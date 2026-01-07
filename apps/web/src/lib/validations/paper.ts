/**
 * Paper 相关 Zod 验证 schemas
 * 基于《色彩身份证字段规范 v1.0》
 */

import { z } from 'zod';

// =============================================================================
// 枚举定义
// =============================================================================

export const PaperCategoryEnum = z.enum(['COATED', 'UNCOATED', 'SPECIALTY']);
export const RecommendationTypeEnum = z.enum(['WHITELIST', 'BLACKLIST']);
export const RiskTypeEnum = z.enum(['COLOR_SHIFT', 'GRAYING', 'DOT_LOSS', 'UNSTABLE']);
export const AuditStatusEnum = z.enum(['VERIFIED', 'UNDER_REVIEW']);

// 中文标签映射
export const PaperCategoryLabels: Record<z.infer<typeof PaperCategoryEnum>, string> = {
  COATED: '涂布',
  UNCOATED: '非涂布',
  SPECIALTY: '特种',
};

export const RecommendationTypeLabels: Record<z.infer<typeof RecommendationTypeEnum>, string> = {
  WHITELIST: '推荐',
  BLACKLIST: '排除',
};

export const RiskTypeLabels: Record<z.infer<typeof RiskTypeEnum>, string> = {
  COLOR_SHIFT: '色偏',
  GRAYING: '发灰',
  DOT_LOSS: '绝网',
  UNSTABLE: '不稳定',
};

export const AuditStatusLabels: Record<z.infer<typeof AuditStatusEnum>, string> = {
  VERIFIED: '已验证',
  UNDER_REVIEW: '审核中',
};

// =============================================================================
// Paper Schemas
// =============================================================================

/**
 * 纸张 ID 格式验证
 */
export const paperIdSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^PAPER-[A-Z-]+$/, '格式应为：PAPER-TYPE-NAME');

/**
 * 创建纸张
 */
export const createPaperSchema = z.object({
  paperId: paperIdSchema,
  name: z.string().min(1).max(100),
  paperCategory: PaperCategoryEnum,
  gramWeight: z.number().int().min(40).max(500).optional(),
  manufacturer: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
});

/**
 * 更新纸张
 */
export const updatePaperSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  paperCategory: PaperCategoryEnum.optional(),
  gramWeight: z.number().int().min(40).max(500).nullable().optional(),
  manufacturer: z.string().max(200).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

// =============================================================================
// PaperRecommendation Schemas
// =============================================================================

/**
 * 创建纸张推荐/排除
 */
export const createPaperRecommendationSchema = z.object({
  colorId: z.string(),
  paperId: z.string(),
  recommendationType: RecommendationTypeEnum,
  reason: z.string().min(1).max(500),
});

/**
 * 更新纸张推荐/排除
 */
export const updatePaperRecommendationSchema = z.object({
  id: z.string(),
  recommendationType: RecommendationTypeEnum.optional(),
  reason: z.string().min(1).max(500).optional(),
});

// =============================================================================
// ColorRisk Schemas
// =============================================================================

/**
 * 创建风险
 */
export const createColorRiskSchema = z.object({
  colorId: z.string(),
  riskType: RiskTypeEnum,
  affectedPaperIds: z.array(z.string()).min(1),
  description: z.string().min(1).max(500),
  mitigation: z.string().max(500).optional(),
});

/**
 * 更新风险
 */
export const updateColorRiskSchema = z.object({
  id: z.string(),
  riskType: RiskTypeEnum.optional(),
  affectedPaperIds: z.array(z.string()).optional(),
  description: z.string().min(1).max(500).optional(),
  mitigation: z.string().max(500).nullable().optional(),
});

// =============================================================================
// 类型导出
// =============================================================================

export type CreatePaperInput = z.infer<typeof createPaperSchema>;
export type UpdatePaperInput = z.infer<typeof updatePaperSchema>;
export type CreatePaperRecommendationInput = z.infer<typeof createPaperRecommendationSchema>;
export type UpdatePaperRecommendationInput = z.infer<typeof updatePaperRecommendationSchema>;
export type CreateColorRiskInput = z.infer<typeof createColorRiskSchema>;
export type UpdateColorRiskInput = z.infer<typeof updateColorRiskSchema>;

