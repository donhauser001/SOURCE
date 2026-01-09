/**
 * 管理员审计日志 Router
 * 
 * 提供审计日志的查询功能
 */

import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '../trpc';
import { AdminAction } from '@prisma/client';

export const adminAuditLogRouter = createTRPCRouter({
    /**
     * 获取审计日志列表
     */
    list: adminProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().optional(),
                action: z.nativeEnum(AdminAction).optional(),
                targetType: z.string().optional(),
                userId: z.string().optional(),
                startDate: z.string().optional(), // ISO 日期字符串
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, cursor, action, targetType, userId, startDate, endDate } = input;

            // 构建查询条件
            const where: {
                action?: AdminAction;
                targetType?: string;
                userId?: string;
                createdAt?: { gte?: Date; lte?: Date };
            } = {};

            if (action) {
                where.action = action;
            }
            if (targetType) {
                where.targetType = targetType;
            }
            if (userId) {
                where.userId = userId;
            }
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate);
                }
            }

            const items = await ctx.prisma.adminAuditLog.findMany({
                where,
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
            });

            let nextCursor: string | undefined;
            if (items.length > limit) {
                const nextItem = items.pop();
                nextCursor = nextItem?.id;
            }

            return {
                items,
                nextCursor,
            };
        }),

    /**
     * 获取单条审计日志详情
     */
    get: adminProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const log = await ctx.prisma.adminAuditLog.findUnique({
                where: { id: input.id },
            });

            return log;
        }),

    /**
     * 获取审计日志统计
     */
    stats: adminProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [total, todayCount, weekCount, monthCount, byAction, byTargetType] = await Promise.all([
            ctx.prisma.adminAuditLog.count(),
            ctx.prisma.adminAuditLog.count({
                where: { createdAt: { gte: today } },
            }),
            ctx.prisma.adminAuditLog.count({
                where: { createdAt: { gte: weekAgo } },
            }),
            ctx.prisma.adminAuditLog.count({
                where: { createdAt: { gte: monthAgo } },
            }),
            ctx.prisma.adminAuditLog.groupBy({
                by: ['action'],
                _count: { action: true },
            }),
            ctx.prisma.adminAuditLog.groupBy({
                by: ['targetType'],
                _count: { targetType: true },
            }),
        ]);

        return {
            total,
            todayCount,
            weekCount,
            monthCount,
            byAction: byAction.map((item) => ({
                action: item.action,
                count: item._count.action,
            })),
            byTargetType: byTargetType.map((item) => ({
                targetType: item.targetType,
                count: item._count.targetType,
            })),
        };
    }),
});
