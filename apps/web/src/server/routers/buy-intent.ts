/**
 * 购买意图 Router
 *
 * v0.3.1 - Bridge 阶段
 * 
 * 功能：
 * - 记录购买意图
 * - 统计分析
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc';

export const buyIntentRouter = createTRPCRouter({
    // ============================================================================
    // 统计（管理员）
    // ============================================================================

    /**
     * 获取购买意图统计概览
     */
    stats: adminProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [total, today, thisWeek, thisMonth] = await Promise.all([
            ctx.prisma.buyIntent.count(),
            ctx.prisma.buyIntent.count({ where: { createdAt: { gte: todayStart } } }),
            ctx.prisma.buyIntent.count({ where: { createdAt: { gte: weekAgo } } }),
            ctx.prisma.buyIntent.count({ where: { createdAt: { gte: monthAgo } } }),
        ]);

        return { total, today, thisWeek, thisMonth };
    }),

    /**
     * 热门 SKU 排行
     */
    topSkus: adminProcedure
        .input(z.object({
            limit: z.number().min(1).max(50).default(10),
            days: z.number().min(1).max(365).default(30),
        }))
        .query(async ({ ctx, input }) => {
            const since = new Date();
            since.setDate(since.getDate() - input.days);

            const results = await ctx.prisma.buyIntent.groupBy({
                by: ['proofingPackId'],
                _count: { _all: true },
                where: { createdAt: { gte: since } },
                orderBy: { _count: { proofingPackId: 'desc' } },
                take: input.limit,
            });

            // 获取 SKU 详情
            const skuIds = results.map(r => r.proofingPackId);
            const skus = await ctx.prisma.proofingPack.findMany({
                where: { id: { in: skuIds } },
                include: {
                    color: {
                        select: { colorId: true, name: true },
                    },
                },
            });

            const skuMap = new Map(skus.map(s => [s.id, s]));

            return results.map(r => ({
                proofingPackId: r.proofingPackId,
                count: r._count._all,
                sku: skuMap.get(r.proofingPackId),
            }));
        }),

    /**
     * 按日期统计（趋势图数据）
     */
    dailyTrend: adminProcedure
        .input(z.object({
            days: z.number().min(1).max(90).default(30),
        }))
        .query(async ({ ctx, input }) => {
            const since = new Date();
            since.setDate(since.getDate() - input.days);
            since.setHours(0, 0, 0, 0);

            const intents = await ctx.prisma.buyIntent.findMany({
                where: { createdAt: { gte: since } },
                select: { createdAt: true },
            });

            // 按日期分组
            const dailyMap = new Map<string, number>();

            // 初始化所有日期
            for (let i = 0; i < input.days; i++) {
                const date = new Date(since);
                date.setDate(date.getDate() + i);
                const key = date.toISOString().split('T')[0];
                dailyMap.set(key, 0);
            }

            // 统计
            intents.forEach(intent => {
                const key = intent.createdAt.toISOString().split('T')[0];
                dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
            });

            return Array.from(dailyMap.entries()).map(([date, count]) => ({
                date,
                count,
            }));
        }),

    /**
     * 按纸张类型统计
     */
    byPaperType: adminProcedure
        .input(z.object({
            days: z.number().min(1).max(365).default(30),
        }))
        .query(async ({ ctx, input }) => {
            const since = new Date();
            since.setDate(since.getDate() - input.days);

            // 先获取所有 intent
            const intents = await ctx.prisma.buyIntent.findMany({
                where: { createdAt: { gte: since } },
                select: { proofingPackId: true },
            });

            // 获取对应的 SKU
            const skuIds = [...new Set(intents.map(i => i.proofingPackId))];
            const skus = await ctx.prisma.proofingPack.findMany({
                where: { id: { in: skuIds } },
                select: { id: true, paperType: true },
            });

            const skuPaperMap = new Map(skus.map(s => [s.id, s.paperType]));

            // 按纸张类型统计
            const typeCount = new Map<string, number>();
            intents.forEach(intent => {
                const paperType = skuPaperMap.get(intent.proofingPackId) || 'UNKNOWN';
                typeCount.set(paperType, (typeCount.get(paperType) || 0) + 1);
            });

            return Array.from(typeCount.entries())
                .map(([paperType, count]) => ({ paperType, count }))
                .sort((a, b) => b.count - a.count);
        }),

    /**
     * 最近的购买意图记录
     */
    recent: adminProcedure
        .input(z.object({
            limit: z.number().min(1).max(100).default(20),
        }))
        .query(async ({ ctx, input }) => {
            const intents = await ctx.prisma.buyIntent.findMany({
                take: input.limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    proofingPack: {
                        include: {
                            color: {
                                select: { colorId: true, name: true },
                            },
                        },
                    },
                },
            });

            return intents;
        }),
});

