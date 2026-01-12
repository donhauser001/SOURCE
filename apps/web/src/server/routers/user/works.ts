/**
 * User Router - 用户作品
 *
 * works, worksStats, createWork, updateWork, deleteWork, getWork
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../trpc';

export const userWorksRouter = createTRPCRouter({
    /**
     * 获取用户作品列表
     */
    works: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(20),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, cursor } = input;

            const items = await ctx.prisma.userWork.findMany({
                where: { userId: ctx.session.user.id },
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
                include: {
                    colorBook: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    colors: {
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
                        orderBy: { order: 'asc' },
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
     * 获取用户作品统计
     */
    worksStats: protectedProcedure.query(async ({ ctx }) => {
        const count = await ctx.prisma.userWork.count({
            where: { userId: ctx.session.user.id },
        });
        return { count };
    }),

    /**
     * 创建用户作品
     */
    createWork: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1).max(100),
                description: z.string().max(2000).optional(),
                imageUrl: z.string().url(),
                colorBookId: z.string().optional(),
                colorIds: z.array(z.string()).max(20).optional(),
                externalUrl: z.string().url().optional(),
                tags: z.array(z.string()).max(10).optional(),
                isPublic: z.boolean().default(false),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { colorIds, ...data } = input;

            // 如果指定了色彩簿，验证其存在性（可以是系统色彩簿或用户自己的）
            if (data.colorBookId) {
                const colorBook = await ctx.prisma.colorBook.findFirst({
                    where: {
                        id: data.colorBookId,
                        OR: [
                            { ownerId: null }, // 系统色彩簿
                            { ownerId: ctx.session.user.id }, // 用户自己的
                            { isPublic: true }, // 公开的
                        ],
                    },
                });

                if (!colorBook) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: '色彩簿不存在或无权限访问',
                    });
                }
            }

            // 创建作品
            const work = await ctx.prisma.userWork.create({
                data: {
                    ...data,
                    userId: ctx.session.user.id,
                    tags: data.tags || [],
                },
            });

            // 添加颜色关联
            if (colorIds && colorIds.length > 0) {
                await ctx.prisma.userWorkColor.createMany({
                    data: colorIds.map((colorId, index) => ({
                        workId: work.id,
                        colorId,
                        order: index,
                    })),
                });
            }

            return work;
        }),

    /**
     * 更新用户作品
     */
    updateWork: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1).max(100).optional(),
                description: z.string().max(2000).optional().nullable(),
                imageUrl: z.string().url().optional(),
                colorBookId: z.string().optional().nullable(),
                colorIds: z.array(z.string()).max(20).optional(),
                externalUrl: z.string().url().optional().nullable(),
                tags: z.array(z.string()).max(10).optional(),
                isPublic: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, colorIds, ...data } = input;

            // 验证所有权
            const existing = await ctx.prisma.userWork.findFirst({
                where: {
                    id,
                    userId: ctx.session.user.id,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '作品不存在或无权限',
                });
            }

            // 如果更改了色彩簿，验证其存在性
            if (data.colorBookId !== undefined && data.colorBookId !== null) {
                const colorBook = await ctx.prisma.colorBook.findFirst({
                    where: {
                        id: data.colorBookId,
                        OR: [
                            { ownerId: null },
                            { ownerId: ctx.session.user.id },
                            { isPublic: true },
                        ],
                    },
                });

                if (!colorBook) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: '色彩簿不存在或无权限访问',
                    });
                }
            }

            // 更新作品
            const work = await ctx.prisma.userWork.update({
                where: { id },
                data,
            });

            // 如果提供了新的颜色列表，更新颜色关联
            if (colorIds !== undefined) {
                // 删除旧的关联
                await ctx.prisma.userWorkColor.deleteMany({
                    where: { workId: id },
                });

                // 创建新的关联
                if (colorIds.length > 0) {
                    await ctx.prisma.userWorkColor.createMany({
                        data: colorIds.map((colorId, index) => ({
                            workId: id,
                            colorId,
                            order: index,
                        })),
                    });
                }
            }

            return work;
        }),

    /**
     * 删除用户作品
     */
    deleteWork: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 验证所有权
            const existing = await ctx.prisma.userWork.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '作品不存在或无权限',
                });
            }

            await ctx.prisma.userWork.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    /**
     * 获取单个作品详情
     */
    getWork: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const work = await ctx.prisma.userWork.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id,
                },
                include: {
                    colorBook: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    colors: {
                        include: {
                            color: {
                                select: {
                                    id: true,
                                    colorId: true,
                                    name: true,
                                    slug: true,
                                    labL: true,
                                    labA: true,
                                    labB: true,
                                    status: true,
                                },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                },
            });

            if (!work) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '作品不存在或无权限',
                });
            }

            return work;
        }),
});
