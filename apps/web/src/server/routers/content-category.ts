/**
 * ColLab 内容分类管理 Router
 * 
 * 提供多级分类的 CRUD 和排序功能
 */

import { z } from 'zod';
import { createTRPCRouter, adminProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
    contentCategoryCreateSchema,
    contentCategoryUpdateSchema,
    contentCategoryListSchema,
    contentCategoryReorderSchema,
    ContentTypeEnum,
} from '@/lib/validations/content';

export const contentCategoryRouter = createTRPCRouter({
    /**
     * 获取分类列表/树（公开）
     */
    list: publicProcedure
        .input(contentCategoryListSchema)
        .query(async ({ ctx, input }) => {
            const { contentType, includeInactive } = input;

            // 构建查询条件
            const where: {
                isActive?: boolean;
                contentTypes?: { has: z.infer<typeof ContentTypeEnum> };
            } = {};

            if (!includeInactive) {
                where.isActive = true;
            }

            if (contentType) {
                where.contentTypes = { has: contentType };
            }

            const categories = await ctx.prisma.contentCategory.findMany({
                where,
                orderBy: [
                    { level: 'asc' },
                    { order: 'asc' },
                    { name: 'asc' },
                ],
                include: {
                    _count: {
                        select: { contents: true },
                    },
                },
            });

            // 构建树形结构
            const buildTree = (parentId: string | null): typeof categories => {
                return categories
                    .filter((cat) => cat.parentId === parentId)
                    .map((cat) => ({
                        ...cat,
                        children: buildTree(cat.id),
                    }));
            };

            return {
                items: categories,
                tree: buildTree(null),
            };
        }),

    /**
     * 获取单个分类
     */
    get: publicProcedure
        .input(z.object({
            id: z.string().optional(),
            slug: z.string().optional(),
        }).refine((data) => data.id || data.slug, {
            message: '必须提供 id 或 slug',
        }))
        .query(async ({ ctx, input }) => {
            const category = await ctx.prisma.contentCategory.findFirst({
                where: input.id ? { id: input.id } : { slug: input.slug },
                include: {
                    parent: true,
                    children: {
                        where: { isActive: true },
                        orderBy: { order: 'asc' },
                    },
                    _count: {
                        select: { contents: true },
                    },
                },
            });

            if (!category) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '分类不存在',
                });
            }

            return category;
        }),

    /**
     * 创建分类（需 ADMIN 权限）
     */
    create: adminProcedure
        .input(contentCategoryCreateSchema)
        .mutation(async ({ ctx, input }) => {
            // 检查 slug 是否已存在
            const existingSlug = await ctx.prisma.contentCategory.findUnique({
                where: { slug: input.slug },
            });

            if (existingSlug) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'URL 标识已被使用',
                });
            }

            // 如果指定了父级，验证父级存在并计算层级
            let level = 0;
            if (input.parentId) {
                const parent = await ctx.prisma.contentCategory.findUnique({
                    where: { id: input.parentId },
                });

                if (!parent) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: '父级分类不存在',
                    });
                }

                level = parent.level + 1;

                // 限制层级深度（最多 3 级）
                if (level > 2) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: '分类层级不能超过 3 级',
                    });
                }
            }

            // 获取最大 order
            const maxOrder = await ctx.prisma.contentCategory.aggregate({
                where: { parentId: input.parentId ?? null },
                _max: { order: true },
            });

            const order = input.order ?? (maxOrder._max.order ?? -1) + 1;

            return ctx.prisma.contentCategory.create({
                data: {
                    name: input.name,
                    slug: input.slug,
                    description: input.description,
                    icon: input.icon,
                    parentId: input.parentId,
                    level,
                    contentTypes: input.contentTypes,
                    order,
                },
            });
        }),

    /**
     * 更新分类（需 ADMIN 权限）
     */
    update: adminProcedure
        .input(contentCategoryUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            // 检查分类是否存在
            const existing = await ctx.prisma.contentCategory.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '分类不存在',
                });
            }

            // 如果更改了 slug，检查是否已被使用
            if (data.slug && data.slug !== existing.slug) {
                const existingSlug = await ctx.prisma.contentCategory.findUnique({
                    where: { slug: data.slug },
                });

                if (existingSlug) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'URL 标识已被使用',
                    });
                }
            }

            // 如果更改了父级，重新计算层级
            let level = existing.level;
            if (data.parentId !== undefined) {
                // 不能将自己设为自己的父级
                if (data.parentId === id) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: '不能将分类设为自己的子分类',
                    });
                }

                if (data.parentId) {
                    const parent = await ctx.prisma.contentCategory.findUnique({
                        where: { id: data.parentId },
                    });

                    if (!parent) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: '父级分类不存在',
                        });
                    }

                    // 检查是否形成循环（不能将分类移动到自己的子分类下）
                    const descendants = await getDescendantIds(ctx.prisma, id);
                    if (descendants.includes(data.parentId)) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: '不能将分类移动到自己的子分类下',
                        });
                    }

                    level = parent.level + 1;

                    if (level > 2) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: '分类层级不能超过 3 级',
                        });
                    }
                } else {
                    level = 0;
                }
            }

            return ctx.prisma.contentCategory.update({
                where: { id },
                data: {
                    ...data,
                    level,
                },
            });
        }),

    /**
     * 删除分类（需 ADMIN 权限）
     */
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const category = await ctx.prisma.contentCategory.findUnique({
                where: { id: input.id },
                include: {
                    _count: {
                        select: {
                            contents: true,
                            children: true,
                        },
                    },
                },
            });

            if (!category) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '分类不存在',
                });
            }

            // 检查是否有子分类
            if (category._count.children > 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '该分类下有子分类，无法删除',
                });
            }

            // 检查是否有内容
            if (category._count.contents > 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '该分类下有内容，无法删除',
                });
            }

            await ctx.prisma.contentCategory.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    /**
     * 调整分类顺序（需 ADMIN 权限）
     */
    reorder: adminProcedure
        .input(contentCategoryReorderSchema)
        .mutation(async ({ ctx, input }) => {
            await Promise.all(
                input.items.map((item) =>
                    ctx.prisma.contentCategory.update({
                        where: { id: item.id },
                        data: { order: item.order },
                    })
                )
            );

            return { success: true };
        }),

    /**
     * 切换分类激活状态（需 ADMIN 权限）
     */
    toggleActive: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const category = await ctx.prisma.contentCategory.findUnique({
                where: { id: input.id },
            });

            if (!category) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '分类不存在',
                });
            }

            return ctx.prisma.contentCategory.update({
                where: { id: input.id },
                data: { isActive: !category.isActive },
            });
        }),
});

/**
 * 获取所有后代分类的 ID
 */
async function getDescendantIds(
    prisma: typeof import('@/lib/db').prisma,
    categoryId: string
): Promise<string[]> {
    const children = await prisma.contentCategory.findMany({
        where: { parentId: categoryId },
        select: { id: true },
    });

    const childIds = children.map((c) => c.id);
    const grandchildIds = await Promise.all(
        childIds.map((id) => getDescendantIds(prisma, id))
    );

    return [...childIds, ...grandchildIds.flat()];
}
