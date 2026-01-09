/**
 * Lab 光谱分析组件类型定义
 */

export interface PaperProfile {
    paperType: string;
    labL: number;
    labA: number;
    labB: number;
    deltaE: number | null;
    recommendation?: string;
}

export interface TrueSource {
    labL: number;
    labA: number;
    labB: number;
}

export interface LabSpectrumCardProps {
    trueSource: TrueSource;
    paperProfiles?: PaperProfile[];
    deltaETolerance?: number;
    className?: string;
}

export interface ChromaticityPlotProps {
    trueSource: TrueSource;
    paperProfiles: PaperProfile[];
    deltaETolerance: number;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    pan: { x: number; y: number };
    onPanChange: (pan: { x: number; y: number }) => void;
    paperVisibility: Record<string, boolean>;
    showSafeZone: boolean;
    showToleranceZone: boolean;
    showConnections: boolean;
}

export interface LightnessScaleProps {
    trueSourceL: number;
    paperProfiles: PaperProfile[];
    zoom: number;
    paperVisibility: Record<string, boolean>;
}

export interface ToolbarProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onFocusSource: () => void;
    showSafeZone: boolean;
    onToggleSafeZone: () => void;
    showToleranceZone: boolean;
    onToggleToleranceZone: () => void;
    showConnections: boolean;
    onToggleConnections: () => void;
    availablePaperTypes: string[];
    paperVisibility: Record<string, boolean>;
    onTogglePaperVisibility: (paperType: string) => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}
