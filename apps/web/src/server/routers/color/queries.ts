/**
 * Color Router - 公共查询
 *
 * get, getIdentity, list, search, stats
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { createTRPCRouter, publicProcedure } from '../../trpc';
import { listColorsSchema, getColorSchema } from '@/lib/validations/color';
import { withCache, CACHE_KEYS } from '@/lib/cache';
import {
    PAPER_TYPE_LABELS,
    RECOMMENDATION_LABELS,
    STATUS_LABELS,
    AUDIT_STATUS_LABELS,
    RECIPE_STATUS_LABELS,
    COST_LEVEL_LABELS,
    INK_TYPE_LABELS,
    FIT_RESULT_LABELS,
    CONCLUSION_LEVEL_LABELS,
    RISK_TYPE_LABELS,
    PAPER_CATEGORY_LABELS,
} from './types';

export const colorQueriesRouter = createTRPCRouter({
    /**
     * 获取单个颜色（基础数据）
     */
    get: publicProcedure.input(getColorSchema).query(async ({ ctx, input }) => {
        const where = input.id
            ? { id: input.id }
            : input.colorId
                ? { colorId: input.colorId }
                : { slug: input.slug };

        const color = await ctx.prisma.color.findUnique({
            where,
            include: {
                batch: true,
                paperProfiles: {
                    orderBy: { paperType: { order: 'asc' } },
                    include: { paperType: true },
                },
            },
        });

        if (!color) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `颜色不存在: ${input.colorId || input.id || input.slug}`,
            });
        }

        return color;
    }),

    /**
     * 获取色彩身份证完整数据（v1.0 规范）
     * 用于 Color Identity 页面展示
     */
    getIdentity: publicProcedure
        .input(
            z.object({
                id: z.string().optional(),
                colorId: z.string().optional(),
                slug: z.string().optional(),
            }).refine((data) => data.id || data.colorId || data.slug, {
                message: '必须提供 id、colorId 或 slug',
            })
        )
        .query(async ({ ctx, input }) => {
            const where = input.id
                ? { id: input.id }
                : input.colorId
                    ? { colorId: input.colorId }
                    : { slug: input.slug };

            // 获取颜色基础数据
            const color = await ctx.prisma.color.findUnique({
                where,
                include: {
                    batch: true,
                    paperProfiles: {
                        orderBy: { paperType: { order: 'asc' } },
                        include: {
                            batch: { select: { batchNo: true } },
                            paperType: true,
                        },
                    },
                    proofingPacks: {
                        where: { isActive: true },
                        orderBy: { paperType: { order: 'asc' } },
                        include: { paperType: true },
                    },
                    paperRecommendations: {
                        include: {
                            paper: true,
                        },
                    },
                    recipes: {
                        include: {
                            ingredients: {
                                orderBy: { order: 'asc' },
                                include: { ink: true },
                            },
                            fitMatrixEntries: {
                                include: {
                                    paper: true,
                                },
                            },
                            testReports: true,
                        },
                    },
                    risks: true,
                },
            });

            if (!color) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `颜色不存在`,
                });
            }

            // 构建返回数据
            return {
                colorId: color.colorId,
                name: color.name,
                slug: color.slug,
                status: color.status,
                statusLabel: STATUS_LABELS[color.status] || color.status,
                version: color.version,
                lastVerifiedAt: color.lastVerifiedAt?.toISOString() || null,

                trueSource: {
                    labL: color.labL,
                    labA: color.labA,
                    labB: color.labB,
                    deltaETolerance: color.deltaETolerance,
                    measurementDevice: color.measurementDevice,
                    measurementStandard: color.measurementStandard,
                    measurementCondition: color.measurementCondition,
                    measuredAt: color.measuredAt.toISOString(),
                    trueSourceNote: color.trueSourceNote,
                },

                audit: {
                    auditStatus: color.auditStatus,
                    auditStatusLabel: AUDIT_STATUS_LABELS[color.auditStatus] || color.auditStatus,
                    auditors: color.auditors,
                    auditNotes: color.auditNotes,
                    lastAuditAt: color.lastAuditAt?.toISOString() || null,
                },

                batch: color.batch
                    ? {
                        batchNo: color.batch.batchNo,
                        type: color.batch.type,
                        instrumentModel: color.batch.instrumentModel,
                        calibratedAt: color.batch.calibratedAt?.toISOString() || null,
                    }
                    : null,

                // 旧模型（向后兼容）- 这里返回空对象，实际数据从 recipes 获取
                inkRecipe: {},

                paperProfiles: color.paperProfiles.map((p) => ({
                    id: p.id,
                    paperType: p.paperType.code,
                    paperTypeLabel: PAPER_TYPE_LABELS[p.paperType.code] || p.paperType.name,
                    labL: p.labL,
                    labA: p.labA,
                    labB: p.labB,
                    deltaE: p.deltaE,
                    glossiness: p.glossiness,
                    inkAbsorption: p.inkAbsorption,
                    gamutCoverage: p.gamutCoverage,
                    scanImageUrl: p.scanImageUrl,
                    recommendation: p.recommendation,
                    recommendationLabel: RECOMMENDATION_LABELS[p.recommendation] || p.recommendation,
                    cautionNote: p.cautionNote,
                    batchNo: p.batch?.batchNo || null,
                })),

                proofingPacks: color.proofingPacks.map((pack) => ({
                    id: pack.id,
                    paperType: pack.paperType.code,
                    paperTypeLabel: PAPER_TYPE_LABELS[pack.paperType.code] || pack.paperType.name,
                    price: pack.price,
                    externalUrl: pack.externalUrl,
                })),

                // 新模型（v1.0 规范）
                paperRecommendations: color.paperRecommendations.map((rec) => ({
                    id: rec.id,
                    paperId: rec.paper.paperId,
                    paperName: rec.paper.name,
                    paperCategory: PAPER_CATEGORY_LABELS[rec.paper.paperCategory] || rec.paper.paperCategory,
                    recommendationType: rec.recommendationType,
                    reason: rec.reason,
                })),

                recipes: color.recipes.map((recipe) => ({
                    id: recipe.id,
                    recipeId: recipe.recipeId,
                    name: recipe.name,
                    status: recipe.status,
                    statusLabel: RECIPE_STATUS_LABELS[recipe.status] || recipe.status,
                    costLevel: recipe.costLevel,
                    costLevelLabel: COST_LEVEL_LABELS[recipe.costLevel] || recipe.costLevel,
                    applicablePapers: recipe.applicablePapers,
                    notes: recipe.notes,
                    ingredients: recipe.ingredients.map((ing) => ({
                        inkName: ing.ink.name,
                        inkType: ing.ink.inkType,
                        inkTypeLabel: INK_TYPE_LABELS[ing.ink.inkType] || ing.ink.inkType,
                        percentage: ing.percentage,
                    })),
                })),

                fitMatrix: color.recipes.flatMap((recipe) =>
                    recipe.fitMatrixEntries.map((entry) => ({
                        id: entry.id,
                        recipeId: recipe.recipeId,
                        recipeName: recipe.name,
                        paperId: entry.paper.paperId,
                        paperName: entry.paper.name,
                        fitResult: entry.fitResult,
                        fitResultLabel: FIT_RESULT_LABELS[entry.fitResult] || entry.fitResult,
                        deltaEResult: entry.deltaEResult,
                        stabilityScore: entry.stabilityScore,
                        issueTags: entry.issueTags,
                        conclusionNote: entry.conclusionNote,
                    }))
                ),

                testReports: color.recipes.flatMap((recipe) =>
                    recipe.testReports.map((report) => ({
                        id: report.id,
                        reportId: report.reportId,
                        recipeName: recipe.name,
                        testedPaperIds: report.testedPaperIds,
                        printerPartner: report.printerPartner,
                        pressModel: report.pressModel,
                        testDate: report.testDate.toISOString(),
                        measurementDevice: report.measurementDevice,
                        conclusionLevel: report.conclusionLevel,
                        conclusionLevelLabel: CONCLUSION_LEVEL_LABELS[report.conclusionLevel] || report.conclusionLevel,
                        summary: report.summary,
                        collabLink: report.collabLink,
                    }))
                ),

                risks: color.risks.map((risk) => ({
                    id: risk.id,
                    riskType: risk.riskType,
                    riskTypeLabel: RISK_TYPE_LABELS[risk.riskType] || risk.riskType,
                    affectedPaperIds: risk.affectedPaperIds,
                    description: risk.description,
                    mitigation: risk.mitigation,
                })),
            };
        }),

    /**
     * 获取颜色列表
     */
    list: publicProcedure.input(listColorsSchema).query(async ({ ctx, input }) => {
        const { cursor, limit, status, search, batchId } = input;

        const where: Prisma.ColorWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (batchId) {
            where.batchId = batchId;
        }

        if (search) {
            where.OR = [
                { colorId: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        const items = await ctx.prisma.color.findMany({
            where,
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { colorId: 'asc' },
            include: {
                batch: {
                    select: { batchNo: true },
                },
                _count: {
                    select: { paperProfiles: true },
                },
            },
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
     * 搜索颜色
     */
    search: publicProcedure
        .input(
            z.object({
                q: z.string().min(1),
                limit: z.number().min(1).max(50).optional().default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const { q, limit } = input;

            const items = await ctx.prisma.color.findMany({
                where: {
                    status: 'VERIFIED',
                    OR: [
                        { colorId: { contains: q, mode: 'insensitive' } },
                        { name: { contains: q, mode: 'insensitive' } },
                    ],
                },
                take: limit,
                orderBy: { colorId: 'asc' },
                select: {
                    id: true,
                    colorId: true,
                    name: true,
                    labL: true,
                    labA: true,
                    labB: true,
                    status: true,
                },
            });

            return items;
        }),

    /**
     * 获取颜色统计（带缓存，10分钟TTL）
     */
    stats: publicProcedure.query(async ({ ctx }) => {
        return withCache(
            CACHE_KEYS.COLOR_STATS,
            async () => {
                const [total, verified, draft, deprecated] = await Promise.all([
                    ctx.prisma.color.count(),
                    ctx.prisma.color.count({ where: { status: 'VERIFIED' } }),
                    ctx.prisma.color.count({ where: { status: 'DRAFT' } }),
                    ctx.prisma.color.count({ where: { status: 'DEPRECATED' } }),
                ]);

                return { total, verified, draft, deprecated };
            },
            { ttl: 600 } // 10 分钟缓存
        );
    }),
});
