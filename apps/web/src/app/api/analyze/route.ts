/**
 * 完整分析 API
 *
 * POST /api/analyze
 * 解析 SourcePack 并生成完整分析报告（包含推荐）
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseSourcePack, validateSourcePack } from '@/lib/validations/sourcepack';
import { generateAnalysisReport } from '@/lib/analyze/report-service';

export async function POST(request: NextRequest) {
    try {
        // 获取当前用户（可选）
        const session = await auth();
        const userId = session?.user?.id;

        // 获取请求体
        const body = await request.text();

        if (!body || body.trim() === '') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'EMPTY_BODY',
                        message: '请求体为空，请提供 SourcePack JSON',
                    },
                },
                { status: 400 }
            );
        }

        // 解析 JSON
        let sourcePack;
        try {
            sourcePack = JSON.parse(body);
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_JSON',
                        message: 'JSON 格式无效',
                    },
                },
                { status: 400 }
            );
        }

        // 验证 SourcePack 格式
        const validation = validateSourcePack(sourcePack);
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'SourcePack 格式验证失败',
                        details: validation.errors,
                    },
                },
                { status: 400 }
            );
        }

        // 生成完整分析报告
        const report = await generateAnalysisReport(validation.data!, {
            userId,
            retentionDays: 30,
        });

        return NextResponse.json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error('Analysis error:', error);
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
