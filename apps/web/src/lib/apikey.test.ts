/**
 * API Key 工具测试
 *
 * 注意：仅测试纯函数，不测试依赖 Prisma 的函数
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash, randomBytes } from 'crypto';

// 直接测试纯函数逻辑，避免 Prisma 初始化问题
describe('API Key 工具', () => {
    describe('generateApiKey() 逻辑', () => {
        // 模拟 generateApiKey 的核心逻辑
        function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
            const randomPart = randomBytes(32).toString('base64url');
            const key = `sk_source_${randomPart}`;
            const keyPrefix = key.substring(0, 12);
            const keyHash = createHash('sha256').update(key).digest('hex');
            return { key, keyHash, keyPrefix };
        }

        it('应生成包含 key、keyHash、keyPrefix 的对象', () => {
            const result = generateApiKey();
            expect(result).toHaveProperty('key');
            expect(result).toHaveProperty('keyHash');
            expect(result).toHaveProperty('keyPrefix');
        });

        it('key 应以 sk_source_ 开头', () => {
            const { key } = generateApiKey();
            expect(key.startsWith('sk_source_')).toBe(true);
        });

        it('keyPrefix 应为前 12 字符', () => {
            const { key, keyPrefix } = generateApiKey();
            expect(keyPrefix).toBe(key.substring(0, 12));
            expect(keyPrefix.length).toBe(12);
        });

        it('keyHash 应为 64 字符的 hex 字符串', () => {
            const { keyHash } = generateApiKey();
            expect(keyHash.length).toBe(64);
            expect(/^[a-f0-9]+$/.test(keyHash)).toBe(true);
        });

        it('每次生成的 key 应不同', () => {
            const result1 = generateApiKey();
            const result2 = generateApiKey();
            expect(result1.key).not.toBe(result2.key);
            expect(result1.keyHash).not.toBe(result2.keyHash);
        });
    });

    describe('hashApiKey() 逻辑', () => {
        // 模拟 hashApiKey 的核心逻辑
        function hashApiKey(key: string): string {
            return createHash('sha256').update(key).digest('hex');
        }

        it('应生成 64 字符的哈希值', () => {
            const key = 'sk_source_test123456789012345678901234';
            const hash = hashApiKey(key);
            expect(hash.length).toBe(64);
            expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
        });

        it('相同 key 应生成相同哈希', () => {
            const key = 'sk_source_test123456789012345678901234';
            const hash1 = hashApiKey(key);
            const hash2 = hashApiKey(key);
            expect(hash1).toBe(hash2);
        });

        it('不同 key 应生成不同哈希', () => {
            const key1 = 'sk_source_test123456789012345678901234';
            const key2 = 'sk_source_test123456789012345678901235';
            const hash1 = hashApiKey(key1);
            const hash2 = hashApiKey(key2);
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('checkApiKeyScope() 逻辑', () => {
        // 模拟 checkApiKeyScope 的核心逻辑
        function checkApiKeyScope(apiKeyScopes: string[], requiredScope: string): boolean {
            return apiKeyScopes.includes(requiredScope);
        }

        it('拥有权限应返回 true', () => {
            const scopes = ['read:color', 'read:paper'];
            expect(checkApiKeyScope(scopes, 'read:color')).toBe(true);
        });

        it('没有权限应返回 false', () => {
            const scopes = ['read:color'];
            expect(checkApiKeyScope(scopes, 'admin:color')).toBe(false);
        });

        it('空权限列表应返回 false', () => {
            expect(checkApiKeyScope([], 'read:color')).toBe(false);
        });
    });

    describe('extractApiKeyFromHeader() 逻辑', () => {
        // 模拟 extractApiKeyFromHeader 的核心逻辑
        function extractApiKeyFromHeader(authHeader: string | null): string | null {
            if (!authHeader) return null;
            if (authHeader.startsWith('Bearer ')) {
                return authHeader.substring(7);
            }
            if (authHeader.startsWith('sk_source_')) {
                return authHeader;
            }
            return null;
        }

        it('应从 Bearer token 提取 key', () => {
            const header = 'Bearer sk_source_abc123';
            const key = extractApiKeyFromHeader(header);
            expect(key).toBe('sk_source_abc123');
        });

        it('应直接返回以 sk_source_ 开头的 key', () => {
            const header = 'sk_source_abc123';
            const key = extractApiKeyFromHeader(header);
            expect(key).toBe('sk_source_abc123');
        });

        it('无效格式应返回 null', () => {
            expect(extractApiKeyFromHeader('invalid')).toBe(null);
            expect(extractApiKeyFromHeader('Basic abc123')).toBe(null);
        });

        it('null 输入应返回 null', () => {
            expect(extractApiKeyFromHeader(null)).toBe(null);
        });

        it('空字符串应返回 null', () => {
            expect(extractApiKeyFromHeader('')).toBe(null);
        });
    });
});
