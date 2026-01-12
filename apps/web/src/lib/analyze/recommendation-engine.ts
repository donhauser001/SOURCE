/**
 * 推荐引擎核心服务
 *
 * 基于规则的纸张推荐系统（不使用 AI）
 * 每条推荐都带有可追溯的证据链
 */

import { prisma } from '@/lib/db';
import type { MappedColorItem } from './parser';
import type { PrintIntent, ColorRiskTag } from '@/lib/validations/sourcepack';
import {
    DIMENSION_WEIGHTS,
    PAPER_COST_SCORES,
    RECOMMENDATION_THRESHOLDS,
    AVOID_CONDITIONS,
    getDeltaEScore,
    calculateRiskScore,
    calculateSuitabilityScore,
    type PaperType,
    type PrintType,
} from './scoring-config';

// =============================================================================
// 类型定义
// =============================================================================

/**
 * 单个颜色在特定纸张上的评分详情
 */
export interface ColorPaperScore {
    colorId?: string;
    colorName?: string;
    paperType: PaperType;
    /** 四维得分 */
    scores: {
        fidelity: number;
        risk: number;
        cost: number;
        suitability: number;
    };
    /** 加权总分 */
    totalScore: number;
    /** 色差值 */
    deltaE?: number;
    /** 风险扣分详情 */
    riskPenalties: Array<{ tag: string; penalty: number }>;
    /** 证据：关联的 PaperProfile ID */
    paperProfileId?: string;
    /** 证据：关联的 Batch ID */
    batchId?: string;
}

/**
 * 风险项
 */
export interface RiskItem {
    /** 风险类型 */
    type: ColorRiskTag;
    /** 风险等级 */
    severity: 'low' | 'medium' | 'high';
    /** 受影响颜色 */
    affectedColors: string[];
    /** 风险说明 */
    description: string;
    /** 建议措施 */
    mitigation: string;
}

/**
 * 纸张推荐项
 */
export interface PaperRecommendationItem {
    /** 纸张类型 */
    paperType: PaperType;
    /** 推荐等级 */
    recommendationLevel: 'highly_recommended' | 'recommended' | 'usable' | 'not_recommended';
    /** 综合得分 */
    totalScore: number;
    /** 各维度得分 */
    dimensionScores: {
        fidelity: number;
        risk: number;
        cost: number;
        suitability: number;
    };
    /** 推荐理由 */
    reasons: string[];
    /** 注意事项 */
    cautions: string[];
    /** 证据链 */
    evidence: {
        paperProfileCount: number;
        batchIds: string[];
        auditNoteIds: string[];
    };
}

/**
 * 避坑项
 */
export interface AvoidItem {
    /** 纸张类型 */
    paperType: PaperType;
    /** 避坑原因 */
    reasons: string[];
    /** 受影响颜色 */
    affectedColors: string[];
    /** 严重程度 */
    severity: 'warning' | 'critical';
}

/**
 * 推荐引擎输出结果
 */
export interface RecommendationResult {
    /** 风险识别结果 */
    risks: RiskItem[];
    /** Top 3 推荐纸张 */
    recommendations: PaperRecommendationItem[];
    /** 避坑列表 */
    avoidList: AvoidItem[];
    /** 引用的证据 ID 列表 */
    citations: string[];
    /** 分析元数据 */
    metadata: {
        analyzedAt: string;
        colorCount: number;
        verifiedColorCount: number;
        unmappedColorCount: number;
    };
}

// =============================================================================
// 风险识别
// =============================================================================

const RISK_DESCRIPTIONS: Record<ColorRiskTag, { description: string; mitigation: string }> = {
    large_area: {
        description: '大面积色块印刷难度高，易出现墨杠、色差不均、鬼影等问题',
        mitigation: '建议选择吸墨性稳定的纸张，控制印刷速度，增加润版液',
    },
    gradient: {
        description: '渐变区域过渡要求高，易出现阶梯感、断层、条纹',
        mitigation: '选择细腻度高的纸张，优化网点线数，调整渐变曲线',
    },
    overprint: {
        description: '叠印区域套准精度要求高，易出现露白、脏色、套印不准',
        mitigation: '确保印刷机套准精度，调整叠印顺序，考虑陷印处理',
    },
    fine_line: {
        description: '细线条印刷易断线、模糊、粗细不均',
        mitigation: '选择平滑度高的纸张，控制印刷压力，注意网点扩大',
    },
    small_text: {
        description: '小字清晰度要求高，易糊字、缺笔、边缘毛糙',
        mitigation: '选择涂布纸或高平滑度纸张，避免使用彩色小字',
    },
    bleed: {
        description: '出血区域裁切误差敏感，设计稿需留足出血位',
        mitigation: '确保出血位≥3mm，关键元素远离裁切线',
    },
    critical: {
        description: '关键色容差要求严格，需要精确还原',
        mitigation: '打样确认，使用专色或调配特定配方，多次上机校色',
    },
};

/**
 * 分析风险并生成风险列表
 */
export function analyzeRisks(mappedColors: MappedColorItem[]): RiskItem[] {
    const riskMap = new Map<ColorRiskTag, string[]>();

    // 收集所有风险标签和对应的颜色
    for (const color of mappedColors) {
        const colorName = color.original.name || color.original.colorId || '未命名颜色';
        const riskTags = color.original.riskTags || [];

        for (const tag of riskTags) {
            if (!riskMap.has(tag)) {
                riskMap.set(tag, []);
            }
            riskMap.get(tag)!.push(colorName);
        }
    }

    // 生成风险项
    const risks: RiskItem[] = [];

    for (const [tag, affectedColors] of riskMap) {
        const info = RISK_DESCRIPTIONS[tag];
        const severity = getSeverity(tag, affectedColors.length);

        risks.push({
            type: tag,
            severity,
            affectedColors,
            description: info.description,
            mitigation: info.mitigation,
        });
    }

    // 按严重程度排序
    return risks.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity];
    });
}

/**
 * 根据风险类型和受影响颜色数量判断严重程度
 */
function getSeverity(tag: ColorRiskTag, affectedCount: number): 'low' | 'medium' | 'high' {
    const highRiskTags: ColorRiskTag[] = ['overprint', 'gradient', 'large_area'];
    const mediumRiskTags: ColorRiskTag[] = ['critical', 'fine_line', 'small_text'];

    if (highRiskTags.includes(tag) || affectedCount >= 3) {
        return 'high';
    }
    if (mediumRiskTags.includes(tag) || affectedCount >= 2) {
        return 'medium';
    }
    return 'low';
}

// =============================================================================
// 纸张推荐生成
// =============================================================================

const PAPER_TYPE_NAMES: Record<PaperType, string> = {
    PREMIUM_MATTE: '高阶映画',
    COATED: '铜版纸',
    UNCOATED: '纯质纸',
    OFFSET: '双胶纸',
    LIGHTWEIGHT: '轻型纸',
};

/**
 * 生成纸张推荐
 */
export async function generateRecommendations(
    mappedColors: MappedColorItem[],
    printIntent?: PrintIntent
): Promise<{
    recommendations: PaperRecommendationItem[];
    avoidList: AvoidItem[];
    citations: string[];
}> {
    const paperTypes: PaperType[] = ['PREMIUM_MATTE', 'COATED', 'UNCOATED', 'OFFSET', 'LIGHTWEIGHT'];
    const printType: PrintType = (printIntent?.printType as PrintType) || 'offset';
    const specialProcesses = printIntent?.specialProcesses || [];

    // 获取已映射颜色的 PaperProfile 数据
    const verifiedColorIds = mappedColors
        .filter((c) => c.matchedColorId)
        .map((c) => c.matchedColorId!)
        .filter((v, i, a) => a.indexOf(v) === i); // 去重

    const paperProfiles = await prisma.paperProfile.findMany({
        where: {
            color: {
                colorId: { in: verifiedColorIds },
            },
        },
        include: {
            color: true,
            batch: true,
            paperType: true,
        },
    });

    // 获取相关的审计注记
    const auditNotes = await prisma.auditNote.findMany({
        where: {
            targetType: 'PAPER_PROFILE',
            targetId: { in: paperProfiles.map((p) => p.id) },
        },
    });

    const citations: string[] = [];
    const paperScores: Map<PaperType, PaperRecommendationItem> = new Map();

    // 为每种纸张计算得分
    for (const paperType of paperTypes) {
        const relevantProfiles = paperProfiles.filter((p) => p.paperType.code === paperType);
        const relevantAuditNotes = auditNotes.filter((n) => relevantProfiles.some((p) => p.id === n.targetId));

        // 收集证据
        const batchIds = [...new Set(relevantProfiles.map((p) => p.batchId).filter(Boolean))] as string[];
        const auditNoteIds = relevantAuditNotes.map((n) => n.id);

        citations.push(...relevantProfiles.map((p) => p.id));
        citations.push(...batchIds);
        citations.push(...auditNoteIds);

        // 计算各维度得分
        const dimensionScores = calculateDimensionScores(
            mappedColors,
            paperType,
            relevantProfiles,
            printType,
            specialProcesses
        );

        // 计算加权总分
        const totalScore =
            dimensionScores.fidelity * DIMENSION_WEIGHTS.fidelity +
            dimensionScores.risk * DIMENSION_WEIGHTS.risk +
            dimensionScores.cost * DIMENSION_WEIGHTS.cost +
            dimensionScores.suitability * DIMENSION_WEIGHTS.suitability;

        // 生成推荐理由和注意事项
        const { reasons, cautions } = generateReasonsAndCautions(
            paperType,
            dimensionScores,
            relevantProfiles,
            mappedColors
        );

        // 确定推荐等级
        const recommendationLevel = getRecommendationLevel(totalScore);

        paperScores.set(paperType, {
            paperType,
            recommendationLevel,
            totalScore: Math.round(totalScore),
            dimensionScores: {
                fidelity: Math.round(dimensionScores.fidelity),
                risk: Math.round(dimensionScores.risk),
                cost: Math.round(dimensionScores.cost),
                suitability: Math.round(dimensionScores.suitability),
            },
            reasons,
            cautions,
            evidence: {
                paperProfileCount: relevantProfiles.length,
                batchIds,
                auditNoteIds,
            },
        });
    }

    // 排序并取 Top 3
    const sortedRecommendations = [...paperScores.values()].sort((a, b) => b.totalScore - a.totalScore);

    const recommendations = sortedRecommendations.slice(0, 3);
    const avoidList = generateAvoidList(sortedRecommendations, mappedColors);

    return {
        recommendations,
        avoidList,
        citations: [...new Set(citations)],
    };
}

/**
 * 计算各维度得分
 */
function calculateDimensionScores(
    mappedColors: MappedColorItem[],
    paperType: PaperType,
    profiles: Awaited<ReturnType<typeof prisma.paperProfile.findMany>>,
    printType: PrintType,
    specialProcesses: string[]
): { fidelity: number; risk: number; cost: number; suitability: number } {
    // 1. 还原度得分
    let fidelityScore = 70; // 基础分（无数据时）
    if (profiles.length > 0) {
        const deltaEScores = profiles.map((p) => {
            const deltaE = p.deltaE ?? 5;
            return getDeltaEScore(deltaE).score;
        });
        fidelityScore = deltaEScores.reduce((a, b) => a + b, 0) / deltaEScores.length;

        // 根据推荐等级调整
        const recommendationBonus = profiles.reduce((sum, p) => {
            switch (p.recommendation) {
                case 'BEST':
                    return sum + 10;
                case 'GOOD':
                    return sum + 5;
                case 'CAUTION':
                    return sum - 5;
                case 'AVOID':
                    return sum - 15;
                default:
                    return sum;
            }
        }, 0);
        fidelityScore = Math.min(100, Math.max(0, fidelityScore + recommendationBonus / profiles.length));
    }

    // 2. 风险得分
    const allRiskTags = mappedColors.flatMap((c) => c.original.riskTags || []);
    const { score: riskScore } = calculateRiskScore(allRiskTags, paperType);

    // 3. 成本得分
    const costScore = PAPER_COST_SCORES[paperType] ?? 70;

    // 4. 适用性得分
    const { score: suitabilityScore } = calculateSuitabilityScore(printType, paperType, specialProcesses);

    return {
        fidelity: fidelityScore,
        risk: riskScore,
        cost: costScore,
        suitability: suitabilityScore,
    };
}

/**
 * 生成推荐理由和注意事项
 */
function generateReasonsAndCautions(
    paperType: PaperType,
    scores: { fidelity: number; risk: number; cost: number; suitability: number },
    profiles: Awaited<ReturnType<typeof prisma.paperProfile.findMany>>,
    mappedColors: MappedColorItem[]
): { reasons: string[]; cautions: string[] } {
    const reasons: string[] = [];
    const cautions: string[] = [];
    const paperName = PAPER_TYPE_NAMES[paperType];

    // 还原度相关
    if (scores.fidelity >= 85) {
        reasons.push(`${paperName}色彩还原度优秀，ΔE值普遍较低`);
    } else if (scores.fidelity < 60) {
        cautions.push(`该纸张色彩还原度一般，建议打样确认`);
    }

    // 风险相关
    if (scores.risk >= 80) {
        reasons.push(`印刷风险较低，适合当前工程的用色特点`);
    } else if (scores.risk < 50) {
        cautions.push(`存在较高印刷风险，需特别注意工艺控制`);
    }

    // 成本相关
    if (scores.cost >= 80) {
        reasons.push(`成本经济，性价比高`);
    } else if (scores.cost < 50) {
        cautions.push(`纸张成本较高，建议评估预算`);
    }

    // 适用性相关
    if (scores.suitability >= 90) {
        reasons.push(`非常适合当前印刷方式`);
    } else if (scores.suitability < 60) {
        cautions.push(`与当前印刷方式或工艺要求不太匹配`);
    }

    // 数据支撑
    if (profiles.length > 0) {
        const bestCount = profiles.filter((p) => p.recommendation === 'BEST').length;
        if (bestCount > 0) {
            reasons.push(`有 ${bestCount} 个颜色在该纸张上表现为"最佳拍档"`);
        }
    } else {
        cautions.push(`缺少该纸张的验证数据，建议打样确认`);
    }

    // 未映射颜色警告
    const unmappedCount = mappedColors.filter((c) => !c.matchedColorId).length;
    if (unmappedCount > 0) {
        cautions.push(`有 ${unmappedCount} 个颜色未找到验证数据，效果无法保证`);
    }

    return { reasons, cautions };
}

/**
 * 根据分数确定推荐等级
 */
function getRecommendationLevel(score: number): 'highly_recommended' | 'recommended' | 'usable' | 'not_recommended' {
    if (score >= RECOMMENDATION_THRESHOLDS.HIGHLY_RECOMMENDED) {
        return 'highly_recommended';
    }
    if (score >= RECOMMENDATION_THRESHOLDS.RECOMMENDED) {
        return 'recommended';
    }
    if (score >= RECOMMENDATION_THRESHOLDS.USABLE) {
        return 'usable';
    }
    return 'not_recommended';
}

/**
 * 生成避坑列表
 */
function generateAvoidList(
    recommendations: PaperRecommendationItem[],
    mappedColors: MappedColorItem[]
): AvoidItem[] {
    const avoidList: AvoidItem[] = [];

    for (const rec of recommendations) {
        const shouldAvoid = rec.totalScore < AVOID_CONDITIONS.minTotalScore;
        const isHighRisk = rec.dimensionScores.risk < AVOID_CONDITIONS.minRiskScore;

        if (shouldAvoid || isHighRisk) {
            const reasons: string[] = [];
            const affectedColors: string[] = [];

            if (shouldAvoid) {
                reasons.push(`综合得分过低（${rec.totalScore}分）`);
            }
            if (isHighRisk) {
                reasons.push(`印刷风险过高（风险分 ${rec.dimensionScores.risk}）`);
            }
            if (rec.dimensionScores.fidelity < 50) {
                reasons.push(`色彩还原度差（还原分 ${rec.dimensionScores.fidelity}）`);
            }

            // 找出在该纸张上表现不佳的颜色
            for (const color of mappedColors) {
                if (color.deltaE && color.deltaE > AVOID_CONDITIONS.maxDeltaE) {
                    affectedColors.push(color.original.name || color.original.colorId || '未命名');
                }
            }

            avoidList.push({
                paperType: rec.paperType,
                reasons,
                affectedColors,
                severity: isHighRisk ? 'critical' : 'warning',
            });
        }
    }

    return avoidList;
}

// =============================================================================
// 主入口函数
// =============================================================================

/**
 * 运行推荐引擎
 */
export async function runRecommendationEngine(
    mappedColors: MappedColorItem[],
    printIntent?: PrintIntent
): Promise<RecommendationResult> {
    // 1. 风险识别
    const risks = analyzeRisks(mappedColors);

    // 2. 生成推荐
    const { recommendations, avoidList, citations } = await generateRecommendations(mappedColors, printIntent);

    // 3. 统计元数据
    const verifiedCount = mappedColors.filter((c) => c.matchedColorId).length;
    const unmappedCount = mappedColors.filter((c) => !c.matchedColorId).length;

    return {
        risks,
        recommendations,
        avoidList,
        citations,
        metadata: {
            analyzedAt: new Date().toISOString(),
            colorCount: mappedColors.length,
            verifiedColorCount: verifiedCount,
            unmappedColorCount: unmappedCount,
        },
    };
}
