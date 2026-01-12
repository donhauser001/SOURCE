/**
 * 色彩数据验证 Schema
 * 基于《色彩身份证字段规范 v1.0》
 */

import { z } from 'zod';

// ============================================================================
// 枚举
// ============================================================================

// 颜色状态（更新为 v1.0 规范）
export const ColorStatusEnum = z.enum(['ACTIVE', 'DEPRECATED', 'EXPERIMENTAL', 'DRAFT', 'VERIFIED']);
export const SourceTypeEnum = z.enum(['MEASURE', 'CALCULATED', 'IMPORTED']);
export const AuditStatusEnum = z.enum(['VERIFIED', 'PENDING']);

// 纸张类型（旧模型兼容）
export const PaperTypeEnum = z.enum([
    'PREMIUM_MATTE',
    'UNCOATED',
    'COATED',
    'OFFSET',
    'LIGHTWEIGHT',
]);
export const RecommendationEnum = z.enum(['BEST', 'GOOD', 'CAUTION', 'AVOID']);

// 颜色状态中文映射
export const ColorStatusLabels: Record<z.infer<typeof ColorStatusEnum>, string> = {
    ACTIVE: '激活',
    DEPRECATED: '已废弃',
    EXPERIMENTAL: '实验中',
    DRAFT: '草稿',
    VERIFIED: '已验证',
};

// 审计状态中文映射
export const AuditStatusLabels: Record<z.infer<typeof AuditStatusEnum>, string> = {
    VERIFIED: '已验证',
    PENDING: '待审核',
};

// 纸张类型中文映射
export const PaperTypeLabels: Record<z.infer<typeof PaperTypeEnum>, string> = {
    PREMIUM_MATTE: '高阶映画',
    UNCOATED: '纯质纸',
    COATED: '铜版纸',
    OFFSET: '双胶纸',
    LIGHTWEIGHT: '轻型纸',
};

// 推荐等级中文映射
export const RecommendationLabels: Record<z.infer<typeof RecommendationEnum>, string> = {
    BEST: '最佳拍档',
    GOOD: '表现良好',
    CAUTION: '需注意',
    AVOID: '建议慎用',
};

// ============================================================================
// Color Schema (v1.0 规范)
// ============================================================================

/**
 * ColorID 格式验证
 * 格式：XX-Xxxx-00 (如 CN-Song-04)
 */
export const colorIdSchema = z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Z]{2,4}-[A-Za-z]+-\d{2,4}$/, '格式应为：XX-Name-00');

/**
 * Slug 格式验证
 */
export const slugSchema = z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, '仅允许小写字母、数字和连字符');

/**
 * Lab 值验证
 */
export const labSchema = z.object({
    L: z.number().min(0).max(100),
    a: z.number().min(-128).max(127),
    b: z.number().min(-128).max(127),
});

/**
 * 创建颜色 (v1.0 完整字段)
 */
export const createColorSchema = z.object({
    // 页面元信息（Meta）
    colorId: colorIdSchema,
    name: z.string().min(1).max(100),
    slug: slugSchema,
    status: ColorStatusEnum.optional().default('EXPERIMENTAL'),
    version: z.string().optional().default('1.0'),

    // 真源区（True Source）
    labL: z.number().min(0).max(100),
    labA: z.number().min(-128).max(127),
    labB: z.number().min(-128).max(127),
    deltaETolerance: z.number().min(0).max(10).optional().default(2.0),
    measurementDevice: z.string().min(1).max(200),
    measurementStandard: z.string().min(1).max(100),
    measurementCondition: z.string().max(500).optional(),
    measuredAt: z.coerce.date(),
    trueSourceNote: z.string().max(1000).optional(),

    // 审计与溯源
    auditStatus: AuditStatusEnum.optional().default('PENDING'),
    auditors: z.array(z.string()).optional().default([]),
    auditNotes: z.string().max(1000).optional(),

    // 证据链
    batchId: z.string().optional(),
    sourceType: SourceTypeEnum.optional().default('MEASURE'),
});

/**
 * 更新颜色 (v1.0 完整字段)
 */
export const updateColorSchema = z.object({
    id: z.string(),

    // 页面元信息
    name: z.string().min(1).max(100).optional(),
    slug: slugSchema.optional(),
    status: ColorStatusEnum.optional(),
    version: z.string().optional(),
    lastVerifiedAt: z.coerce.date().nullable().optional(),

    // 真源区
    labL: z.number().min(0).max(100).optional(),
    labA: z.number().min(-128).max(127).optional(),
    labB: z.number().min(-128).max(127).optional(),
    deltaETolerance: z.number().min(0).max(10).optional(),
    measurementDevice: z.string().min(1).max(200).optional(),
    measurementStandard: z.string().min(1).max(100).optional(),
    measurementCondition: z.string().max(500).nullable().optional(),
    measuredAt: z.coerce.date().optional(),
    trueSourceNote: z.string().max(1000).nullable().optional(),

    // 审计与溯源
    auditStatus: AuditStatusEnum.optional(),
    auditors: z.array(z.string()).optional(),
    auditNotes: z.string().max(1000).nullable().optional(),
    lastAuditAt: z.coerce.date().nullable().optional(),

    // 证据链
    batchId: z.string().nullable().optional(),
    sourceType: SourceTypeEnum.optional(),
});

/**
 * 查询颜色列表
 */
export const listColorsSchema = z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).optional().default(20),
    status: ColorStatusEnum.optional(),
    auditStatus: AuditStatusEnum.optional(),
    search: z.string().optional(),
    batchId: z.string().optional(),
});

/**
 * 获取单个颜色（支持 id、colorId 或 slug）
 */
export const getColorSchema = z.object({
    id: z.string().optional(),
    colorId: z.string().optional(),
    slug: z.string().optional(),
}).refine((data) => data.id || data.colorId || data.slug, {
    message: '必须提供 id、colorId 或 slug',
});

// ============================================================================
// PaperProfile Schema（旧模型兼容）
// ============================================================================

/**
 * 创建纸张表现数据
 */
export const createPaperProfileSchema = z.object({
    colorId: z.string(),
    paperTypeId: z.string().min(1, '请选择纸型'),  // 改为 paperTypeId
    labL: z.number().min(0).max(100),
    labA: z.number().min(-128).max(127),
    labB: z.number().min(-128).max(127),
    deltaE: z.number().min(0).optional(),
    glossiness: z.number().min(0).max(100),
    inkAbsorption: z.number().min(0).max(100),
    gamutCoverage: z.number().min(0).max(100),
    scanImageUrl: z.string().url().optional(),
    recommendation: RecommendationEnum,
    cautionNote: z.string().max(500).optional(),
    batchId: z.string().optional(),
});

/**
 * 更新纸张表现数据
 */
export const updatePaperProfileSchema = z.object({
    id: z.string(),
    labL: z.number().min(0).max(100).optional(),
    labA: z.number().min(-128).max(127).optional(),
    labB: z.number().min(-128).max(127).optional(),
    deltaE: z.number().min(0).optional(),
    glossiness: z.number().min(0).max(100).optional(),
    inkAbsorption: z.number().min(0).max(100).optional(),
    gamutCoverage: z.number().min(0).max(100).optional(),
    scanImageUrl: z.string().url().nullable().optional(),
    recommendation: RecommendationEnum.optional(),
    cautionNote: z.string().max(500).nullable().optional(),
    batchId: z.string().nullable().optional(),
});

/**
 * 查询纸张表现列表
 */
export const listPaperProfilesSchema = z.object({
    colorId: z.string().optional(),
    paperTypeId: z.string().optional(),  // 改为 paperTypeId
    recommendation: RecommendationEnum.optional(),
    limit: z.number().min(1).max(100).optional().default(50),
});

// ============================================================================
// 类型导出
// ============================================================================

export type CreateColorInput = z.infer<typeof createColorSchema>;
export type UpdateColorInput = z.infer<typeof updateColorSchema>;
export type ListColorsInput = z.infer<typeof listColorsSchema>;
export type GetColorInput = z.infer<typeof getColorSchema>;

export type CreatePaperProfileInput = z.infer<typeof createPaperProfileSchema>;
export type UpdatePaperProfileInput = z.infer<typeof updatePaperProfileSchema>;
export type ListPaperProfilesInput = z.infer<typeof listPaperProfilesSchema>;
