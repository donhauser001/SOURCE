/**
 * API Key 鉴权中间件
 *
 * 用于 CLI/插件/AI 等外部调用的认证
 */

import { TRPCError } from '@trpc/server';
import { validateApiKey, extractApiKeyFromHeader, type ApiKeyContext } from '@/lib/apikey';
import { hasScope, type Scope } from '@/lib/scopes';
import { logAudit } from '@/lib/audit';

/**
 * 验证 API Key 并返回上下文
 */
export async function authenticateApiKey(authHeader: string | null): Promise<ApiKeyContext> {
    const key = extractApiKeyFromHeader(authHeader);

    if (!key) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Missing API key',
        });
    }

    try {
        const apiKey = await validateApiKey(key);

        return {
            apiKeyId: apiKey.id,
            userId: apiKey.ownerUserId,
            scopes: apiKey.scopes,
            role: apiKey.role,
            rateLimitPolicy: apiKey.rateLimitPolicy
                ? {
                    requestsPerMinute: apiKey.rateLimitPolicy.requestsPerMinute,
                    requestsPerDay: apiKey.rateLimitPolicy.requestsPerDay,
                }
                : null,
        };
    } catch (error: any) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message || 'Invalid API key',
        });
    }
}

/**
 * 检查 API Key 是否有指定权限
 */
export function requireScope(apiKeyContext: ApiKeyContext, scope: Scope): void {
    if (!hasScope(apiKeyContext.scopes, scope)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Insufficient scope. Required: ${scope}`,
        });
    }
}

/**
 * 创建需要特定权限的中间件
 */
export function createScopeMiddleware(requiredScope: Scope) {
    return async ({ ctx, next }: { ctx: { apiKey?: ApiKeyContext }; next: () => Promise<any> }) => {
        if (!ctx.apiKey) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'API key required',
            });
        }

        requireScope(ctx.apiKey, requiredScope);

        return next();
    };
}

/**
 * 简单的内存限流（生产环境应使用 Redis）
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(apiKeyId: string, limit: number, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = `${apiKeyId}:${Math.floor(now / windowMs)}`;

    const record = rateLimitStore.get(key);

    if (!record || record.resetAt < now) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count++;
    return true;
}

/**
 * 获取限流详细信息（用于响应头）
 */
export function getRateLimitInfo(
    apiKeyId: string,
    limit: number,
    windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const key = `${apiKeyId}:${Math.floor(now / windowMs)}`;

    const record = rateLimitStore.get(key);

    if (!record || record.resetAt < now) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return {
            allowed: true,
            remaining: limit - 1,
            resetAt: now + windowMs,
        };
    }

    if (record.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: record.resetAt,
        };
    }

    record.count++;
    return {
        allowed: true,
        remaining: limit - record.count,
        resetAt: record.resetAt,
    };
}

/**
 * 清理过期的限流记录
 */
export function cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (record.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
}

// 每分钟清理一次
setInterval(cleanupRateLimitStore, 60000);

