/**
 * Redis 连接配置
 * 
 * 用于 BullMQ 队列和缓存
 */

import Redis from 'ioredis';

// Redis 连接 URL
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// 单例模式
let redisInstance: Redis | null = null;

/**
 * 获取 Redis 连接实例
 */
export function getRedisConnection(): Redis {
    if (!redisInstance) {
        redisInstance = new Redis(REDIS_URL, {
            maxRetriesPerRequest: null, // BullMQ 要求
            enableReadyCheck: false,
        });

        redisInstance.on('error', (err) => {
            console.error('[Redis] Connection error:', err);
        });

        redisInstance.on('connect', () => {
            console.log('[Redis] Connected');
        });
    }

    return redisInstance;
}

/**
 * 关闭 Redis 连接
 */
export async function closeRedisConnection(): Promise<void> {
    if (redisInstance) {
        await redisInstance.quit();
        redisInstance = null;
    }
}

/**
 * 检查 Redis 是否可用
 */
export async function isRedisAvailable(): Promise<boolean> {
    try {
        const redis = getRedisConnection();
        const pong = await redis.ping();
        return pong === 'PONG';
    } catch {
        return false;
    }
}
