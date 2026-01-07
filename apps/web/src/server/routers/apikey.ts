/**
 * API 密钥管理 Router
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateApiKey } from '@/lib/apikey';
import { SCOPES, ROLE_SCOPES, type Scope } from '@/lib/scopes';
import { ApiKeyRole } from '@prisma/client';

// 前端角色名到数据库枚举的映射
const ROLE_MAP: Record<string, ApiKeyRole> = {
    'ai-readonly': ApiKeyRole.READONLY,
    'ai-full': ApiKeyRole.READONLY, // 使用 READONLY，通过 scopes 区分
    'plugin-free': ApiKeyRole.PLUGIN_FREE,
    'plugin-paid': ApiKeyRole.PLUGIN_PAID,
};

export const apikeyRouter = createTRPCRouter({
    /**
     * 获取当前用户的 API 密钥列表
     */
    list: protectedProcedure.query(async ({ ctx }) => {
        const apiKeys = await ctx.prisma.apiKey.findMany({
            where: { ownerUserId: ctx.session.user.id },
            select: {
                id: true,
                keyPrefix: true,
                name: true,
                scopes: true,
                role: true,
                lastUsedAt: true,
                expiresAt: true,
                revokedAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return apiKeys;
    }),

    /**
     * 创建新的 API 密钥
     */
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                role: z.enum(['ai-readonly', 'ai-full', 'plugin-free', 'plugin-paid']).default('ai-readonly'),
                expiresInDays: z.number().min(1).max(365).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { name, role, expiresInDays } = input;

            // 生成密钥
            const { key, keyHash, keyPrefix } = generateApiKey();

            // 获取角色对应的权限
            const scopes = ROLE_SCOPES[role] || [];

            // 映射到数据库角色
            const dbRole = ROLE_MAP[role] || ApiKeyRole.READONLY;

            // 计算过期时间
            const expiresAt = expiresInDays
                ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
                : null;

            // 获取默认限流策略
            const defaultPolicy = await ctx.prisma.rateLimitPolicy.findFirst({
                where: { name: '标准' },
            });

            // 创建密钥记录
            const apiKey = await ctx.prisma.apiKey.create({
                data: {
                    keyHash,
                    keyPrefix,
                    name,
                    scopes,
                    role: dbRole,
                    ownerUserId: ctx.session.user.id,
                    rateLimitPolicyId: defaultPolicy?.id,
                    expiresAt,
                },
                select: {
                    id: true,
                    keyPrefix: true,
                    name: true,
                    scopes: true,
                    role: true,
                    expiresAt: true,
                    createdAt: true,
                },
            });

            // 返回完整密钥（仅此一次）
            return {
                ...apiKey,
                key, // 只在创建时返回完整密钥
            };
        }),

    /**
     * 撤销 API 密钥
     */
    revoke: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const apiKey = await ctx.prisma.apiKey.findFirst({
                where: {
                    id: input.id,
                    ownerUserId: ctx.session.user.id,
                },
            });

            if (!apiKey) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'API 密钥不存在',
                });
            }

            if (apiKey.revokedAt) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'API 密钥已被撤销',
                });
            }

            await ctx.prisma.apiKey.update({
                where: { id: input.id },
                data: { revokedAt: new Date() },
            });

            return { success: true };
        }),

    /**
     * 删除 API 密钥
     */
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const apiKey = await ctx.prisma.apiKey.findFirst({
                where: {
                    id: input.id,
                    ownerUserId: ctx.session.user.id,
                },
            });

            if (!apiKey) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'API 密钥不存在',
                });
            }

            await ctx.prisma.apiKey.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    /**
     * 获取可用的权限范围
     */
    getAvailableScopes: protectedProcedure.query(() => {
        return {
            scopes: SCOPES,
            roles: Object.entries(ROLE_SCOPES).map(([role, scopes]) => ({
                role,
                scopes,
                description: getRoleDescription(role),
            })),
        };
    }),

    // ===== 管理员接口 =====

    /**
     * 管理员：获取所有 API 密钥
     */
    adminList: adminProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().optional(),
                userId: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, cursor, userId } = input;

            const apiKeys = await ctx.prisma.apiKey.findMany({
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                where: userId ? { ownerUserId: userId } : undefined,
                include: {
                    ownerUser: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                    rateLimitPolicy: {
                        select: {
                            name: true,
                            requestsPerMinute: true,
                            requestsPerDay: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            let nextCursor: string | undefined = undefined;
            if (apiKeys.length > limit) {
                const nextItem = apiKeys.pop();
                nextCursor = nextItem?.id;
            }

            return {
                items: apiKeys,
                nextCursor,
            };
        }),

    /**
     * 管理员：撤销任意 API 密钥
     */
    adminRevoke: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const apiKey = await ctx.prisma.apiKey.findUnique({
                where: { id: input.id },
            });

            if (!apiKey) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'API 密钥不存在',
                });
            }

            await ctx.prisma.apiKey.update({
                where: { id: input.id },
                data: { revokedAt: new Date() },
            });

            return { success: true };
        }),
});

/**
 * 获取角色描述
 */
function getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
        'ai-readonly': 'AI 只读 - 仅可读取色彩和纸张数据',
        'ai-full': 'AI 完整 - 可读取数据、估算成本、分析工程',
        'plugin-free': '插件免费版 - 基础色彩查询',
        'plugin-paid': '插件付费版 - 完整色彩数据和推荐',
        admin: '管理员 - 完整权限',
    };
    return descriptions[role] || role;
}

