/**
 * Lab 光谱分析卡片
 * 
 * 此文件作为向后兼容的入口点，重新导出模块化后的组件。
 * 新代码建议直接从 ./lab-spectrum 目录导入。
 * 
 * @example
 * // 旧方式（仍然支持）
 * import { LabSpectrumCard } from '@/components/color/lab-spectrum-card';
 * 
 * // 新方式（推荐）
 * import { 
 *   LabSpectrumCard,           // 响应式版本（自动切换）
 *   LabSpectrumCardDesktop,    // 桌面版
 *   LabSpectrumCardTablet,     // 平板版
 *   LabSpectrumCardMobile,     // 手机版
 *   LabSpectrumCardResponsive, // 响应式版本
 *   LabSpectrumCardWithVariant // 可指定版本
 * } from '@/components/color/lab-spectrum';
 */

export {
    // 主组件（响应式）
    LabSpectrumCard,
    LabSpectrumCardResponsive,
    LabSpectrumCardWithVariant,

    // 各版本主组件
    LabSpectrumCardDesktop,
    LabSpectrumCardTablet,
    LabSpectrumCardMobile,

    // 子组件
    Toolbar,
    ChromaticityPlot,
    LightnessScale,

    // 类型
    type PaperProfile,
    type TrueSource,
    type LabSpectrumCardProps,
    type ChromaticityPlotProps,
    type LightnessScaleProps,
    type ToolbarProps,

    // 常量
    PAPER_TYPE_LABELS,
    PAPER_COLORS,
    PLOT_CONFIG,
    PLOT_DIMENSIONS,
} from './lab-spectrum';
