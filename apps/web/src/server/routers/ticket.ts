/**
 * 工单系统 tRPC Router
 * 
 * 包含工单分类、工单、工单回复的 CRUD
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import { prisma as db } from '@/lib/db';
import {
  ticketCategoryCreateSchema,
  ticketCategoryUpdateSchema,
  ticketCreateSchema,
  ticketUpdateSchema,
  ticketListSchema,
  ticketReplyCreateSchema,
  ticketStatusEnum,
} from '@/lib/validations/support';
import { logAdminAction } from '@/lib/admin-audit';
import {
  sendEmail,
  ticketCreatedEmail,
  ticketRepliedEmail,
  ticketStatusChangedEmail,
} from '@/lib/email';

// 生成工单编号
async function generateTicketNo(): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  // 查询当月工单数量
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const count = await db.supportTicket.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const num = (count + 1).toString().padStart(4, '0');
  return `TK-${yearMonth}-${num}`;
}

export const ticketRouter = createTRPCRouter({
  // ==========================================================================
  // 工单分类
  // ==========================================================================

  // 获取分类列表（公开 - 用于用户提交工单）
  categoryList: publicProcedure.query(async () => {
    return db.ticketCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
      },
    });
  }),

  // 获取分类列表（管理员 - 全部）
  categoryListAdmin: adminProcedure.query(async () => {
    return db.ticketCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });
  }),

  // 获取单个分类
  categoryGet: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const category = await db.ticketCategory.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '分类不存在' });
      }

      return category;
    }),

  // 创建分类（管理员）
  categoryCreate: adminProcedure
    .input(ticketCategoryCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // 检查 slug
      const existing = await db.ticketCategory.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'URL 标识已存在' });
      }

      const category = await db.ticketCategory.create({
        data: input,
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'CREATE',
        targetType: 'ticketCategory',
        targetId: category.id,
        changes: { after: category },
      });

      return category;
    }),

  // 更新分类（管理员）
  categoryUpdate: adminProcedure
    .input(z.object({
      id: z.string(),
      data: ticketCategoryUpdateSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.ticketCategory.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '分类不存在' });
      }

      // 检查 slug
      if (input.data.slug && input.data.slug !== existing.slug) {
        const duplicate = await db.ticketCategory.findUnique({
          where: { slug: input.data.slug },
        });
        if (duplicate) {
          throw new TRPCError({ code: 'CONFLICT', message: 'URL 标识已存在' });
        }
      }

      const category = await db.ticketCategory.update({
        where: { id: input.id },
        data: input.data,
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'UPDATE',
        targetType: 'ticketCategory',
        targetId: category.id,
        changes: { before: existing, after: category },
      });

      return category;
    }),

  // 删除分类（管理员）
  categoryDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const category = await db.ticketCategory.findUnique({
        where: { id: input.id },
        include: { _count: { select: { tickets: true } } },
      });

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '分类不存在' });
      }

      if (category._count.tickets > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '该分类下还有工单，无法删除' });
      }

      await db.ticketCategory.delete({ where: { id: input.id } });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'DELETE',
        targetType: 'ticketCategory',
        targetId: input.id,
        changes: { before: category },
      });

      return { success: true };
    }),

  // ==========================================================================
  // 工单
  // ==========================================================================

  // 创建工单（需登录）
  create: protectedProcedure
    .input(ticketCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const ticketNo = await generateTicketNo();

      const ticket = await db.supportTicket.create({
        data: {
          ...input,
          ticketNo,
          userId: ctx.session.user.id,
        },
        include: {
          category: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // 发送工单创建邮件通知
      if (ticket.user.email) {
        const emailContent = ticketCreatedEmail({
          ticketNumber: ticket.ticketNo,
          subject: ticket.subject,
          description: ticket.description || '',
          userName: ticket.user.name || '用户',
        });
        sendEmail({
          to: ticket.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        }).catch(console.error); // 不阻塞返回
      }

      return ticket;
    }),

  // 获取我的工单列表（用户）
  myTickets: protectedProcedure
    .input(z.object({
      status: z.union([ticketStatusEnum, z.literal('')]).optional().transform(v => v || undefined),
      search: z.string().optional().transform(v => v || undefined),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(10),
    }))
    .query(async ({ input, ctx }) => {
      const { status, search, page, limit } = input;

      const where = {
        userId: ctx.session.user.id,
        ...(status && { status }),
        ...(search && {
          OR: [
            { ticketNo: { contains: search, mode: 'insensitive' as const } },
            { subject: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        db.supportTicket.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            category: { select: { id: true, name: true } },
            _count: { select: { replies: true } },
          },
        }),
        db.supportTicket.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // 获取单个工单（用户）
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const ticket = await db.supportTicket.findUnique({
        where: { id: input.id },
        include: {
          category: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true, image: true } },
          assignee: { select: { id: true, name: true, email: true, image: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, email: true, image: true, role: true } },
            },
          },
        },
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '工单不存在' });
      }

      // 检查权限：只能查看自己的工单，或者是管理员
      const userRole = (ctx.session.user as { role?: string })?.role;
      const isAdmin = userRole === 'ADMIN' || userRole === 'OPERATOR';

      if (ticket.userId !== ctx.session.user.id && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: '无权查看此工单' });
      }

      // 如果是普通用户，过滤掉内部备注
      if (!isAdmin) {
        ticket.replies = ticket.replies.filter((r) => r.replyType === 'PUBLIC');
      }

      return ticket;
    }),

  // 获取工单回复列表
  replyList: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ticket = await db.supportTicket.findUnique({
        where: { id: input.ticketId },
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '工单不存在' });
      }

      // 检查权限
      const userRole = (ctx.session.user as { role?: string })?.role;
      const isAdmin = userRole === 'ADMIN' || userRole === 'OPERATOR';

      if (ticket.userId !== ctx.session.user.id && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: '无权查看此工单' });
      }

      const replies = await db.ticketReply.findMany({
        where: { ticketId: input.ticketId },
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true, image: true, role: true } },
        },
      });

      // 如果是普通用户，过滤掉内部备注
      if (!isAdmin) {
        return replies.filter((r) => r.replyType === 'PUBLIC');
      }

      return replies;
    }),

  // 用户添加回复
  replyCreate: protectedProcedure
    .input(ticketReplyCreateSchema.omit({ replyType: true }))
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.supportTicket.findUnique({
        where: { id: input.ticketId },
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '工单不存在' });
      }

      // 检查权限
      if (ticket.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: '无权回复此工单' });
      }

      // 检查工单状态
      if (ticket.status === 'CLOSED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '工单已关闭，无法回复' });
      }

      const reply = await db.ticketReply.create({
        data: {
          ticketId: input.ticketId,
          userId: ctx.session.user.id,
          content: input.content,
          attachments: input.attachments,
          replyType: 'PUBLIC',
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      });

      // 如果工单状态是"等待用户回复"，改为"处理中"
      if (ticket.status === 'PENDING_USER') {
        await db.supportTicket.update({
          where: { id: input.ticketId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return reply;
    }),

  // 用户关闭工单
  close: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.supportTicket.findUnique({
        where: { id: input.id },
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '工单不存在' });
      }

      if (ticket.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: '无权操作此工单' });
      }

      await db.supportTicket.update({
        where: { id: input.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      return { success: true };
    }),

  // ==========================================================================
  // 管理员操作
  // ==========================================================================

  // 工单列表（管理员）
  adminList: adminProcedure
    .input(ticketListSchema)
    .query(async ({ input }) => {
      const { categoryId, status, priority, assigneeId, userId, search, page, limit } = input;

      const where = {
        ...(categoryId && { categoryId }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assigneeId && { assigneeId }),
        ...(userId && { userId }),
        ...(search && {
          OR: [
            { ticketNo: { contains: search, mode: 'insensitive' as const } },
            { subject: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        db.supportTicket.findMany({
          where,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            category: { select: { id: true, name: true } },
            user: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
            _count: { select: { replies: true } },
          },
        }),
        db.supportTicket.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // 获取单个工单（管理员）
  adminGet: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const ticket = await db.supportTicket.findUnique({
        where: { id: input.id },
        include: {
          category: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true, image: true } },
          assignee: { select: { id: true, name: true, email: true, image: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, email: true, image: true, role: true } },
            },
          },
        },
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '工单不存在' });
      }

      return ticket;
    }),

  // 更新工单状态（管理员）
  adminUpdate: adminProcedure
    .input(z.object({
      id: z.string(),
      data: ticketUpdateSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.supportTicket.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '工单不存在' });
      }

      const updateData: Record<string, unknown> = { ...input.data };

      // 处理状态变更
      if (input.data.status) {
        if (input.data.status === 'RESOLVED' && existing.status !== 'RESOLVED') {
          updateData.resolvedAt = new Date();
        }
        if (input.data.status === 'CLOSED' && existing.status !== 'CLOSED') {
          updateData.closedAt = new Date();
        }
      }

      const ticket = await db.supportTicket.update({
        where: { id: input.id },
        data: updateData,
        include: {
          category: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'UPDATE',
        targetType: 'supportTicket',
        targetId: ticket.id,
        changes: { before: existing, after: ticket },
      });

      // 如果状态变更，发送邮件通知用户
      if (input.data.status && input.data.status !== existing.status && existing.user.email) {
        const emailContent = ticketStatusChangedEmail({
          ticketNumber: ticket.ticketNo,
          subject: ticket.subject,
          oldStatus: existing.status,
          newStatus: input.data.status,
          userName: existing.user.name || '用户',
        });
        sendEmail({
          to: existing.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        }).catch(console.error);
      }

      return ticket;
    }),

  // 管理员回复
  adminReply: adminProcedure
    .input(ticketReplyCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.supportTicket.findUnique({
        where: { id: input.ticketId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '工单不存在' });
      }

      const reply = await db.ticketReply.create({
        data: {
          ticketId: input.ticketId,
          userId: ctx.session.user.id,
          content: input.content,
          attachments: input.attachments,
          replyType: input.replyType,
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true, role: true } },
        },
      });

      // 更新工单状态和首次回复时间
      const updateData: Record<string, unknown> = {};

      if (input.replyType === 'PUBLIC') {
        if (!ticket.firstReplyAt) {
          updateData.firstReplyAt = new Date();
        }

        // 如果是公开回复，将状态改为"等待用户回复"
        if (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') {
          updateData.status = 'PENDING_USER';
        }

        // 发送邮件通知用户
        if (ticket.user.email) {
          const emailContent = ticketRepliedEmail({
            ticketNumber: ticket.ticketNo,
            subject: ticket.subject,
            replyContent: input.content,
            replierName: reply.user.name || '支持团队',
            isStaffReply: true,
            userName: ticket.user.name || '用户',
          });
          sendEmail({
            to: ticket.user.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          }).catch(console.error);
        }
      }

      // 如果工单未分配，自动分配给回复者
      if (!ticket.assigneeId) {
        updateData.assigneeId = ctx.session.user.id;
      }

      if (Object.keys(updateData).length > 0) {
        await db.supportTicket.update({
          where: { id: input.ticketId },
          data: updateData,
        });
      }

      return reply;
    }),

  // 分配工单（管理员）
  adminAssign: adminProcedure
    .input(z.object({
      id: z.string(),
      assigneeId: z.string().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.supportTicket.update({
        where: { id: input.id },
        data: { assigneeId: input.assigneeId },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      await logAdminAction({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email || '',
        action: 'UPDATE',
        targetType: 'supportTicket',
        targetId: ticket.id,
        metadata: { action: 'assign', assigneeId: input.assigneeId },
      });

      return ticket;
    }),

  // 工单统计（管理员）
  adminStats: adminProcedure.query(async () => {
    const [
      total,
      open,
      inProgress,
      pendingUser,
      resolved,
      closed,
      urgent,
    ] = await Promise.all([
      db.supportTicket.count(),
      db.supportTicket.count({ where: { status: 'OPEN' } }),
      db.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      db.supportTicket.count({ where: { status: 'PENDING_USER' } }),
      db.supportTicket.count({ where: { status: 'RESOLVED' } }),
      db.supportTicket.count({ where: { status: 'CLOSED' } }),
      db.supportTicket.count({ where: { priority: 'URGENT', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);

    // 今日新增
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNew = await db.supportTicket.count({
      where: { createdAt: { gte: today } },
    });

    // 平均首次响应时间（已回复的工单）
    const ticketsWithResponse = await db.supportTicket.findMany({
      where: { firstReplyAt: { not: null } },
      select: { createdAt: true, firstReplyAt: true },
    });

    let avgResponseTime = 0;
    if (ticketsWithResponse.length > 0) {
      const totalTime = ticketsWithResponse.reduce((sum, t) => {
        return sum + (t.firstReplyAt!.getTime() - t.createdAt.getTime());
      }, 0);
      avgResponseTime = Math.round(totalTime / ticketsWithResponse.length / 1000 / 60); // 分钟
    }

    return {
      total,
      byStatus: { open, inProgress, pendingUser, resolved, closed },
      urgent,
      todayNew,
      avgResponseTime,
    };
  }),

  // 获取可分配的管理员列表
  adminAssignees: adminProcedure.query(async () => {
    return db.user.findMany({
      where: {
        role: { in: ['ADMIN', 'OPERATOR'] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: { name: 'asc' },
    });
  }),
});
