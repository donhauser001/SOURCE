/**
 * 色彩数据批量导入 API
 * 
 * POST /api/admin/import/colors
 * 
 * 需要管理员权限
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// 批量导入请求 Schema
const importColorsSchema = z.object({
    colors: z.array(z.object({
        colorId: z.string(),
        name: z.string(),
        slug: z.string().optional(),
        labL: z.number(),
        labA: z.number(),
        labB: z.number(),
        status: z.string().optional(),
        auditStatus: z.string().optional(),
        measurementDevice: z.string().optional(),
        measurementStandard: z.string().optional(),
        measuredAt: z.string().optional(),
        version: z.string().optional(),
    })),
});

export async function POST(request: NextRequest) {
    try {
        // 验证权限
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: '未登录' } },
                { status: 401 }
            );
        }

        // 检查管理员权限
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: { code: 'FORBIDDEN', message: '需要管理员权限' } },
                { status: 403 }
            );
        }

        // 解析请求
        const body = await request.json();
        const parsed = importColorsSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { 
                    error: { 
                        code: 'VALIDATION_ERROR', 
                        message: '请求数据格式错误',
                        details: parsed.error.issues,
                    } 
                },
                { status: 400 }
            );
        }

        const { colors } = parsed.data;
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
        };

        // 逐条导入
        for (const color of colors) {
            try {
                // 生成 slug（如果未提供）
                const slug = color.slug || color.colorId.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                // 检查 colorId 是否已存在
                const existing = await prisma.color.findFirst({
                    where: {
                        OR: [
                            { colorId: color.colorId },
                            { slug },
                        ],
                    },
                });

                if (existing) {
                    results.failed++;
                    results.errors.push(`${color.colorId}: colorId 或 slug 已存在`);
                    continue;
                }

                // 创建记录
                await prisma.color.create({
                    data: {
                        colorId: color.colorId,
                        name: color.name,
                        slug,
                        labL: color.labL,
                        labA: color.labA,
                        labB: color.labB,
                        status: (color.status as 'ACTIVE' | 'DEPRECATED' | 'EXPERIMENTAL' | 'DRAFT' | 'VERIFIED') || 'EXPERIMENTAL',
                        auditStatus: (color.auditStatus as 'VERIFIED' | 'UNDER_REVIEW') || 'UNDER_REVIEW',
                        measurementDevice: color.measurementDevice || 'Unknown',
                        measurementStandard: color.measurementStandard || 'D50/2°',
                        measuredAt: color.measuredAt ? new Date(color.measuredAt) : new Date(),
                        version: color.version || '1.0',
                        deltaETolerance: 2.0,
                        sourceType: 'IMPORTED',
                    },
                });

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push(
                    `${color.colorId}: ${error instanceof Error ? error.message : '创建失败'}`
                );
            }
        }

        // TODO: 记录审计日志（需要先添加 AuditLog 模型）
        // 暂时跳过审计日志记录

        return NextResponse.json({
            ok: true,
            ...results,
            message: `成功导入 ${results.success} 条，失败 ${results.failed} 条`,
        });

    } catch (error) {
        console.error('[Import Colors Error]', error);
        return NextResponse.json(
            { 
                error: { 
                    code: 'INTERNAL_ERROR', 
                    message: error instanceof Error ? error.message : '服务器错误' 
                } 
            },
            { status: 500 }
        );
    }
}

