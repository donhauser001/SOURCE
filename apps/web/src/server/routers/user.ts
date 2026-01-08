/**
 * 用户 Router
 *
 * 用户相关 API
 * 
 * v0.5.2 增强：管理员用户管理
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';

export const userRouter = createTRPCRouter({
    /**
     * 获取当前用户信息
     */
    me: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                tier: true,
                createdAt: true,
            },
        });

        return user;
    }),

    /**
     * 更新用户资料
     */
    updateProfile: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(50).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.prisma.user.update({
                where: { id: ctx.session.user.id },
                data: {
                    name: input.name,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    tier: true,
                },
            });

            return user;
        }),

    // ============================================================================
    // 管理员功能
    // ============================================================================

    /**
     * 管理员：获取用户列表
     */
    adminList: adminProcedure
        .input(
            z.object({
                search: z.string().optional(),
                role: z.enum(['ADMIN', 'AUDITOR', 'PARTNER', 'USER']).optional(),
                tier: z.enum(['FREE', 'VERIFIED', 'PAID']).optional(),
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { search, role, tier, limit, cursor } = input;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const where: any = {};

            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (role) {
                where.role = role;
            }

            if (tier) {
                where.tier = tier;
            }

            const items = await ctx.prisma.user.findMany({
                where,
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    image: true,
                    role: true,
                    tier: true,
                    createdAt: true,
                    _count: {
                        select: {
                            apiKeys: true,
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
     * 管理员：更新用户角色/等级
     */
    adminUpdate: adminProcedure
        .input(
            z.object({
                id: z.string(),
                role: z.enum(['ADMIN', 'AUDITOR', 'PARTNER', 'USER']).optional(),
                tier: z.enum(['FREE', 'VERIFIED', 'PAID']).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const existing = await ctx.prisma.user.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用户不存在',
                });
            }

            const user = await ctx.prisma.user.update({
                where: { id },
                data,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    tier: true,
                },
            });

            return user;
        }),

    /**
     * 管理员：统计
     */
    adminStats: adminProcedure.query(async ({ ctx }) => {
        const [total, byRole, byTier] = await Promise.all([
            ctx.prisma.user.count(),
            ctx.prisma.user.groupBy({
                by: ['role'],
                _count: { _all: true },
            }),
            ctx.prisma.user.groupBy({
                by: ['tier'],
                _count: { _all: true },
            }),
        ]);

        return {
            total,
            byRole: byRole.map((r) => ({ role: r.role, count: r._count._all })),
            byTier: byTier.map((t) => ({ tier: t.tier, count: t._count._all })),
        };
    }),
});

