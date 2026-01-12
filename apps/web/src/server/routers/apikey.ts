/**
 * API 密钥管理 Router
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateApiKey } from '@/lib/apikey';
import { SCOPES, ROLE_SCOPES, type Scope } from '@/lib/scopes';
import { ApiKeyRole } from '@prisma/client';
import { logAdminAction, AUDIT_TARGET_TYPES } from '@/lib/admin-audit';

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
                include: { ownerUser: { select: { email: true } } },
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

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'STATUS_CHANGE',
                targetType: AUDIT_TARGET_TYPES.API_KEY,
                targetId: input.id,
                changes: {
                    before: { revokedAt: null },
                    after: { revokedAt: new Date().toISOString() },
                },
                metadata: { keyPrefix: apiKey.keyPrefix, ownerEmail: apiKey.ownerUser?.email },
            });

            return { success: true };
        }),

    /**
     * 管理员：为指定用户生成 API 密钥
     */
    adminCreate: adminProcedure
        .input(
            z.object({
                userId: z.string(),
                name: z.string().min(1).max(100),
                role: z.enum(['ai-readonly', 'ai-full', 'plugin-free', 'plugin-paid']).default('ai-readonly'),
                expiresInDays: z.number().min(1).max(365).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { userId, name, role, expiresInDays } = input;

            // 验证用户存在
            const user = await ctx.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, name: true, isActive: true },
            });

            if (!user) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用户不存在',
                });
            }

            if (!user.isActive) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '无法为已禁用的用户生成密钥',
                });
            }

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
                    ownerUserId: userId,
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

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'CREATE',
                targetType: AUDIT_TARGET_TYPES.API_KEY,
                targetId: apiKey.id,
                changes: {
                    after: {
                        keyPrefix: apiKey.keyPrefix,
                        name: apiKey.name,
                        role: apiKey.role,
                        ownerUserId: userId,
                    },
                },
                metadata: { forUserEmail: user.email },
            });

            // 返回完整密钥（仅此一次）
            return {
                ...apiKey,
                key,
                user: { id: user.id, email: user.email, name: user.name },
            };
        }),

    /**
     * 管理员：重新颁发 API 密钥（撤销旧密钥 + 生成新密钥）
     */
    adminReissue: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const oldApiKey = await ctx.prisma.apiKey.findUnique({
                where: { id: input.id },
                include: {
                    ownerUser: { select: { id: true, email: true, name: true, isActive: true } },
                    rateLimitPolicy: true,
                },
            });

            if (!oldApiKey) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'API 密钥不存在',
                });
            }

            if (oldApiKey.ownerUser && !oldApiKey.ownerUser.isActive) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '无法为已禁用的用户重新颁发密钥',
                });
            }

            // 生成新密钥
            const { key, keyHash, keyPrefix } = generateApiKey();

            // 使用事务：撤销旧密钥 + 创建新密钥
            const newApiKey = await ctx.prisma.$transaction(async (tx) => {
                // 撤销旧密钥
                await tx.apiKey.update({
                    where: { id: input.id },
                    data: { revokedAt: new Date() },
                });

                // 创建新密钥，继承旧密钥的配置
                return tx.apiKey.create({
                    data: {
                        keyHash,
                        keyPrefix,
                        name: oldApiKey.name,
                        scopes: oldApiKey.scopes,
                        role: oldApiKey.role,
                        ownerUserId: oldApiKey.ownerUserId,
                        rateLimitPolicyId: oldApiKey.rateLimitPolicyId,
                        expiresAt: oldApiKey.expiresAt,
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
            });

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'UPDATE',
                targetType: AUDIT_TARGET_TYPES.API_KEY,
                targetId: newApiKey.id,
                changes: {
                    before: { id: input.id, keyPrefix: oldApiKey.keyPrefix },
                    after: { id: newApiKey.id, keyPrefix: newApiKey.keyPrefix },
                },
                metadata: {
                    action: 'reissue',
                    oldKeyId: input.id,
                    ownerEmail: oldApiKey.ownerUser?.email,
                },
            });

            return {
                ...newApiKey,
                key,
                user: oldApiKey.ownerUser ? {
                    id: oldApiKey.ownerUser.id,
                    email: oldApiKey.ownerUser.email,
                    name: oldApiKey.ownerUser.name,
                } : null,
            };
        }),

    /**
     * 管理员：搜索用户（用于选择密钥所有者）
     */
    adminSearchUsers: adminProcedure
        .input(z.object({ search: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
            const users = await ctx.prisma.user.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { email: { contains: input.search, mode: 'insensitive' } },
                        { name: { contains: input.search, mode: 'insensitive' } },
                    ],
                },
                take: 10,
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
                orderBy: { email: 'asc' },
            });

            return users;
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

