/**
 * Lab 光谱分析组件常量
 */

// 纸张类型到中文名的映射
export const PAPER_TYPE_LABELS: Record<string, string> = {
    COATED: '铜版纸',
    UNCOATED: '胶版纸',
    MATTE: '哑粉纸',
    PREMIUM_MATTE: '高级哑粉纸',
    ART: '高阶映画',
    NEWSPRINT: '新闻纸',
    LIGHTWEIGHT: '轻型纸',
    PURE: '纯质纸',
    GLOSSY: '光面纸',
    SILK: '丝绒纸',
    RECYCLED: '再生纸',
    BOND: '证券纸',
    KRAFT: '牛皮纸',
    CARDSTOCK: '卡纸',
    VELLUM: '仿羊皮纸',
    PARCHMENT: '羊皮纸',
    CANVAS: '画布纸',
    PHOTO: '相纸',
};

// 纸张类型对应的颜色
export const PAPER_COLORS: Record<string, string> = {
    COATED: '#3b82f6',      // 蓝色，避免与真源青色混淆
    UNCOATED: '#a78bfa',    // 紫色
    MATTE: '#fb923c',       // 橙色
    PREMIUM_MATTE: '#f97316', // 深橙色
    ART: '#4ade80',         // 绿色
    NEWSPRINT: '#facc15',   // 黄色
    LIGHTWEIGHT: '#f87171', // 红色
    PURE: '#e879f9',        // 粉紫色
    GLOSSY: '#06b6d4',      // 青绿色
    SILK: '#ec4899',        // 粉红色
    RECYCLED: '#84cc16',    // 黄绿色
    BOND: '#8b5cf6',        // 紫罗兰
    KRAFT: '#d97706',       // 琥珀色
    CARDSTOCK: '#64748b',   // 灰蓝色
    VELLUM: '#fbbf24',      // 金黄色
    PARCHMENT: '#a3a3a3',   // 灰色
    CANVAS: '#78716c',      // 棕灰色
    PHOTO: '#0ea5e9',       // 天蓝色
};

// 色度坐标图 viewBox 参数
export const PLOT_CONFIG = {
    viewWidth: 600,
    viewHeight: 450,
    padding: 50,
    baseRangeA: 80,
    baseRangeB: 60,
} as const;

// 计算派生值
export const PLOT_DIMENSIONS = {
    ...PLOT_CONFIG,
    plotWidth: PLOT_CONFIG.viewWidth - PLOT_CONFIG.padding * 2,
    plotHeight: PLOT_CONFIG.viewHeight - PLOT_CONFIG.padding * 2,
    centerX: PLOT_CONFIG.viewWidth / 2,
    centerY: PLOT_CONFIG.viewHeight / 2,
} as const;
