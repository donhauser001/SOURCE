/**
 * Color Router - 管理员操作
 *
 * adminList, adminListPaginated, adminBatchDelete, adminImport
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { createTRPCRouter, adminProcedure } from '../../trpc';
import { ColorStatusEnum } from '@/lib/validations/color';
import { logAdminAction, logAdminBatchAction, AUDIT_TARGET_TYPES } from '@/lib/admin-audit';
import { invalidateColorCache } from '@/lib/cache';

export const colorAdminRouter = createTRPCRouter({
    /**
     * 管理员：获取色彩列表（含更多信息）
     * @deprecated 使用 adminListPaginated 代替
     */
    adminList: adminProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(200).default(50),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, cursor } = input;

            const items = await ctx.prisma.color.findMany({
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    colorId: true,
                    name: true,
                    slug: true,
                    labL: true,
                    labA: true,
                    labB: true,
                    status: true,
                    auditStatus: true,
                    createdAt: true,
                    _count: {
                        select: {
                            recipes: true,
                            paperProfiles: true,
                            participations: true,
                        },
                    },
                },
            });

            let nextCursor: string | undefined;
            if (items.length > limit) {
                const nextItem = items.pop();
                nextCursor = nextItem?.id;
            }

            return {
                items,
                nextCursor,
            };
        }),

    /**
     * 管理员：获取色彩列表（分页版，支持搜索和筛选）
     */
    adminListPaginated: adminProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(20),
                cursor: z.string().optional(),
                search: z.string().optional(),
                status: ColorStatusEnum.optional(),
                auditStatus: z.enum(['VERIFIED', 'PENDING']).optional(),
                colorFamily: z.enum(['RED', 'ORANGE', 'YELLOW', 'GREEN', 'CYAN', 'BLUE', 'PURPLE', 'PINK', 'BROWN', 'NEUTRAL']).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, cursor, search, status, auditStatus, colorFamily } = input;

            // 构建 where 条件
            const where: Prisma.ColorWhereInput = {};

            if (search) {
                where.OR = [
                    { colorId: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (status) {
                where.status = status;
            }

            if (auditStatus) {
                where.auditStatus = auditStatus;
            }

            if (colorFamily) {
                where.colorFamily = colorFamily;
            }

            // 并行查询：数据和总数
            const [items, totalCount] = await Promise.all([
                ctx.prisma.color.findMany({
                    where,
                    take: limit + 1,
                    cursor: cursor ? { id: cursor } : undefined,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        colorId: true,
                        name: true,
                        slug: true,
                        labL: true,
                        labA: true,
                        labB: true,
                        status: true,
                        auditStatus: true,
                        colorFamily: true,
                        createdAt: true,
                        updatedAt: true,
                        colorBookEntries: {
                            select: {
                                colorBook: {
                                    select: {
                                        id: true,
                                        slug: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: {
                                recipes: true,
                                paperProfiles: true,
                                participations: true,
                                proofingPacks: true,
                            },
                        },
                    },
                }),
                ctx.prisma.color.count({ where }),
            ]);

            let nextCursor: string | undefined;
            if (items.length > limit) {
                const nextItem = items.pop();
                nextCursor = nextItem?.id;
            }

            return {
                items,
                nextCursor,
                totalCount,
            };
        }),

    /**
     * 管理员：批量删除色彩
     */
    adminBatchDelete: adminProcedure
        .input(z.object({ ids: z.array(z.string()).min(1) }))
        .mutation(async ({ ctx, input }) => {
            const { ids } = input;

            // 检查是否有关联数据
            const colorsWithDeps = await ctx.prisma.color.findMany({
                where: { id: { in: ids } },
                include: {
                    _count: {
                        select: {
                            proofingPacks: true,
                            recipes: true,
                        },
                    },
                },
            });

            const hasProofingPacks = colorsWithDeps.some((c) => c._count.proofingPacks > 0);
            if (hasProofingPacks) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: '部分色彩有关联的打样包，无法删除',
                });
            }

            // 删除关联的 paperProfiles
            await ctx.prisma.paperProfile.deleteMany({
                where: { colorId: { in: ids } },
            });

            // 删除色彩
            const result = await ctx.prisma.color.deleteMany({
                where: { id: { in: ids } },
            });

            // 记录审计日志
            await logAdminBatchAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'BATCH_DELETE',
                targetType: AUDIT_TARGET_TYPES.COLOR,
                targetIds: ids,
                metadata: {
                    deletedColorIds: colorsWithDeps.map((c) => c.colorId),
                },
            });

            // 失效缓存
            await invalidateColorCache();

            return { deleted: result.count };
        }),

    /**
     * 管理员：批量导入色彩数据
     */
    adminImport: adminProcedure
        .input(
            z.object({
                colors: z.array(
                    z.object({
                        colorId: z.string(),
                        name: z.string(),
                        slug: z.string().optional(),
                        labL: z.number(),
                        labA: z.number(),
                        labB: z.number(),
                        status: ColorStatusEnum.optional(),
                        auditStatus: z.enum(['VERIFIED', 'PENDING']).optional(),
                        measurementDevice: z.string().optional(),
                        measurementStandard: z.string().optional(),
                        measuredAt: z.string().optional(),
                        version: z.string().optional(),
                        deltaETolerance: z.number().optional(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { colors } = input;
            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[],
                created: [] as string[],
            };

            // 使用事务保证原子性
            await ctx.prisma.$transaction(async (tx) => {
                for (const color of colors) {
                    try {
                        // 生成 slug（如果未提供）
                        const slug = color.slug || color.colorId.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                        // 检查 colorId 或 slug 是否已存在
                        const existing = await tx.color.findFirst({
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
                        const created = await tx.color.create({
                            data: {
                                colorId: color.colorId,
                                name: color.name,
                                slug,
                                labL: color.labL,
                                labA: color.labA,
                                labB: color.labB,
                                status: color.status || 'EXPERIMENTAL',
                                auditStatus: color.auditStatus || 'PENDING',
                                measurementDevice: color.measurementDevice || 'Unknown',
                                measurementStandard: color.measurementStandard || 'D50/2°',
                                measuredAt: color.measuredAt ? new Date(color.measuredAt) : new Date(),
                                version: color.version || '1.0',
                                deltaETolerance: color.deltaETolerance ?? 2.0,
                                sourceType: 'IMPORTED',
                            },
                        });

                        results.success++;
                        results.created.push(created.colorId);
                    } catch (error) {
                        results.failed++;
                        results.errors.push(
                            `${color.colorId}: ${error instanceof Error ? error.message : '创建失败'}`
                        );
                    }
                }
            });

            // 记录审计日志
            if (results.success > 0) {
                await logAdminAction({
                    userId: ctx.session.user.id,
                    userEmail: ctx.session.user.email ?? '',
                    action: 'IMPORT',
                    targetType: AUDIT_TARGET_TYPES.COLOR,
                    targetId: null,
                    metadata: {
                        total: colors.length,
                        success: results.success,
                        failed: results.failed,
                        createdColorIds: results.created,
                    },
                });

                // 失效缓存
                await invalidateColorCache();
            }

            return {
                success: results.success,
                failed: results.failed,
                errors: results.errors,
                message: `成功导入 ${results.success} 条，失败 ${results.failed} 条`,
            };
        }),
});
