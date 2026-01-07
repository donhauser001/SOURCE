/**
 * 用户 Router
 *
 * 用户相关 API
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';

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
});

