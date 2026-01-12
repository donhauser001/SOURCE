/**
 * Content Router - 用户操作
 *
 * create, update, delete, submit, myContents
 */

import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import {
    contentInputSchema,
    contentUpdateSchema,
    contentSubmitSchema,
    contentDeleteSchema,
    myContentsSchema,
    ContentTypeLabels,
    ContentStatusLabels,
    FeaturedLevelLabels,
} from '@/lib/validations/content';
import { canEdit, canDelete, canSubmit } from '../../machines/content-machine';

/**
 * 生成内容 ID
 * 格式：CL-{类型前缀}-{序号}
 * 例如：CL-W-0001, CL-T-0001, CL-A-0001
 */
async function generateContentId(
    prisma: typeof import('@/lib/db').prisma,
    contentType: 'WORK' | 'TUTORIAL' | 'ARTICLE'
): Promise<string> {
    const prefix = {
        WORK: 'W',
        TUTORIAL: 'T',
        ARTICLE: 'A',
    }[contentType];

    // 获取该类型的最大序号
    const lastContent = await prisma.content.findFirst({
        where: {
            contentId: { startsWith: `CL-${prefix}-` },
        },
        orderBy: { contentId: 'desc' },
        select: { contentId: true },
    });

    let nextNum = 1;
    if (lastContent?.contentId) {
        const match = lastContent.contentId.match(/CL-[WTA]-(\d+)/);
        if (match) {
            nextNum = parseInt(match[1], 10) + 1;
        }
    }

    return `CL-${prefix}-${nextNum.toString().padStart(4, '0')}`;
}

export const contentMutationsRouter = createTRPCRouter({
    /**
     * 创建内容
     */
    create: protectedProcedure
        .input(contentInputSchema)
        .mutation(async ({ ctx, input }) => {
            const { colorIds, ...data } = input;

            // 生成内容 ID
            const contentId = await generateContentId(ctx.prisma, data.contentType);

            // 验证色彩簿存在性
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

            // 验证分类存在性
            if (data.categoryId) {
                const category = await ctx.prisma.contentCategory.findUnique({
                    where: { id: data.categoryId },
                });

                if (!category) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: '分类不存在',
                    });
                }

                // 检查分类是否适用于该内容类型
                if (!category.contentTypes.includes(data.contentType)) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `分类「${category.name}」不适用于${ContentTypeLabels[data.contentType]}`,
                    });
                }
            }

            // 创建内容
            const content = await ctx.prisma.content.create({
                data: {
                    contentId,
                    contentType: data.contentType,
                    title: data.title,
                    summary: data.summary,
                    body: data.body || '',
                    coverImageUrl: data.coverImageUrl,
                    galleryImages: data.galleryImages || [],
                    externalUrl: data.externalUrl,
                    categoryId: data.categoryId,
                    colorBookId: data.colorBookId,
                    tags: data.tags || [],
                    authorId: ctx.session.user.id,
                    status: 'DRAFT',
                    featuredLevel: 'NONE',
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

            return content;
        }),

    /**
     * 更新内容
     */
    update: protectedProcedure
        .input(contentUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, colorIds, ...data } = input;

            // 验证内容存在性和所有权
            const existing = await ctx.prisma.content.findFirst({
                where: {
                    id,
                    authorId: ctx.session.user.id,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '内容不存在或无权限',
                });
            }

            // 检查是否可编辑
            if (!canEdit(existing.status)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `当前状态（${ContentStatusLabels[existing.status]}）不允许编辑`,
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

            // 验证分类
            if (data.categoryId !== undefined && data.categoryId !== null) {
                const category = await ctx.prisma.contentCategory.findUnique({
                    where: { id: data.categoryId },
                });

                if (!category) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: '分类不存在',
                    });
                }

                if (!category.contentTypes.includes(existing.contentType)) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `分类「${category.name}」不适用于${ContentTypeLabels[existing.contentType]}`,
                    });
                }
            }

            // 更新内容
            const content = await ctx.prisma.content.update({
                where: { id },
                data: {
                    ...data,
                    // 如果被拒绝后重新编辑，清除拒绝原因
                    ...(existing.status === 'REJECTED' && { rejectReason: null }),
                },
            });

            // 如果提供了新的颜色列表，更新颜色关联
            if (colorIds !== undefined) {
                // 删除旧的关联
                await ctx.prisma.contentColor.deleteMany({
                    where: { contentId: id },
                });

                // 创建新的关联
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

            return content;
        }),

    /**
     * 删除内容
     */
    delete: protectedProcedure
        .input(contentDeleteSchema)
        .mutation(async ({ ctx, input }) => {
            // 验证内容存在性和所有权
            const existing = await ctx.prisma.content.findFirst({
                where: {
                    id: input.id,
                    authorId: ctx.session.user.id,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '内容不存在或无权限',
                });
            }

            // 检查是否可删除
            if (!canDelete(existing.status)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `当前状态（${ContentStatusLabels[existing.status]}）不允许删除`,
                });
            }

            await ctx.prisma.content.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    /**
     * 提交审核
     */
    submit: protectedProcedure
        .input(contentSubmitSchema)
        .mutation(async ({ ctx, input }) => {
            // 验证内容存在性和所有权
            const existing = await ctx.prisma.content.findFirst({
                where: {
                    id: input.id,
                    authorId: ctx.session.user.id,
                },
                include: {
                    colors: true,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '内容不存在或无权限',
                });
            }

            // 检查是否可提交审核
            if (!canSubmit(existing.status)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `当前状态（${ContentStatusLabels[existing.status]}）不允许提交审核`,
                });
            }

            // 作品类型：验证是否关联了色彩或色彩簿
            if (existing.contentType === 'WORK') {
                const hasColors = existing.colors.length > 0;
                const hasColorBook = !!existing.colorBookId;

                if (!hasColors && !hasColorBook) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: '作品必须关联至少一个色彩或色彩簿才能提交审核',
                    });
                }
            }

            // 教程和文章类型：验证是否有正文
            if (existing.contentType === 'TUTORIAL' || existing.contentType === 'ARTICLE') {
                if (!existing.body || existing.body.trim().length === 0) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `${ContentTypeLabels[existing.contentType]}必须有正文内容才能提交审核`,
                    });
                }
            }

            // 更新状态为待审核
            const content = await ctx.prisma.content.update({
                where: { id: input.id },
                data: {
                    status: 'PENDING',
                    rejectReason: null,
                },
            });

            return content;
        }),

    /**
     * 获取我的内容列表
     */
    myContents: protectedProcedure
        .input(myContentsSchema)
        .query(async ({ ctx, input }) => {
            const { status, contentType, limit, cursor } = input;

            const where: {
                authorId: string;
                status?: typeof status;
                contentType?: typeof contentType;
            } = {
                authorId: ctx.session.user.id,
            };

            if (status) {
                where.status = status;
            }

            if (contentType) {
                where.contentType = contentType;
            }

            const items = await ctx.prisma.content.findMany({
                where,
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { updatedAt: 'desc' },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    colors: {
                        take: 5,
                        orderBy: { order: 'asc' },
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
                    },
                    _count: {
                        select: { colors: true },
                    },
                },
            });

            let nextCursor: string | undefined;
            if (items.length > limit) {
                const nextItem = items.pop();
                nextCursor = nextItem?.id;
            }

            return {
                items: items.map(item => ({
                    ...item,
                    contentTypeLabel: ContentTypeLabels[item.contentType],
                    statusLabel: ContentStatusLabels[item.status],
                    featuredLevelLabel: FeaturedLevelLabels[item.featuredLevel],
                    canEdit: canEdit(item.status),
                    canDelete: canDelete(item.status),
                    canSubmit: canSubmit(item.status),
                })),
                nextCursor,
            };
        }),

    /**
     * 获取单个内容详情（作者视角，可查看任意状态）
     */
    getMyContent: protectedProcedure
        .input(contentDeleteSchema) // 复用 schema
        .query(async ({ ctx, input }) => {
            const content = await ctx.prisma.content.findFirst({
                where: {
                    id: input.id,
                    authorId: ctx.session.user.id,
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    colorBook: {
                        select: {
                            id: true,
                            bookId: true,
                            name: true,
                            slug: true,
                        },
                    },
                    colors: {
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
                                },
                            },
                        },
                    },
                    reviews: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        include: {
                            reviewer: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!content) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '内容不存在或无权限',
                });
            }

            return {
                ...content,
                contentTypeLabel: ContentTypeLabels[content.contentType],
                statusLabel: ContentStatusLabels[content.status],
                featuredLevelLabel: FeaturedLevelLabels[content.featuredLevel],
                canEdit: canEdit(content.status),
                canDelete: canDelete(content.status),
                canSubmit: canSubmit(content.status),
            };
        }),
});
