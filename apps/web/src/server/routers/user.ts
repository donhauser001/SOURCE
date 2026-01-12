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
import { logAdminAction, AUDIT_TARGET_TYPES } from '@/lib/admin-audit';

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
    // 色彩资产
    // ============================================================================

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

    // ============================================================================
    // 用户色彩簿
    // ============================================================================

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

    // ============================================================================
    // 用户作品
    // ============================================================================

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

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'UPDATE',
                targetType: AUDIT_TARGET_TYPES.USER,
                targetId: user.id,
                changes: {
                    before: { role: existing.role, tier: existing.tier },
                    after: { role: user.role, tier: user.tier },
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

