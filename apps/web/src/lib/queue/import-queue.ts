/**
 * 导入任务队列
 * 
 * 使用 BullMQ 处理大文件异步导入
 */

import { Queue, Job } from 'bullmq';
import { getRedisConnection } from './connection';

// 队列名称
export const IMPORT_QUEUE_NAME = 'import-jobs';

// 导入任务类型
export type ImportJobType = 'color' | 'paper-profile';

// 导入任务数据
export interface ImportJobData {
    type: ImportJobType;
    jobId: string;        // 数据库中的 ImportJob ID
    userId: string;
    userEmail: string;
    records: Record<string, unknown>[];
}

// 导入任务结果
export interface ImportJobResult {
    success: boolean;
    totalCount: number;
    successCount: number;
    failedCount: number;
    errors?: { index: number; message: string }[];
}

// 单例队列实例
let importQueue: Queue<ImportJobData, ImportJobResult> | null = null;

/**
 * 获取导入队列实例
 */
export function getImportQueue(): Queue<ImportJobData, ImportJobResult> {
    if (!importQueue) {
        const connection = getRedisConnection();
        importQueue = new Queue<ImportJobData, ImportJobResult>(IMPORT_QUEUE_NAME, {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: {
                    age: 24 * 60 * 60, // 24 小时后删除已完成任务
                    count: 100,
                },
                removeOnFail: {
                    age: 7 * 24 * 60 * 60, // 7 天后删除失败任务
                },
            },
        });
    }

    return importQueue;
}

/**
 * 添加导入任务到队列
 */
export async function addImportJob(data: ImportJobData): Promise<Job<ImportJobData, ImportJobResult>> {
    const queue = getImportQueue();
    
    const job = await queue.add(`import-${data.type}`, data, {
        jobId: data.jobId, // 使用数据库 ID 作为 job ID
    });

    return job;
}

/**
 * 获取任务状态
 */
export async function getImportJobStatus(jobId: string): Promise<{
    state: string;
    progress: number;
    result?: ImportJobResult;
    failedReason?: string;
} | null> {
    const queue = getImportQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
        return null;
    }

    const state = await job.getState();
    const progress = job.progress as number || 0;

    return {
        state,
        progress,
        result: job.returnvalue || undefined,
        failedReason: job.failedReason || undefined,
    };
}

/**
 * 关闭队列
 */
export async function closeImportQueue(): Promise<void> {
    if (importQueue) {
        await importQueue.close();
        importQueue = null;
    }
}
