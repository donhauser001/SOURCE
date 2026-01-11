/**
 * 色彩组件统一导出
 */

// 标准色彩卡片（Coolors 风格）
export {
    StandardColorCard,
    labToRgb,
    getSoftBackgroundColor,
    getContrastTextColor
} from './standard-color-card';
export type {
    StandardColorData,
    StandardColorCardProps
} from './standard-color-card';

// 极简色彩卡片
export { MinimalColorCard } from './minimal-color-card';
export type {
    MinimalColorData,
    MinimalColorCardProps
} from './minimal-color-card';

// 色彩列表条目
export { ColorListItem } from './color-list-item';
export type {
    ColorListItemData,
    ColorListItemProps
} from './color-list-item';

// 色彩库视图（支持多种视图模式）
export { ColorLibraryView } from './color-library-view';
export type { ViewMode } from './color-library-view';

// 色彩身份证
export { ColorIdentityCard } from './identity';
export type { ColorData } from './identity';

// 色彩列表（旧版，保留兼容）
export { ColorListClientB } from './color-list-client-b';

// 色彩色块
export { ColorSwatch } from './color-swatch';

// 纸张档案卡片
export { PaperProfileCard } from './paper-profile-card';

// 油墨配方展示
export { InkRecipeDisplay } from './ink-recipe-display';

// Lab 可视化
export { LabSpectrumCard } from './lab-spectrum-card';
export { LabVisualizer } from './lab-visualizer';

// 材料雷达图
export { MaterialRadar } from './material-radar';

// 打样包卡片
export { ProofingPackCard } from './proofing-pack-card';
