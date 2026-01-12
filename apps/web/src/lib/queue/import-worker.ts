/**
 * 导入任务 Worker
 * 
 * 处理异步导入任务
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getRedisConnection } from './connection';
import { IMPORT_QUEUE_NAME, ImportJobData, ImportJobResult } from './import-queue';
import { logAdminAction, AUDIT_TARGET_TYPES } from '@/lib/admin-audit';

// Prisma 客户端
const prisma = new PrismaClient();

// 颜色导入数据验证
const colorImportSchema = z.object({
    colorId: z.string().min(1),
    name: z.string().min(1),
    labL: z.coerce.number().min(0).max(100),
    labA: z.coerce.number().min(-128).max(127),
    labB: z.coerce.number().min(-128).max(127),
    // 可选字段（带默认值）
    measurementDevice: z.string().optional(),
    measurementStandard: z.string().optional(),
});

// Worker 实例
let importWorker: Worker<ImportJobData, ImportJobResult> | null = null;

/**
 * 处理颜色导入
 */
async function processColorImport(
    job: Job<ImportJobData, ImportJobResult>,
    data: ImportJobData
): Promise<ImportJobResult> {
    const { records, userId, userEmail, jobId } = data;
    const errors: { index: number; message: string }[] = [];
    let successCount = 0;
    let failedCount = 0;

    // 更新数据库状态为处理中
    await prisma.importJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING', totalCount: records.length },
    });

    // 批量处理
    for (let i = 0; i < records.length; i++) {
        try {
            const record = records[i];

            // 验证数据
            const parsed = colorImportSchema.safeParse(record);
            if (!parsed.success) {
                const errorMessages = parsed.error.issues.map((issue) => issue.message).join(', ');
                errors.push({
                    index: i,
                    message: errorMessages,
                });
                failedCount++;
                continue;
            }

            const colorData = parsed.data;

            // 生成 slug
            const slug = colorData.colorId.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            // 创建或更新颜色
            await prisma.color.upsert({
                where: { colorId: colorData.colorId },
                create: {
                    colorId: colorData.colorId,
                    name: colorData.name,
                    slug,
                    labL: colorData.labL,
                    labA: colorData.labA,
                    labB: colorData.labB,
                    // 必填字段使用默认值或导入数据中的值
                    measurementDevice: colorData.measurementDevice || '导入数据',
                    measurementStandard: colorData.measurementStandard || 'D50/2°',
                    measuredAt: new Date(),
                },
                update: {
                    name: colorData.name,
                    labL: colorData.labL,
                    labA: colorData.labA,
                    labB: colorData.labB,
                    ...(colorData.measurementDevice && { measurementDevice: colorData.measurementDevice }),
                    ...(colorData.measurementStandard && { measurementStandard: colorData.measurementStandard }),
                },
            });

            successCount++;
        } catch (err) {
            errors.push({
                index: i,
                message: err instanceof Error ? err.message : '未知错误',
            });
            failedCount++;
        }

        // 更新进度
        const progress = Math.round(((i + 1) / records.length) * 100);
        await job.updateProgress(progress);

        // 定期更新数据库状态
        if ((i + 1) % 50 === 0 || i === records.length - 1) {
            await prisma.importJob.update({
                where: { id: jobId },
                data: { successCount, failedCount },
            });
        }
    }

    // 更新最终状态
    await prisma.importJob.update({
        where: { id: jobId },
        data: {
            status: failedCount === records.length ? 'FAILED' : 'COMPLETED',
            successCount,
            failedCount,
            errors: errors.length > 0 ? errors : undefined,
            completedAt: new Date(),
        },
    });

    // 记录审计日志
    await logAdminAction({
        userId,
        userEmail,
        action: 'IMPORT',
        targetType: AUDIT_TARGET_TYPES.COLOR,
        targetId: null,
        metadata: {
            jobId,
            totalCount: records.length,
            successCount,
            failedCount,
            async: true,
        },
    });

    return {
        success: failedCount < records.length,
        totalCount: records.length,
        successCount,
        failedCount,
        errors: errors.length > 0 ? errors.slice(0, 100) : undefined, // 限制错误数量
    };
}

/**
 * 处理纸张配置文件导入
 * 注意：这是一个简化实现，实际使用时需要完善
 */
async function processPaperProfileImport(
    job: Job<ImportJobData, ImportJobResult>,
    data: ImportJobData
): Promise<ImportJobResult> {
    const { records, userId, userEmail, jobId } = data;

    // 更新数据库状态
    await prisma.importJob.update({
        where: { id: jobId },
        data: { 
            status: 'COMPLETED', 
            totalCount: records.length,
            successCount: 0,
            failedCount: records.length,
            errors: [{ index: 0, message: '纸张配置导入功能暂未完全实现' }],
            completedAt: new Date(),
        },
    });

    // 记录审计日志
    await logAdminAction({
        userId,
        userEmail,
        action: 'IMPORT',
        targetType: AUDIT_TARGET_TYPES.PAPER_PROFILE,
        targetId: null,
        metadata: {
            jobId,
            totalCount: records.length,
            status: 'not_implemented',
        },
    });

    return {
        success: false,
        totalCount: records.length,
        successCount: 0,
        failedCount: records.length,
        errors: [{ index: 0, message: '纸张配置导入功能暂未完全实现' }],
    };
}

/**
 * 任务处理器
 */
async function processJob(job: Job<ImportJobData, ImportJobResult>): Promise<ImportJobResult> {
    const { type } = job.data;

    console.log(`[ImportWorker] Processing job ${job.id} (type: ${type})`);

    switch (type) {
        case 'color':
            return processColorImport(job, job.data);
        case 'paper-profile':
            return processPaperProfileImport(job, job.data);
        default:
            throw new Error(`Unknown import type: ${type}`);
    }
}

/**
 * 启动 Worker
 */
export function startImportWorker(): Worker<ImportJobData, ImportJobResult> {
    if (!importWorker) {
        const connection = getRedisConnection();
        
        importWorker = new Worker<ImportJobData, ImportJobResult>(
            IMPORT_QUEUE_NAME,
            processJob,
            {
                connection,
                concurrency: 2, // 并发处理 2 个任务
            }
        );

        importWorker.on('completed', (job) => {
            console.log(`[ImportWorker] Job ${job.id} completed`);
        });

        importWorker.on('failed', (job, err) => {
            console.error(`[ImportWorker] Job ${job?.id} failed:`, err);
        });

        importWorker.on('error', (err) => {
            console.error('[ImportWorker] Worker error:', err);
        });

        console.log('[ImportWorker] Started');
    }

    return importWorker;
}

/**
 * 停止 Worker
 */
export async function stopImportWorker(): Promise<void> {
    if (importWorker) {
        await importWorker.close();
        importWorker = null;
        console.log('[ImportWorker] Stopped');
    }
}
