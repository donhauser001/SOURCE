/**
 * 批次数据验证 Schema
 */

import { z } from 'zod';

// ============================================================================
// 枚举
// ============================================================================

export const BatchTypeEnum = z.enum(['MEASURE', 'SCAN', 'PRINT', 'AUDIT']);

// 批次类型中文映射
export const BatchTypeLabels: Record<z.infer<typeof BatchTypeEnum>, string> = {
    MEASURE: '分光仪测量',
    SCAN: '高清扫描',
    PRINT: '印刷打样',
    AUDIT: '审计复核',
};

// ============================================================================
// Batch Schema
// ============================================================================

/**
 * 批次编号格式验证
 * 格式：BATCH-YYYY-NNN
 */
export const batchNoSchema = z
    .string()
    .regex(/^BATCH-\d{4}-\d{3,}$/, '格式应为：BATCH-YYYY-NNN');

/**
 * 创建批次
 */
export const createBatchSchema = z.object({
    batchNo: batchNoSchema,
    type: BatchTypeEnum,
    partnerId: z.string().optional(),
    instrumentModel: z.string().max(200).optional(),
    calibratedAt: z.coerce.date().optional(),
    notes: z.string().max(1000).optional(),
    createdBy: z.string().min(1).max(100),
});

/**
 * 更新批次
 */
export const updateBatchSchema = z.object({
    id: z.string(),
    partnerId: z.string().nullable().optional(),
    instrumentModel: z.string().max(200).nullable().optional(),
    calibratedAt: z.coerce.date().nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
});

/**
 * 查询批次列表
 */
export const listBatchesSchema = z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).optional().default(20),
    type: BatchTypeEnum.optional(),
    search: z.string().optional(),
});

/**
 * 获取单个批次
 */
export const getBatchSchema = z.object({
    id: z.string().optional(),
    batchNo: z.string().optional(),
}).refine((data) => data.id || data.batchNo, {
    message: '必须提供 id 或 batchNo',
});

// ============================================================================
// 类型导出
// ============================================================================

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type ListBatchesInput = z.infer<typeof listBatchesSchema>;
export type GetBatchInput = z.infer<typeof getBatchSchema>;

