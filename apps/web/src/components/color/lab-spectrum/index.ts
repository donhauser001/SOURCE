/**
 * Lab 光谱分析组件模块
 * 
 * 目录结构：
 * - types.ts                      类型定义
 * - constants.ts                  常量（纸张标签、颜色、配置）
 * - toolbar.tsx                   工具栏组件
 * - chromaticity-plot.tsx         色度坐标图组件
 * - lightness-scale.tsx           明度标尺组件
 * - lab-spectrum-card.desktop.tsx 桌面版主组件
 * - lab-spectrum-card.tablet.tsx  平板版主组件
 * - lab-spectrum-card.mobile.tsx  手机版主组件
 * - lab-spectrum-card.responsive.tsx 响应式自动切换组件
 * 
 * 断点说明：
 * - < 640px: 手机版 (mobile)
 * - 640px - 1024px: 平板版 (tablet)
 * - > 1024px: 桌面版 (desktop)
 */

// 类型导出
export * from './types';

// 常量导出
export { PAPER_TYPE_LABELS, PAPER_COLORS, PLOT_CONFIG, PLOT_DIMENSIONS } from './constants';

// 子组件导出
export { Toolbar } from './toolbar';
export { ChromaticityPlot } from './chromaticity-plot';
export { LightnessScale } from './lightness-scale';

// 各版本主组件导出
export { LabSpectrumCardDesktop } from './lab-spectrum-card.desktop';
export { LabSpectrumCardTablet } from './lab-spectrum-card.tablet';
export { LabSpectrumCardMobile } from './lab-spectrum-card.mobile';

// 响应式组件导出
export { LabSpectrumCardResponsive, LabSpectrumCardWithVariant } from './lab-spectrum-card.responsive';

// 默认导出响应式版本作为主组件
export { LabSpectrumCardResponsive as LabSpectrumCard } from './lab-spectrum-card.responsive';
