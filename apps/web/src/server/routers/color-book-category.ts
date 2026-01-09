/**
 * 色彩簿分类管理 Router
 */

import { z } from 'zod';
import { createTRPCRouter, adminProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const colorBookCategoryRouter = createTRPCRouter({
  // 获取所有分类（公开）
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.colorBookCategoryOption.findMany({
      orderBy: { order: 'asc' },
    });
  }),

  // 管理员：创建分类
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1, '分类名称不能为空'),
    }))
    .mutation(async ({ ctx, input }) => {
      // 检查是否已存在
      const existing = await ctx.prisma.colorBookCategoryOption.findUnique({
        where: { name: input.name },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '该分类已存在',
        });
      }

      // 获取最大 order
      const maxOrder = await ctx.prisma.colorBookCategoryOption.aggregate({
        _max: { order: true },
      });

      return ctx.prisma.colorBookCategoryOption.create({
        data: {
          name: input.name,
          order: (maxOrder._max.order ?? -1) + 1,
        },
      });
    }),

  // 管理员：删除分类
  delete: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.colorBookCategoryOption.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '分类不存在',
        });
      }

      // 不允许删除默认分类
      if (category.isDefault) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '不能删除默认分类',
        });
      }

      // 获取默认分类
      const defaultCategory = await ctx.prisma.colorBookCategoryOption.findFirst({
        where: { isDefault: true },
      });

      if (!defaultCategory) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '系统错误：未找到默认分类',
        });
      }

      // 将使用该分类的色彩簿切换到默认分类
      await ctx.prisma.colorBook.updateMany({
        where: { categoryId: input.id },
        data: { categoryId: defaultCategory.id },
      });

      // 删除分类
      await ctx.prisma.colorBookCategoryOption.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // 管理员：设置默认分类
  setDefault: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 先取消所有默认
      await ctx.prisma.colorBookCategoryOption.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      // 设置新默认
      return ctx.prisma.colorBookCategoryOption.update({
        where: { id: input.id },
        data: { isDefault: true },
      });
    }),

  // 管理员：更新分类顺序
  updateOrder: adminProcedure
    .input(z.object({
      updates: z.array(z.object({
        id: z.string(),
        order: z.number().int(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.updates.map((update) =>
          ctx.prisma.colorBookCategoryOption.update({
            where: { id: update.id },
            data: { order: update.order },
          })
        )
      );
      return { success: true };
    }),

  // 管理员：重命名分类
  rename: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, '分类名称不能为空'),
    }))
    .mutation(async ({ ctx, input }) => {
      // 检查新名称是否已存在
      const existing = await ctx.prisma.colorBookCategoryOption.findFirst({
        where: {
          name: input.name,
          id: { not: input.id },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '该分类名称已存在',
        });
      }

      return ctx.prisma.colorBookCategoryOption.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),
});
