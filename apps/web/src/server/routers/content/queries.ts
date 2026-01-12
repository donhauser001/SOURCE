/**
 * Content Router - 公开查询
 *
 * list, get, search, featured
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { createTRPCRouter, publicProcedure } from '../../trpc';
import {
    contentListSchema,
    contentGetSchema,
    ContentTypeLabels,
    ContentStatusLabels,
    FeaturedLevelLabels,
} from '@/lib/validations/content';
import { getCacheClient, isCacheAvailable } from '@/lib/cache/redis';

// 浏览量防刷过期时间（秒）- 同一访客 24 小时内只计一次
const VIEW_THROTTLE_TTL = 24 * 60 * 60;

export const contentQueriesRouter = createTRPCRouter({
    /**
     * 公开内容列表（简化版，用于首页展示）
     */
    publicList: publicProcedure
        .input(
            z.object({
                contentType: z.enum(['WORK', 'TUTORIAL', 'ARTICLE']).optional(),
                featuredLevel: z.number().min(0).max(3).optional(),
                limit: z.number().min(1).max(50).optional().default(12),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { contentType, featuredLevel, limit, cursor } = input;

            const where: Prisma.ContentWhereInput = {
                status: 'PUBLISHED',
            };

            if (contentType) {
                where.contentType = contentType;
            }

            if (featuredLevel !== undefined) {
                const levelMap: Record<number, 'NONE' | 'EDITOR_PICK' | 'HOMEPAGE' | 'HERO'> = {
                    0: 'NONE',
                    1: 'EDITOR_PICK',
                    2: 'HOMEPAGE',
                    3: 'HERO',
                };
                where.featuredLevel = levelMap[featuredLevel];
            }

            const items = await ctx.prisma.content.findMany({
                where,
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: [{ publishedAt: 'desc' }],
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
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
                    featuredLevelLabel: FeaturedLevelLabels[item.featuredLevel],
                })),
                nextCursor,
            };
        }),

    /**
     * 获取公开内容列表
     */
    list: publicProcedure.input(contentListSchema).query(async ({ ctx, input }) => {
        const { tab, contentTypes, categorySlug, tags, q, limit, cursor } = input;

        // 基础条件：只显示已发布内容
        const where: Prisma.ContentWhereInput = {
            status: 'PUBLISHED',
        };

        // 根据 Tab 筛选
        if (tab) {
            switch (tab) {
                case 'all_featured':
                    where.featuredLevel = { not: 'NONE' };
                    break;
                case 'featured_works':
                    where.featuredLevel = { not: 'NONE' };
                    where.contentType = 'WORK';
                    break;
                case 'featured_tutorials':
                    where.featuredLevel = { not: 'NONE' };
                    where.contentType = 'TUTORIAL';
                    break;
                case 'featured_articles':
                    where.featuredLevel = { not: 'NONE' };
                    where.contentType = 'ARTICLE';
                    break;
                case 'all_contents':
                    // 不筛选推荐等级
                    break;
            }
        }

        // 内容类型筛选
        if (contentTypes && contentTypes.length > 0 && !tab?.startsWith('featured_')) {
            where.contentType = { in: contentTypes };
        }

        // 分类筛选
        if (categorySlug) {
            const category = await ctx.prisma.contentCategory.findUnique({
                where: { slug: categorySlug },
                include: { children: { select: { id: true } } },
            });
            if (category) {
                // 包含该分类及其所有子分类
                const categoryIds = [category.id, ...category.children.map(c => c.id)];
                where.categoryId = { in: categoryIds };
            }
        }

        // 标签筛选
        if (tags && tags.length > 0) {
            where.tags = { hasSome: tags };
        }

        // 搜索关键词
        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { summary: { contains: q, mode: 'insensitive' } },
                { tags: { has: q } },
            ];
        }

        const items = await ctx.prisma.content.findMany({
            where,
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: [
                { featuredLevel: 'desc' }, // 首页推荐 > 编辑推荐 > 普通
                { publishedAt: 'desc' },
            ],
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
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
                featuredLevelLabel: FeaturedLevelLabels[item.featuredLevel],
            })),
            nextCursor,
        };
    }),

    /**
     * 获取单个内容详情
     */
    get: publicProcedure.input(contentGetSchema).query(async ({ ctx, input }) => {
        const where = input.id ? { id: input.id } : { contentId: input.contentId };

        const content = await ctx.prisma.content.findFirst({
            where: {
                ...where,
                // 公开接口只返回已发布内容
                status: 'PUBLISHED',
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
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
            },
        });

        if (!content) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '内容不存在或未发布',
            });
        }

        // 防刷机制：同一访客 24 小时内只计一次浏览量
        let shouldIncrementView = true;
        const viewKey = `view:${content.id}:${ctx.clientFingerprint}`;

        try {
            if (await isCacheAvailable()) {
                const cache = getCacheClient();
                const exists = await cache.exists(viewKey);
                if (exists) {
                    // 已经在 24 小时内访问过，不增加浏览量
                    shouldIncrementView = false;
                } else {
                    // 首次访问，记录访问记录
                    await cache.setex(viewKey, VIEW_THROTTLE_TTL, '1');
                }
            }
        } catch (error) {
            // Redis 不可用时，降级为每次都计数
            console.warn('[ViewCount] Redis unavailable, falling back to counting every view');
        }

        // 增加浏览量
        if (shouldIncrementView) {
            await ctx.prisma.content.update({
                where: { id: content.id },
                data: { viewCount: { increment: 1 } },
            });
        }

        return {
            ...content,
            contentTypeLabel: ContentTypeLabels[content.contentType],
            statusLabel: ContentStatusLabels[content.status],
            featuredLevelLabel: FeaturedLevelLabels[content.featuredLevel],
        };
    }),

    /**
     * 搜索内容
     */
    search: publicProcedure
        .input(
            z.object({
                q: z.string().min(1),
                contentType: z.enum(['WORK', 'TUTORIAL', 'ARTICLE']).optional(),
                limit: z.number().min(1).max(50).optional().default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const { q, contentType, limit } = input;

            const where: Prisma.ContentWhereInput = {
                status: 'PUBLISHED',
                OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { summary: { contains: q, mode: 'insensitive' } },
                    { contentId: { contains: q, mode: 'insensitive' } },
                    { tags: { has: q } },
                ],
            };

            if (contentType) {
                where.contentType = contentType;
            }

            const items = await ctx.prisma.content.findMany({
                where,
                take: limit,
                orderBy: { publishedAt: 'desc' },
                select: {
                    id: true,
                    contentId: true,
                    contentType: true,
                    title: true,
                    summary: true,
                    coverImageUrl: true,
                    featuredLevel: true,
                    viewCount: true,
                    likeCount: true,
                    publishedAt: true,
                    author: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            });

            return {
                items: items.map(item => ({
                    ...item,
                    contentTypeLabel: ContentTypeLabels[item.contentType],
                    featuredLevelLabel: FeaturedLevelLabels[item.featuredLevel],
                })),
                total: items.length,
            };
        }),

    /**
     * 获取首页推荐内容
     */
    featured: publicProcedure.query(async ({ ctx }) => {
        // 首页推荐（轮播）
        const homepage = await ctx.prisma.content.findMany({
            where: {
                status: 'PUBLISHED',
                featuredLevel: 'HOMEPAGE',
            },
            take: 5,
            orderBy: { publishedAt: 'desc' },
            include: {
                author: {
                    select: { id: true, name: true, image: true },
                },
            },
        });

        // 编辑推荐
        const editorPicks = await ctx.prisma.content.findMany({
            where: {
                status: 'PUBLISHED',
                featuredLevel: 'EDITOR_PICK',
            },
            take: 10,
            orderBy: { publishedAt: 'desc' },
            include: {
                author: {
                    select: { id: true, name: true, image: true },
                },
                colors: {
                    take: 3,
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
            },
        });

        return {
            homepage: homepage.map(item => ({
                ...item,
                contentTypeLabel: ContentTypeLabels[item.contentType],
            })),
            editorPicks: editorPicks.map(item => ({
                ...item,
                contentTypeLabel: ContentTypeLabels[item.contentType],
            })),
        };
    }),

    /**
     * 获取内容统计
     */
    stats: publicProcedure.query(async ({ ctx }) => {
        const [total, works, tutorials, articles] = await Promise.all([
            ctx.prisma.content.count({ where: { status: 'PUBLISHED' } }),
            ctx.prisma.content.count({ where: { status: 'PUBLISHED', contentType: 'WORK' } }),
            ctx.prisma.content.count({ where: { status: 'PUBLISHED', contentType: 'TUTORIAL' } }),
            ctx.prisma.content.count({ where: { status: 'PUBLISHED', contentType: 'ARTICLE' } }),
        ]);

        return { total, works, tutorials, articles };
    }),
});
