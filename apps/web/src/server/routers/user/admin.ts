/**
 * User Router - 管理员功能
 *
 * adminList, adminUpdate, adminStats, adminDisable, adminEnable, adminDelete, adminBatchUpdate
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
import { createTRPCRouter, adminProcedure } from '../../trpc';
import { logAdminAction, AUDIT_TARGET_TYPES } from '@/lib/admin-audit';

export const userAdminRouter = createTRPCRouter({
    /**
     * 管理员：获取用户列表
     */
    adminList: adminProcedure
        .input(
            z.object({
                search: z.string().optional(),
                role: z.enum(['ADMIN', 'OPERATOR', 'AUDITOR', 'PARTNER', 'USER']).optional(),
                tier: z.enum(['FREE', 'VERIFIED', 'PAID']).optional(),
                isActive: z.boolean().optional(),
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { search, role, tier, isActive, limit, cursor } = input;

            const where: Prisma.UserWhereInput = {};

            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (role) {
                where.role = role;
            }

            if (tier) {
                where.tier = tier;
            }

            if (isActive !== undefined) {
                where.isActive = isActive;
            }

            const [items, totalCount] = await Promise.all([
                ctx.prisma.user.findMany({
                    where,
                    take: limit + 1,
                    cursor: cursor ? { id: cursor } : undefined,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                        role: true,
                        tier: true,
                        isActive: true,
                        disabledAt: true,
                        createdAt: true,
                        _count: {
                            select: {
                                apiKeys: true,
                            },
                        },
                    },
                }),
                ctx.prisma.user.count({ where }),
            ]);

            let nextCursor: string | undefined;
            if (items.length > limit) {
                const nextItem = items.pop();
                nextCursor = nextItem?.id;
            }

            return {
                items,
                nextCursor,
                totalCount,
            };
        }),

    /**
     * 管理员：更新用户角色/等级
     */
    adminUpdate: adminProcedure
        .input(
            z.object({
                id: z.string(),
                role: z.enum(['ADMIN', 'OPERATOR', 'AUDITOR', 'PARTNER', 'USER']).optional(),
                tier: z.enum(['FREE', 'VERIFIED', 'PAID']).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const existing = await ctx.prisma.user.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用户不存在',
                });
            }

            const user = await ctx.prisma.user.update({
                where: { id },
                data,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    tier: true,
                },
            });

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'UPDATE',
                targetType: AUDIT_TARGET_TYPES.USER,
                targetId: user.id,
                changes: {
                    before: { role: existing.role, tier: existing.tier },
                    after: { role: user.role, tier: user.tier },
                },
            });

            return user;
        }),

    /**
     * 管理员：统计
     */
    adminStats: adminProcedure.query(async ({ ctx }) => {
        const [total, byRole, byTier, activeCount, disabledCount] = await Promise.all([
            ctx.prisma.user.count(),
            ctx.prisma.user.groupBy({
                by: ['role'],
                _count: { _all: true },
            }),
            ctx.prisma.user.groupBy({
                by: ['tier'],
                _count: { _all: true },
            }),
            ctx.prisma.user.count({ where: { isActive: true } }),
            ctx.prisma.user.count({ where: { isActive: false } }),
        ]);

        return {
            total,
            active: activeCount,
            disabled: disabledCount,
            byRole: byRole.map((r) => ({ role: r.role, count: r._count._all })),
            byTier: byTier.map((t) => ({ tier: t.tier, count: t._count._all })),
        };
    }),

    /**
     * 管理员：禁用用户
     */
    adminDisable: adminProcedure
        .input(
            z.object({
                id: z.string(),
                reason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, reason } = input;

            // 不允许禁用自己
            if (id === ctx.session.user.id) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '不能禁用自己的账户',
                });
            }

            const existing = await ctx.prisma.user.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用户不存在',
                });
            }

            if (!existing.isActive) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '用户已被禁用',
                });
            }

            // 使用事务：禁用用户 + 撤销所有 API 密钥
            const user = await ctx.prisma.$transaction(async (tx) => {
                // 撤销用户所有 API 密钥
                await tx.apiKey.updateMany({
                    where: {
                        ownerUserId: id,
                        revokedAt: null,
                    },
                    data: {
                        revokedAt: new Date(),
                    },
                });

                // 禁用用户
                return tx.user.update({
                    where: { id },
                    data: {
                        isActive: false,
                        disabledAt: new Date(),
                        disabledBy: ctx.session.user.id,
                    },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        tier: true,
                        isActive: true,
                    },
                });
            });

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'STATUS_CHANGE',
                targetType: AUDIT_TARGET_TYPES.USER,
                targetId: user.id,
                changes: {
                    before: { isActive: true },
                    after: { isActive: false },
                },
                metadata: { reason },
            });

            return user;
        }),

    /**
     * 管理员：启用用户
     */
    adminEnable: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id } = input;

            const existing = await ctx.prisma.user.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用户不存在',
                });
            }

            if (existing.isActive) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '用户已处于激活状态',
                });
            }

            const user = await ctx.prisma.user.update({
                where: { id },
                data: {
                    isActive: true,
                    disabledAt: null,
                    disabledBy: null,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    tier: true,
                    isActive: true,
                },
            });

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'STATUS_CHANGE',
                targetType: AUDIT_TARGET_TYPES.USER,
                targetId: user.id,
                changes: {
                    before: { isActive: false },
                    after: { isActive: true },
                },
            });

            return user;
        }),

    /**
     * 管理员：删除用户
     */
    adminDelete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id } = input;

            // 不允许删除自己
            if (id === ctx.session.user.id) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '不能删除自己的账户',
                });
            }

            const existing = await ctx.prisma.user.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            apiKeys: true,
                            analysisReports: true,
                            buyIntents: true,
                            colorParticipations: true,
                            colorBooks: true,
                            works: true,
                        },
                    },
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用户不存在',
                });
            }

            // 检查是否有关联数据
            const hasRelations =
                existing._count.analysisReports > 0 ||
                existing._count.buyIntents > 0 ||
                existing._count.colorParticipations > 0 ||
                existing._count.colorBooks > 0 ||
                existing._count.works > 0;

            if (hasRelations) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: '该用户有关联数据，无法删除。建议禁用用户。',
                });
            }

            // 删除用户（会级联删除 API 密钥、账户、会话）
            await ctx.prisma.user.delete({
                where: { id },
            });

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'DELETE',
                targetType: AUDIT_TARGET_TYPES.USER,
                targetId: id,
                changes: {
                    before: { email: existing.email, name: existing.name },
                },
            });

            return { success: true };
        }),

    /**
     * 管理员：批量更新用户
     */
    adminBatchUpdate: adminProcedure
        .input(
            z.object({
                ids: z.array(z.string()).min(1).max(100),
                role: z.enum(['ADMIN', 'OPERATOR', 'AUDITOR', 'PARTNER', 'USER']).optional(),
                tier: z.enum(['FREE', 'VERIFIED', 'PAID']).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { ids, role, tier } = input;

            // 不允许批量修改自己
            if (ids.includes(ctx.session.user.id)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '不能批量修改包含自己的用户列表',
                });
            }

            // 至少需要一个更新字段
            if (!role && !tier) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '至少需要指定 role 或 tier',
                });
            }

            // 获取更新前的用户数据
            const existingUsers = await ctx.prisma.user.findMany({
                where: { id: { in: ids } },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    tier: true,
                },
            });

            if (existingUsers.length === 0) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '未找到任何用户',
                });
            }

            // 构建更新数据
            const updateData: { role?: 'ADMIN' | 'OPERATOR' | 'AUDITOR' | 'PARTNER' | 'USER'; tier?: 'FREE' | 'VERIFIED' | 'PAID' } = {};
            if (role) updateData.role = role;
            if (tier) updateData.tier = tier;

            // 批量更新
            const result = await ctx.prisma.user.updateMany({
                where: { id: { in: ids } },
                data: updateData,
            });

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'UPDATE',
                targetType: AUDIT_TARGET_TYPES.USER,
                targetId: null,
                changes: {
                    before: existingUsers.map(u => ({ id: u.id, role: u.role, tier: u.tier })),
                    after: { role, tier },
                },
                metadata: {
                    batchOperation: true,
                    affectedCount: result.count,
                    userIds: ids,
                },
            });

            return {
                success: true,
                updated: result.count,
            };
        }),
});
