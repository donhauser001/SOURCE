/**
 * 系统配置 Router
 * 
 * 管理系统级配置项
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, adminProcedure, protectedProcedure } from '../trpc';
import { logAdminAction, AUDIT_TARGET_TYPES } from '@/lib/admin-audit';

// 配置分类
export const CONFIG_CATEGORIES = {
    GENERAL: 'general',           // 通用配置
    RATE_LIMIT: 'rate-limit',     // 限流配置
    STORAGE: 'storage',           // 存储配置
    EMAIL: 'email',               // 邮件配置
} as const;

// 预定义的配置键
export const CONFIG_KEYS = {
    // 通用
    SITE_NAME: 'site.name',
    SITE_LOGO_URL: 'site.logoUrl',
    CONTACT_EMAIL: 'site.contactEmail',
    MAINTENANCE_MODE: 'site.maintenanceMode',
    
    // 限流
    API_DEFAULT_RATE_LIMIT_PER_MINUTE: 'rateLimit.defaultPerMinute',
    API_DEFAULT_RATE_LIMIT_PER_DAY: 'rateLimit.defaultPerDay',
    
    // 存储
    IMPORT_MAX_FILE_SIZE_MB: 'storage.importMaxFileSizeMB',
    EXPORT_MAX_RECORDS: 'storage.exportMaxRecords',
} as const;

// 配置值类型
type ConfigValue = string | number | boolean | Record<string, unknown>;

export const systemConfigRouter = createTRPCRouter({
    /**
     * 获取单个配置
     */
    get: protectedProcedure
        .input(z.object({ key: z.string() }))
        .query(async ({ ctx, input }) => {
            const config = await ctx.prisma.systemConfig.findUnique({
                where: { key: input.key },
            });

            if (!config) {
                return null;
            }

            return {
                key: config.key,
                value: config.value as ConfigValue,
                category: config.category,
            };
        }),

    /**
     * 获取多个配置
     */
    getMany: protectedProcedure
        .input(z.object({ keys: z.array(z.string()) }))
        .query(async ({ ctx, input }) => {
            const configs = await ctx.prisma.systemConfig.findMany({
                where: { key: { in: input.keys } },
            });

            const result: Record<string, ConfigValue> = {};
            for (const config of configs) {
                result[config.key] = config.value as ConfigValue;
            }

            return result;
        }),

    /**
     * 获取某分类下的所有配置
     */
    listByCategory: adminProcedure
        .input(z.object({ category: z.string() }))
        .query(async ({ ctx, input }) => {
            const configs = await ctx.prisma.systemConfig.findMany({
                where: { category: input.category },
                orderBy: { key: 'asc' },
            });

            return configs.map((c) => ({
                key: c.key,
                value: c.value as ConfigValue,
                category: c.category,
                updatedAt: c.updatedAt,
            }));
        }),

    /**
     * 获取所有配置
     */
    list: adminProcedure.query(async ({ ctx }) => {
        const configs = await ctx.prisma.systemConfig.findMany({
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });

        return configs.map((c) => ({
            id: c.id,
            key: c.key,
            value: c.value as ConfigValue,
            category: c.category,
            updatedAt: c.updatedAt,
        }));
    }),

    /**
     * 设置配置
     */
    set: adminProcedure
        .input(
            z.object({
                key: z.string().min(1).max(100),
                value: z.unknown(),
                category: z.string().min(1).max(50),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { key, value, category } = input;

            // 获取旧值
            const existing = await ctx.prisma.systemConfig.findUnique({
                where: { key },
            });

            // 更新或创建
            const config = await ctx.prisma.systemConfig.upsert({
                where: { key },
                create: {
                    key,
                    value: value as object,
                    category,
                },
                update: {
                    value: value as object,
                    category,
                },
            });

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: existing ? 'UPDATE' : 'CREATE',
                targetType: AUDIT_TARGET_TYPES.SYSTEM_CONFIG,
                targetId: config.id,
                changes: {
                    before: existing ? { value: existing.value } : null,
                    after: { value },
                },
                metadata: { key, category },
            });

            return {
                key: config.key,
                value: config.value as ConfigValue,
                category: config.category,
            };
        }),

    /**
     * 批量设置配置
     */
    setMany: adminProcedure
        .input(
            z.object({
                configs: z.array(
                    z.object({
                        key: z.string().min(1).max(100),
                        value: z.unknown(),
                        category: z.string().min(1).max(50),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { configs } = input;

            // 获取所有旧值
            const existingConfigs = await ctx.prisma.systemConfig.findMany({
                where: { key: { in: configs.map((c) => c.key) } },
            });
            const existingMap = new Map(existingConfigs.map((c) => [c.key, c]));

            // 使用事务批量更新
            const results = await ctx.prisma.$transaction(
                configs.map((config) =>
                    ctx.prisma.systemConfig.upsert({
                        where: { key: config.key },
                        create: {
                            key: config.key,
                            value: config.value as object,
                            category: config.category,
                        },
                        update: {
                            value: config.value as object,
                            category: config.category,
                        },
                    })
                )
            );

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'UPDATE',
                targetType: AUDIT_TARGET_TYPES.SYSTEM_CONFIG,
                targetId: null,
                changes: {
                    before: Object.fromEntries(
                        existingConfigs.map((c) => [c.key, c.value])
                    ),
                    after: Object.fromEntries(configs.map((c) => [c.key, c.value])),
                },
                metadata: { batchUpdate: true, count: configs.length },
            });

            return results.map((r) => ({
                key: r.key,
                value: r.value as ConfigValue,
                category: r.category,
            }));
        }),

    /**
     * 删除配置
     */
    delete: adminProcedure
        .input(z.object({ key: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.prisma.systemConfig.findUnique({
                where: { key: input.key },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '配置不存在',
                });
            }

            await ctx.prisma.systemConfig.delete({
                where: { key: input.key },
            });

            // 记录审计日志
            await logAdminAction({
                userId: ctx.session.user.id,
                userEmail: ctx.session.user.email ?? '',
                action: 'DELETE',
                targetType: AUDIT_TARGET_TYPES.SYSTEM_CONFIG,
                targetId: existing.id,
                changes: {
                    before: { key: input.key, value: existing.value },
                },
            });

            return { success: true };
        }),
});
