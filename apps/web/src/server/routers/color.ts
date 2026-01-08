/**
 * 色彩 Router
 *
 * 色彩身份证的完整 CRUD
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc';
import {
    createColorSchema,
    updateColorSchema,
    listColorsSchema,
    getColorSchema,
    createPaperProfileSchema,
    updatePaperProfileSchema,
    listPaperProfilesSchema,
    ColorStatusEnum,
    PaperTypeEnum,
} from '@/lib/validations/color';

export const colorRouter = createTRPCRouter({
    // ============================================================================
    // 查询
    // ============================================================================

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
                    orderBy: { paperType: 'asc' },
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
                        orderBy: { paperType: 'asc' },
                        include: {
                            batch: { select: { batchNo: true } },
                        },
                    },
                    proofingPacks: {
                        where: { isActive: true },
                        orderBy: { paperType: 'asc' },
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

            // 纸张类型标签映射
            const paperTypeLabels: Record<string, string> = {
                PREMIUM_MATTE: '高阶映画',
                UNCOATED: '纯质纸',
                COATED: '铜版纸',
                OFFSET: '双胶纸',
                LIGHTWEIGHT: '轻型纸',
            };

            // 推荐等级标签映射
            const recommendationLabels: Record<string, string> = {
                BEST: '最佳拍档',
                GOOD: '表现良好',
                CAUTION: '需注意',
                AVOID: '建议慎用',
            };

            // 颜色状态标签映射
            const statusLabels: Record<string, string> = {
                ACTIVE: '激活',
                DEPRECATED: '已废弃',
                EXPERIMENTAL: '实验中',
                DRAFT: '草稿',
                VERIFIED: '已验证',
            };

            // 审计状态标签映射
            const auditStatusLabels: Record<string, string> = {
                VERIFIED: '已验证',
                UNDER_REVIEW: '审核中',
            };

            // 配方状态标签映射
            const recipeStatusLabels: Record<string, string> = {
                EXPERIMENTAL: '实验中',
                VERIFIED: '已验证',
                DEPRECATED: '已废弃',
            };

            // 成本等级标签映射
            const costLevelLabels: Record<string, string> = {
                LOW: '低',
                MEDIUM: '中',
                HIGH: '高',
            };

            // 油墨类型标签映射
            const inkTypeLabels: Record<string, string> = {
                BASE: '基础色',
                SPOT: '专色',
                EXTENDER: '冲淡剂',
            };

            // 适配结果标签映射
            const fitResultLabels: Record<string, string> = {
                RECOMMENDED: '推荐',
                USABLE: '可用',
                NOT_RECOMMENDED: '不推荐',
            };

            // 结论等级标签映射
            const conclusionLevelLabels: Record<string, string> = {
                PASS: '通过',
                CONDITIONAL: '有条件通过',
                FAIL: '不通过',
            };

            // 风险类型标签映射
            const riskTypeLabels: Record<string, string> = {
                COLOR_SHIFT: '色偏',
                GRAYING: '发灰',
                DOT_LOSS: '绝网',
                UNSTABLE: '不稳定',
            };

            // 纸张类别标签映射
            const paperCategoryLabels: Record<string, string> = {
                COATED: '涂布',
                UNCOATED: '非涂布',
                SPECIALTY: '特种',
            };

            // 构建返回数据
            return {
                colorId: color.colorId,
                name: color.name,
                slug: color.slug,
                status: color.status,
                statusLabel: statusLabels[color.status] || color.status,
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
                    auditStatusLabel: auditStatusLabels[color.auditStatus] || color.auditStatus,
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
                    paperType: p.paperType,
                    paperTypeLabel: paperTypeLabels[p.paperType] || p.paperType,
                    labL: p.labL,
                    labA: p.labA,
                    labB: p.labB,
                    deltaE: p.deltaE,
                    glossiness: p.glossiness,
                    inkAbsorption: p.inkAbsorption,
                    gamutCoverage: p.gamutCoverage,
                    scanImageUrl: p.scanImageUrl,
                    recommendation: p.recommendation,
                    recommendationLabel: recommendationLabels[p.recommendation] || p.recommendation,
                    cautionNote: p.cautionNote,
                    batchNo: p.batch?.batchNo || null,
                })),

                proofingPacks: color.proofingPacks.map((pack) => ({
                    id: pack.id,
                    paperType: pack.paperType,
                    paperTypeLabel: paperTypeLabels[pack.paperType] || pack.paperType,
                    price: pack.price,
                    externalUrl: pack.externalUrl,
                })),

                // 新模型（v1.0 规范）
                paperRecommendations: color.paperRecommendations.map((rec) => ({
                    id: rec.id,
                    paperId: rec.paper.paperId,
                    paperName: rec.paper.name,
                    paperCategory: paperCategoryLabels[rec.paper.paperCategory] || rec.paper.paperCategory,
                    recommendationType: rec.recommendationType,
                    reason: rec.reason,
                })),

                recipes: color.recipes.map((recipe) => ({
                    id: recipe.id,
                    recipeId: recipe.recipeId,
                    name: recipe.name,
                    status: recipe.status,
                    statusLabel: recipeStatusLabels[recipe.status] || recipe.status,
                    costLevel: recipe.costLevel,
                    costLevelLabel: costLevelLabels[recipe.costLevel] || recipe.costLevel,
                    applicablePapers: recipe.applicablePapers,
                    notes: recipe.notes,
                    ingredients: recipe.ingredients.map((ing) => ({
                        inkName: ing.inkName,
                        inkType: ing.inkType,
                        inkTypeLabel: inkTypeLabels[ing.inkType] || ing.inkType,
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
                        fitResultLabel: fitResultLabels[entry.fitResult] || entry.fitResult,
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
                        conclusionLevelLabel: conclusionLevelLabels[report.conclusionLevel] || report.conclusionLevel,
                        summary: report.summary,
                        collabLink: report.collabLink,
                    }))
                ),

                risks: color.risks.map((risk) => ({
                    id: risk.id,
                    riskType: risk.riskType,
                    riskTypeLabel: riskTypeLabels[risk.riskType] || risk.riskType,
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

        const where: any = {};

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
     * 获取颜色统计
     */
    stats: publicProcedure.query(async ({ ctx }) => {
        const [total, verified, draft, deprecated] = await Promise.all([
            ctx.prisma.color.count(),
            ctx.prisma.color.count({ where: { status: 'VERIFIED' } }),
            ctx.prisma.color.count({ where: { status: 'DRAFT' } }),
            ctx.prisma.color.count({ where: { status: 'DEPRECATED' } }),
        ]);

        return { total, verified, draft, deprecated };
    }),

    // ============================================================================
    // 管理员查询
    // ============================================================================

    /**
     * 管理员：获取色彩列表（含更多信息）
     */
    adminList: adminProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(200).default(50),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, cursor } = input;

            const items = await ctx.prisma.color.findMany({
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    colorId: true,
                    name: true,
                    slug: true,
                    labL: true,
                    labA: true,
                    labB: true,
                    status: true,
                    auditStatus: true,
                    createdAt: true,
                    _count: {
                        select: {
                            recipes: true,
                            paperProfiles: true,
                            participations: true,
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
                items,
                nextCursor,
            };
        }),

    /**
     * 管理员：批量删除色彩
     */
    adminBatchDelete: adminProcedure
        .input(z.object({ ids: z.array(z.string()).min(1) }))
        .mutation(async ({ ctx, input }) => {
            const { ids } = input;

            // 检查是否有关联数据
            const colorsWithDeps = await ctx.prisma.color.findMany({
                where: { id: { in: ids } },
                include: {
                    _count: {
                        select: {
                            proofingPacks: true,
                            recipes: true,
                        },
                    },
                },
            });

            const hasProofingPacks = colorsWithDeps.some((c) => c._count.proofingPacks > 0);
            if (hasProofingPacks) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: '部分色彩有关联的打样包，无法删除',
                });
            }

            // 删除关联的 paperProfiles
            await ctx.prisma.paperProfile.deleteMany({
                where: { colorId: { in: ids } },
            });

            // 删除色彩
            const result = await ctx.prisma.color.deleteMany({
                where: { id: { in: ids } },
            });

            return { deleted: result.count };
        }),

    // ============================================================================
    // 创建 / 更新 / 删除（需要管理员权限）
    // ============================================================================

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

            return { success: true };
        }),

    // ============================================================================
    // PaperProfile 子路由
    // ============================================================================

    paperProfile: createTRPCRouter({
        /**
         * 获取颜色的所有纸张表现
         */
        list: publicProcedure.input(listPaperProfilesSchema).query(async ({ ctx, input }) => {
            const where: any = {};

            if (input.colorId) {
                where.colorId = input.colorId;
            }
            if (input.paperType) {
                where.paperType = input.paperType;
            }
            if (input.recommendation) {
                where.recommendation = input.recommendation;
            }

            const items = await ctx.prisma.paperProfile.findMany({
                where,
                take: input.limit,
                orderBy: [{ recommendation: 'asc' }, { paperType: 'asc' }],
                include: {
                    color: {
                        select: { colorId: true, name: true },
                    },
                    batch: {
                        select: { batchNo: true },
                    },
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
                // 获取颜色的真源 Lab
                const color = await ctx.prisma.color.findUnique({
                    where: { id: input.colorId },
                    select: { labL: true, labA: true, labB: true },
                });

                if (!color) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: `颜色不存在`,
                    });
                }

                // 检查是否已存在该纸张类型
                const existing = await ctx.prisma.paperProfile.findUnique({
                    where: {
                        colorId_paperType: {
                            colorId: input.colorId,
                            paperType: input.paperType,
                        },
                    },
                });

                if (existing) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: `该颜色的 ${input.paperType} 纸张数据已存在`,
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
    }),
});

/**
 * 计算 ΔE (CIE76)
 * 简化版色差计算
 */
function calculateDeltaE(
    source: { L: number; a: number; b: number },
    target: { L: number; a: number; b: number }
): number {
    const dL = target.L - source.L;
    const da = target.a - source.a;
    const db = target.b - source.b;
    return Math.sqrt(dL * dL + da * da + db * db);
}
