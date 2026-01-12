/**
 * 纸型管理 tRPC Router
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { logAdminAction } from '@/lib/admin-audit';
import { PaperCategory, Prisma } from '@prisma/client';

// ============================================================================
// Validation Schemas
// ============================================================================

const createPaperTypeSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.nativeEnum(PaperCategory),
  gramWeightMin: z.number().int().min(1).max(1000).optional(),
  gramWeightMax: z.number().int().min(1).max(1000).optional(),
  surfaceFinish: z.string().optional(),
  suitableFor: z.array(z.string()).optional(),
  order: z.number().int().default(0),
  supplierIds: z.array(z.string()).optional(), // 纸商 Partner ID 列表
});

const updatePaperTypeSchema = z.object({
  id: z.string(),
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  category: z.nativeEnum(PaperCategory).optional(),
  gramWeightMin: z.number().int().min(1).max(1000).optional().nullable(),
  gramWeightMax: z.number().int().min(1).max(1000).optional().nullable(),
  surfaceFinish: z.string().optional().nullable(),
  suitableFor: z.array(z.string()).optional().nullable(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  supplierIds: z.array(z.string()).optional(), // 纸商 Partner ID 列表
});

// ============================================================================
// Router
// ============================================================================

export const paperTypeRouter = createTRPCRouter({
  // 公开：获取所有激活的纸型（供前台下拉选择使用）
  list: publicProcedure
    .input(
      z.object({
        includeInactive: z.boolean().default(false),
        category: z.nativeEnum(PaperCategory).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { includeInactive = false, category } = input || {};

      const where = {
        ...(!includeInactive && { isActive: true }),
        ...(category && { category }),
      };

      return ctx.prisma.paperTypeOption.findMany({
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
              paperProfiles: true,
              proofingPacks: true,
            },
          },
        },
      });
    }),

  // 公开：根据 ID 获取纸型详情
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const paperType = await ctx.prisma.paperTypeOption.findUnique({
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

      if (!paperType) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '纸型不存在',
        });
      }

      return paperType;
    }),

  // 公开：根据 code 获取纸型
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const paperType = await ctx.prisma.paperTypeOption.findUnique({
        where: { code: input.code },
      });

      if (!paperType) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '纸型不存在',
        });
      }

      return paperType;
    }),

  // ========================================================================
  // 管理员接口
  // ========================================================================

  // 管理员：获取所有纸型（包括已停用）
  adminList: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.nativeEnum(PaperCategory).optional(),
        isActive: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, category, isActive, limit = 50, cursor } = input || {};

      const where = {
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const items = await ctx.prisma.paperTypeOption.findMany({
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
              paperProfiles: true,
              proofingPacks: true,
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

  // 管理员：创建纸型
  create: adminProcedure
    .input(createPaperTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const { supplierIds, ...data } = input;

      // 检查 code 是否已存在
      const existing = await ctx.prisma.paperTypeOption.findUnique({
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
        const maxOrder = await ctx.prisma.paperTypeOption.aggregate({
          _max: { order: true },
        });
        data.order = (maxOrder._max.order || 0) + 1;
      }

      const paperType = await ctx.prisma.paperTypeOption.create({
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
        targetType: 'paperType',
        targetId: paperType.id,
        changes: { after: paperType },
      });

      return paperType;
    }),

  // 管理员：更新纸型
  update: adminProcedure
    .input(updatePaperTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, supplierIds, ...data } = input;

      const existing = await ctx.prisma.paperTypeOption.findUnique({
        where: { id },
        include: { suppliers: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '纸型不存在',
        });
      }

      // 检查 code 是否与其他记录冲突
      if (data.code && data.code !== existing.code) {
        const codeExists = await ctx.prisma.paperTypeOption.findFirst({
          where: { code: data.code, id: { not: id } },
        });
        if (codeExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'code 已被使用',
          });
        }
      }

      // 处理 suitableFor 的 null 值，Prisma Json 类型需要使用 Prisma.DbNull
      const { suitableFor, ...restData } = data;

      const paperType = await ctx.prisma.paperTypeOption.update({
        where: { id },
        data: {
          ...restData,
          suitableFor: suitableFor === null ? Prisma.DbNull : suitableFor,
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
        targetType: 'paperType',
        targetId: paperType.id,
        changes: { before: existing, after: paperType },
      });

      return paperType;
    }),

  // 管理员：软删除纸型（设为不激活）
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.paperTypeOption.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              paperProfiles: true,
              proofingPacks: true,
            },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '纸型不存在',
        });
      }

      // 如果有关联数据，只做软删除
      if (existing._count.paperProfiles > 0 || existing._count.proofingPacks > 0) {
        await ctx.prisma.paperTypeOption.update({
          where: { id: input.id },
          data: { isActive: false },
        });

        await logAdminAction({
          userId: ctx.session.user.id,
          userEmail: ctx.session.user.email!,
          action: 'STATUS_CHANGE',
          targetType: 'paperType',
          targetId: input.id,
          changes: { before: { isActive: true }, after: { isActive: false } },
          metadata: {
            reason: '存在关联数据，执行软删除',
            paperProfilesCount: existing._count.paperProfiles,
            proofingPacksCount: existing._count.proofingPacks,
          },
        });

        return { success: true, softDeleted: true };
      }

      // 没有关联数据，可以硬删除
      await ctx.prisma.paperTypeOption.delete({
        where: { id: input.id },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'DELETE',
        targetType: 'paperType',
        targetId: input.id,
        changes: { before: existing },
      });

      return { success: true, softDeleted: false };
    }),

  // 管理员：恢复已停用的纸型
  restore: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.paperTypeOption.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '纸型不存在',
        });
      }

      if (existing.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '纸型已是激活状态',
        });
      }

      await ctx.prisma.paperTypeOption.update({
        where: { id: input.id },
        data: { isActive: true },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'STATUS_CHANGE',
        targetType: 'paperType',
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
          ctx.prisma.paperTypeOption.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );

      return { success: true };
    }),
});
