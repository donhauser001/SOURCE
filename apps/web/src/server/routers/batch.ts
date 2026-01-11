/**
 * 批次 Router
 *
 * 验证批次的完整 CRUD
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc';
import {
    createBatchSchema,
    updateBatchSchema,
    listBatchesSchema,
    getBatchSchema,
} from '@/lib/validations/batch';

export const batchRouter = createTRPCRouter({
    // ============================================================================
    // 查询
    // ============================================================================

    /**
     * 获取单个批次
     */
    get: publicProcedure.input(getBatchSchema).query(async ({ ctx, input }) => {
        const where = input.id ? { id: input.id } : { batchNo: input.batchNo };

        const batch = await ctx.prisma.batch.findUnique({
            where,
            include: {
                _count: {
                    select: {
                        colors: true,
                        paperProfiles: true,
                    },
                },
            },
        });

        if (!batch) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `批次不存在: ${input.batchNo || input.id}`,
            });
        }

        return batch;
    }),

    /**
     * 获取批次列表
     */
    list: publicProcedure.input(listBatchesSchema).query(async ({ ctx, input }) => {
        const { cursor, limit, type, search } = input;

        const where: any = {};

        if (type) {
            where.type = type;
        }

        if (search) {
            where.OR = [
                { batchNo: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
            ];
        }

        const items = await ctx.prisma.batch.findMany({
            where,
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        colors: true,
                        paperProfiles: true,
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
     * 获取批次关联的颜色
     */
    getColors: publicProcedure
        .input(z.object({ batchId: z.string() }))
        .query(async ({ ctx, input }) => {
            const colors = await ctx.prisma.color.findMany({
                where: { batchId: input.batchId },
                orderBy: { colorId: 'asc' },
                select: {
                    id: true,
                    colorId: true,
                    name: true,
                    status: true,
                    labL: true,
                    labA: true,
                    labB: true,
                },
            });

            return colors;
        }),

    /**
     * 获取批次关联的纸张表现
     */
    getPaperProfiles: publicProcedure
        .input(z.object({ batchId: z.string() }))
        .query(async ({ ctx, input }) => {
            const profiles = await ctx.prisma.paperProfile.findMany({
                where: { batchId: input.batchId },
                orderBy: [{ paperType: { order: 'asc' } }],
                include: {
                    color: {
                        select: { colorId: true, name: true },
                    },
                    paperType: true,
                },
            });

            return profiles;
        }),

    /**
     * 获取批次统计
     */
    stats: publicProcedure.query(async ({ ctx }) => {
        const [total, measure, scan, print, audit] = await Promise.all([
            ctx.prisma.batch.count(),
            ctx.prisma.batch.count({ where: { type: 'MEASURE' } }),
            ctx.prisma.batch.count({ where: { type: 'SCAN' } }),
            ctx.prisma.batch.count({ where: { type: 'PRINT' } }),
            ctx.prisma.batch.count({ where: { type: 'AUDIT' } }),
        ]);

        return { total, measure, scan, print, audit };
    }),

    // ============================================================================
    // 管理员查询
    // ============================================================================

    /**
     * 管理员批次列表（不分页，用于后台管理）
     */
    adminList: adminProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(500).optional().default(100),
                type: z.enum(['MEASURE', 'SCAN', 'PRINT', 'AUDIT']).optional(),
                search: z.string().optional(),
                partnerId: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, type, search, partnerId } = input;

            const where: any = {};

            if (type) {
                where.type = type;
            }

            if (partnerId) {
                where.partnerId = partnerId;
            }

            if (search) {
                where.OR = [
                    { batchNo: { contains: search, mode: 'insensitive' } },
                    { notes: { contains: search, mode: 'insensitive' } },
                    { createdBy: { contains: search, mode: 'insensitive' } },
                ];
            }

            const items = await ctx.prisma.batch.findMany({
                where,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    partner: {
                        select: {
                            partnerId: true,
                            name: true,
                            shortName: true,
                        },
                    },
                    _count: {
                        select: {
                            colors: true,
                            paperProfiles: true,
                        },
                    },
                },
            });

            return { items };
        }),

    /**
     * 管理员统计（详细）
     */
    adminStats: adminProcedure.query(async ({ ctx }) => {
        const [total, byType, recentBatches] = await Promise.all([
            // 总数
            ctx.prisma.batch.count(),

            // 按类型统计
            ctx.prisma.batch.groupBy({
                by: ['type'],
                _count: true,
            }),

            // 最近批次
            ctx.prisma.batch.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            colors: true,
                            paperProfiles: true,
                        },
                    },
                },
            }),
        ]);

        const typeStats = byType.reduce(
            (acc, item) => {
                acc[item.type] = item._count;
                return acc;
            },
            {} as Record<string, number>
        );

        return {
            total,
            byType: typeStats,
            recentBatches,
        };
    }),

    // ============================================================================
    // 创建 / 更新 / 删除（需要管理员权限）
    // ============================================================================

    /**
     * 创建批次
     */
    create: adminProcedure.input(createBatchSchema).mutation(async ({ ctx, input }) => {
        // 检查 batchNo 是否已存在
        const existing = await ctx.prisma.batch.findUnique({
            where: { batchNo: input.batchNo },
        });

        if (existing) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `批次编号已存在: ${input.batchNo}`,
            });
        }

        const batch = await ctx.prisma.batch.create({
            data: input,
        });

        return batch;
    }),

    /**
     * 更新批次
     */
    update: adminProcedure.input(updateBatchSchema).mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;

        // 检查批次是否存在
        const existing = await ctx.prisma.batch.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `批次不存在`,
            });
        }

        const batch = await ctx.prisma.batch.update({
            where: { id },
            data,
            include: {
                _count: {
                    select: {
                        colors: true,
                        paperProfiles: true,
                    },
                },
            },
        });

        return batch;
    }),

    /**
     * 删除批次
     */
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查批次是否存在
            const existing = await ctx.prisma.batch.findUnique({
                where: { id: input.id },
                include: {
                    _count: {
                        select: {
                            colors: true,
                            paperProfiles: true,
                        },
                    },
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `批次不存在`,
                });
            }

            // 检查是否有关联数据
            if (existing._count.colors > 0 || existing._count.paperProfiles > 0) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: `该批次有关联数据，无法删除。请先解除关联。`,
                });
            }

            await ctx.prisma.batch.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    /**
     * 生成下一个批次编号
     */
    nextBatchNo: adminProcedure.query(async ({ ctx }) => {
        const year = new Date().getFullYear();
        const prefix = `BATCH-${year}-`;

        // 获取当年最大编号
        const latest = await ctx.prisma.batch.findFirst({
            where: {
                batchNo: { startsWith: prefix },
            },
            orderBy: { batchNo: 'desc' },
            select: { batchNo: true },
        });

        let nextNum = 1;
        if (latest) {
            const match = latest.batchNo.match(/BATCH-\d{4}-(\d+)/);
            if (match) {
                nextNum = parseInt(match[1], 10) + 1;
            }
        }

        return `${prefix}${nextNum.toString().padStart(3, '0')}`;
    }),
});

