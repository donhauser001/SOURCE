/**
 * 打样包 SKU 数据验证 Schema
 * 
 * v0.3.0 - Bridge 阶段
 * 
 * 设计原则：
 * - SOURCE 不做电商，只做"履约桥"
 * - 一色一纸一包（colorId + paperType = 唯一 SKU）
 * - 价格仅供参考，真实交易在外部平台
 */

import { z } from 'zod';
import { PaperTypeEnum, PaperTypeLabels } from './color';

// ============================================================================
// 打样包状态
// ============================================================================

// 打样包状态标签
export const ProofingPackStatusLabels = {
    active: '在售',
    inactive: '下架',
};

// ============================================================================
// 创建打样包
// ============================================================================

export const createProofingPackSchema = z.object({
    colorId: z.string().min(1, '请选择色彩'),
    paperTypeId: z.string().min(1, '请选择纸型'),  // 改为 paperTypeId
    price: z.number().int().min(0, '价格不能为负数'),  // 单位：分
    externalUrl: z.string().url('请输入有效的URL').optional().nullable(),
    isActive: z.boolean().default(true),
});

// ============================================================================
// 更新打样包
// ============================================================================

export const updateProofingPackSchema = z.object({
    id: z.string(),
    price: z.number().int().min(0, '价格不能为负数').optional(),
    externalUrl: z.string().url('请输入有效的URL').optional().nullable(),
    isActive: z.boolean().optional(),
});

// ============================================================================
// 查询打样包列表
// ============================================================================

export const listProofingPacksSchema = z.object({
    colorId: z.string().optional(),
    paperTypeId: z.string().optional(),  // 改为 paperTypeId
    isActive: z.boolean().optional(),
    limit: z.number().min(1).max(100).default(50),
    cursor: z.string().optional(),
});

// ============================================================================
// 获取单个打样包
// ============================================================================

export const getProofingPackSchema = z.object({
    id: z.string().optional(),
    colorId: z.string().optional(),
    paperType: PaperTypeEnum.optional(),
}).refine(
    (data) => data.id || (data.colorId && data.paperType),
    { message: '必须提供 id，或同时提供 colorId 和 paperType' }
);

// ============================================================================
// 类型导出
// ============================================================================

export type CreateProofingPackInput = z.infer<typeof createProofingPackSchema>;
export type UpdateProofingPackInput = z.infer<typeof updateProofingPackSchema>;
export type ListProofingPacksInput = z.infer<typeof listProofingPacksSchema>;
export type GetProofingPackInput = z.infer<typeof getProofingPackSchema>;

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 格式化价格（分 → 元）
 */
export function formatPrice(priceInCents: number): string {
    return `¥${(priceInCents / 100).toFixed(2)}`;
}

/**
 * 生成 SKU 展示名称
 */
export function getSkuDisplayName(colorId: string, paperType: string): string {
    const paperLabel = PaperTypeLabels[paperType as keyof typeof PaperTypeLabels] || paperType;
    return `${colorId} / ${paperLabel}`;
}

