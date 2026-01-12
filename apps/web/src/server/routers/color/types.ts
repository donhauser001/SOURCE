/**
 * Color Router - 共享类型和工具函数
 */

// ============================================================================
// 标签映射常量
// ============================================================================

/** 纸张类型标签映射 */
export const PAPER_TYPE_LABELS: Record<string, string> = {
    PREMIUM_MATTE: '高阶映画',
    UNCOATED: '纯质纸',
    COATED: '铜版纸',
    OFFSET: '双胶纸',
    LIGHTWEIGHT: '轻型纸',
};

/** 推荐等级标签映射 */
export const RECOMMENDATION_LABELS: Record<string, string> = {
    BEST: '最佳拍档',
    GOOD: '表现良好',
    CAUTION: '需注意',
    AVOID: '建议慎用',
};

/** 颜色状态标签映射 */
export const STATUS_LABELS: Record<string, string> = {
    ACTIVE: '激活',
    DEPRECATED: '已废弃',
    EXPERIMENTAL: '实验中',
    DRAFT: '草稿',
    VERIFIED: '已验证',
};

/** 审计状态标签映射 */
export const AUDIT_STATUS_LABELS: Record<string, string> = {
    VERIFIED: '已验证',
    PENDING: '待审核',
};

/** 配方状态标签映射 */
export const RECIPE_STATUS_LABELS: Record<string, string> = {
    EXPERIMENTAL: '实验中',
    VERIFIED: '已验证',
    DEPRECATED: '已废弃',
};

/** 成本等级标签映射 */
export const COST_LEVEL_LABELS: Record<string, string> = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
};

/** 油墨类型标签映射 */
export const INK_TYPE_LABELS: Record<string, string> = {
    BASE: '基础色',
    SPOT: '专色',
    EXTENDER: '冲淡剂',
};

/** 适配结果标签映射 */
export const FIT_RESULT_LABELS: Record<string, string> = {
    RECOMMENDED: '推荐',
    USABLE: '可用',
    NOT_RECOMMENDED: '不推荐',
};

/** 结论等级标签映射 */
export const CONCLUSION_LEVEL_LABELS: Record<string, string> = {
    PASS: '通过',
    CONDITIONAL: '有条件通过',
    FAIL: '不通过',
};

/** 风险类型标签映射 */
export const RISK_TYPE_LABELS: Record<string, string> = {
    COLOR_SHIFT: '色偏',
    GRAYING: '发灰',
    DOT_LOSS: '绝网',
    UNSTABLE: '不稳定',
};

/** 纸张类别标签映射 */
export const PAPER_CATEGORY_LABELS: Record<string, string> = {
    COATED: '涂布',
    UNCOATED: '非涂布',
    SPECIALTY: '特种',
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 计算 ΔE (CIE76)
 * 简化版色差计算
 */
export function calculateDeltaE(
    source: { L: number; a: number; b: number },
    target: { L: number; a: number; b: number }
): number {
    const dL = target.L - source.L;
    const da = target.a - source.a;
    const db = target.b - source.b;
    return Math.sqrt(dL * dL + da * da + db * db);
}
