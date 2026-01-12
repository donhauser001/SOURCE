/**
 * 缓存工具
 * 
 * 提供简单的缓存 get/set/invalidate 接口
 */

import { getCacheClient, isCacheAvailable } from './redis';

// 默认 TTL（秒）
const DEFAULT_TTL = 300; // 5 分钟

// 缓存键前缀
export const CACHE_KEYS = {
    COLOR_LIST: 'color:list',
    COLOR_STATS: 'color:stats',
    COLOR_DETAIL: 'color:detail',
    COLOR_BOOK_LIST: 'colorBook:list',
} as const;

/**
 * 缓存配置
 */
export interface CacheOptions {
    ttl?: number;     // 过期时间（秒）
    prefix?: string;  // 键前缀
}

/**
 * 从缓存获取数据
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const available = await isCacheAvailable();
        if (!available) return null;

        const client = getCacheClient();
        const data = await client.get(key);

        if (!data) return null;

        return JSON.parse(data) as T;
    } catch (err) {
        console.error('[Cache] Get error:', err);
        return null;
    }
}

/**
 * 设置缓存
 */
export async function cacheSet<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
): Promise<boolean> {
    try {
        const available = await isCacheAvailable();
        if (!available) return false;

        const client = getCacheClient();
        const ttl = options.ttl ?? DEFAULT_TTL;
        const data = JSON.stringify(value);

        if (ttl > 0) {
            await client.setex(key, ttl, data);
        } else {
            await client.set(key, data);
        }

        return true;
    } catch (err) {
        console.error('[Cache] Set error:', err);
        return false;
    }
}

/**
 * 删除缓存
 */
export async function cacheDelete(key: string): Promise<boolean> {
    try {
        const available = await isCacheAvailable();
        if (!available) return false;

        const client = getCacheClient();
        await client.del(key);

        return true;
    } catch (err) {
        console.error('[Cache] Delete error:', err);
        return false;
    }
}

/**
 * 删除匹配模式的缓存
 */
export async function cacheInvalidatePattern(pattern: string): Promise<number> {
    try {
        const available = await isCacheAvailable();
        if (!available) return 0;

        const client = getCacheClient();
        // 注意：keyPrefix 会自动添加，所以这里不需要再加
        const keys = await client.keys(pattern);

        if (keys.length === 0) return 0;

        // 移除 keyPrefix 后删除
        const keysWithoutPrefix = keys.map(k => k.replace(/^source:cache:/, ''));
        const deleted = await client.del(...keysWithoutPrefix);

        return deleted;
    } catch (err) {
        console.error('[Cache] Invalidate pattern error:', err);
        return 0;
    }
}

/**
 * 失效颜色相关缓存
 */
export async function invalidateColorCache(): Promise<void> {
    await cacheInvalidatePattern('color:*');
}

/**
 * 失效色彩簿相关缓存
 */
export async function invalidateColorBookCache(): Promise<void> {
    await cacheInvalidatePattern('colorBook:*');
}

/**
 * 带缓存的查询包装器
 */
export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    // 尝试从缓存获取
    const cached = await cacheGet<T>(key);
    if (cached !== null) {
        return cached;
    }

    // 执行查询
    const result = await fetcher();

    // 存入缓存
    await cacheSet(key, result, options);

    return result;
}
