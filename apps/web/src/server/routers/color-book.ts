/**
 * 色彩簿 tRPC Router
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { logAdminAction, AUDIT_TARGET_TYPES } from '@/lib/admin-audit';
import { ColorBookStatus, ColorSystem } from '@prisma/client';

// ============================================================================
// Validation Schemas
// ============================================================================

const createColorBookSchema = z.object({
  bookId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDesc: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  publisher: z.string().optional(),
  publishedYear: z.number().int().min(1900).max(2100).optional(),
  edition: z.string().optional(),
  isbn: z.string().optional(),
  colorSystem: z.nativeEnum(ColorSystem).optional(),
  categoryId: z.string().min(1), // 改为 categoryId
  tags: z.array(z.string()).default([]),
  status: z.nativeEnum(ColorBookStatus).default('DRAFT'),
});

const updateColorBookSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  shortDesc: z.string().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  publisher: z.string().optional().nullable(),
  publishedYear: z.number().int().min(1900).max(2100).optional().nullable(),
  edition: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  colorSystem: z.nativeEnum(ColorSystem).optional().nullable(),
  categoryId: z.string().optional(), // 改为 categoryId
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(ColorBookStatus).optional(),
});

const addColorsToBookSchema = z.object({
  colorBookId: z.string(),
  colors: z.array(z.object({
    colorId: z.string(),
    order: z.number().int().default(0),
    pageNumber: z.string().optional(),
    sectionName: z.string().optional(),
    note: z.string().optional(),
  })),
});

// ============================================================================
// Router
// ============================================================================

export const colorBookRouter = createTRPCRouter({
  // 公开：获取色彩簿列表
  list: publicProcedure
    .input(
      z.object({
        status: z.nativeEnum(ColorBookStatus).optional(),
        categoryId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { status, categoryId, limit = 20, cursor } = input || {};

      const where = {
        ...(status && { status }),
        ...(categoryId && { categoryId }),
        // 公开接口只返回已发布的
        ...(!status && { status: 'ACTIVE' as ColorBookStatus }),
      };

      const items = await ctx.prisma.colorBook.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          _count: {
            select: { entries: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
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

  // 公开：获取色彩簿详情
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const colorBook = await ctx.prisma.colorBook.findUnique({
        where: { slug: input.slug },
        include: {
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
          _count: {
            select: { entries: true },
          },
        },
      });

      if (!colorBook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '色彩簿不存在',
        });
      }

      // 非管理员只能看到已发布的
      if (colorBook.status !== 'ACTIVE') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '色彩簿不存在',
        });
      }

      return {
        ...colorBook,
        totalColors: colorBook._count.entries,
      };
    }),

  // 公开：获取色彩所属的色彩簿
  getByColorId: publicProcedure
    .input(z.object({ colorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const entries = await ctx.prisma.colorBookEntry.findMany({
        where: { colorId: input.colorId },
        include: {
          colorBook: {
            select: {
              id: true,
              bookId: true,
              name: true,
              slug: true,
              shortDesc: true,
              coverImageUrl: true,
              category: true,
              status: true,
            },
          },
        },
      });

      // 只返回已发布的色彩簿
      return entries
        .filter((entry) => entry.colorBook.status === 'ACTIVE')
        .map((entry) => ({
          ...entry.colorBook,
          pageNumber: entry.pageNumber,
          sectionName: entry.sectionName,
        }));
    }),

  // ========================================================================
  // 管理员接口
  // ========================================================================

  // 管理员：获取所有色彩簿（包括草稿）
  adminList: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(ColorBookStatus).optional(),
        categoryId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { status, categoryId, search, limit = 20, cursor } = input || {};

      const where = {
        ...(status && { status }),
        ...(categoryId && { categoryId }),
        ...(search && {
          OR: [
            { bookId: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const items = await ctx.prisma.colorBook.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          _count: {
            select: { entries: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
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

  // 管理员：获取色彩簿详情（包括草稿）
  adminGetById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const colorBook = await ctx.prisma.colorBook.findUnique({
        where: { id: input.id },
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
                },
              },
            },
          },
        },
      });

      if (!colorBook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '色彩簿不存在',
        });
      }

      return colorBook;
    }),

  // 管理员：创建色彩簿
  create: adminProcedure
    .input(createColorBookSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查 bookId 和 slug 是否已存在
      const existing = await ctx.prisma.colorBook.findFirst({
        where: {
          OR: [{ bookId: input.bookId }, { slug: input.slug }],
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'bookId 或 slug 已存在',
        });
      }

      const colorBook = await ctx.prisma.colorBook.create({
        data: {
          ...input,
          coverImageUrl: input.coverImageUrl || null,
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'CREATE',
        targetType: 'colorBook',
        targetId: colorBook.id,
        changes: { after: colorBook },
      });

      return colorBook;
    }),

  // 管理员：更新色彩簿
  update: adminProcedure
    .input(updateColorBookSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.colorBook.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '色彩簿不存在',
        });
      }

      // 检查 slug 是否与其他记录冲突
      if (data.slug && data.slug !== existing.slug) {
        const slugExists = await ctx.prisma.colorBook.findFirst({
          where: { slug: data.slug, id: { not: id } },
        });
        if (slugExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'slug 已被使用',
          });
        }
      }

      const colorBook = await ctx.prisma.colorBook.update({
        where: { id },
        data: {
          ...data,
          coverImageUrl: data.coverImageUrl === '' ? null : data.coverImageUrl,
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'UPDATE',
        targetType: 'colorBook',
        targetId: colorBook.id,
        changes: { before: existing, after: colorBook },
      });

      return colorBook;
    }),

  // 管理员：删除色彩簿
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.colorBook.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '色彩簿不存在',
        });
      }

      await ctx.prisma.colorBook.delete({
        where: { id: input.id },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'DELETE',
        targetType: 'colorBook',
        targetId: input.id,
        changes: { before: existing },
      });

      return { success: true };
    }),

  // 管理员：添加色彩到色彩簿
  addColors: adminProcedure
    .input(addColorsToBookSchema)
    .mutation(async ({ ctx, input }) => {
      const colorBook = await ctx.prisma.colorBook.findUnique({
        where: { id: input.colorBookId },
      });

      if (!colorBook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '色彩簿不存在',
        });
      }

      // 批量创建关联
      const entries = await ctx.prisma.colorBookEntry.createMany({
        data: input.colors.map((c) => ({
          colorBookId: input.colorBookId,
          colorId: c.colorId,
          order: c.order,
          pageNumber: c.pageNumber,
          sectionName: c.sectionName,
          note: c.note,
        })),
        skipDuplicates: true,
      });

      // 更新色彩簿的 totalColors
      const count = await ctx.prisma.colorBookEntry.count({
        where: { colorBookId: input.colorBookId },
      });
      await ctx.prisma.colorBook.update({
        where: { id: input.colorBookId },
        data: { totalColors: count },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'UPDATE',
        targetType: 'colorBook',
        targetId: input.colorBookId,
        metadata: {
          action: 'addColors',
          addedCount: entries.count,
        },
      });

      return { added: entries.count };
    }),

  // 管理员：从色彩簿移除色彩
  removeColor: adminProcedure
    .input(z.object({
      colorBookId: z.string(),
      colorId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
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

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'UPDATE',
        targetType: 'colorBook',
        targetId: input.colorBookId,
        metadata: {
          action: 'removeColor',
          removedColorId: input.colorId,
        },
      });

      return { success: true };
    }),

  // 管理员：更新色彩在色彩簿中的顺序
  updateColorOrder: adminProcedure
    .input(z.object({
      colorBookId: z.string(),
      entries: z.array(z.object({
        colorId: z.string(),
        order: z.number().int(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // 批量更新顺序
      await Promise.all(
        input.entries.map((entry) =>
          ctx.prisma.colorBookEntry.updateMany({
            where: {
              colorBookId: input.colorBookId,
              colorId: entry.colorId,
            },
            data: { order: entry.order },
          })
        )
      );

      return { success: true };
    }),
});
