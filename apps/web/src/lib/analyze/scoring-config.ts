/**
 * 推荐引擎评分配置
 *
 * 四维评分模型：
 * 1. 还原度 (fidelity) - 颜色还原准确性
 * 2. 风险性 (risk) - 印刷风险程度
 * 3. 成本性 (cost) - 生产成本估算
 * 4. 适用性 (suitability) - 用途适配度
 */

// =============================================================================
// 评分权重配置
// =============================================================================

/**
 * 各维度权重（总和为 1.0）
 * 可根据业务需求调整
 */
export const DIMENSION_WEIGHTS = {
    /** 还原度权重 - 最重要 */
    fidelity: 0.40,
    /** 风险性权重 */
    risk: 0.25,
    /** 成本性权重 */
    cost: 0.15,
    /** 适用性权重 */
    suitability: 0.20,
} as const;

// =============================================================================
// 还原度评分配置
// =============================================================================

/**
 * ΔE 色差对应的还原度得分
 * 分数范围：0-100
 */
export const DELTA_E_SCORE_THRESHOLDS = [
    { maxDeltaE: 1.0, score: 100, label: '完美还原' },
    { maxDeltaE: 2.0, score: 95, label: '极佳还原' },
    { maxDeltaE: 3.0, score: 85, label: '良好还原' },
    { maxDeltaE: 5.0, score: 70, label: '可接受' },
    { maxDeltaE: 8.0, score: 50, label: '明显偏差' },
    { maxDeltaE: Infinity, score: 20, label: '严重偏差' },
] as const;

/**
 * 推荐等级对应的基础分数
 */
export const RECOMMENDATION_BASE_SCORES = {
    BEST: 100,
    GOOD: 80,
    CAUTION: 50,
    AVOID: 20,
} as const;

// =============================================================================
// 风险评分配置
// =============================================================================

/**
 * 风险标签对应的扣分值
 * 基础分 100，累计扣分
 */
export const RISK_TAG_PENALTIES = {
    /** 大色块：印刷难度高，易出现墨杠、不均匀 */
    large_area: 15,
    /** 渐变：过渡区域易出现阶梯、断层 */
    gradient: 20,
    /** 叠印：套准要求高，易出现露白或脏色 */
    overprint: 25,
    /** 细线条：易断线、模糊 */
    fine_line: 10,
    /** 小字：清晰度要求高 */
    small_text: 10,
    /** 出血区：裁切误差敏感 */
    bleed: 5,
    /** 关键色：容差要求严格 */
    critical: 15,
} as const;

/**
 * 纸张类型的风险系数
 * 1.0 为基准，越高风险越大
 */
export const PAPER_RISK_FACTORS = {
    PREMIUM_MATTE: 0.9, // 高阶映画，表现稳定
    COATED: 1.0, // 铜版纸，标准
    UNCOATED: 1.2, // 纯质纸，吸墨不均
    OFFSET: 1.1, // 双胶纸，稍有风险
    LIGHTWEIGHT: 1.3, // 轻型纸，风险较高
} as const;

// =============================================================================
// 成本评分配置
// =============================================================================

/**
 * 纸张类型的成本等级
 * 分数越高表示成本越低（更经济）
 */
export const PAPER_COST_SCORES = {
    LIGHTWEIGHT: 90, // 轻型纸最便宜
    OFFSET: 80, // 双胶纸较便宜
    UNCOATED: 70, // 纯质纸中等
    COATED: 60, // 铜版纸较贵
    PREMIUM_MATTE: 40, // 高阶映画最贵
} as const;

/**
 * 配方成本等级对应分数
 */
export const RECIPE_COST_SCORES = {
    LOW: 100,
    MEDIUM: 70,
    HIGH: 40,
} as const;

// =============================================================================
// 适用性评分配置
// =============================================================================

/**
 * 印刷类型与纸张的适配分数
 */
export const PRINT_TYPE_PAPER_FIT = {
    offset: {
        PREMIUM_MATTE: 100,
        COATED: 95,
        UNCOATED: 85,
        OFFSET: 80,
        LIGHTWEIGHT: 60,
    },
    digital: {
        PREMIUM_MATTE: 90,
        COATED: 95,
        UNCOATED: 80,
        OFFSET: 75,
        LIGHTWEIGHT: 70,
    },
    screen: {
        PREMIUM_MATTE: 70,
        COATED: 80,
        UNCOATED: 90,
        OFFSET: 85,
        LIGHTWEIGHT: 60,
    },
    flexo: {
        PREMIUM_MATTE: 60,
        COATED: 85,
        UNCOATED: 80,
        OFFSET: 90,
        LIGHTWEIGHT: 95,
    },
    gravure: {
        PREMIUM_MATTE: 95,
        COATED: 100,
        UNCOATED: 70,
        OFFSET: 75,
        LIGHTWEIGHT: 60,
    },
    other: {
        PREMIUM_MATTE: 80,
        COATED: 80,
        UNCOATED: 80,
        OFFSET: 80,
        LIGHTWEIGHT: 80,
    },
} as const;

/**
 * 特殊工艺对纸张的要求
 * 不适配时的扣分值
 */
export const SPECIAL_PROCESS_REQUIREMENTS = {
    varnish: {
        incompatible: ['LIGHTWEIGHT'],
        penalty: 30,
    },
    lamination: {
        incompatible: ['LIGHTWEIGHT'],
        penalty: 25,
    },
    embossing: {
        incompatible: ['LIGHTWEIGHT', 'OFFSET'],
        penalty: 40,
    },
    foil: {
        incompatible: [],
        penalty: 0,
    },
    die_cut: {
        incompatible: [],
        penalty: 0,
    },
    uv: {
        incompatible: ['UNCOATED', 'LIGHTWEIGHT'],
        penalty: 35,
    },
    spot_uv: {
        incompatible: ['UNCOATED', 'LIGHTWEIGHT'],
        penalty: 30,
    },
    other: {
        incompatible: [],
        penalty: 0,
    },
} as const;

// =============================================================================
// 推荐阈值配置
// =============================================================================

/**
 * 综合得分对应的推荐等级
 */
export const RECOMMENDATION_THRESHOLDS = {
    /** 强烈推荐阈值 */
    HIGHLY_RECOMMENDED: 85,
    /** 推荐阈值 */
    RECOMMENDED: 70,
    /** 可用阈值 */
    USABLE: 50,
    /** 低于此值建议避免 */
    AVOID: 50,
} as const;

/**
 * 避坑触发条件
 */
export const AVOID_CONDITIONS = {
    /** ΔE 超过此值强制避坑 */
    maxDeltaE: 8.0,
    /** 风险分低于此值强制避坑 */
    minRiskScore: 40,
    /** 综合分低于此值列入避坑 */
    minTotalScore: 45,
} as const;

// =============================================================================
// 类型导出
// =============================================================================

export type DimensionKey = keyof typeof DIMENSION_WEIGHTS;
export type RiskTag = keyof typeof RISK_TAG_PENALTIES;
export type PaperType = keyof typeof PAPER_RISK_FACTORS;
export type PrintType = keyof typeof PRINT_TYPE_PAPER_FIT;
export type SpecialProcess = keyof typeof SPECIAL_PROCESS_REQUIREMENTS;

// =============================================================================
// 辅助函数
// =============================================================================

/**
 * 根据 ΔE 获取还原度得分
 */
export function getDeltaEScore(deltaE: number): { score: number; label: string } {
    for (const threshold of DELTA_E_SCORE_THRESHOLDS) {
        if (deltaE <= threshold.maxDeltaE) {
            return { score: threshold.score, label: threshold.label };
        }
    }
    return { score: 20, label: '严重偏差' };
}

/**
 * 根据风险标签计算风险得分
 */
export function calculateRiskScore(
    riskTags: string[],
    paperType: PaperType
): { score: number; penalties: Array<{ tag: string; penalty: number }> } {
    let totalPenalty = 0;
    const penalties: Array<{ tag: string; penalty: number }> = [];

    for (const tag of riskTags) {
        const basePenalty = RISK_TAG_PENALTIES[tag as RiskTag] || 0;
        const adjustedPenalty = Math.round(basePenalty * (PAPER_RISK_FACTORS[paperType] || 1.0));
        if (adjustedPenalty > 0) {
            penalties.push({ tag, penalty: adjustedPenalty });
            totalPenalty += adjustedPenalty;
        }
    }

    return {
        score: Math.max(0, 100 - totalPenalty),
        penalties,
    };
}

/**
 * 计算适用性得分
 */
export function calculateSuitabilityScore(
    printType: PrintType,
    paperType: PaperType,
    specialProcesses: string[]
): { score: number; incompatibilities: string[] } {
    // 基础适配分
    let score = PRINT_TYPE_PAPER_FIT[printType]?.[paperType] ?? 80;
    const incompatibilities: string[] = [];

    // 特殊工艺扣分
    for (const process of specialProcesses) {
        const requirement = SPECIAL_PROCESS_REQUIREMENTS[process as SpecialProcess];
        if (requirement?.incompatible.includes(paperType)) {
            score -= requirement.penalty;
            incompatibilities.push(process);
        }
    }

    return {
        score: Math.max(0, score),
        incompatibilities,
    };
}
