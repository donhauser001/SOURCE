/**
 * 色彩列表/搜索 REST API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateApiKey, requireScope, checkRateLimit } from '@/server/middleware/apiKeyAuth';
import { createSuccessResponse, createErrorResponse, ErrorCode, Errors } from '@/lib/errors';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
    const startTime = Date.now();
    let apiKeyId: string | undefined;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    try {
        // 认证
        const authHeader = request.headers.get('authorization');
        const apiKey = await authenticateApiKey(authHeader);
        apiKeyId = apiKey.apiKeyId;

        // 权限检查
        requireScope(apiKey, query ? 'search:color' : 'read:color');

        // 限流检查
        if (apiKey.rateLimitPolicy) {
            const allowed = checkRateLimit(apiKey.apiKeyId, apiKey.rateLimitPolicy.requestsPerMinute);
            if (!allowed) {
                throw Errors.rateLimit(60);
            }
        }

        // 查询
        const colors = await prisma.color.findMany({
            where: query
                ? {
                    OR: [
                        { colorId: { contains: query, mode: 'insensitive' } },
                        { name: { contains: query, mode: 'insensitive' } },
                    ],
                    status: 'VERIFIED',
                }
                : { status: 'VERIFIED' },
            take: limit,
            select: {
                colorId: true,
                name: true,
                labL: true,
                labA: true,
                labB: true,
                status: true,
            },
            orderBy: { colorId: 'asc' },
        });

        const response = createSuccessResponse({
            items: colors,
            count: colors.length,
        });

        // 记录审计日志
        await logAudit({
            apiKeyId,
            command: query ? 'color.search' : 'color.list',
            args: { query, limit },
            result: 'success',
            duration: Date.now() - startTime,
        });

        return NextResponse.json(response);
    } catch (error: any) {
        const duration = Date.now() - startTime;

        await logAudit({
            apiKeyId,
            command: query ? 'color.search' : 'color.list',
            args: { query, limit },
            result: 'error',
            errorCode: error.code || 'UNKNOWN',
            duration,
        });

        const statusCode = error.statusCode || 500;
        const errorResponse = createErrorResponse(
            error.code || ErrorCode.UNKNOWN,
            error.message || '服务器错误'
        );

        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

