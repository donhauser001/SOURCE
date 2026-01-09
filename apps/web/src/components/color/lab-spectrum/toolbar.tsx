'use client';

/**
 * Lab 光谱分析工具栏组件
 */

import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Shield, AlertCircle, Link2, ChevronDown, Check, Maximize2, Minimize2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { PAPER_TYPE_LABELS, PAPER_COLORS } from './constants';
import type { ToolbarProps } from './types';

export function Toolbar({
    zoom,
    onZoomIn,
    onZoomOut,
    onReset,
    onFocusSource,
    showSafeZone,
    onToggleSafeZone,
    showToleranceZone,
    onToggleToleranceZone,
    showConnections,
    onToggleConnections,
    availablePaperTypes,
    paperVisibility,
    onTogglePaperVisibility,
    isFullscreen,
    onToggleFullscreen,
}: ToolbarProps) {
    return (
        <div className="flex items-center gap-1 mb-3 flex-wrap">
            {/* 缩放控制 */}
            <button
                onClick={onZoomIn}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="放大"
            >
                <ZoomIn className="w-4 h-4 text-white/70" />
            </button>
            <button
                onClick={onZoomOut}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="缩小"
            >
                <ZoomOut className="w-4 h-4 text-white/70" />
            </button>
            <button
                onClick={onReset}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="重置视图"
            >
                <RotateCcw className="w-4 h-4 text-white/70" />
            </button>
            <button
                onClick={onFocusSource}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="聚焦真源"
            >
                <Crosshair className="w-4 h-4 text-white/70" />
            </button>
            <span className="ml-1 text-xs text-white/50 tabular-nums">
                {zoom.toFixed(1)}×
            </span>

            <div className="w-px h-4 bg-white/20 mx-2" />

            {/* 显示控制 */}
            <button
                onClick={onToggleSafeZone}
                className={cn(
                    "p-1.5 rounded-lg transition-colors flex items-center gap-1",
                    showSafeZone ? "bg-cyan-500/30 hover:bg-cyan-500/40" : "bg-white/10 hover:bg-white/20"
                )}
                title="容差范围"
            >
                <Shield className={cn("w-4 h-4", showSafeZone ? "text-cyan-400" : "text-white/40")} />
                <span className={cn("text-xs", showSafeZone ? "text-cyan-400" : "text-white/40")}>容差范围</span>
            </button>
            <button
                onClick={onToggleToleranceZone}
                className={cn(
                    "p-1.5 rounded-lg transition-colors flex items-center gap-1",
                    showToleranceZone ? "bg-amber-500/30 hover:bg-amber-500/40" : "bg-white/10 hover:bg-white/20"
                )}
                title="警戒范围"
            >
                <AlertCircle className={cn("w-4 h-4", showToleranceZone ? "text-amber-400" : "text-white/40")} />
                <span className={cn("text-xs", showToleranceZone ? "text-amber-400" : "text-white/40")}>警戒范围</span>
            </button>
            <button
                onClick={onToggleConnections}
                className={cn(
                    "p-1.5 rounded-lg transition-colors flex items-center gap-1",
                    showConnections ? "bg-pink-500/30 hover:bg-pink-500/40" : "bg-white/10 hover:bg-white/20"
                )}
                title="连接线"
            >
                <Link2 className={cn("w-4 h-4", showConnections ? "text-pink-400" : "text-white/40")} />
                <span className={cn("text-xs", showConnections ? "text-pink-400" : "text-white/40")}>连接线</span>
            </button>

            {/* 纸型选择 */}
            {availablePaperTypes.length > 0 && (
                <>
                    <div className="w-px h-4 bg-white/20 mx-2" />
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2">
                                <div className="flex items-center gap-0.5">
                                    {availablePaperTypes.slice(0, 3).map(pt => (
                                        <div
                                            key={pt}
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: PAPER_COLORS[pt] || '#94a3b8' }}
                                        />
                                    ))}
                                    {availablePaperTypes.length > 3 && (
                                        <span className="text-[10px] text-white/50 ml-0.5">+</span>
                                    )}
                                </div>
                                <span className="text-xs text-white/70">纸型</span>
                                <ChevronDown className="w-3 h-3 text-white/50" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto min-w-40 p-2 bg-slate-900 border-white/10"
                            align="start"
                            sideOffset={8}
                        >
                            <div className="space-y-1">
                                <div className="text-xs text-white/50 px-2 py-1">选择显示的纸型</div>
                                {availablePaperTypes.map(paperType => {
                                    const color = PAPER_COLORS[paperType] || '#94a3b8';
                                    const label = PAPER_TYPE_LABELS[paperType] || paperType;
                                    const isVisible = paperVisibility[paperType] ?? true;
                                    return (
                                        <button
                                            key={paperType}
                                            onClick={() => onTogglePaperVisibility(paperType)}
                                            className="w-full px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors flex items-center gap-3"
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <span className="text-sm text-white/80 truncate">{label}</span>
                                            </div>
                                            <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                                                {isVisible && (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                </>
            )}

            <div className="w-px h-4 bg-white/20 mx-2" />

            {/* 全屏控制 */}
            <button
                onClick={onToggleFullscreen}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title={isFullscreen ? "退出全屏" : "全屏查看"}
            >
                {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-white/70" />
                ) : (
                    <Maximize2 className="w-4 h-4 text-white/70" />
                )}
            </button>
        </div>
    );
}
