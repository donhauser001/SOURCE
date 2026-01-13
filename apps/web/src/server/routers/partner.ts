/**
 * 共建者 Router
 *
 * 印厂/纸商/油墨商统一管理
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc';
import {
    CreatePartnerSchema,
    UpdatePartnerSchema,
    ListPartnersSchema,
    GetPartnerSchema,
    PartnerTypeEnum,
    PartnerStatusEnum,
} from '@/lib/validations/partner';
import { logAdminAction, logAdminBatchAction, AUDIT_TARGET_TYPES } from '@/lib/admin-audit';

export const partnerRouter = createTRPCRouter({
    // ============================================================================
    // 公开查询
    // ============================================================================

    /**
     * 获取单个共建者
     */
    get: publicProcedure.input(GetPartnerSchema).query(async ({ ctx, input }) => {
        const where = input.id
            ? { id: input.id }
            : { partnerId: input.partnerId };

        const partner = await ctx.prisma.partner.findUnique({
            where,
            include: {
                _count: {
                    select: {
                        colorParticipations: true,
                        users: true,
                        batches: true,
                        testReports: true,
                    },
                },
            },
        });

        if (!partner) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `共建者不存在: ${input.partnerId || input.id}`,
            });
        }

        return partner;
    }),

    /**
     * 公开列表（仅显示 ACTIVE 状态）
     */
    list: publicProcedure.input(ListPartnersSchema).query(async ({ ctx, input }) => {
        const { cursor, limit = 20, types, search, region } = input;

        // 构建查询条件
        const where: any = {
            status: 'ACTIVE', // 公开列表只显示活跃共建者
        };

        if (types && types.length > 0) {
            where.types = { hasSome: types };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { shortName: { contains: search, mode: 'insensitive' } },
                { partnerId: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (region) {
            where.region = { contains: region, mode: 'insensitive' };
        }

        // 分页查询
        const items = await ctx.prisma.partner.findMany({
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        colorParticipations: true,
                        batches: true,
                    },
                },
            },
        });

        let nextCursor: string | undefined = undefined;
        if (items.length > limit) {
            const nextItem = items.pop();
            nextCursor = nextItem!.id;
        }

        return {
            items,
            nextCursor,
        };
    }),

    /**
     * 统计数据（按类型和状态分组）
     */
    stats: publicProcedure.query(async ({ ctx }) => {
        const [total, byType, byStatus] = await Promise.all([
            // 总数
            ctx.prisma.partner.count(),

            // 按类型统计
            ctx.prisma.partner.groupBy({
                by: ['types'],
                _count: true,
            }),

            // 按状态统计
            ctx.prisma.partner.groupBy({
                by: ['status'],
                _count: true,
            }),
        ]);

        // 处理类型统计（数组类型需要特殊处理）
        const typeStats: Record<string, number> = {
            PRINTER: 0,
            PAPER_VENDOR: 0,
            INK_VENDOR: 0,
            LAB: 0,
            CONSULTANT: 0,
        };

        // Prisma 数组字段的 groupBy 返回的是包含数组的记录
        // 需要手动统计
        const allPartners = await ctx.prisma.partner.findMany({
            select: { types: true },
        });

        allPartners.forEach((partner) => {
            partner.types.forEach((type) => {
                typeStats[type] = (typeStats[type] || 0) + 1;
            });
        });

        const statusStats = byStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
        }, {} as Record<string, number>);

        return {
            total,
            byType: typeStats,
            byStatus: statusStats,
        };
    }),

    // ============================================================================
    // 管理员操作
    // ============================================================================

    /**
     * 管理员列表（支持搜索、筛选、排序）
     */
    adminList: adminProcedure
        .input(
            ListPartnersSchema.extend({
                status: PartnerStatusEnum.optional(), // 管理员可以看所有状态
            })
        )
        .query(async ({ ctx, input }) => {
            const { cursor, limit = 100, types, status, search, region } = input;

            // 构建查询条件
            const where: any = {};

            if (types && types.length > 0) {
                where.types = { hasSome: types };
            }

            if (status) {
                where.status = status;
            }

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { shortName: { contains: search, mode: 'insensitive' } },
                    { partnerId: { contains: search, mode: 'insensitive' } },
                    { contactEmail: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (region) {
                where.region = { contains: region, mode: 'insensitive' };
            }

            // 查询
            const items = await ctx.prisma.partner.findMany({
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            colorParticipations: true,
                            users: true,
                            batches: true,
                            testReports: true,
                        },
                    },
                },
            });

            let nextCursor: string | undefined = undefined;
            if (items.length > limit) {
                const nextItem = items.pop();
                nextCursor = nextItem!.id;
            }

            return {
                items,
                nextCursor,
            };
        }),

    /**
     * 创建共建者
     */
    create: adminProcedure.input(CreatePartnerSchema).mutation(async ({ ctx, input }) => {
        // 检查 partnerId 是否已存在
        const existing = await ctx.prisma.partner.findUnique({
            where: { partnerId: input.partnerId },
        });

        if (existing) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `共建者编号已存在: ${input.partnerId}`,
            });
        }

        // 创建共建者
        const partner = await ctx.prisma.partner.create({
            data: {
                ...input,
                status: input.status || 'PENDING', // 默认待审核
            },
        });

        // 记录审计日志
        await logAdminAction({
            userId: ctx.session.user.id,
            userEmail: ctx.session.user.email ?? '',
            action: 'CREATE',
            targetType: AUDIT_TARGET_TYPES.PARTNER,
            targetId: partner.id,
            changes: { after: { partnerId: partner.partnerId, name: partner.name } },
        });

        return partner;
    }),

    /**
     * 更新共建者
     */
    update: adminProcedure.input(UpdatePartnerSchema).mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;

        // 检查共建者是否存在
        const existing = await ctx.prisma.partner.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '共建者不存在',
            });
        }

        // 更新共建者
        const partner = await ctx.prisma.partner.update({
            where: { id },
            data,
        });

        // 记录审计日志
        await logAdminAction({
            userId: ctx.session.user.id,
            userEmail: ctx.session.user.email ?? '',
            action: 'UPDATE',
            targetType: AUDIT_TARGET_TYPES.PARTNER,
            targetId: partner.id,
            changes: {
                before: { partnerId: existing.partnerId, name: existing.name, status: existing.status },
                after: { partnerId: partner.partnerId, name: partner.name, status: partner.status },
            },
        });

        return partner;
    }),

    /**
     * 删除共建者
     */
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查是否有关联数据
            const partner = await ctx.prisma.partner.findUnique({
                where: { id: input.id },
                include: {
                    _count: {
                        select: {
                            colorParticipations: true,
                            users: true,
                            batches: true,
                            testReports: true,
                        },
                    },
                },
            });

            if (!partner) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '共建者不存在',
                });
            }

            // 检查关联数据
            const hasRelations =
                partner._count.colorParticipations > 0 ||
                partner._count.users > 0 ||
                partner._count.batches > 0 ||
                partner._count.testReports > 0;

            if (hasRelations) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: '该共建者有关联数据，无法删除。建议将状态设为"停止合作"。',
                });
            }

            // 删除共建者
            await ctx.prisma.partner.delete({
                where: { id: input.id },
            });

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'DELETE',
                targetType: AUDIT_TARGET_TYPES.PARTNER,
                targetId: input.id,
                changes: { before: { partnerId: partner.partnerId, name: partner.name } },
            });

            return { success: true };
        }),

    /**
     * 批量更新状态
     */
    batchUpdateStatus: adminProcedure
        .input(
            z.object({
                ids: z.array(z.string()).min(1, '至少选择一个共建者'),
                status: PartnerStatusEnum,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.prisma.partner.updateMany({
                where: {
                    id: { in: input.ids },
                },
                data: {
                    status: input.status,
                },
            });

            // 记录审计日志
            await logAdminBatchAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'STATUS_CHANGE',
                targetType: AUDIT_TARGET_TYPES.PARTNER,
                targetIds: input.ids,
                metadata: { newStatus: input.status },
            });

            return {
                count: result.count,
            };
        }),
});
