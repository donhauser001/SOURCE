/**
 * Lab 光谱分析组件模块
 * 
 * 目录结构：
 * - types.ts          类型定义
 * - constants.ts      常量（纸张标签、颜色、配置）
 * - toolbar.tsx       工具栏组件
 * - chromaticity-plot.tsx  色度坐标图组件
 * - lightness-scale.tsx    明度标尺组件
 * - lab-spectrum-card.desktop.tsx  桌面版主组件
 * - lab-spectrum-card.tablet.tsx   平板版主组件（待开发）
 * - lab-spectrum-card.mobile.tsx   手机版主组件（待开发）
 */

// 类型导出
export * from './types';

// 常量导出
export { PAPER_TYPE_LABELS, PAPER_COLORS, PLOT_CONFIG, PLOT_DIMENSIONS } from './constants';

// 组件导出
export { Toolbar } from './toolbar';
export { ChromaticityPlot } from './chromaticity-plot';
export { LightnessScale } from './lightness-scale';

// 主组件导出
export { LabSpectrumCardDesktop } from './lab-spectrum-card.desktop';

// 默认导出桌面版作为主组件
// 未来可以根据设备类型自动选择版本
export { LabSpectrumCardDesktop as LabSpectrumCard } from './lab-spectrum-card.desktop';
