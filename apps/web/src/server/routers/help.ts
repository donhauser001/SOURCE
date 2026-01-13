/**
 * 帮助文档 tRPC Router
 * 
 * 包含帮助分类、帮助文章、法律文档的 CRUD
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import { prisma as db } from '@/lib/db';
import {
  helpCategoryCreateSchema,
  helpCategoryUpdateSchema,
  helpArticleCreateSchema,
  helpArticleUpdateSchema,
  helpArticleListSchema,
  legalDocumentCreateSchema,
  legalDocumentUpdateSchema,
  legalDocumentTypeEnum,
} from '@/lib/validations/support';
import { logAdminAction } from '@/lib/admin-audit';

// 生成文章编号
async function generateArticleId(): Promise<string> {
  const count = await db.helpArticle.count();
  const num = (count + 1).toString().padStart(3, '0');
  return `HELP-${num}`;
}

export const helpRouter = createTRPCRouter({
  // ==========================================================================
  // 帮助分类
  // ==========================================================================

  // 获取分类树（公开）
  categoryTree: publicProcedure.query(async () => {
    const categories = await db.helpCategory.findMany({
      where: { isActive: true },
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
      include: {
        _count: {
          select: {
            articles: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
    });

    // 构建树形结构
    const buildTree = (parentId: string | null): typeof categories => {
      return categories
        .filter((c) => c.parentId === parentId)
        .map((c) => ({
          ...c,
          children: buildTree(c.id),
        }));
    };

    return buildTree(null);
  }),

  // 获取所有分类（管理员）
  categoryList: adminProcedure.query(async () => {
    return db.helpCategory.findMany({
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: { articles: true },
        },
      },
    });
  }),

  // 获取单个分类
  categoryGet: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const category = await db.helpCategory.findUnique({
        where: { id: input.id },
        include: {
          parent: { select: { id: true, name: true } },
          children: { select: { id: true, name: true } },
        },
      });

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '分类不存在' });
      }

      return category;
    }),

  // 创建分类（管理员）
  categoryCreate: adminProcedure
    .input(helpCategoryCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // 检查 slug 是否重复
      const existing = await db.helpCategory.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'URL 标识已存在' });
      }

      // 计算层级
      let level = 0;
      if (input.parentId) {
        const parent = await db.helpCategory.findUnique({
          where: { id: input.parentId },
        });
        if (!parent) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '父分类不存在' });
        }
        level = parent.level + 1;
      }

      const category = await db.helpCategory.create({
        data: {
          ...input,
          level,
        },
      });

      // 记录审计日志
      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'CREATE',
        targetType: 'helpCategory',
        targetId: category.id,
        changes: { after: category },
      });

      return category;
    }),

  // 更新分类（管理员）
  categoryUpdate: adminProcedure
    .input(z.object({
      id: z.string(),
      data: helpCategoryUpdateSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.helpCategory.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '分类不存在' });
      }

      // 检查 slug 是否重复
      if (input.data.slug && input.data.slug !== existing.slug) {
        const duplicate = await db.helpCategory.findUnique({
          where: { slug: input.data.slug },
        });
        if (duplicate) {
          throw new TRPCError({ code: 'CONFLICT', message: 'URL 标识已存在' });
        }
      }

      const category = await db.helpCategory.update({
        where: { id: input.id },
        data: input.data,
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'UPDATE',
        targetType: 'helpCategory',
        targetId: category.id,
        changes: { before: existing, after: category },
      });

      return category;
    }),

  // 删除分类（管理员）
  categoryDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const category = await db.helpCategory.findUnique({
        where: { id: input.id },
        include: {
          _count: { select: { articles: true, children: true } },
        },
      });

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '分类不存在' });
      }

      if (category._count.articles > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '该分类下还有文章，无法删除' });
      }

      if (category._count.children > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '该分类下还有子分类，无法删除' });
      }

      await db.helpCategory.delete({ where: { id: input.id } });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'DELETE',
        targetType: 'helpCategory',
        targetId: input.id,
        changes: { before: category },
      });

      return { success: true };
    }),

  // ==========================================================================
  // 帮助文章
  // ==========================================================================

  // 文章列表（公开 - 只显示已发布）
  articleList: publicProcedure
    .input(helpArticleListSchema.partial())
    .query(async ({ input }) => {
      const { categoryId, status, search, page = 1, limit = 20 } = input || {};

      const where = {
        status: status || 'PUBLISHED',
        ...(categoryId && { categoryId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { summary: { contains: search, mode: 'insensitive' as const } },
            { tags: { has: search } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        db.helpArticle.findMany({
          where,
          orderBy: [{ isPinned: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        }),
        db.helpArticle.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // 获取推荐/置顶文章（公开 - 用于首页常见问题）
  articleFeatured: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(6) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit || 6;

      return db.helpArticle.findMany({
        where: {
          status: 'PUBLISHED',
          isPinned: true,
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });
    }),

  // 相关文章推荐
  articleRelated: publicProcedure
    .input(z.object({
      articleId: z.string(),
      limit: z.number().int().min(1).max(10).default(3),
    }))
    .query(async ({ input }) => {
      const { articleId, limit } = input;

      // 获取当前文章
      const currentArticle = await db.helpArticle.findUnique({
        where: { id: articleId },
        select: { categoryId: true, tags: true },
      });

      if (!currentArticle) {
        return [];
      }

      // 查找相关文章：同分类 或 相同标签
      const relatedArticles = await db.helpArticle.findMany({
        where: {
          id: { not: articleId },
          status: 'PUBLISHED',
          OR: [
            // 同分类
            currentArticle.categoryId ? { categoryId: currentArticle.categoryId } : {},
            // 相同标签
            currentArticle.tags.length > 0 ? { tags: { hasSome: currentArticle.tags } } : {},
          ].filter(condition => Object.keys(condition).length > 0),
        },
        orderBy: [
          { viewCount: 'desc' }, // 按浏览量排序
          { createdAt: 'desc' },
        ],
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          category: { select: { id: true, name: true } },
        },
      });

      return relatedArticles;
    }),

  // 文章列表（管理员 - 全部状态）
  articleListAdmin: adminProcedure
    .input(helpArticleListSchema)
    .query(async ({ input }) => {
      const { categoryId, status, search, page, limit } = input;

      const where = {
        ...(categoryId && { categoryId }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { articleId: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        db.helpArticle.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            category: { select: { id: true, name: true } },
          },
        }),
        db.helpArticle.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // 获取单篇文章（通过 slug）
  articleGetBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const article = await db.helpArticle.findUnique({
        where: { slug: input.slug },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      if (!article) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '文章不存在' });
      }

      // 增加浏览量
      await db.helpArticle.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
      });

      return article;
    }),

  // 获取单篇文章（通过 ID）
  articleGet: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const article = await db.helpArticle.findUnique({
        where: { id: input.id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!article) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '文章不存在' });
      }

      return article;
    }),

  // 创建文章（管理员）
  articleCreate: adminProcedure
    .input(helpArticleCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // 检查 slug
      const existing = await db.helpArticle.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'URL 标识已存在' });
      }

      const articleId = await generateArticleId();

      const article = await db.helpArticle.create({
        data: {
          ...input,
          articleId,
          authorId: ctx.session.user.id,
          publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'CREATE',
        targetType: 'helpArticle',
        targetId: article.id,
        changes: { after: article },
      });

      return article;
    }),

  // 更新文章（管理员）
  articleUpdate: adminProcedure
    .input(z.object({
      id: z.string(),
      data: helpArticleUpdateSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.helpArticle.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '文章不存在' });
      }

      // 检查 slug
      if (input.data.slug && input.data.slug !== existing.slug) {
        const duplicate = await db.helpArticle.findUnique({
          where: { slug: input.data.slug },
        });
        if (duplicate) {
          throw new TRPCError({ code: 'CONFLICT', message: 'URL 标识已存在' });
        }
      }

      // 如果从非发布变为发布，设置发布时间
      const publishedAt =
        input.data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED'
          ? new Date()
          : existing.publishedAt;

      const article = await db.helpArticle.update({
        where: { id: input.id },
        data: {
          ...input.data,
          publishedAt,
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'UPDATE',
        targetType: 'helpArticle',
        targetId: article.id,
        changes: { before: existing, after: article },
      });

      return article;
    }),

  // 删除文章（管理员）
  articleDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const article = await db.helpArticle.findUnique({
        where: { id: input.id },
      });

      if (!article) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '文章不存在' });
      }

      await db.helpArticle.delete({ where: { id: input.id } });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'DELETE',
        targetType: 'helpArticle',
        targetId: input.id,
        changes: { before: article },
      });

      return { success: true };
    }),

  // 切换文章置顶状态（管理员）
  articleTogglePinned: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const article = await db.helpArticle.findUnique({
        where: { id: input.id },
      });

      if (!article) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '文章不存在' });
      }

      const updated = await db.helpArticle.update({
        where: { id: input.id },
        data: { isPinned: !article.isPinned },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'UPDATE',
        targetType: 'helpArticle',
        targetId: input.id,
        changes: { 
          before: { isPinned: article.isPinned }, 
          after: { isPinned: updated.isPinned },
        },
      });

      return updated;
    }),

  // 批量更新文章状态（管理员）
  articleBulkUpdateStatus: adminProcedure
    .input(z.object({
      ids: z.array(z.string()).min(1).max(100),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { ids, status } = input;

      const result = await db.helpArticle.updateMany({
        where: { id: { in: ids } },
        data: { 
          status,
          ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'BULK_UPDATE',
        targetType: 'helpArticle',
        metadata: { ids, status, count: result.count },
      });

      return { success: true, count: result.count };
    }),

  // 批量删除文章（管理员）
  articleBulkDelete: adminProcedure
    .input(z.object({
      ids: z.array(z.string()).min(1).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      const { ids } = input;

      // 获取要删除的文章信息
      const articles = await db.helpArticle.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true },
      });

      const result = await db.helpArticle.deleteMany({
        where: { id: { in: ids } },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'BULK_DELETE',
        targetType: 'helpArticle',
        metadata: { 
          count: result.count,
          articles: articles.map(a => ({ id: a.id, title: a.title })),
        },
      });

      return { success: true, count: result.count };
    }),

  // 批量修改文章分类（管理员）
  articleBulkUpdateCategory: adminProcedure
    .input(z.object({
      ids: z.array(z.string()).min(1).max(100),
      categoryId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { ids, categoryId } = input;

      // 验证分类存在
      const category = await db.helpCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '分类不存在' });
      }

      const result = await db.helpArticle.updateMany({
        where: { id: { in: ids } },
        data: { categoryId },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'BULK_UPDATE',
        targetType: 'helpArticle',
        metadata: { ids, categoryId, categoryName: category.name, count: result.count },
      });

      return { success: true, count: result.count };
    }),

  // 文章反馈（有帮助/没帮助）
  articleFeedback: publicProcedure
    .input(z.object({
      id: z.string(),
      helpful: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await db.helpArticle.update({
        where: { id: input.id },
        data: input.helpful
          ? { helpfulCount: { increment: 1 } }
          : { notHelpfulCount: { increment: 1 } },
      });

      return { success: true };
    }),

  // ==========================================================================
  // 法律文档
  // ==========================================================================

  // 获取法律文档（公开 - 通过类型）
  legalGet: publicProcedure
    .input(z.object({ type: legalDocumentTypeEnum }))
    .query(async ({ input }) => {
      const document = await db.legalDocument.findUnique({
        where: { type: input.type },
      });

      if (!document || document.status !== 'PUBLISHED') {
        throw new TRPCError({ code: 'NOT_FOUND', message: '文档不存在' });
      }

      return document;
    }),

  // 获取法律文档（管理员 - 任何状态）
  legalGetAdmin: adminProcedure
    .input(z.object({ type: legalDocumentTypeEnum }))
    .query(async ({ input }) => {
      const document = await db.legalDocument.findUnique({
        where: { type: input.type },
        include: {
          histories: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      return document;
    }),

  // 获取所有法律文档（管理员）
  legalListAdmin: adminProcedure.query(async () => {
    // 返回所有类型，包括未创建的
    const documents = await db.legalDocument.findMany();

    const types = ['PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'COOKIE_POLICY', 'REFUND_POLICY'] as const;

    return types.map((type) => {
      const doc = documents.find((d) => d.type === type);
      return {
        type,
        document: doc || null,
      };
    });
  }),

  // 创建或更新法律文档（管理员）
  legalUpsert: adminProcedure
    .input(legalDocumentCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await db.legalDocument.findUnique({
        where: { type: input.type },
      });

      if (existing) {
        // 保存历史版本
        await db.legalDocumentHistory.create({
          data: {
            documentId: existing.id,
            version: existing.version,
            title: existing.title,
            content: existing.content,
            effectiveDate: existing.effectiveDate,
            changeNote: `更新前版本`,
            createdBy: ctx.session.user.id,
          },
        });

        // 更新文档
        const document = await db.legalDocument.update({
          where: { type: input.type },
          data: {
            title: input.title,
            content: input.content,
            version: input.version,
            effectiveDate: input.effectiveDate,
            status: input.status,
            publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
          },
        });

        await logAdminAction({
          userId: ctx.session.user.id,
          userEmail: ctx.session.user.email || '',
          action: 'UPDATE',
          targetType: 'legalDocument',
          targetId: document.id,
          changes: { before: existing, after: document },
        });

        return document;
      } else {
        // 创建新文档
        const document = await db.legalDocument.create({
          data: {
            type: input.type,
            title: input.title,
            content: input.content,
            version: input.version,
            effectiveDate: input.effectiveDate,
            status: input.status,
            publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
          },
        });

        await logAdminAction({
          userId: ctx.session.user.id,
          userEmail: ctx.session.user.email || '',
          action: 'CREATE',
          targetType: 'legalDocument',
          targetId: document.id,
          changes: { after: document },
        });

        return document;
      }
    }),

  // 更新法律文档（管理员）
  legalUpdate: adminProcedure
    .input(z.object({
      type: legalDocumentTypeEnum,
      data: legalDocumentUpdateSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.legalDocument.findUnique({
        where: { type: input.type },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '文档不存在' });
      }

      // 保存历史版本
      await db.legalDocumentHistory.create({
        data: {
          documentId: existing.id,
          version: existing.version,
          title: existing.title,
          content: existing.content,
          effectiveDate: existing.effectiveDate,
          changeNote: `更新前版本`,
          createdBy: ctx.session.user.id,
        },
      });

      const document = await db.legalDocument.update({
        where: { type: input.type },
        data: {
          ...input.data,
          publishedAt: input.data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED'
            ? new Date()
            : existing.publishedAt,
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'UPDATE',
        targetType: 'legalDocument',
        targetId: document.id,
        changes: { before: existing, after: document },
      });

      return document;
    }),

  // 获取法律文档历史版本
  legalHistory: adminProcedure
    .input(z.object({ type: legalDocumentTypeEnum }))
    .query(async ({ input }) => {
      const document = await db.legalDocument.findUnique({
        where: { type: input.type },
      });

      if (!document) {
        return [];
      }

      return db.legalDocumentHistory.findMany({
        where: { documentId: document.id },
        orderBy: { createdAt: 'desc' },
      });
    }),
});
