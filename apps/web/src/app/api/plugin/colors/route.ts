/**
 * 插件色彩数据 API
 * 
 * v0.4.1 - Access 阶段
 * 
 * GET /api/plugin/colors?colorId=xxx
 * GET /api/plugin/colors?q=xxx (搜索)
 * 
 * 按权限返回色彩数据：
 * - PLUGIN_FREE: 基础信息（colorId, name, Lab, hex）
 * - PLUGIN_PAID: 完整数据（含配方、纸张表现、推荐）
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeader } from '@/lib/apikey';
import { getRateLimitInfo } from '@/server/middleware/apiKeyAuth';
import { prisma } from '@/lib/db';
import { hasScope } from '@/lib/scopes';

// 基础色彩字段（免费版可见）
const BASIC_COLOR_SELECT = {
    id: true,
    colorId: true,
    name: true,
    slug: true,
    labL: true,
    labA: true,
    labB: true,
    hex: true,
    status: true,
    createdAt: true,
};

// 完整色彩数据（付费版可见）
const FULL_COLOR_INCLUDE = {
    paperProfiles: {
        select: {
            id: true,
            paperType: true,
            labL: true,
            labA: true,
            labB: true,
            hex: true,
            deltaE: true,
            scanImageUrl: true,
        },
    },
    recipes: {
        where: { isActive: true },
        select: {
            id: true,
            recipeCode: true,
            inkSystem: true,
            ingredients: {
                select: {
                    inkCode: true,
                    inkName: true,
                    percentage: true,
                },
            },
        },
    },
    paperRecommendations: {
        select: {
            paperId: true,
            rank: true,
            fitScore: true,
            reason: true,
        },
    },
};

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const key = extractApiKeyFromHeader(authHeader);

        if (!key) {
            return NextResponse.json(
                {
                    ok: false,
                    error: {
                        code: 'MISSING_API_KEY',
                        message: 'Authorization header with Bearer token required',
                    },
                },
                { status: 401 }
            );
        }

        // 验证 API Key
        let apiKey;
        try {
            apiKey = await validateApiKey(key);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Invalid API key';
            return NextResponse.json(
                {
                    ok: false,
                    error: {
                        code: 'INVALID_API_KEY',
                        message,
                    },
                },
                { status: 401 }
            );
        }

        // 检查是否有读取色彩的权限
        if (!hasScope(apiKey.scopes, 'read:color')) {
            return NextResponse.json(
                {
                    ok: false,
                    error: {
                        code: 'INSUFFICIENT_SCOPE',
                        message: 'Missing required scope: read:color',
                    },
                },
                { status: 403 }
            );
        }

        // 检查速率限制
        const rateLimitPolicy = apiKey.rateLimitPolicy;
        const rateLimitPerMinute = rateLimitPolicy?.requestsPerMinute || 60;

        const { allowed, remaining, resetAt } = getRateLimitInfo(
            apiKey.id,
            rateLimitPerMinute
        );

        if (!allowed) {
            const response = NextResponse.json(
                {
                    ok: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Too many requests',
                    },
                },
                { status: 429 }
            );

            response.headers.set('X-RateLimit-Limit', String(rateLimitPerMinute));
            response.headers.set('X-RateLimit-Remaining', '0');
            response.headers.set('X-RateLimit-Reset', String(resetAt));
            response.headers.set('Retry-After', String(Math.ceil((resetAt - Date.now()) / 1000)));

            return response;
        }

        // 解析查询参数
        const { searchParams } = new URL(request.url);
        const colorId = searchParams.get('colorId');
        const query = searchParams.get('q');
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

        // 判断权限等级
        const isPaidTier = apiKey.role === 'PLUGIN_PAID' || 
                          hasScope(apiKey.scopes, 'read:recipe');

        let responseData;

        if (colorId) {
            // 单个色彩查询
            const color = await prisma.color.findUnique({
                where: { colorId },
                select: isPaidTier
                    ? { ...BASIC_COLOR_SELECT, ...FULL_COLOR_INCLUDE }
                    : BASIC_COLOR_SELECT,
            });

            if (!color) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: `Color not found: ${colorId}`,
                        },
                    },
                    { status: 404 }
                );
            }

            responseData = {
                type: 'single',
                color,
                tier: isPaidTier ? 'paid' : 'free',
            };
        } else if (query) {
            // 搜索
            const colors = await prisma.color.findMany({
                where: {
                    OR: [
                        { colorId: { contains: query, mode: 'insensitive' } },
                        { name: { contains: query, mode: 'insensitive' } },
                    ],
                },
                select: BASIC_COLOR_SELECT, // 搜索结果始终返回基础信息
                take: limit,
            });

            responseData = {
                type: 'search',
                query,
                count: colors.length,
                colors,
                tier: isPaidTier ? 'paid' : 'free',
            };
        } else {
            // 列表（分页）
            const colors = await prisma.color.findMany({
                select: BASIC_COLOR_SELECT,
                take: limit,
                orderBy: { colorId: 'asc' },
            });

            responseData = {
                type: 'list',
                count: colors.length,
                colors,
                tier: isPaidTier ? 'paid' : 'free',
            };
        }

        const response = NextResponse.json({
            ok: true,
            data: responseData,
        });

        // 添加限流响应头
        response.headers.set('X-RateLimit-Limit', String(rateLimitPerMinute));
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        response.headers.set('X-RateLimit-Reset', String(resetAt));

        return response;

    } catch (error) {
        console.error('[Plugin Colors Error]', error);
        return NextResponse.json(
            {
                ok: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error',
                },
            },
            { status: 500 }
        );
    }
}

