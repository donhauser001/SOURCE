/**
 * 配方管理 tRPC Router
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { logAdminAction } from '@/lib/admin-audit';
import { RecipeStatus, CostLevel } from '@prisma/client';

// ============================================================================
// Validation Schemas
// ============================================================================

const recipeIngredientSchema = z.object({
  inkId: z.string(),
  percentage: z.number().min(0).max(100),
  order: z.number().int().default(0),
});

const createRecipeSchema = z.object({
  recipeId: z.string().min(1).max(50),
  name: z.string().max(100).optional(),
  colorId: z.string(), // Color 的 id (cuid)
  status: z.nativeEnum(RecipeStatus).default('EXPERIMENTAL'),
  costLevel: z.nativeEnum(CostLevel),
  applicablePapers: z.array(z.string()).default([]),
  notes: z.string().optional(),
  ingredients: z.array(recipeIngredientSchema).default([]),
});

const updateRecipeSchema = z.object({
  id: z.string(),
  recipeId: z.string().min(1).max(50).optional(),
  name: z.string().max(100).optional().nullable(),
  colorId: z.string().optional(),
  status: z.nativeEnum(RecipeStatus).optional(),
  costLevel: z.nativeEnum(CostLevel).optional(),
  applicablePapers: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  ingredients: z.array(recipeIngredientSchema).optional(),
});

// ============================================================================
// Router
// ============================================================================

export const recipeRouter = createTRPCRouter({
  // 公开：获取所有配方
  list: publicProcedure
    .input(
      z.object({
        colorId: z.string().optional(), // 按颜色筛选
        status: z.nativeEnum(RecipeStatus).optional(),
        costLevel: z.nativeEnum(CostLevel).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { colorId, status, costLevel, search, limit = 50 } = input || {};

      const where = {
        ...(colorId && { colorId }),
        ...(status && { status }),
        ...(costLevel && { costLevel }),
        ...(search && {
          OR: [
            { recipeId: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      return ctx.prisma.recipe.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          color: {
            select: {
              id: true,
              colorId: true,
              name: true,
            },
          },
          ingredients: {
            orderBy: { order: 'asc' },
            include: {
              ink: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  inkType: true,
                },
              },
            },
          },
          _count: {
            select: {
              fitMatrixEntries: true,
              testReports: true,
            },
          },
        },
      });
    }),

  // 公开：根据 ID 获取配方详情
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipe = await ctx.prisma.recipe.findUnique({
        where: { id: input.id },
        include: {
          color: {
            select: {
              id: true,
              colorId: true,
              name: true,
            },
          },
          ingredients: {
            orderBy: { order: 'asc' },
            include: {
              ink: true,
            },
          },
          fitMatrixEntries: {
            include: {
              paper: true,
            },
          },
          testReports: {
            include: {
              partner: {
                select: {
                  id: true,
                  partnerId: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!recipe) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '配方不存在',
        });
      }

      return recipe;
    }),

  // 公开：根据 recipeId 获取配方
  getByRecipeId: publicProcedure
    .input(z.object({ recipeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipe = await ctx.prisma.recipe.findUnique({
        where: { recipeId: input.recipeId },
        include: {
          color: {
            select: {
              id: true,
              colorId: true,
              name: true,
            },
          },
          ingredients: {
            orderBy: { order: 'asc' },
            include: {
              ink: true,
            },
          },
        },
      });

      if (!recipe) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '配方不存在',
        });
      }

      return recipe;
    }),

  // 公开：获取某颜色的所有配方
  getByColorId: publicProcedure
    .input(z.object({ colorId: z.string() }))
    .query(async ({ ctx, input }) => {
      // 先通过 colorId 找到颜色
      const color = await ctx.prisma.color.findUnique({
        where: { colorId: input.colorId },
        select: { id: true },
      });

      if (!color) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '颜色不存在',
        });
      }

      return ctx.prisma.recipe.findMany({
        where: { colorId: color.id },
        orderBy: { createdAt: 'desc' },
        include: {
          ingredients: {
            orderBy: { order: 'asc' },
            include: {
              ink: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  inkType: true,
                },
              },
            },
          },
          _count: {
            select: {
              fitMatrixEntries: true,
              testReports: true,
            },
          },
        },
      });
    }),

  // ========================================================================
  // 管理员接口
  // ========================================================================

  // 管理员：获取所有配方（支持分页）
  adminList: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        colorId: z.string().optional(),
        status: z.nativeEnum(RecipeStatus).optional(),
        costLevel: z.nativeEnum(CostLevel).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, colorId, status, costLevel, limit = 50, cursor } = input || {};

      const where = {
        ...(colorId && { colorId }),
        ...(status && { status }),
        ...(costLevel && { costLevel }),
        ...(search && {
          OR: [
            { recipeId: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { color: { colorId: { contains: search, mode: 'insensitive' as const } } },
            { color: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }),
      };

      const items = await ctx.prisma.recipe.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          color: {
            select: {
              id: true,
              colorId: true,
              name: true,
            },
          },
          ingredients: {
            orderBy: { order: 'asc' },
            include: {
              ink: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  inkType: true,
                },
              },
            },
          },
          _count: {
            select: {
              fitMatrixEntries: true,
              testReports: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  // 管理员：创建配方
  create: adminProcedure
    .input(createRecipeSchema)
    .mutation(async ({ ctx, input }) => {
      const { ingredients, ...data } = input;

      // 检查 recipeId 是否已存在
      const existing = await ctx.prisma.recipe.findUnique({
        where: { recipeId: data.recipeId },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'recipeId 已存在',
        });
      }

      // 检查颜色是否存在
      const color = await ctx.prisma.color.findUnique({
        where: { id: data.colorId },
      });

      if (!color) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '颜色不存在',
        });
      }

      // 验证所有油墨是否存在
      if (ingredients.length > 0) {
        const inkIds = ingredients.map((i) => i.inkId);
        const inks = await ctx.prisma.inkOption.findMany({
          where: { id: { in: inkIds } },
          select: { id: true },
        });

        if (inks.length !== inkIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '部分油墨不存在',
          });
        }
      }

      const recipe = await ctx.prisma.recipe.create({
        data: {
          ...data,
          ingredients: {
            create: ingredients.map((ing, index) => ({
              inkId: ing.inkId,
              percentage: ing.percentage,
              order: ing.order || index,
            })),
          },
        },
        include: {
          color: {
            select: { colorId: true, name: true },
          },
          ingredients: {
            include: { ink: true },
          },
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'CREATE',
        targetType: 'recipe',
        targetId: recipe.id,
        changes: { after: recipe },
      });

      return recipe;
    }),

  // 管理员：更新配方
  update: adminProcedure
    .input(updateRecipeSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ingredients, ...data } = input;

      const existing = await ctx.prisma.recipe.findUnique({
        where: { id },
        include: {
          ingredients: true,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '配方不存在',
        });
      }

      // 检查 recipeId 是否与其他记录冲突
      if (data.recipeId && data.recipeId !== existing.recipeId) {
        const recipeIdExists = await ctx.prisma.recipe.findFirst({
          where: { recipeId: data.recipeId, id: { not: id } },
        });
        if (recipeIdExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'recipeId 已被使用',
          });
        }
      }

      // 如果更新颜色，检查颜色是否存在
      if (data.colorId && data.colorId !== existing.colorId) {
        const color = await ctx.prisma.color.findUnique({
          where: { id: data.colorId },
        });
        if (!color) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '颜色不存在',
          });
        }
      }

      // 如果更新成分，先验证油墨是否存在
      if (ingredients !== undefined && ingredients.length > 0) {
        const inkIds = ingredients.map((i) => i.inkId);
        const inks = await ctx.prisma.inkOption.findMany({
          where: { id: { in: inkIds } },
          select: { id: true },
        });

        if (inks.length !== inkIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '部分油墨不存在',
          });
        }
      }

      // 更新配方
      const recipe = await ctx.prisma.recipe.update({
        where: { id },
        data: {
          ...data,
          // 如果提供了 ingredients，先删除旧的再创建新的
          ...(ingredients !== undefined && {
            ingredients: {
              deleteMany: {},
              create: ingredients.map((ing, index) => ({
                inkId: ing.inkId,
                percentage: ing.percentage,
                order: ing.order || index,
              })),
            },
          }),
        },
        include: {
          color: {
            select: { colorId: true, name: true },
          },
          ingredients: {
            include: { ink: true },
          },
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'UPDATE',
        targetType: 'recipe',
        targetId: recipe.id,
        changes: { before: existing, after: recipe },
      });

      return recipe;
    }),

  // 管理员：删除配方
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.recipe.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              fitMatrixEntries: true,
              testReports: true,
            },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '配方不存在',
        });
      }

      // 如果有关联数据，改为废弃状态
      if (existing._count.fitMatrixEntries > 0 || existing._count.testReports > 0) {
        await ctx.prisma.recipe.update({
          where: { id: input.id },
          data: { status: 'DEPRECATED' },
        });

        await logAdminAction({
          userId: ctx.session.user.id,
          userEmail: ctx.session.user.email!,
          action: 'STATUS_CHANGE',
          targetType: 'recipe',
          targetId: input.id,
          changes: { before: { status: existing.status }, after: { status: 'DEPRECATED' } },
          metadata: {
            reason: '存在关联数据，执行软删除（标记为废弃）',
            fitMatrixCount: existing._count.fitMatrixEntries,
            testReportsCount: existing._count.testReports,
          },
        });

        return { success: true, softDeleted: true };
      }

      // 没有关联数据，可以硬删除
      await ctx.prisma.recipe.delete({
        where: { id: input.id },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'DELETE',
        targetType: 'recipe',
        targetId: input.id,
        changes: { before: existing },
      });

      return { success: true, softDeleted: false };
    }),

  // 管理员：更新配方状态
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(RecipeStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.recipe.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '配方不存在',
        });
      }

      const recipe = await ctx.prisma.recipe.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'STATUS_CHANGE',
        targetType: 'recipe',
        targetId: input.id,
        changes: { before: { status: existing.status }, after: { status: input.status } },
      });

      return recipe;
    }),

  // 管理员：获取统计信息
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [total, experimental, verified, deprecated] = await Promise.all([
      ctx.prisma.recipe.count(),
      ctx.prisma.recipe.count({ where: { status: 'EXPERIMENTAL' } }),
      ctx.prisma.recipe.count({ where: { status: 'VERIFIED' } }),
      ctx.prisma.recipe.count({ where: { status: 'DEPRECATED' } }),
    ]);

    const costLevelStats = await ctx.prisma.recipe.groupBy({
      by: ['costLevel'],
      _count: { id: true },
    });

    return {
      total,
      byStatus: {
        experimental,
        verified,
        deprecated,
      },
      byCostLevel: costLevelStats.reduce(
        (acc, item) => {
          acc[item.costLevel] = item._count.id;
          return acc;
        },
        {} as Record<CostLevel, number>
      ),
    };
  }),
});
