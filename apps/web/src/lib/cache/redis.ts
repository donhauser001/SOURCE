/**
 * Redis 缓存客户端
 * 
 * 用于查询结果缓存
 */

import Redis from 'ioredis';

// Redis 连接 URL
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// 单例模式
let cacheClient: Redis | null = null;

/**
 * 获取缓存 Redis 连接
 */
export function getCacheClient(): Redis {
    if (!cacheClient) {
        cacheClient = new Redis(REDIS_URL, {
            keyPrefix: 'source:cache:',
            enableReadyCheck: true,
            lazyConnect: true,
        });

        cacheClient.on('error', (err) => {
            console.error('[Cache] Redis error:', err.message);
        });

        cacheClient.on('ready', () => {
            console.log('[Cache] Redis connected');
        });
    }

    return cacheClient;
}

/**
 * 关闭缓存连接
 */
export async function closeCacheClient(): Promise<void> {
    if (cacheClient) {
        await cacheClient.quit();
        cacheClient = null;
    }
}

/**
 * 检查缓存是否可用
 */
export async function isCacheAvailable(): Promise<boolean> {
    try {
        const client = getCacheClient();
        await client.ping();
        return true;
    } catch {
        return false;
    }
}
