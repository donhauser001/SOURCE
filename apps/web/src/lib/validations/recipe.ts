/**
 * Recipe 相关 Zod 验证 schemas
 * 基于《色彩身份证字段规范 v1.0》
 */

import { z } from 'zod';

// =============================================================================
// 枚举定义
// =============================================================================

export const RecipeStatusEnum = z.enum(['EXPERIMENTAL', 'VERIFIED', 'DEPRECATED']);
export const CostLevelEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const InkTypeEnum = z.enum(['BASE', 'SPOT', 'EXTENDER']);
export const FitResultEnum = z.enum(['RECOMMENDED', 'USABLE', 'NOT_RECOMMENDED']);
export const ConclusionLevelEnum = z.enum(['PASS', 'CONDITIONAL', 'FAIL']);
export const ConfidenceLevelEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);

// 中文标签映射
export const RecipeStatusLabels: Record<z.infer<typeof RecipeStatusEnum>, string> = {
  EXPERIMENTAL: '实验中',
  VERIFIED: '已验证',
  DEPRECATED: '已废弃',
};

export const CostLevelLabels: Record<z.infer<typeof CostLevelEnum>, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
};

export const InkTypeLabels: Record<z.infer<typeof InkTypeEnum>, string> = {
  BASE: '基础色',
  SPOT: '专色',
  EXTENDER: '冲淡剂',
};

export const FitResultLabels: Record<z.infer<typeof FitResultEnum>, string> = {
  RECOMMENDED: '推荐',
  USABLE: '可用',
  NOT_RECOMMENDED: '不推荐',
};

export const ConclusionLevelLabels: Record<z.infer<typeof ConclusionLevelEnum>, string> = {
  PASS: '通过',
  CONDITIONAL: '有条件通过',
  FAIL: '不通过',
};

export const ConfidenceLevelLabels: Record<z.infer<typeof ConfidenceLevelEnum>, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

// =============================================================================
// Recipe Schemas
// =============================================================================

/**
 * 配方 ID 格式验证
 */
export const recipeIdSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^RECIPE-[A-Z]+-\d{2,4}$/, '格式应为：RECIPE-NAME-00');

/**
 * 创建配方
 */
export const createRecipeSchema = z.object({
  recipeId: recipeIdSchema,
  name: z.string().min(1).max(100).optional(),
  colorId: z.string(),
  status: RecipeStatusEnum.optional().default('EXPERIMENTAL'),
  costLevel: CostLevelEnum,
  applicablePapers: z.array(z.string()).min(1),
  notes: z.string().max(500).optional(),
});

/**
 * 更新配方
 */
export const updateRecipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  status: RecipeStatusEnum.optional(),
  costLevel: CostLevelEnum.optional(),
  applicablePapers: z.array(z.string()).optional(),
  notes: z.string().max(500).nullable().optional(),
});

// =============================================================================
// RecipeIngredient Schemas
// =============================================================================

/**
 * 油墨构成
 */
export const recipeIngredientSchema = z.object({
  inkName: z.string().min(1).max(100),
  inkType: InkTypeEnum,
  percentage: z.number().min(0).max(100),
  order: z.number().int().min(0).optional().default(0),
});

/**
 * 创建油墨构成
 */
export const createRecipeIngredientSchema = z.object({
  recipeId: z.string(),
  ...recipeIngredientSchema.shape,
});

// =============================================================================
// FitMatrix Schemas
// =============================================================================

/**
 * 创建适配矩阵条目
 */
export const createFitMatrixSchema = z.object({
  recipeId: z.string(),
  paperId: z.string(),
  fitResult: FitResultEnum,
  deltaEResult: z.number().min(0).optional(),
  stabilityScore: z.number().int().min(1).max(5).optional(),
  issueTags: z.array(z.string()).optional().default([]),
  conclusionNote: z.string().min(1).max(500),
  reportIds: z.array(z.string()).min(1),
});

/**
 * 更新适配矩阵条目
 */
export const updateFitMatrixSchema = z.object({
  id: z.string(),
  fitResult: FitResultEnum.optional(),
  deltaEResult: z.number().min(0).nullable().optional(),
  stabilityScore: z.number().int().min(1).max(5).nullable().optional(),
  issueTags: z.array(z.string()).optional(),
  conclusionNote: z.string().min(1).max(500).optional(),
  reportIds: z.array(z.string()).optional(),
});

// =============================================================================
// RecipeTestReport Schemas
// =============================================================================

/**
 * 报告 ID 格式验证
 */
export const reportIdSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^REPORT-[A-Z]+-\d{3,4}$/, '格式应为：REPORT-NAME-001');

/**
 * 创建测试报告
 */
export const createRecipeTestReportSchema = z.object({
  reportId: reportIdSchema,
  recipeId: z.string(),
  testedPaperIds: z.array(z.string()).min(1),
  printerPartner: z.string().min(1).max(200),
  pressModel: z.string().max(200).optional(),
  testDate: z.coerce.date(),
  measurementDevice: z.string().min(1).max(200),
  conclusionLevel: ConclusionLevelEnum,
  summary: z.string().min(1).max(1000),
  collabLink: z.string().url().optional(),
});

/**
 * 更新测试报告
 */
export const updateRecipeTestReportSchema = z.object({
  id: z.string(),
  testedPaperIds: z.array(z.string()).optional(),
  printerPartner: z.string().min(1).max(200).optional(),
  pressModel: z.string().max(200).nullable().optional(),
  testDate: z.coerce.date().optional(),
  measurementDevice: z.string().min(1).max(200).optional(),
  conclusionLevel: ConclusionLevelEnum.optional(),
  summary: z.string().min(1).max(1000).optional(),
  collabLink: z.string().url().nullable().optional(),
});

// =============================================================================
// PaperRecipeRecommendation Schemas
// =============================================================================

/**
 * 创建按纸张推荐配方
 */
export const createPaperRecipeRecommendationSchema = z.object({
  paperId: z.string(),
  recipeId: z.string(),
  reason: z.string().min(1).max(500),
  confidenceLevel: ConfidenceLevelEnum.optional(),
});

// =============================================================================
// 类型导出
// =============================================================================

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type RecipeIngredientInput = z.infer<typeof recipeIngredientSchema>;
export type CreateRecipeIngredientInput = z.infer<typeof createRecipeIngredientSchema>;
export type CreateFitMatrixInput = z.infer<typeof createFitMatrixSchema>;
export type UpdateFitMatrixInput = z.infer<typeof updateFitMatrixSchema>;
export type CreateRecipeTestReportInput = z.infer<typeof createRecipeTestReportSchema>;
export type UpdateRecipeTestReportInput = z.infer<typeof updateRecipeTestReportSchema>;
export type CreatePaperRecipeRecommendationInput = z.infer<typeof createPaperRecipeRecommendationSchema>;

