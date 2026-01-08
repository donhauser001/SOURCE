/**
 * 插件授权验证 API
 * 
 * v0.4.1 - Access 阶段
 * 
 * GET /api/plugin/verify
 * 验证 ApiKey 有效性，返回权限等级和剩余配额
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, extractApiKeyFromHeader } from '@/lib/apikey';
import { checkRateLimit, getRateLimitInfo } from '@/server/middleware/apiKeyAuth';

// 插件角色等级
const PLUGIN_TIERS = {
    PLUGIN_FREE: {
        tier: 'free',
        label: '免费版',
        features: ['basic_color_lookup', 'search'],
        limits: { colorsPerDay: 50, searchesPerDay: 100 },
    },
    PLUGIN_PAID: {
        tier: 'paid',
        label: '专业版',
        features: ['full_color_data', 'recipes', 'recommendations', 'unlimited_search'],
        limits: { colorsPerDay: -1, searchesPerDay: -1 }, // -1 = 无限
    },
    READONLY: {
        tier: 'basic',
        label: '基础版',
        features: ['basic_color_lookup'],
        limits: { colorsPerDay: 20, searchesPerDay: 50 },
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

            // 添加限流响应头
            response.headers.set('X-RateLimit-Limit', String(rateLimitPerMinute));
            response.headers.set('X-RateLimit-Remaining', '0');
            response.headers.set('X-RateLimit-Reset', String(resetAt));
            response.headers.set('Retry-After', String(Math.ceil((resetAt - Date.now()) / 1000)));

            return response;
        }

        // 获取插件等级信息
        const tierInfo = PLUGIN_TIERS[apiKey.role as keyof typeof PLUGIN_TIERS] || PLUGIN_TIERS.READONLY;

        // 构建响应
        const responseData = {
            ok: true,
            data: {
                valid: true,
                keyId: apiKey.id,
                keyPrefix: apiKey.keyPrefix,
                role: apiKey.role,
                tier: tierInfo.tier,
                tierLabel: tierInfo.label,
                features: tierInfo.features,
                limits: tierInfo.limits,
                scopes: apiKey.scopes,
                rateLimit: {
                    limit: rateLimitPerMinute,
                    remaining,
                    resetAt: new Date(resetAt).toISOString(),
                },
                expiresAt: apiKey.expiresAt?.toISOString() || null,
            },
        };

        const response = NextResponse.json(responseData);

        // 添加限流响应头
        response.headers.set('X-RateLimit-Limit', String(rateLimitPerMinute));
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        response.headers.set('X-RateLimit-Reset', String(resetAt));

        return response;

    } catch (error) {
        console.error('[Plugin Verify Error]', error);
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

