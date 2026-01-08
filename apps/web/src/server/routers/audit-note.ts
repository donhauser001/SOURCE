/**
 * 审计注记 Router
 *
 * v0.5.1 - Admin 阶段
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc';
import { AuditTargetType, AuditVerdict, AdvisorType, Visibility } from '@prisma/client';

// Zod schemas - 使用 nativeEnum 确保类型兼容
const auditTargetTypeSchema = z.nativeEnum(AuditTargetType);
const auditVerdictSchema = z.nativeEnum(AuditVerdict);
const advisorTypeSchema = z.nativeEnum(AdvisorType);
const visibilitySchema = z.nativeEnum(Visibility);

const createAuditNoteSchema = z.object({
    targetType: auditTargetTypeSchema,
    targetId: z.string().min(1),
    advisorType: advisorTypeSchema,
    advisorId: z.string().min(1),
    advisorName: z.string().min(1),
    note: z.string().min(1),
    verdict: auditVerdictSchema,
    visibility: visibilitySchema.default('PUBLIC'),
});

const updateAuditNoteSchema = z.object({
    id: z.string(),
    note: z.string().min(1).optional(),
    verdict: auditVerdictSchema.optional(),
    visibility: visibilitySchema.optional(),
});

const listAuditNotesSchema = z.object({
    targetType: auditTargetTypeSchema.optional(),
    targetId: z.string().optional(),
    verdict: auditVerdictSchema.optional(),
    limit: z.number().min(1).max(100).default(50),
    cursor: z.string().optional(),
});

export const auditNoteRouter = createTRPCRouter({
    /**
     * 获取审计注记列表
     */
    list: adminProcedure
        .input(listAuditNotesSchema)
        .query(async ({ ctx, input }) => {
            const { targetType, targetId, verdict, limit, cursor } = input;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const where: any = {};

            if (targetType) {
                where.targetType = targetType;
            }
            if (targetId) {
                where.targetId = targetId;
            }
            if (verdict) {
                where.verdict = verdict;
            }

            const items = await ctx.prisma.auditNote.findMany({
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
     * 获取单个审计注记
     */
    get: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const note = await ctx.prisma.auditNote.findUnique({
                where: { id: input.id },
            });

            if (!note) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '审计注记不存在',
                });
            }

            return note;
        }),

    /**
     * 获取目标的审计注记
     */
    byTarget: publicProcedure
        .input(z.object({
            targetType: auditTargetTypeSchema,
            targetId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const notes = await ctx.prisma.auditNote.findMany({
                where: {
                    targetType: input.targetType,
                    targetId: input.targetId,
                    visibility: 'PUBLIC',
                },
                orderBy: { createdAt: 'desc' },
            });

            return notes;
        }),

    /**
     * 创建审计注记
     */
    create: adminProcedure
        .input(createAuditNoteSchema)
        .mutation(async ({ ctx, input }) => {
            const note = await ctx.prisma.auditNote.create({
                data: input,
            });

            return note;
        }),

    /**
     * 更新审计注记
     */
    update: adminProcedure
        .input(updateAuditNoteSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const existing = await ctx.prisma.auditNote.findUnique({
                where: { id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '审计注记不存在',
                });
            }

            const note = await ctx.prisma.auditNote.update({
                where: { id },
                data,
            });

            return note;
        }),

    /**
     * 删除审计注记
     */
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.prisma.auditNote.findUnique({
                where: { id: input.id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '审计注记不存在',
                });
            }

            await ctx.prisma.auditNote.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    /**
     * 统计
     */
    stats: adminProcedure.query(async ({ ctx }) => {
        const [total, approved, flagged, rejected] = await Promise.all([
            ctx.prisma.auditNote.count(),
            ctx.prisma.auditNote.count({ where: { verdict: AuditVerdict.APPROVED } }),
            ctx.prisma.auditNote.count({ where: { verdict: AuditVerdict.FLAGGED } }),
            ctx.prisma.auditNote.count({ where: { verdict: AuditVerdict.REJECTED } }),
        ]);

        // 按目标类型统计
        const byTargetType = await ctx.prisma.auditNote.groupBy({
            by: ['targetType'],
            _count: { _all: true },
        });

        return {
            total,
            byVerdict: { approved, flagged, rejected },
            byTargetType: byTargetType.map((t) => ({
                type: t.targetType,
                count: t._count._all,
            })),
        };
    }),
});

