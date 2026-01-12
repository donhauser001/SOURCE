/**
 * Color Router - PaperProfile 子路由
 *
 * list, get, create, update, delete
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../../trpc';
import {
    createPaperProfileSchema,
    updatePaperProfileSchema,
    listPaperProfilesSchema,
} from '@/lib/validations/color';
import { calculateDeltaE } from './types';

export const paperProfileRouter = createTRPCRouter({
    /**
     * 获取颜色的所有纸张表现
     */
    list: publicProcedure.input(listPaperProfilesSchema).query(async ({ ctx, input }) => {
        const where: Prisma.PaperProfileWhereInput = {};

        if (input.colorId) {
            where.colorId = input.colorId;
        }
        if (input.paperTypeId) {
            where.paperTypeId = input.paperTypeId;
        }
        if (input.recommendation) {
            where.recommendation = input.recommendation;
        }

        const items = await ctx.prisma.paperProfile.findMany({
            where,
            take: input.limit,
            orderBy: [{ recommendation: 'asc' }, { paperType: { order: 'asc' } }],
            include: {
                color: {
                    select: { colorId: true, name: true },
                },
                batch: {
                    select: { batchNo: true },
                },
                paperType: true,
            },
        });

        return items;
    }),

    /**
     * 获取单个纸张表现
     */
    get: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const profile = await ctx.prisma.paperProfile.findUnique({
                where: { id: input.id },
                include: {
                    color: true,
                    batch: true,
                },
            });

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `纸张表现数据不存在`,
                });
            }

            return profile;
        }),

    /**
     * 创建纸张表现
     */
    create: adminProcedure
        .input(createPaperProfileSchema)
        .mutation(async ({ ctx, input }) => {
            // 获取颜色的真源 Lab 和验证纸型存在
            const [color, paperType] = await Promise.all([
                ctx.prisma.color.findUnique({
                    where: { id: input.colorId },
                    select: { labL: true, labA: true, labB: true },
                }),
                ctx.prisma.paperTypeOption.findUnique({
                    where: { id: input.paperTypeId },
                    select: { id: true, code: true, name: true },
                }),
            ]);

            if (!color) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `颜色不存在`,
                });
            }

            if (!paperType) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `纸型不存在`,
                });
            }

            // 检查是否已存在该纸张类型
            const existing = await ctx.prisma.paperProfile.findUnique({
                where: {
                    colorId_paperTypeId: {
                        colorId: input.colorId,
                        paperTypeId: input.paperTypeId,
                    },
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `该颜色的 ${paperType.name} 纸张数据已存在`,
                });
            }

            // 计算 ΔE（如果未提供）
            let deltaE = input.deltaE;
            if (deltaE === undefined) {
                deltaE = calculateDeltaE(
                    { L: color.labL, a: color.labA, b: color.labB },
                    { L: input.labL, a: input.labA, b: input.labB }
                );
            }

            const profile = await ctx.prisma.paperProfile.create({
                data: {
                    ...input,
                    deltaE,
                },
                include: {
                    color: { select: { colorId: true, name: true } },
                    batch: { select: { batchNo: true } },
                    paperType: true,
                },
            });

            return profile;
        }),

    /**
     * 更新纸张表现
     */
    update: adminProcedure
        .input(updatePaperProfileSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const existing = await ctx.prisma.paperProfile.findUnique({
                where: { id },
                include: {
                    color: { select: { labL: true, labA: true, labB: true } },
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `纸张表现数据不存在`,
                });
            }

            // 如果更新了 Lab 值，重新计算 ΔE
            let deltaE = data.deltaE;
            if (
                (data.labL !== undefined || data.labA !== undefined || data.labB !== undefined) &&
                deltaE === undefined
            ) {
                deltaE = calculateDeltaE(
                    {
                        L: existing.color.labL,
                        a: existing.color.labA,
                        b: existing.color.labB,
                    },
                    {
                        L: data.labL ?? existing.labL,
                        a: data.labA ?? existing.labA,
                        b: data.labB ?? existing.labB,
                    }
                );
            }

            const profile = await ctx.prisma.paperProfile.update({
                where: { id },
                data: {
                    ...data,
                    deltaE,
                },
                include: {
                    color: { select: { colorId: true, name: true } },
                    batch: { select: { batchNo: true } },
                },
            });

            return profile;
        }),

    /**
     * 删除纸张表现
     */
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.prisma.paperProfile.findUnique({
                where: { id: input.id },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `纸张表现数据不存在`,
                });
            }

            await ctx.prisma.paperProfile.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),
});
