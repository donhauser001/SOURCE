/**
 * Color Router - CRUD 变更操作
 *
 * create, update, delete
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '../../trpc';
import { createColorSchema, updateColorSchema } from '@/lib/validations/color';
import { logAdminAction, AUDIT_TARGET_TYPES } from '@/lib/admin-audit';

export const colorMutationsRouter = createTRPCRouter({
    /**
     * 创建颜色
     */
    create: adminProcedure.input(createColorSchema).mutation(async ({ ctx, input }) => {
        // 检查 colorId 是否已存在
        const existing = await ctx.prisma.color.findUnique({
            where: { colorId: input.colorId },
        });

        if (existing) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `颜色编号已存在: ${input.colorId}`,
            });
        }

        // 如果指定了 batchId，验证存在性
        if (input.batchId) {
            const batch = await ctx.prisma.batch.findUnique({
                where: { id: input.batchId },
            });
            if (!batch) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `批次不存在: ${input.batchId}`,
                });
            }
        }

        const color = await ctx.prisma.color.create({
            data: input,
            include: {
                batch: true,
            },
        });

        // 记录审计日志
        await logAdminAction({
            userId: ctx.session.user.id,
            userEmail: ctx.session.user.email ?? '',
            action: 'CREATE',
            targetType: AUDIT_TARGET_TYPES.COLOR,
            targetId: color.id,
            changes: { after: { colorId: color.colorId, name: color.name } },
        });

        return color;
    }),

    /**
     * 更新颜色
     */
    update: adminProcedure.input(updateColorSchema).mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;

        // 检查颜色是否存在
        const existing = await ctx.prisma.color.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `颜色不存在`,
            });
        }

        // 如果指定了 batchId，验证存在性
        if (data.batchId) {
            const batch = await ctx.prisma.batch.findUnique({
                where: { id: data.batchId },
            });
            if (!batch) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `批次不存在: ${data.batchId}`,
                });
            }
        }

        const color = await ctx.prisma.color.update({
            where: { id },
            data,
            include: {
                batch: true,
                paperProfiles: true,
            },
        });

        // 记录审计日志
        await logAdminAction({
            userId: ctx.session.user.id,
            userEmail: ctx.session.user.email ?? '',
            action: 'UPDATE',
            targetType: AUDIT_TARGET_TYPES.COLOR,
            targetId: color.id,
            changes: {
                before: { colorId: existing.colorId, name: existing.name, status: existing.status },
                after: { colorId: color.colorId, name: color.name, status: color.status },
            },
        });

        return color;
    }),

    /**
     * 删除颜色
     */
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查颜色是否存在
            const existing = await ctx.prisma.color.findUnique({
                where: { id: input.id },
                include: {
                    _count: {
                        select: { proofingPacks: true },
                    },
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `颜色不存在`,
                });
            }

            // 检查是否有关联的打样包
            if (existing._count.proofingPacks > 0) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: `该颜色有关联的打样包，无法删除`,
                });
            }

            await ctx.prisma.color.delete({
                where: { id: input.id },
            });

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'DELETE',
                targetType: AUDIT_TARGET_TYPES.COLOR,
                targetId: input.id,
                changes: { before: { colorId: existing.colorId, name: existing.name } },
            });

            return { success: true };
        }),
});
