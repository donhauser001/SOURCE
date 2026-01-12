/**
 * User Router - 用户色彩簿
 *
 * colorBooks, createColorBook, updateColorBook, deleteColorBook,
 * getColorBook, addColorToBook, removeColorFromBook
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../trpc';

export const userColorBooksRouter = createTRPCRouter({
    /**
     * 获取用户的色彩簿列表
     */
    colorBooks: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(20),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, cursor } = input;

            const items = await ctx.prisma.colorBook.findMany({
                where: { ownerId: ctx.session.user.id },
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { updatedAt: 'desc' },
                include: {
                    category: true,
                    _count: {
                        select: { entries: true },
                    },
                },
            });

            let nextCursor: string | undefined;
            if (items.length > limit) {
                const nextItem = items.pop();
                nextCursor = nextItem?.id;
            }

            return {
                items: items.map((item) => ({
                    ...item,
                    totalColors: item._count.entries,
                })),
                nextCursor,
            };
        }),

    /**
     * 创建用户色彩簿
     */
    createColorBook: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                description: z.string().max(500).optional(),
                isPublic: z.boolean().default(false),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 生成唯一的 bookId 和 slug
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 6);
            const bookId = `U-${userId.substring(0, 4)}-${timestamp}`.toUpperCase();
            const slug = `user-${userId.substring(0, 8)}-${timestamp}-${random}`;

            // 获取默认分类
            let category = await ctx.prisma.colorBookCategoryOption.findFirst({
                where: { isDefault: true },
            });

            if (!category) {
                // 如果没有默认分类，使用第一个分类或创建一个
                category = await ctx.prisma.colorBookCategoryOption.findFirst({
                    orderBy: { order: 'asc' },
                });

                if (!category) {
                    category = await ctx.prisma.colorBookCategoryOption.create({
                        data: {
                            name: '用户收藏',
                            order: 999,
                            isDefault: true,
                        },
                    });
                }
            }

            const colorBook = await ctx.prisma.colorBook.create({
                data: {
                    bookId,
                    name: input.name,
                    slug,
                    description: input.description,
                    ownerId: userId,
                    isPublic: input.isPublic,
                    categoryId: category.id,
                    status: 'ACTIVE',
                    colorSystem: 'SOURCE',
                },
                include: {
                    category: true,
                },
            });

            return colorBook;
        }),

    /**
     * 更新用户色彩簿
     */
    updateColorBook: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1).max(100).optional(),
                description: z.string().max(500).optional().nullable(),
                isPublic: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            // 验证所有权
            const existing = await ctx.prisma.colorBook.findFirst({
                where: {
                    id,
                    ownerId: ctx.session.user.id,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '色彩簿不存在或无权限',
                });
            }

            const colorBook = await ctx.prisma.colorBook.update({
                where: { id },
                data,
                include: {
                    category: true,
                },
            });

            return colorBook;
        }),

    /**
     * 删除用户色彩簿
     */
    deleteColorBook: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 验证所有权
            const existing = await ctx.prisma.colorBook.findFirst({
                where: {
                    id: input.id,
                    ownerId: ctx.session.user.id,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '色彩簿不存在或无权限',
                });
            }

            await ctx.prisma.colorBook.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    /**
     * 获取用户色彩簿详情
     */
    getColorBook: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const colorBook = await ctx.prisma.colorBook.findFirst({
                where: {
                    id: input.id,
                    ownerId: ctx.session.user.id,
                },
                include: {
                    category: true,
                    entries: {
                        orderBy: { order: 'asc' },
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
                                    auditStatus: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!colorBook) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '色彩簿不存在或无权限',
                });
            }

            return colorBook;
        }),

    /**
     * 添加颜色到用户色彩簿
     */
    addColorToBook: protectedProcedure
        .input(
            z.object({
                colorBookId: z.string(),
                colorId: z.string(),
                note: z.string().max(200).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 验证所有权
            const colorBook = await ctx.prisma.colorBook.findFirst({
                where: {
                    id: input.colorBookId,
                    ownerId: ctx.session.user.id,
                },
            });

            if (!colorBook) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '色彩簿不存在或无权限',
                });
            }

            // 获取当前最大 order
            const maxOrder = await ctx.prisma.colorBookEntry.aggregate({
                where: { colorBookId: input.colorBookId },
                _max: { order: true },
            });

            // 创建关联
            const entry = await ctx.prisma.colorBookEntry.create({
                data: {
                    colorBookId: input.colorBookId,
                    colorId: input.colorId,
                    order: (maxOrder._max.order || 0) + 1,
                    note: input.note,
                },
            });

            // 更新色彩簿的 totalColors
            const count = await ctx.prisma.colorBookEntry.count({
                where: { colorBookId: input.colorBookId },
            });
            await ctx.prisma.colorBook.update({
                where: { id: input.colorBookId },
                data: { totalColors: count },
            });

            return entry;
        }),

    /**
     * 从用户色彩簿移除颜色
     */
    removeColorFromBook: protectedProcedure
        .input(
            z.object({
                colorBookId: z.string(),
                colorId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 验证所有权
            const colorBook = await ctx.prisma.colorBook.findFirst({
                where: {
                    id: input.colorBookId,
                    ownerId: ctx.session.user.id,
                },
            });

            if (!colorBook) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '色彩簿不存在或无权限',
                });
            }

            await ctx.prisma.colorBookEntry.deleteMany({
                where: {
                    colorBookId: input.colorBookId,
                    colorId: input.colorId,
                },
            });

            // 更新色彩簿的 totalColors
            const count = await ctx.prisma.colorBookEntry.count({
                where: { colorBookId: input.colorBookId },
            });
            await ctx.prisma.colorBook.update({
                where: { id: input.colorBookId },
                data: { totalColors: count },
            });

            return { success: true };
        }),
});
