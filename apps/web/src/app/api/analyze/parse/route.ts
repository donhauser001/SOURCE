/**
 * SourcePack 解析 API
 *
 * POST /api/analyze/parse
 * 解析和验证 SourcePack JSON，返回映射结果
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseAndMapSourcePack } from '@/lib/analyze/parser';

export async function POST(request: NextRequest) {
    try {
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

        // 解析并映射颜色
        const result = await parseAndMapSourcePack(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'PARSE_ERROR',
                        message: '解析 SourcePack 失败',
                        details: result.errors,
                    },
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                docInfo: result.sourcePack?.docInfo,
                printIntent: result.sourcePack?.printIntent,
                colors: result.mappedColors,
                summary: result.summary,
            },
        });
    } catch (error) {
        console.error('SourcePack parse error:', error);
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
