/**
 * 打样包 SKU Router
 *
 * v0.3.0 - Bridge 阶段
 * 
 * 功能：
 * - SKU 的完整 CRUD
 * - 按色彩/纸张查询
 * - 后台管理操作
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import {
    createProofingPackSchema,
    updateProofingPackSchema,
    listProofingPacksSchema,
    getProofingPackSchema,
} from '@/lib/validations/proofing-pack';

export const proofingPackRouter = createTRPCRouter({
    // ============================================================================
    // 查询（公开）
    // ============================================================================

    /**
     * 获取单个打样包
     */
    get: publicProcedure.input(getProofingPackSchema).query(async ({ ctx, input }) => {
        let proofingPack;

        if (input.id) {
            proofingPack = await ctx.prisma.proofingPack.findUnique({
                where: { id: input.id },
                include: {
                    color: {
                        select: {
                            id: true,
                            colorId: true,
                            name: true,
                            labL: true,
                            labA: true,
                            labB: true,
                        },
                    },
                },
            });
        } else if (input.colorId && input.paperType) {
            // 先找到 color
            const color = await ctx.prisma.color.findUnique({
                where: { colorId: input.colorId },
            });

            if (!color) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `色彩不存在: ${input.colorId}`,
                });
            }

            proofingPack = await ctx.prisma.proofingPack.findUnique({
                where: {
                    colorId_paperType: {
                        colorId: color.id,
                        paperType: input.paperType,
                    },
                },
                include: {
                    color: {
                        select: {
                            id: true,
                            colorId: true,
                            name: true,
                            labL: true,
                            labA: true,
                            labB: true,
                        },
                    },
                },
            });
        }

        if (!proofingPack) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '打样包不存在',
            });
        }

        return proofingPack;
    }),

    /**
     * 获取打样包列表
     */
    list: publicProcedure.input(listProofingPacksSchema).query(async ({ ctx, input }) => {
        const { colorId, paperType, isActive, limit, cursor } = input;

        // 构建查询条件
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (colorId) {
            // 先找到 color 的内部 ID
            const color = await ctx.prisma.color.findUnique({
                where: { colorId },
            });
            if (color) {
                where.colorId = color.id;
            }
        }

        if (paperType) {
            where.paperType = paperType;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const proofingPacks = await ctx.prisma.proofingPack.findMany({
            where,
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: [
                { color: { colorId: 'asc' } },
                { paperType: 'asc' },
            ],
            include: {
                color: {
                    select: {
                        id: true,
                        colorId: true,
                        name: true,
                        labL: true,
                        labA: true,
                        labB: true,
                    },
                },
                _count: {
                    select: { buyIntents: true },
                },
            },
        });

        let nextCursor: string | undefined;
        if (proofingPacks.length > limit) {
            const nextItem = proofingPacks.pop();
            nextCursor = nextItem?.id;
        }

        return {
            items: proofingPacks,
            nextCursor,
        };
    }),

    /**
     * 获取指定色彩的所有打样包
     */
    byColor: publicProcedure
        .input(z.object({ colorId: z.string() }))
        .query(async ({ ctx, input }) => {
            // 先找到 color
            const color = await ctx.prisma.color.findUnique({
                where: { colorId: input.colorId },
            });

            if (!color) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `色彩不存在: ${input.colorId}`,
                });
            }

            const proofingPacks = await ctx.prisma.proofingPack.findMany({
                where: {
                    colorId: color.id,
                    isActive: true,
                },
                orderBy: { paperType: 'asc' },
            });

            return proofingPacks;
        }),

    // ============================================================================
    // 管理操作（需要管理员权限）
    // ============================================================================

    /**
     * 创建打样包
     */
    create: adminProcedure
        .input(createProofingPackSchema)
        .mutation(async ({ ctx, input }) => {
            // 验证 color 存在
            const color = await ctx.prisma.color.findUnique({
                where: { id: input.colorId },
            });

            if (!color) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '色彩不存在',
                });
            }

            // 检查是否已存在相同的 SKU
            const existing = await ctx.prisma.proofingPack.findUnique({
                where: {
                    colorId_paperType: {
                        colorId: input.colorId,
                        paperType: input.paperType,
                    },
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: '该色彩的此纸张类型打样包已存在',
                });
            }

            const proofingPack = await ctx.prisma.proofingPack.create({
                data: {
                    colorId: input.colorId,
                    paperType: input.paperType,
                    price: input.price,
                    externalUrl: input.externalUrl,
                    isActive: input.isActive ?? true,
                },
                include: {
                    color: {
                        select: { colorId: true, name: true },
                    },
                },
            });

            return proofingPack;
        }),

    /**
     * 更新打样包
     */
    update: adminProcedure
        .input(updateProofingPackSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            // 验证存在
            const existing = await ctx.prisma.proofingPack.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '打样包不存在',
                });
            }

            const proofingPack = await ctx.prisma.proofingPack.update({
                where: { id },
                data,
                include: {
                    color: {
                        select: { colorId: true, name: true },
                    },
                },
            });

            return proofingPack;
        }),

    /**
     * 删除打样包
     */
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 验证存在
            const existing = await ctx.prisma.proofingPack.findUnique({
                where: { id: input.id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '打样包不存在',
                });
            }

            // 检查是否有关联的购买意图
            const intentCount = await ctx.prisma.buyIntent.count({
                where: { proofingPackId: input.id },
            });

            if (intentCount > 0) {
                // 软删除：只标记为不活跃
                await ctx.prisma.proofingPack.update({
                    where: { id: input.id },
                    data: { isActive: false },
                });
                return { deleted: false, deactivated: true, message: '已标记为下架（存在购买意图记录）' };
            }

            // 硬删除
            await ctx.prisma.proofingPack.delete({
                where: { id: input.id },
            });

            return { deleted: true, deactivated: false };
        }),

    /**
     * 批量设置状态
     */
    batchSetActive: adminProcedure
        .input(z.object({
            ids: z.array(z.string()),
            isActive: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.prisma.proofingPack.updateMany({
                where: { id: { in: input.ids } },
                data: { isActive: input.isActive },
            });

            return { updated: result.count };
        }),

    // ============================================================================
    // 统计
    // ============================================================================

    /**
     * 获取统计数据
     */
    stats: adminProcedure.query(async ({ ctx }) => {
        const [total, active, inactive, totalIntents] = await Promise.all([
            ctx.prisma.proofingPack.count(),
            ctx.prisma.proofingPack.count({ where: { isActive: true } }),
            ctx.prisma.proofingPack.count({ where: { isActive: false } }),
            ctx.prisma.buyIntent.count(),
        ]);

        // 按纸张类型统计
        const byPaperType = await ctx.prisma.proofingPack.groupBy({
            by: ['paperType'],
            _count: { _all: true },
            where: { isActive: true },
        });

        return {
            total,
            active,
            inactive,
            totalIntents,
            byPaperType: byPaperType.map(item => ({
                paperType: item.paperType,
                count: item._count._all,
            })),
        };
    }),
});

