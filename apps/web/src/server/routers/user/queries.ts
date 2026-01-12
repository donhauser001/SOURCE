/**
 * User Router - 基本查询
 *
 * me, updateProfile
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';

export const userQueriesRouter = createTRPCRouter({
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
