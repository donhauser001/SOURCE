/**
 * 纸张数据批量导入 API
 * 
 * POST /api/admin/import/paper-profiles
 * 
 * 需要管理员权限
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logAdminAction, AUDIT_TARGET_TYPES } from '@/lib/admin-audit';

// 有效的枚举值
const PAPER_TYPES = ['PREMIUM_MATTE', 'UNCOATED', 'COATED', 'OFFSET', 'LIGHTWEIGHT'] as const;
const RECOMMENDATIONS = ['BEST', 'GOOD', 'CAUTION', 'AVOID'] as const;

// 批量导入请求 Schema
const importPaperProfilesSchema = z.object({
    paperProfiles: z.array(z.object({
        colorId: z.string(),
        paperType: z.enum(PAPER_TYPES),
        labL: z.number().min(0).max(100),
        labA: z.number().min(-128).max(127),
        labB: z.number().min(-128).max(127),
        deltaE: z.number().min(0).optional(),
        glossiness: z.number().min(0).max(100),
        inkAbsorption: z.number().min(0).max(100),
        gamutCoverage: z.number().min(0).max(100),
        recommendation: z.enum(RECOMMENDATIONS),
        cautionNote: z.string().optional(),
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
        const parsed = importPaperProfilesSchema.safeParse(body);

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

        const { paperProfiles } = parsed.data;
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
        };

        // 预先获取所有涉及的 color 和 paperType
        const colorIds = [...new Set(paperProfiles.map(p => p.colorId))];
        const paperTypeCodes = [...new Set(paperProfiles.map(p => p.paperType))];
        
        const [colors, paperTypes] = await Promise.all([
            prisma.color.findMany({
                where: { colorId: { in: colorIds } },
                select: { id: true, colorId: true },
            }),
            prisma.paperTypeOption.findMany({
                where: { code: { in: paperTypeCodes } },
                select: { id: true, code: true },
            }),
        ]);
        
        const colorMap = new Map(colors.map(c => [c.colorId, c.id]));
        const paperTypeMap = new Map(paperTypes.map(p => [p.code, p.id]));

        // 逐条导入
        for (const profile of paperProfiles) {
            try {
                // 检查 color 是否存在
                const colorDbId = colorMap.get(profile.colorId);
                if (!colorDbId) {
                    results.failed++;
                    results.errors.push(`${profile.colorId}/${profile.paperType}: 色彩不存在`);
                    continue;
                }

                // 检查 paperType 是否存在
                const paperTypeId = paperTypeMap.get(profile.paperType);
                if (!paperTypeId) {
                    results.failed++;
                    results.errors.push(`${profile.colorId}/${profile.paperType}: 纸型不存在`);
                    continue;
                }

                // 检查是否已存在相同的 paperProfile
                const existing = await prisma.paperProfile.findFirst({
                    where: {
                        colorId: colorDbId,
                        paperTypeId: paperTypeId,
                    },
                });

                if (existing) {
                    // 更新现有记录
                    await prisma.paperProfile.update({
                        where: { id: existing.id },
                        data: {
                            labL: profile.labL,
                            labA: profile.labA,
                            labB: profile.labB,
                            deltaE: profile.deltaE,
                            glossiness: profile.glossiness,
                            inkAbsorption: profile.inkAbsorption,
                            gamutCoverage: profile.gamutCoverage,
                            recommendation: profile.recommendation,
                            cautionNote: profile.cautionNote,
                        },
                    });
                } else {
                    // 创建新记录
                    await prisma.paperProfile.create({
                        data: {
                            colorId: colorDbId,
                            paperTypeId: paperTypeId,
                            labL: profile.labL,
                            labA: profile.labA,
                            labB: profile.labB,
                            deltaE: profile.deltaE,
                            glossiness: profile.glossiness,
                            inkAbsorption: profile.inkAbsorption,
                            gamutCoverage: profile.gamutCoverage,
                            recommendation: profile.recommendation,
                            cautionNote: profile.cautionNote,
                        },
                    });
                }

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push(
                    `${profile.colorId}/${profile.paperType}: ${error instanceof Error ? error.message : '操作失败'}`
                );
            }
        }

        // 记录审计日志
        if (results.success > 0) {
            await logAdminAction({
                userId: session.user.id,
                userEmail: session.user.email ?? '',
                action: 'IMPORT',
                targetType: AUDIT_TARGET_TYPES.PAPER_PROFILE,
                targetId: null,
                metadata: {
                    total: paperProfiles.length,
                    success: results.success,
                    failed: results.failed,
                    colorIds: colorIds,
                },
            });
        }

        return NextResponse.json({
            ok: true,
            ...results,
            message: `成功导入 ${results.success} 条，失败 ${results.failed} 条`,
        });

    } catch (error) {
        console.error('[Import Paper Profiles Error]', error);
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

