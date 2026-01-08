/**
 * 激活码 Router
 *
 * v0.4.0 - Access 阶段
 * 
 * 功能：
 * - 批量生成激活码（管理员）
 * - 激活码列表查询（管理员）
 * - 用户激活
 * - 检查激活码状态
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import {
    generateActivationCodesSchema,
    listActivationCodesSchema,
    activateCodeSchema,
    checkCodeSchema,
    generateActivationCodes,
    getCodeStatus,
} from '@/lib/validations/activation-code';

export const activationCodeRouter = createTRPCRouter({
    // ============================================================================
    // 管理员操作
    // ============================================================================

    /**
     * 批量生成激活码
     */
    generate: adminProcedure
        .input(generateActivationCodesSchema)
        .mutation(async ({ ctx, input }) => {
            const { count, batchLabel, expiresInDays } = input;

            // 计算过期时间
            const expiresAt = expiresInDays
                ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
                : null;

            // 生成唯一的激活码
            const codes = generateActivationCodes(count);

            // 批量插入数据库
            const created = await ctx.prisma.activationCode.createMany({
                data: codes.map(code => ({
                    code,
                    batchLabel,
                    expiresAt,
                })),
            });

            return {
                created: created.count,
                batchLabel,
                expiresAt,
                codes, // 返回生成的激活码列表
            };
        }),

    /**
     * 获取激活码列表
     */
    list: adminProcedure
        .input(listActivationCodesSchema)
        .query(async ({ ctx, input }) => {
            const { batchLabel, status, limit, cursor } = input;

            // 构建查询条件
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const where: any = {};

            if (batchLabel) {
                where.batchLabel = batchLabel;
            }

            if (status === 'unused') {
                where.usedAt = null;
                where.OR = [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ];
            } else if (status === 'used') {
                where.usedAt = { not: null };
            } else if (status === 'expired') {
                where.usedAt = null;
                where.expiresAt = { lt: new Date() };
            }

            const codes = await ctx.prisma.activationCode.findMany({
                where,
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
            });

            let nextCursor: string | undefined;
            if (codes.length > limit) {
                const nextItem = codes.pop();
                nextCursor = nextItem?.id;
            }

            return {
                items: codes.map(code => ({
                    ...code,
                    status: getCodeStatus(code),
                })),
                nextCursor,
            };
        }),

    /**
     * 获取批次列表
     */
    listBatches: adminProcedure.query(async ({ ctx }) => {
        const batches = await ctx.prisma.activationCode.groupBy({
            by: ['batchLabel'],
            _count: { _all: true },
            _min: { createdAt: true },
        });

        // 统计每个批次的使用情况
        const batchStats = await Promise.all(
            batches.map(async (batch) => {
                const [total, used] = await Promise.all([
                    ctx.prisma.activationCode.count({
                        where: { batchLabel: batch.batchLabel },
                    }),
                    ctx.prisma.activationCode.count({
                        where: {
                            batchLabel: batch.batchLabel,
                            usedAt: { not: null },
                        },
                    }),
                ]);

                return {
                    batchLabel: batch.batchLabel,
                    total,
                    used,
                    unused: total - used,
                    createdAt: batch._min.createdAt,
                };
            })
        );

        return batchStats;
    }),

    /**
     * 删除未使用的激活码（按批次）
     */
    deleteBatch: adminProcedure
        .input(z.object({ batchLabel: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.prisma.activationCode.deleteMany({
                where: {
                    batchLabel: input.batchLabel,
                    usedAt: null, // 只删除未使用的
                },
            });

            return { deleted: result.count };
        }),

    /**
     * 统计概览
     */
    stats: adminProcedure.query(async ({ ctx }) => {
        const now = new Date();

        const [total, used, expired, unused] = await Promise.all([
            ctx.prisma.activationCode.count(),
            ctx.prisma.activationCode.count({
                where: { usedAt: { not: null } },
            }),
            ctx.prisma.activationCode.count({
                where: {
                    usedAt: null,
                    expiresAt: { lt: now },
                },
            }),
            ctx.prisma.activationCode.count({
                where: {
                    usedAt: null,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: now } },
                    ],
                },
            }),
        ]);

        return { total, used, expired, unused };
    }),

    // ============================================================================
    // 用户操作
    // ============================================================================

    /**
     * 检查激活码状态（公开）
     */
    check: publicProcedure
        .input(checkCodeSchema)
        .query(async ({ ctx, input }) => {
            const code = await ctx.prisma.activationCode.findUnique({
                where: { code: input.code },
            });

            if (!code) {
                return {
                    valid: false,
                    status: 'not_found' as const,
                    message: '激活码不存在',
                };
            }

            const status = getCodeStatus(code);

            if (status === 'used') {
                return {
                    valid: false,
                    status,
                    message: '激活码已被使用',
                };
            }

            if (status === 'expired') {
                return {
                    valid: false,
                    status,
                    message: '激活码已过期',
                };
            }

            return {
                valid: true,
                status,
                message: '激活码有效',
                batchLabel: code.batchLabel,
                expiresAt: code.expiresAt,
            };
        }),

    /**
     * 激活（需要登录）
     */
    activate: protectedProcedure
        .input(activateCodeSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 查找激活码
            const code = await ctx.prisma.activationCode.findUnique({
                where: { code: input.code },
            });

            if (!code) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '激活码不存在',
                });
            }

            // 检查状态
            const status = getCodeStatus(code);

            if (status === 'used') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '激活码已被使用',
                });
            }

            if (status === 'expired') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '激活码已过期',
                });
            }

            // 检查用户是否已经是 VERIFIED 或更高等级
            const user = await ctx.prisma.user.findUnique({
                where: { id: userId },
                select: { tier: true },
            });

            if (user?.tier === 'VERIFIED' || user?.tier === 'PAID') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '您的账户已经激活，无需重复激活',
                });
            }

            // 事务：使用激活码 + 升级用户等级
            await ctx.prisma.$transaction([
                // 标记激活码已使用
                ctx.prisma.activationCode.update({
                    where: { id: code.id },
                    data: {
                        usedById: userId,
                        usedAt: new Date(),
                    },
                }),
                // 升级用户等级
                ctx.prisma.user.update({
                    where: { id: userId },
                    data: { tier: 'VERIFIED' },
                }),
            ]);

            return {
                success: true,
                message: '激活成功！您的账户已升级为已验证用户',
                newTier: 'VERIFIED',
            };
        }),

    /**
     * 获取当前用户的激活状态
     */
    myStatus: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            select: { tier: true },
        });

        // 查找用户使用过的激活码
        const usedCode = await ctx.prisma.activationCode.findFirst({
            where: { usedById: ctx.session.user.id },
            select: {
                code: true,
                batchLabel: true,
                usedAt: true,
            },
        });

        return {
            tier: user?.tier || 'FREE',
            isVerified: user?.tier === 'VERIFIED' || user?.tier === 'PAID',
            usedCode: usedCode
                ? {
                    code: usedCode.code.substring(0, 12) + '****', // 部分隐藏
                    batchLabel: usedCode.batchLabel,
                    usedAt: usedCode.usedAt,
                }
                : null,
        };
    }),
});

