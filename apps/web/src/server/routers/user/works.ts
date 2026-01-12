/**
 * User Router - 用户作品 (兼容层)
 *
 * @deprecated 此模块为兼容层，新代码请使用 contentRouter
 *
 * 将旧的 userWorksRouter API 转发到新的 contentRouter
 * 保持向后兼容，逐步废弃
 *
 * 映射关系：
 * - works → content.myContents (type=WORK)
 * - worksStats → 直接查询
 * - createWork → content.create (type=WORK)
 * - updateWork → content.update
 * - deleteWork → content.delete
 * - getWork → content.myContent
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../trpc';

// 添加废弃警告日志
function logDeprecationWarning(method: string) {
    console.warn(
        `[DEPRECATED] user.${method} is deprecated. Please use content.* API instead.`
    );
}

export const userWorksRouter = createTRPCRouter({
    /**
     * 获取用户作品列表
     * @deprecated 请使用 content.myContents
     */
    works: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(20),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            logDeprecationWarning('works');
            const { limit, cursor } = input;

            // 优先从新的 Content 表获取数据
            const contents = await ctx.prisma.content.findMany({
                where: {
                    authorId: ctx.session.user.id,
                    contentType: 'WORK',
                },
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

            // 转换为旧格式
            const items = contents.slice(0, limit).map((content) => ({
                id: content.id,
                userId: content.authorId,
                title: content.title,
                description: content.summary || content.body,
                imageUrl: content.coverImageUrl,
                colorBookId: content.colorBookId,
                colorBook: content.colorBook,
                colors: content.colors,
                externalUrl: content.externalUrl?.split('|migrated:')[0] || content.externalUrl,
                tags: content.tags,
                isPublic: content.status === 'PUBLISHED',
                viewCount: content.viewCount,
                likeCount: content.likeCount,
                createdAt: content.createdAt,
                updatedAt: content.updatedAt,
            }));

            let nextCursor: string | undefined;
            if (contents.length > limit) {
                nextCursor = contents[limit - 1]?.id;
            }

            // 如果没有从 Content 获取到数据，回退到旧表
            if (items.length === 0) {
                const oldItems = await ctx.prisma.userWork.findMany({
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

                let oldNextCursor: string | undefined;
                if (oldItems.length > limit) {
                    const nextItem = oldItems.pop();
                    oldNextCursor = nextItem?.id;
                }

                return {
                    items: oldItems,
                    nextCursor: oldNextCursor,
                };
            }

            return {
                items,
                nextCursor,
            };
        }),

    /**
     * 获取用户作品统计
     * @deprecated 请使用 content.myContents 并计算
     */
    worksStats: protectedProcedure.query(async ({ ctx }) => {
        logDeprecationWarning('worksStats');

        // 从新的 Content 表统计
        const contentCount = await ctx.prisma.content.count({
            where: {
                authorId: ctx.session.user.id,
                contentType: 'WORK',
            },
        });

        // 如果没有，回退到旧表
        if (contentCount === 0) {
            const oldCount = await ctx.prisma.userWork.count({
                where: { userId: ctx.session.user.id },
            });
            return { count: oldCount };
        }

        return { count: contentCount };
    }),

    /**
     * 创建用户作品
     * @deprecated 请使用 content.create
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
            logDeprecationWarning('createWork');
            const { colorIds, isPublic, ...data } = input;

            // 如果指定了色彩簿，验证其存在性
            if (data.colorBookId) {
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

            // 生成 contentId
            const existingContent = await ctx.prisma.content.findFirst({
                where: {
                    contentType: 'WORK',
                    contentId: { startsWith: 'CL-W-' },
                },
                orderBy: { contentId: 'desc' },
            });

            let sequence = 1;
            if (existingContent?.contentId) {
                const match = existingContent.contentId.match(/CL-W-(\d+)/);
                if (match) {
                    sequence = parseInt(match[1], 10) + 1;
                }
            }
            const contentId = `CL-W-${String(sequence).padStart(4, '0')}`;

            // 创建到新的 Content 表
            const content = await ctx.prisma.content.create({
                data: {
                    contentId,
                    contentType: 'WORK',
                    title: data.title,
                    summary: data.description?.substring(0, 500) || null,
                    body: data.description || '',
                    coverImageUrl: data.imageUrl,
                    galleryImages: [],
                    externalUrl: data.externalUrl,
                    status: isPublic ? 'PUBLISHED' : 'DRAFT',
                    featuredLevel: 'NONE',
                    authorId: ctx.session.user.id,
                    colorBookId: data.colorBookId,
                    tags: data.tags || [],
                    publishedAt: isPublic ? new Date() : null,
                },
            });

            // 添加颜色关联
            if (colorIds && colorIds.length > 0) {
                await ctx.prisma.contentColor.createMany({
                    data: colorIds.map((colorId, index) => ({
                        contentId: content.id,
                        colorId,
                        order: index,
                    })),
                });
            }

            // 返回兼容格式
            return {
                id: content.id,
                userId: content.authorId,
                title: content.title,
                description: content.summary,
                imageUrl: content.coverImageUrl,
                colorBookId: content.colorBookId,
                externalUrl: content.externalUrl,
                tags: content.tags,
                isPublic: content.status === 'PUBLISHED',
                viewCount: content.viewCount,
                likeCount: content.likeCount,
                createdAt: content.createdAt,
                updatedAt: content.updatedAt,
            };
        }),

    /**
     * 更新用户作品
     * @deprecated 请使用 content.update
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
            logDeprecationWarning('updateWork');
            const { id, colorIds, isPublic, ...data } = input;

            // 先尝试在 Content 表中查找
            const existingContent = await ctx.prisma.content.findFirst({
                where: {
                    id,
                    authorId: ctx.session.user.id,
                    contentType: 'WORK',
                },
            });

            if (existingContent) {
                // 更新 Content 表
                const updateData: Record<string, unknown> = {};
                if (data.title !== undefined) updateData.title = data.title;
                if (data.description !== undefined) {
                    updateData.summary = data.description?.substring(0, 500) || null;
                    updateData.body = data.description || '';
                }
                if (data.imageUrl !== undefined) updateData.coverImageUrl = data.imageUrl;
                if (data.colorBookId !== undefined) updateData.colorBookId = data.colorBookId;
                if (data.externalUrl !== undefined) updateData.externalUrl = data.externalUrl;
                if (data.tags !== undefined) updateData.tags = data.tags;
                if (isPublic !== undefined) {
                    updateData.status = isPublic ? 'PUBLISHED' : 'DRAFT';
                    if (isPublic && !existingContent.publishedAt) {
                        updateData.publishedAt = new Date();
                    }
                }

                const content = await ctx.prisma.content.update({
                    where: { id },
                    data: updateData,
                });

                // 更新颜色关联
                if (colorIds !== undefined) {
                    await ctx.prisma.contentColor.deleteMany({
                        where: { contentId: id },
                    });

                    if (colorIds.length > 0) {
                        await ctx.prisma.contentColor.createMany({
                            data: colorIds.map((colorId, index) => ({
                                contentId: id,
                                colorId,
                                order: index,
                            })),
                        });
                    }
                }

                return {
                    id: content.id,
                    userId: content.authorId,
                    title: content.title,
                    description: content.summary,
                    imageUrl: content.coverImageUrl,
                    colorBookId: content.colorBookId,
                    externalUrl: content.externalUrl,
                    tags: content.tags,
                    isPublic: content.status === 'PUBLISHED',
                    viewCount: content.viewCount,
                    likeCount: content.likeCount,
                    createdAt: content.createdAt,
                    updatedAt: content.updatedAt,
                };
            }

            // 回退到旧表
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

            // 验证色彩簿
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

            const work = await ctx.prisma.userWork.update({
                where: { id },
                data: {
                    ...data,
                    isPublic,
                },
            });

            if (colorIds !== undefined) {
                await ctx.prisma.userWorkColor.deleteMany({
                    where: { workId: id },
                });

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
     * @deprecated 请使用 content.delete
     */
    deleteWork: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            logDeprecationWarning('deleteWork');

            // 先尝试从 Content 表删除
            const existingContent = await ctx.prisma.content.findFirst({
                where: {
                    id: input.id,
                    authorId: ctx.session.user.id,
                    contentType: 'WORK',
                },
            });

            if (existingContent) {
                await ctx.prisma.content.delete({
                    where: { id: input.id },
                });
                return { success: true };
            }

            // 回退到旧表
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
     * @deprecated 请使用 content.get
     */
    getWork: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            logDeprecationWarning('getWork');

            // 先尝试从 Content 表获取
            const content = await ctx.prisma.content.findFirst({
                where: {
                    id: input.id,
                    authorId: ctx.session.user.id,
                    contentType: 'WORK',
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

            if (content) {
                return {
                    id: content.id,
                    userId: content.authorId,
                    title: content.title,
                    description: content.summary || content.body,
                    imageUrl: content.coverImageUrl,
                    colorBookId: content.colorBookId,
                    colorBook: content.colorBook,
                    colors: content.colors,
                    externalUrl: content.externalUrl?.split('|migrated:')[0] || content.externalUrl,
                    tags: content.tags,
                    isPublic: content.status === 'PUBLISHED',
                    viewCount: content.viewCount,
                    likeCount: content.likeCount,
                    createdAt: content.createdAt,
                    updatedAt: content.updatedAt,
                };
            }

            // 回退到旧表
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
