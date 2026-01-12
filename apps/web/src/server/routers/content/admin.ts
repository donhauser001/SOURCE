/**
 * Content Router - 管理员操作
 *
 * pendingList, review, setFeatured, archive, restore, stats, adminList
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
import { createTRPCRouter, operatorProcedure, adminProcedure } from '../../trpc';
import {
  pendingListSchema,
  contentReviewSchema,
  setFeaturedSchema,
  ContentTypeLabels,
  ContentStatusLabels,
  FeaturedLevelLabels,
  ReviewActionLabels,
} from '@/lib/validations/content';
import { getNextStatus } from '../../machines/content-machine';
import { logAdminAction } from '@/lib/admin-audit';

// 添加审计目标类型
const CONTENT_TARGET_TYPE = 'content';

export const contentAdminRouter = createTRPCRouter({
  /**
   * 获取待审核列表（需 OPERATOR/ADMIN 权限）
   */
  pendingList: operatorProcedure
    .input(pendingListSchema)
    .query(async ({ ctx, input }) => {
      const { contentType, limit, cursor } = input;

      const where: Prisma.ContentWhereInput = {
        status: 'PENDING',
      };

      if (contentType) {
        where.contentType = contentType;
      }

      const items = await ctx.prisma.content.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: 'asc' }, // 先提交的先审核
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
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

      // 获取统计数据
      const [total, byWork, byTutorial, byArticle] = await Promise.all([
        ctx.prisma.content.count({ where: { status: 'PENDING' } }),
        ctx.prisma.content.count({ where: { status: 'PENDING', contentType: 'WORK' } }),
        ctx.prisma.content.count({ where: { status: 'PENDING', contentType: 'TUTORIAL' } }),
        ctx.prisma.content.count({ where: { status: 'PENDING', contentType: 'ARTICLE' } }),
      ]);

      return {
        items: items.map(item => ({
          ...item,
          contentTypeLabel: ContentTypeLabels[item.contentType],
        })),
        nextCursor,
        stats: {
          total,
          byType: {
            WORK: byWork,
            TUTORIAL: byTutorial,
            ARTICLE: byArticle,
          },
        },
      };
    }),

  /**
   * 审核操作（需 OPERATOR/ADMIN 权限）
   */
  review: operatorProcedure
    .input(contentReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, action, reason, note } = input;

      // 获取内容
      const content = await ctx.prisma.content.findUnique({
        where: { id },
      });

      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '内容不存在',
        });
      }

      // 映射审核操作到状态机事件
      const eventType = action === 'APPROVE' ? 'APPROVE' : action === 'REJECT' ? 'REJECT' : 'REQUEST_CHANGE';
      
      // 检查状态转换是否有效
      const newStatus = getNextStatus(content.status, eventType);
      if (!newStatus) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `当前状态（${ContentStatusLabels[content.status]}）不允许执行「${ReviewActionLabels[action]}」操作`,
        });
      }

      // 更新内容状态
      const updatedContent = await ctx.prisma.content.update({
        where: { id },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedBy: ctx.session.user.id,
          rejectReason: action === 'REJECT' || action === 'REQUEST_CHANGE' ? reason : null,
          publishedAt: action === 'APPROVE' && !content.publishedAt ? new Date() : content.publishedAt,
        },
      });

      // 创建审核记录
      await ctx.prisma.contentReview.create({
        data: {
          contentId: id,
          reviewerId: ctx.session.user.id,
          action: action,
          reason: reason,
          note: note,
          previousStatus: content.status,
        },
      });

      // 记录审计日志
      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'STATUS_CHANGE',
        targetType: CONTENT_TARGET_TYPE,
        targetId: id,
        changes: {
          before: { status: content.status },
          after: { status: newStatus },
        },
        metadata: { reviewAction: action, reason },
      });

      return updatedContent;
    }),

  /**
   * 设置推荐等级（需 OPERATOR/ADMIN 权限）
   */
  setFeatured: operatorProcedure
    .input(setFeaturedSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, level } = input;

      // 获取内容
      const content = await ctx.prisma.content.findUnique({
        where: { id },
      });

      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '内容不存在',
        });
      }

      // 只有已发布的内容可以设置推荐
      if (content.status !== 'PUBLISHED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '只有已发布的内容可以设置推荐等级',
        });
      }

      const updatedContent = await ctx.prisma.content.update({
        where: { id },
        data: { featuredLevel: level },
      });

      // 创建审核记录
      const action = level === 'NONE' ? 'UNSET_FEATURED' : 'SET_FEATURED';
      await ctx.prisma.contentReview.create({
        data: {
          contentId: id,
          reviewerId: ctx.session.user.id,
          action: action,
          note: `设置推荐等级为：${FeaturedLevelLabels[level]}`,
          previousStatus: content.status,
        },
      });

      // 记录审计日志
      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'UPDATE',
        targetType: CONTENT_TARGET_TYPE,
        targetId: id,
        changes: {
          before: { featuredLevel: content.featuredLevel },
          after: { featuredLevel: level },
        },
      });

      return updatedContent;
    }),

  /**
   * 归档内容（需 OPERATOR/ADMIN 权限）
   */
  archive: operatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const content = await ctx.prisma.content.findUnique({
        where: { id: input.id },
      });

      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '内容不存在',
        });
      }

      // 检查状态转换
      const newStatus = getNextStatus(content.status, 'ARCHIVE');
      if (!newStatus) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `当前状态（${ContentStatusLabels[content.status]}）不允许归档`,
        });
      }

      const updatedContent = await ctx.prisma.content.update({
        where: { id: input.id },
        data: {
          status: 'ARCHIVED',
          featuredLevel: 'NONE', // 归档时取消推荐
        },
      });

      // 创建审核记录
      await ctx.prisma.contentReview.create({
        data: {
          contentId: input.id,
          reviewerId: ctx.session.user.id,
          action: 'ARCHIVE',
          previousStatus: content.status,
        },
      });

      // 记录审计日志
      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'STATUS_CHANGE',
        targetType: CONTENT_TARGET_TYPE,
        targetId: input.id,
        changes: {
          before: { status: content.status },
          after: { status: 'ARCHIVED' },
        },
      });

      return updatedContent;
    }),

  /**
   * 恢复归档内容（需 ADMIN 权限）
   */
  restore: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const content = await ctx.prisma.content.findUnique({
        where: { id: input.id },
      });

      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '内容不存在',
        });
      }

      // 检查状态转换
      const newStatus = getNextStatus(content.status, 'RESTORE');
      if (!newStatus) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `当前状态（${ContentStatusLabels[content.status]}）不允许恢复`,
        });
      }

      const updatedContent = await ctx.prisma.content.update({
        where: { id: input.id },
        data: { status: 'PUBLISHED' },
      });

      // 创建审核记录
      await ctx.prisma.contentReview.create({
        data: {
          contentId: input.id,
          reviewerId: ctx.session.user.id,
          action: 'RESTORE',
          previousStatus: content.status,
        },
      });

      // 记录审计日志
      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email!,
        action: 'STATUS_CHANGE',
        targetType: CONTENT_TARGET_TYPE,
        targetId: input.id,
        changes: {
          before: { status: content.status },
          after: { status: 'PUBLISHED' },
        },
      });

      return updatedContent;
    }),

  /**
   * 统计面板（需 OPERATOR/ADMIN 权限）
   */
  stats: operatorProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [
      total,
      byDraft,
      byPending,
      byPublished,
      byRejected,
      byArchived,
      byWork,
      byTutorial,
      byArticle,
      byNone,
      byEditorPick,
      byHomepage,
      todayPublished,
      weeklyPublished,
    ] = await Promise.all([
      ctx.prisma.content.count(),
      ctx.prisma.content.count({ where: { status: 'DRAFT' } }),
      ctx.prisma.content.count({ where: { status: 'PENDING' } }),
      ctx.prisma.content.count({ where: { status: 'PUBLISHED' } }),
      ctx.prisma.content.count({ where: { status: 'REJECTED' } }),
      ctx.prisma.content.count({ where: { status: 'ARCHIVED' } }),
      ctx.prisma.content.count({ where: { contentType: 'WORK' } }),
      ctx.prisma.content.count({ where: { contentType: 'TUTORIAL' } }),
      ctx.prisma.content.count({ where: { contentType: 'ARTICLE' } }),
      ctx.prisma.content.count({ where: { featuredLevel: 'NONE' } }),
      ctx.prisma.content.count({ where: { featuredLevel: 'EDITOR_PICK' } }),
      ctx.prisma.content.count({ where: { featuredLevel: 'HOMEPAGE' } }),
      ctx.prisma.content.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: todayStart },
        },
      }),
      ctx.prisma.content.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: weekStart },
        },
      }),
    ]);

    return {
      total,
      byStatus: {
        DRAFT: byDraft,
        PENDING: byPending,
        PUBLISHED: byPublished,
        REJECTED: byRejected,
        ARCHIVED: byArchived,
      },
      byType: {
        WORK: byWork,
        TUTORIAL: byTutorial,
        ARTICLE: byArticle,
      },
      byFeaturedLevel: {
        NONE: byNone,
        EDITOR_PICK: byEditorPick,
        HOMEPAGE: byHomepage,
      },
      pending: byPending,
      todayPublished,
      weeklyPublished,
    };
  }),

  /**
   * 管理员内容列表（需 OPERATOR/ADMIN 权限）
   */
  adminList: operatorProcedure
    .input(
      z.object({
        status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED']).optional(),
        contentType: z.enum(['WORK', 'TUTORIAL', 'ARTICLE']).optional(),
        featuredLevel: z.enum(['NONE', 'EDITOR_PICK', 'HOMEPAGE', 'HERO']).optional(),
        categoryId: z.string().optional(),
        authorId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, contentType, featuredLevel, categoryId, authorId, search, limit, cursor } = input;

      const where: Prisma.ContentWhereInput = {};

      if (status) where.status = status;
      if (contentType) where.contentType = contentType;
      if (featuredLevel) where.featuredLevel = featuredLevel;
      if (categoryId) where.categoryId = categoryId;
      if (authorId) where.authorId = authorId;

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { contentId: { contains: search, mode: 'insensitive' } },
          { author: { name: { contains: search, mode: 'insensitive' } } },
          { author: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const items = await ctx.prisma.content.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
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
          statusLabel: ContentStatusLabels[item.status],
          featuredLevelLabel: FeaturedLevelLabels[item.featuredLevel],
        })),
        nextCursor,
      };
    }),

  /**
   * 获取单个内容详情（管理员视角）
   */
  getContent: operatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const content = await ctx.prisma.content.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
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
          reviews: {
            orderBy: { createdAt: 'desc' },
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '内容不存在',
        });
      }

      return {
        ...content,
        contentTypeLabel: ContentTypeLabels[content.contentType],
        statusLabel: ContentStatusLabels[content.status],
        featuredLevelLabel: FeaturedLevelLabels[content.featuredLevel],
        reviews: content.reviews.map(r => ({
          ...r,
          actionLabel: ReviewActionLabels[r.action],
          previousStatusLabel: ContentStatusLabels[r.previousStatus],
        })),
      };
    }),
});
