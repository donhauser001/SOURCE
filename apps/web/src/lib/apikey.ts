/**
 * API 密钥工具函数
 *
 * 安全原则：
 * - 不存储明文密钥
 * - 只存储 SHA256 哈希
 * - 前缀用于识别
 */

import { createHash, randomBytes } from 'crypto';
import { prisma } from './db';
import { Errors } from './errors';
import type { Scope } from './scopes';

/**
 * 生成新的 API 密钥
 * @returns { key: string, keyHash: string, keyPrefix: string }
 */
export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
    // 生成 32 字节随机数
    const randomPart = randomBytes(32).toString('base64url');

    // 完整密钥格式: sk_source_<random>
    const key = `sk_source_${randomPart}`;

    // 前缀用于识别（前 12 字符）
    const keyPrefix = key.substring(0, 12);

    // 存储哈希
    const keyHash = createHash('sha256').update(key).digest('hex');

    return { key, keyHash, keyPrefix };
}

/**
 * 哈希 API 密钥
 */
export function hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
}

/**
 * 验证 API 密钥并返回密钥信息
 */
export async function validateApiKey(key: string) {
    if (!key || !key.startsWith('sk_source_')) {
        throw Errors.invalidApiKey();
    }

    const keyHash = hashApiKey(key);

    const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: {
            ownerUser: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    tier: true,
                },
            },
            rateLimitPolicy: true,
        },
    });

    if (!apiKey) {
        throw Errors.invalidApiKey();
    }

    if (apiKey.revokedAt) {
        throw Errors.revokedApiKey();
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        throw Errors.expiredApiKey();
    }

    // 更新最后使用时间
    await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
    });

    return apiKey;
}

/**
 * 检查 API 密钥是否有指定权限
 */
export function checkApiKeyScope(apiKeyScopes: string[], requiredScope: Scope): boolean {
    return apiKeyScopes.includes(requiredScope);
}

/**
 * API 密钥上下文（用于请求处理）
 */
export interface ApiKeyContext {
    apiKeyId: string;
    userId: string | null;
    scopes: string[];
    role: string;
    rateLimitPolicy: {
        requestsPerMinute: number;
        requestsPerDay: number;
    } | null;
}

/**
 * 从请求头提取 API 密钥
 */
export function extractApiKeyFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;

    // 支持 Bearer token 格式
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // 支持直接传递密钥
    if (authHeader.startsWith('sk_source_')) {
        return authHeader;
    }

    return null;
}

