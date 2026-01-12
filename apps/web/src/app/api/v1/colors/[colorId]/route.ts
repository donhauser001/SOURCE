/**
 * 色彩 REST API
 *
 * CLI/插件/AI 通过此端点访问
 * 使用 API Key 认证
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateApiKey, requireScope, checkRateLimit } from '@/server/middleware/apiKeyAuth';
import { createSuccessResponse, createErrorResponse, ErrorCode, Errors } from '@/lib/errors';
import { logAudit } from '@/lib/audit';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ colorId: string }> }
) {
    const startTime = Date.now();
    const { colorId } = await params;
    let apiKeyId: string | undefined;

    try {
        // 认证
        const authHeader = request.headers.get('authorization');
        const apiKey = await authenticateApiKey(authHeader);
        apiKeyId = apiKey.apiKeyId;

        // 权限检查
        requireScope(apiKey, 'read:color');

        // 限流检查
        if (apiKey.rateLimitPolicy) {
            const allowed = checkRateLimit(apiKey.apiKeyId, apiKey.rateLimitPolicy.requestsPerMinute);
            if (!allowed) {
                throw Errors.rateLimit(60);
            }
        }

        // 查询色彩
        const color = await prisma.color.findUnique({
            where: { colorId },
            include: {
                batch: {
                    select: {
                        batchNo: true,
                        type: true,
                        instrumentModel: true,
                        calibratedAt: true,
                    },
                },
                paperProfiles: {
                    include: {
                        batch: {
                            select: { batchNo: true },
                        },
                        paperType: {
                            select: { code: true },
                        },
                    },
                },
            },
        });

        if (!color) {
            throw Errors.colorNotFound(colorId);
        }

        // 构建响应
        const response = createSuccessResponse(
            {
                colorId: color.colorId,
                name: color.name,
                slug: color.slug,
                trueSource: {
                    labL: color.labL,
                    labA: color.labA,
                    labB: color.labB,
                    measuredAt: color.measuredAt,
                    measurementDevice: color.measurementDevice,
                    measurementStandard: color.measurementStandard,
                    measurementCondition: color.measurementCondition,
                    deltaETolerance: color.deltaETolerance,
                    trueSourceNote: color.trueSourceNote,
                },
                status: color.status,
                auditStatus: color.auditStatus,
                paperProfiles: color.paperProfiles.map((p) => ({
                    paperType: p.paperType.code,
                    labL: p.labL,
                    labA: p.labA,
                    labB: p.labB,
                    deltaE: p.deltaE,
                    gamutCoverage: p.gamutCoverage,
                    recommendation: p.recommendation,
                    cautionNote: p.cautionNote,
                    batch: p.batch?.batchNo ?? null,
                })),
            },
            [
                { type: 'color', id: color.colorId, label: color.name },
                ...(color.batch ? [{ type: 'batch' as const, id: color.batch.batchNo }] : []),
            ]
        );

        // 记录审计日志
        await logAudit({
            apiKeyId,
            command: 'color.get',
            args: { colorId },
            result: 'success',
            duration: Date.now() - startTime,
            citations: [color.colorId],
        });

        return NextResponse.json(response);
    } catch (error: any) {
        const duration = Date.now() - startTime;

        // 记录错误审计日志
        await logAudit({
            apiKeyId,
            command: 'color.get',
            args: { colorId },
            result: 'error',
            errorCode: error.code || 'UNKNOWN',
            duration,
        });

        // 返回错误响应
        const statusCode = error.statusCode || 500;
        const errorResponse = createErrorResponse(
            error.code || ErrorCode.UNKNOWN,
            error.message || '服务器错误'
        );

        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

