/**
 * 分析报告详情 API
 *
 * GET /api/analyze/[id] - 获取报告详情
 * DELETE /api/analyze/[id] - 删除报告
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getReport, deleteReport, getReportEvidence } from '@/lib/analyze/report-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const report = await getReport(id);

        if (!report) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: '报告不存在或已过期',
                    },
                },
                { status: 404 }
            );
        }

        // 获取证据链（可选参数）
        const includeEvidence = request.nextUrl.searchParams.get('evidence') === 'true';
        let evidence = null;

        if (includeEvidence) {
            evidence = await getReportEvidence(id);
        }

        return NextResponse.json({
            success: true,
            data: {
                ...report,
                evidence,
            },
        });
    } catch (error) {
        console.error('Get report error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : '服务器内部错误',
                },
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: '请先登录',
                    },
                },
                { status: 401 }
            );
        }

        const { id } = await params;

        const deleted = await deleteReport(id, session.user.id);

        if (!deleted) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: '报告不存在或无权删除',
                    },
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '报告已删除',
        });
    } catch (error) {
        console.error('Delete report error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : '服务器内部错误',
                },
            },
            { status: 500 }
        );
    }
}
