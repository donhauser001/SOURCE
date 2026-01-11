/**
 * 油墨管理 tRPC Router
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { logAdminAction } from '@/lib/admin-audit';
import { InkType } from '@prisma/client';

// ============================================================================
// Validation Schemas
// ============================================================================

const createInkSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  brand: z.string().optional(),
  colorSeries: z.string().optional(),
  colorCode: z.string().optional(),
  inkType: z.nativeEnum(InkType),
  viscosity: z.number().min(0).optional(),
  dryingTime: z.number().int().min(0).optional(),
  colorStrength: z.number().min(0).max(200).optional(),
  lightfastness: z.number().int().min(1).max(8).optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  order: z.number().int().default(0),
  supplierIds: z.array(z.string()).optional(), // 油墨商 Partner ID 列表
});

const updateInkSchema = z.object({
  id: z.string(),
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  brand: z.string().optional().nullable(),
  colorSeries: z.string().optional().nullable(),
  colorCode: z.string().optional().nullable(),
  inkType: z.nativeEnum(InkType).optional(),
  viscosity: z.number().min(0).optional().nullable(),
  dryingTime: z.number().int().min(0).optional().nullable(),
  colorStrength: z.number().min(0).max(200).optional().nullable(),
  lightfastness: z.number().int().min(1).max(8).optional().nullable(),
  priceMin: z.number().int().min(0).optional().nullable(),
  priceMax: z.number().int().min(0).optional().nullable(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  supplierIds: z.array(z.string()).optional(), // 油墨商 Partner ID 列表
});

// ============================================================================
// Router
// ============================================================================

export const inkRouter = createTRPCRouter({
  // 公开：获取所有激活的油墨（供配方编辑器使用）
  list: publicProcedure
    .input(
      z.object({
        includeInactive: z.boolean().default(false),
        inkType: z.nativeEnum(InkType).optional(),
        colorSeries: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { includeInactive = false, inkType, colorSeries, search } = input || {};

      const where = {
        ...(!includeInactive && { isActive: true }),
        ...(inkType && { inkType }),
        ...(colorSeries && { colorSeries }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { brand: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      return ctx.prisma.inkOption.findMany({
        where,
        orderBy: { order: 'asc' },
        include: {
          suppliers: {
            select: {
              id: true,
              partnerId: true,
              name: true,
              shortName: true,
            },
          },
          _count: {
            select: {
              recipeIngredients: true,
            },
          },
        },
      });
    }),

  // 公开：根据 ID 获取油墨详情
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ink = await ctx.prisma.inkOption.findUnique({
        where: { id: input.id },
        include: {
          suppliers: {
            select: {
              id: true,
              partnerId: true,
              name: true,
              shortName: true,
              types: true,
            },
          },
        },
      });

      if (!ink) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '油墨不存在',
        });
      }

      return ink;
    }),

  // 公开：根据 code 获取油墨
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const ink = await ctx.prisma.inkOption.findUnique({
        where: { code: input.code },
      });

      if (!ink) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '油墨不存在',
        });
      }

      return ink;
    }),

  // 公开：获取所有颜色系列（用于筛选）
  getColorSeries: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.inkOption.findMany({
      where: { isActive: true, colorSeries: { not: null } },
      select: { colorSeries: true },
      distinct: ['colorSeries'],
      orderBy: { colorSeries: 'asc' },
    });

    return result
      .map((r) => r.colorSeries)
      .filter((s): s is string => s !== null);
  }),

  // 公开：获取所有品牌（用于筛选）
  getBrands: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.inkOption.findMany({
      where: { isActive: true, brand: { not: null } },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    });

    return result
      .map((r) => r.brand)
      .filter((b): b is string => b !== null);
  }),

  // ========================================================================
  // 管理员接口
  // ========================================================================

  // 管理员：获取所有油墨（包括已停用）
  adminList: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        inkType: z.nativeEnum(InkType).optional(),
        colorSeries: z.string().optional(),
        brand: z.string().optional(),
        isActive: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, inkType, colorSeries, brand, isActive, limit = 50, cursor } = input || {};

      const where = {
        ...(inkType && { inkType }),
        ...(colorSeries && { colorSeries }),
        ...(brand && { brand }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { brand: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const items = await ctx.prisma.inkOption.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { order: 'asc' },
        include: {
          suppliers: {
            select: {
              id: true,
              partnerId: true,
              name: true,
              shortName: true,
            },
          },
          _count: {
            select: {
              recipeIngredients: true,
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

  // 管理员：创建油墨
  create: adminProcedure
    .input(createInkSchema)
    .mutation(async ({ ctx, input }) => {
      const { supplierIds, ...data } = input;

      // 检查 code 是否已存在
      const existing = await ctx.prisma.inkOption.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'code 已存在',
        });
      }

      // 获取最大 order 值
      if (data.order === 0) {
        const maxOrder = await ctx.prisma.inkOption.aggregate({
          _max: { order: true },
        });
        data.order = (maxOrder._max.order || 0) + 1;
      }

      const ink = await ctx.prisma.inkOption.create({
        data: {
          ...data,
          suppliers: supplierIds?.length
            ? { connect: supplierIds.map((id) => ({ id })) }
            : undefined,
        },
        include: {
          suppliers: true,
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'CREATE',
        targetType: 'ink',
        targetId: ink.id,
        changes: { after: ink },
      });

      return ink;
    }),

  // 管理员：更新油墨
  update: adminProcedure
    .input(updateInkSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, supplierIds, ...data } = input;

      const existing = await ctx.prisma.inkOption.findUnique({
        where: { id },
        include: { suppliers: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '油墨不存在',
        });
      }

      // 检查 code 是否与其他记录冲突
      if (data.code && data.code !== existing.code) {
        const codeExists = await ctx.prisma.inkOption.findFirst({
          where: { code: data.code, id: { not: id } },
        });
        if (codeExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'code 已被使用',
          });
        }
      }

      const ink = await ctx.prisma.inkOption.update({
        where: { id },
        data: {
          ...data,
          suppliers: supplierIds !== undefined
            ? {
              set: [], // 先清空
              connect: supplierIds.map((pid) => ({ id: pid })),
            }
            : undefined,
        },
        include: {
          suppliers: true,
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'UPDATE',
        targetType: 'ink',
        targetId: ink.id,
        changes: { before: existing, after: ink },
      });

      return ink;
    }),

  // 管理员：软删除油墨（设为不激活）
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.inkOption.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              recipeIngredients: true,
            },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '油墨不存在',
        });
      }

      // 如果有关联数据，只做软删除
      if (existing._count.recipeIngredients > 0) {
        await ctx.prisma.inkOption.update({
          where: { id: input.id },
          data: { isActive: false },
        });

        await logAdminAction({
          userId: ctx.session.user.id,
          userEmail: ctx.session.user.email!,
          action: 'STATUS_CHANGE',
          targetType: 'ink',
          targetId: input.id,
          changes: { before: { isActive: true }, after: { isActive: false } },
          metadata: {
            reason: '存在关联配方，执行软删除',
            recipeIngredientsCount: existing._count.recipeIngredients,
          },
        });

        return { success: true, softDeleted: true };
      }

      // 没有关联数据，可以硬删除
      await ctx.prisma.inkOption.delete({
        where: { id: input.id },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'DELETE',
        targetType: 'ink',
        targetId: input.id,
        changes: { before: existing },
      });

      return { success: true, softDeleted: false };
    }),

  // 管理员：恢复已停用的油墨
  restore: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.inkOption.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '油墨不存在',
        });
      }

      if (existing.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '油墨已是激活状态',
        });
      }

      await ctx.prisma.inkOption.update({
        where: { id: input.id },
        data: { isActive: true },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'STATUS_CHANGE',
        targetType: 'ink',
        targetId: input.id,
        changes: { before: { isActive: false }, after: { isActive: true } },
      });

      return { success: true };
    }),

  // 管理员：批量更新排序
  reorder: adminProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            order: z.number().int(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.items.map((item) =>
          ctx.prisma.inkOption.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );

      return { success: true };
    }),
});
