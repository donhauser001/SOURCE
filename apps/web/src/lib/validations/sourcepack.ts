/**
 * SourcePack JSON Schema 定义
 *
 * SourcePack 是 SOURCE 系统的工程色彩包格式
 * 用于设计师导出工程中使用的色彩信息，供系统分析
 *
 * 文件扩展名: .sourcepack.json
 * 版本: 1.0
 */

import { z } from 'zod';

// =============================================================================
// 基础类型
// =============================================================================

/**
 * Lab 色彩空间值
 */
export const labValueSchema = z.object({
    L: z.number().min(0).max(100),
    a: z.number().min(-128).max(127),
    b: z.number().min(-128).max(127),
});

/**
 * RGB 色彩空间值
 */
export const rgbValueSchema = z.object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255),
    b: z.number().int().min(0).max(255),
});

/**
 * CMYK 色彩空间值
 */
export const cmykValueSchema = z.object({
    c: z.number().min(0).max(100),
    m: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    k: z.number().min(0).max(100),
});

// =============================================================================
// 文档信息
// =============================================================================

/**
 * 文档元信息
 */
export const docInfoSchema = z.object({
    /** 文档名称 */
    name: z.string().min(1).max(200),
    /** 导出时间 */
    exportedAt: z.string().datetime().optional(),
    /** 导出来源 (如 "Adobe InDesign", "Illustrator", "SOURCE Plugin") */
    source: z.string().max(100).optional(),
    /** 来源版本 */
    sourceVersion: z.string().max(50).optional(),
    /** 文档尺寸（毫米） */
    documentSize: z
        .object({
            width: z.number().positive(),
            height: z.number().positive(),
            unit: z.enum(['mm', 'inch', 'px']).default('mm'),
        })
        .optional(),
    /** 页数 */
    pageCount: z.number().int().positive().optional(),
});

// =============================================================================
// 印刷意图
// =============================================================================

/**
 * 印刷意图
 */
export const printIntentSchema = z.object({
    /** 印刷类型 */
    printType: z
        .enum([
            'offset', // 胶印
            'digital', // 数码印刷
            'screen', // 丝网印刷
            'flexo', // 柔印
            'gravure', // 凹印
            'other', // 其他
        ])
        .default('offset'),
    /** 印刷数量 */
    quantity: z.number().int().positive().optional(),
    /** 纸张偏好（纸张 ID 或类型） */
    preferredPaper: z.string().max(100).optional(),
    /** 特殊工艺 */
    specialProcesses: z
        .array(
            z.enum([
                'varnish', // 光油
                'lamination', // 覆膜
                'embossing', // 压凹凸
                'foil', // 烫金
                'die_cut', // 模切
                'uv', // UV
                'spot_uv', // 局部 UV
                'other', // 其他
            ])
        )
        .default([]),
    /** 备注 */
    notes: z.string().max(1000).optional(),
});

// =============================================================================
// 颜色项
// =============================================================================

/**
 * 颜色使用方式
 */
export const colorUsageSchema = z.enum([
    'fill', // 填充
    'stroke', // 描边
    'text', // 文字
    'image', // 图像
    'background', // 背景
    'other', // 其他
]);

/**
 * 颜色风险标签（设计师自标注）
 */
export const colorRiskTagSchema = z.enum([
    'large_area', // 大色块
    'gradient', // 渐变
    'overprint', // 叠印
    'fine_line', // 细线条
    'small_text', // 小字
    'bleed', // 出血区
    'critical', // 关键色
]);

/**
 * 单个颜色项
 */
export const colorItemSchema = z.object({
    /** 颜色 ID（如果已知 SOURCE ColorID） */
    colorId: z.string().max(50).optional(),
    /** 颜色名称（设计中的命名） */
    name: z.string().max(100).optional(),

    /** Lab 值（优先使用） */
    lab: labValueSchema.optional(),
    /** RGB 值 */
    rgb: rgbValueSchema.optional(),
    /** CMYK 值 */
    cmyk: cmykValueSchema.optional(),

    /** 使用方式 */
    usage: z.array(colorUsageSchema).default(['fill']),
    /** 使用次数/出现次数 */
    occurrenceCount: z.number().int().positive().optional(),
    /** 覆盖面积比例 (0-100) */
    coveragePercent: z.number().min(0).max(100).optional(),

    /** 风险标签 */
    riskTags: z.array(colorRiskTagSchema).default([]),

    /** 所在页面 */
    pages: z.array(z.number().int().positive()).optional(),

    /** 备注 */
    notes: z.string().max(500).optional(),
});

// =============================================================================
// SourcePack 主结构
// =============================================================================

/**
 * SourcePack 格式版本
 */
export const SOURCEPACK_VERSION = '1.0';

/**
 * SourcePack 主 Schema
 */
export const sourcePackSchema = z.object({
    /** SourcePack 格式版本 */
    version: z.literal(SOURCEPACK_VERSION),
    /** 文档信息 */
    docInfo: docInfoSchema,
    /** 印刷意图 */
    printIntent: printIntentSchema.optional(),
    /** 颜色列表 */
    colors: z.array(colorItemSchema).min(1).max(500),
});

// =============================================================================
// TypeScript 类型导出
// =============================================================================

export type LabValue = z.infer<typeof labValueSchema>;
export type RgbValue = z.infer<typeof rgbValueSchema>;
export type CmykValue = z.infer<typeof cmykValueSchema>;
export type DocInfo = z.infer<typeof docInfoSchema>;
export type PrintIntent = z.infer<typeof printIntentSchema>;
export type ColorUsage = z.infer<typeof colorUsageSchema>;
export type ColorRiskTag = z.infer<typeof colorRiskTagSchema>;
export type ColorItem = z.infer<typeof colorItemSchema>;
export type SourcePack = z.infer<typeof sourcePackSchema>;

// =============================================================================
// 验证函数
// =============================================================================

export interface SourcePackValidationResult {
    success: boolean;
    data?: SourcePack;
    errors?: Array<{
        path: string;
        message: string;
    }>;
}

/**
 * 验证 SourcePack JSON
 */
export function validateSourcePack(input: unknown): SourcePackValidationResult {
    const result = sourcePackSchema.safeParse(input);

    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }

    return {
        success: false,
        errors: result.error.issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
        })),
    };
}

/**
 * 解析 SourcePack JSON 字符串
 */
export function parseSourcePack(jsonString: string): SourcePackValidationResult {
    try {
        const parsed = JSON.parse(jsonString);
        return validateSourcePack(parsed);
    } catch {
        return {
            success: false,
            errors: [
                {
                    path: '',
                    message: 'JSON 格式无效，请检查文件内容',
                },
            ],
        };
    }
}

// =============================================================================
// 示例 SourcePack（用于文档和测试）
// =============================================================================

export const exampleSourcePack: SourcePack = {
    version: '1.0',
    docInfo: {
        name: '品牌画册-2026春季版',
        exportedAt: '2026-01-08T10:30:00Z',
        source: 'Adobe InDesign',
        sourceVersion: '2026',
        documentSize: {
            width: 210,
            height: 297,
            unit: 'mm',
        },
        pageCount: 24,
    },
    printIntent: {
        printType: 'offset',
        quantity: 5000,
        preferredPaper: 'PREMIUM_MATTE',
        specialProcesses: ['varnish'],
        notes: '封面需要局部 UV',
    },
    colors: [
        {
            colorId: 'CN-Song-04',
            name: '烟雨青',
            lab: { L: 65.2, a: -12.3, b: -8.5 },
            usage: ['fill', 'background'],
            occurrenceCount: 15,
            coveragePercent: 25,
            riskTags: ['large_area'],
            pages: [1, 2, 5, 8],
        },
        {
            name: '主题红',
            lab: { L: 45.0, a: 58.0, b: 32.0 },
            cmyk: { c: 0, m: 95, y: 90, k: 10 },
            usage: ['text', 'stroke'],
            occurrenceCount: 42,
            riskTags: ['small_text'],
        },
        {
            name: '未知灰',
            rgb: { r: 128, g: 128, b: 128 },
            usage: ['fill'],
            occurrenceCount: 8,
            riskTags: [],
        },
    ],
};
