/**
 * User Router - 用户资产
 *
 * assetsStats, buyIntents, analysisReports
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';

export const userAssetsRouter = createTRPCRouter({
    /**
     * 获取用户色彩资产统计
     */
    assetsStats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const [buyIntentsCount, analysisReportsCount, colorBooksCount, worksCount] = await Promise.all([
            ctx.prisma.buyIntent.count({
                where: { userId },
            }),
            ctx.prisma.analysisReport.count({
                where: { userId },
            }),
            ctx.prisma.colorBook.count({
                where: { ownerId: userId },
            }),
            ctx.prisma.userWork.count({
                where: { userId },
            }),
        ]);

        return {
            buyIntents: buyIntentsCount,
            analysisReports: analysisReportsCount,
            colorBooks: colorBooksCount,
            works: worksCount,
        };
    }),

    /**
     * 获取用户购买意向记录
     */
    buyIntents: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(20),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, cursor } = input;

            const items = await ctx.prisma.buyIntent.findMany({
                where: { userId: ctx.session.user.id },
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
                include: {
                    proofingPack: {
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
                            paperType: {
                                select: {
                                    code: true,
                                    name: true,
                                },
                            },
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
     * 获取用户分析报告
     */
    analysisReports: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(20),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, cursor } = input;

            const items = await ctx.prisma.analysisReport.findMany({
                where: {
                    userId: ctx.session.user.id,
                    deletedAt: null, // 排除已删除的
                },
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    summary: true,
                    printIntent: true,
                    createdAt: true,
                    expiresAt: true,
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
});
