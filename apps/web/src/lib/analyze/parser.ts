/**
 * SourcePack 解析服务
 *
 * 负责：
 * 1. 解析和验证 SourcePack JSON
 * 2. 颜色映射（匹配 SOURCE 数据库中的颜色）
 * 3. 生成分析摘要
 */

import { prisma } from '@/lib/db';
import type { SourcePack, ColorItem, LabValue } from '@/lib/validations/sourcepack';
import { parseSourcePack } from '@/lib/validations/sourcepack';

// =============================================================================
// 类型定义
// =============================================================================

/**
 * 颜色映射状态
 */
export enum ColorMappingStatus {
    /** 已验证 - 完全匹配 SOURCE 数据库中的颜色 */
    VERIFIED = 'verified',
    /** 部分匹配 - 基于 Lab 值找到相近颜色 */
    PARTIAL_MATCH = 'partial_match',
    /** 未映射 - 数据库中没有匹配的颜色 */
    UNMAPPED = 'unmapped',
}

/**
 * 映射后的颜色项
 */
export interface MappedColorItem {
    /** 原始颜色项 */
    original: ColorItem;
    /** 映射状态 */
    status: ColorMappingStatus;
    /** 匹配到的 SOURCE 颜色 ID */
    matchedColorId?: string;
    /** 匹配到的 SOURCE 颜色名称 */
    matchedColorName?: string;
    /** 匹配到的颜色审计状态 */
    matchedAuditStatus?: string;
    /** 与匹配颜色的 ΔE 值 */
    deltaE?: number;
    /** 映射说明 */
    mappingNote?: string;
}

/**
 * 解析结果
 */
export interface ParseResult {
    success: boolean;
    /** 原始 SourcePack */
    sourcePack?: SourcePack;
    /** 映射后的颜色列表 */
    mappedColors?: MappedColorItem[];
    /** 摘要统计 */
    summary?: {
        totalColors: number;
        verifiedCount: number;
        partialMatchCount: number;
        unmappedCount: number;
        riskColorsCount: number;
    };
    /** 错误信息 */
    errors?: Array<{
        path: string;
        message: string;
    }>;
}

// =============================================================================
// Lab 色差计算（CIE76 简化版）
// =============================================================================

/**
 * 计算两个 Lab 值之间的 ΔE（CIE76）
 * 注意：这是简化版本，生产环境建议使用 CIE2000
 */
export function calculateDeltaE(lab1: LabValue, lab2: LabValue): number {
    const dL = lab1.L - lab2.L;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * ΔE 阈值配置
 */
export const DELTA_E_THRESHOLDS = {
    /** 完全匹配阈值 */
    EXACT_MATCH: 1.0,
    /** 接近匹配阈值（可接受的色差） */
    CLOSE_MATCH: 3.0,
    /** 部分匹配阈值（建议验证） */
    PARTIAL_MATCH: 6.0,
};

// =============================================================================
// 颜色映射逻辑
// =============================================================================

/**
 * 从数据库获取所有可映射的颜色
 */
async function getAllSourceColors() {
    return prisma.color.findMany({
        where: {
            status: {
                in: ['ACTIVE', 'VERIFIED', 'EXPERIMENTAL'],
            },
        },
        select: {
            id: true,
            colorId: true,
            name: true,
            labL: true,
            labA: true,
            labB: true,
            auditStatus: true,
            status: true,
        },
    });
}

/**
 * 通过 ColorID 精确匹配
 */
async function findByColorId(colorId: string) {
    return prisma.color.findUnique({
        where: { colorId },
        select: {
            id: true,
            colorId: true,
            name: true,
            labL: true,
            labA: true,
            labB: true,
            auditStatus: true,
            status: true,
        },
    });
}

/**
 * 通过 Lab 值查找最接近的颜色
 */
async function findByLabValue(lab: LabValue): Promise<{
    color: Awaited<ReturnType<typeof getAllSourceColors>>[0] | null;
    deltaE: number;
}> {
    const allColors = await getAllSourceColors();

    let closestColor: (typeof allColors)[0] | null = null;
    let minDeltaE = Infinity;

    for (const color of allColors) {
        const colorLab: LabValue = {
            L: color.labL,
            a: color.labA,
            b: color.labB,
        };
        const deltaE = calculateDeltaE(lab, colorLab);

        if (deltaE < minDeltaE) {
            minDeltaE = deltaE;
            closestColor = color;
        }
    }

    return { color: closestColor, deltaE: minDeltaE };
}

/**
 * 映射单个颜色项
 */
async function mapColorItem(item: ColorItem): Promise<MappedColorItem> {
    // 1. 如果有 colorId，优先精确匹配
    if (item.colorId) {
        const exactMatch = await findByColorId(item.colorId);

        if (exactMatch) {
            // 如果还有 Lab 值，计算色差作为参考
            let deltaE: number | undefined;
            if (item.lab) {
                deltaE = calculateDeltaE(item.lab, {
                    L: exactMatch.labL,
                    a: exactMatch.labA,
                    b: exactMatch.labB,
                });
            }

            return {
                original: item,
                status: ColorMappingStatus.VERIFIED,
                matchedColorId: exactMatch.colorId,
                matchedColorName: exactMatch.name,
                matchedAuditStatus: exactMatch.auditStatus,
                deltaE,
                mappingNote: '通过 ColorID 精确匹配',
            };
        }

        // ColorID 没找到，但可能是输入错误
        // 继续尝试 Lab 匹配
    }

    // 2. 通过 Lab 值匹配
    if (item.lab) {
        const { color, deltaE } = await findByLabValue(item.lab);

        if (color) {
            // 完全匹配
            if (deltaE <= DELTA_E_THRESHOLDS.EXACT_MATCH) {
                return {
                    original: item,
                    status: ColorMappingStatus.VERIFIED,
                    matchedColorId: color.colorId,
                    matchedColorName: color.name,
                    matchedAuditStatus: color.auditStatus,
                    deltaE,
                    mappingNote: `通过 Lab 值精确匹配（ΔE=${deltaE.toFixed(2)}）`,
                };
            }

            // 接近匹配
            if (deltaE <= DELTA_E_THRESHOLDS.CLOSE_MATCH) {
                return {
                    original: item,
                    status: ColorMappingStatus.VERIFIED,
                    matchedColorId: color.colorId,
                    matchedColorName: color.name,
                    matchedAuditStatus: color.auditStatus,
                    deltaE,
                    mappingNote: `通过 Lab 值匹配（ΔE=${deltaE.toFixed(2)}，在可接受范围内）`,
                };
            }

            // 部分匹配 - 需要用户确认
            if (deltaE <= DELTA_E_THRESHOLDS.PARTIAL_MATCH) {
                return {
                    original: item,
                    status: ColorMappingStatus.PARTIAL_MATCH,
                    matchedColorId: color.colorId,
                    matchedColorName: color.name,
                    matchedAuditStatus: color.auditStatus,
                    deltaE,
                    mappingNote: `找到相近颜色（ΔE=${deltaE.toFixed(2)}），建议确认或打样验证`,
                };
            }

            // 太远了，视为未映射
            return {
                original: item,
                status: ColorMappingStatus.UNMAPPED,
                deltaE,
                mappingNote: `未找到匹配颜色，最近的是 ${color.name}（ΔE=${deltaE.toFixed(2)}，超出阈值）`,
            };
        }
    }

    // 3. 没有足够信息进行映射
    return {
        original: item,
        status: ColorMappingStatus.UNMAPPED,
        mappingNote: item.colorId
            ? `ColorID "${item.colorId}" 在数据库中不存在`
            : '未提供 Lab 值，无法进行颜色映射',
    };
}

// =============================================================================
// 主解析函数
// =============================================================================

/**
 * 解析 SourcePack JSON 字符串
 */
export async function parseAndMapSourcePack(jsonString: string): Promise<ParseResult> {
    // 1. 解析和验证 JSON
    const parseResult = parseSourcePack(jsonString);

    if (!parseResult.success || !parseResult.data) {
        return {
            success: false,
            errors: parseResult.errors,
        };
    }

    const sourcePack = parseResult.data;

    // 2. 映射所有颜色
    const mappedColors: MappedColorItem[] = [];

    for (const colorItem of sourcePack.colors) {
        const mapped = await mapColorItem(colorItem);
        mappedColors.push(mapped);
    }

    // 3. 计算摘要统计
    const verifiedCount = mappedColors.filter((c) => c.status === ColorMappingStatus.VERIFIED).length;
    const partialMatchCount = mappedColors.filter((c) => c.status === ColorMappingStatus.PARTIAL_MATCH).length;
    const unmappedCount = mappedColors.filter((c) => c.status === ColorMappingStatus.UNMAPPED).length;
    const riskColorsCount = mappedColors.filter((c) => c.original.riskTags && c.original.riskTags.length > 0).length;

    return {
        success: true,
        sourcePack,
        mappedColors,
        summary: {
            totalColors: mappedColors.length,
            verifiedCount,
            partialMatchCount,
            unmappedCount,
            riskColorsCount,
        },
    };
}

/**
 * 解析 SourcePack 对象（已解析的 JSON）
 */
export async function mapSourcePack(sourcePack: SourcePack): Promise<ParseResult> {
    // 映射所有颜色
    const mappedColors: MappedColorItem[] = [];

    for (const colorItem of sourcePack.colors) {
        const mapped = await mapColorItem(colorItem);
        mappedColors.push(mapped);
    }

    // 计算摘要统计
    const verifiedCount = mappedColors.filter((c) => c.status === ColorMappingStatus.VERIFIED).length;
    const partialMatchCount = mappedColors.filter((c) => c.status === ColorMappingStatus.PARTIAL_MATCH).length;
    const unmappedCount = mappedColors.filter((c) => c.status === ColorMappingStatus.UNMAPPED).length;
    const riskColorsCount = mappedColors.filter((c) => c.original.riskTags && c.original.riskTags.length > 0).length;

    return {
        success: true,
        sourcePack,
        mappedColors,
        summary: {
            totalColors: mappedColors.length,
            verifiedCount,
            partialMatchCount,
            unmappedCount,
            riskColorsCount,
        },
    };
}
