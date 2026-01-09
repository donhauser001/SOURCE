'use client';

/**
 * Lab 光谱分析卡片 - 手机版
 * 
 * 针对手机设备优化的布局：
 * - 垂直布局，坐标图占主要空间
 * - 横向明度渐变条，圆点标记
 * - 工具栏精简，可折叠
 * - 触摸友好的交互
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Crosshair, CheckCircle2, AlertTriangle, ZoomIn, ZoomOut, RotateCcw, Shield, AlertCircle, Link2, ChevronDown, Check, Maximize2, Minimize2, Settings2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { PAPER_TYPE_LABELS, PAPER_COLORS } from './constants';
import { ChromaticityPlot } from './chromaticity-plot';
import type { LabSpectrumCardProps } from './types';

export function LabSpectrumCardMobile({
    trueSource,
    paperProfiles = [],
    deltaETolerance = 2.0,
    className,
}: LabSpectrumCardProps) {
    // 共享的缩放状态（默认聚焦真源，zoom=5）
    const [zoom, setZoom] = useState(5);

    // 全屏状态
    const [isFullscreen, setIsFullscreen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // 工具栏展开状态
    const [toolbarExpanded, setToolbarExpanded] = useState(false);

    // 全屏切换
    const toggleFullscreen = useCallback(async () => {
        if (!cardRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await cardRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.error('全屏切换失败:', err);
        }
    }, []);

    // 监听全屏状态变化
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // 获取当前数据中存在的纸型类型
    const availablePaperTypes = [...new Set(paperProfiles.map(p => p.paperType))];

    // 共享的显示/隐藏控制状态
    const [showSafeZone, setShowSafeZone] = useState(true);
    const [showToleranceZone, setShowToleranceZone] = useState(true);
    const [showConnections, setShowConnections] = useState(true);

    // 共享的平移状态（默认聚焦真源）
    const [pan, setPan] = useState({ x: trueSource.labA, y: trueSource.labB });

    // 重置视图
    const handleReset = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    // 聚焦真源
    const handleFocusSource = useCallback(() => {
        setZoom(5);
        setPan({ x: trueSource.labA, y: trueSource.labB });
    }, [trueSource.labA, trueSource.labB]);

    // 共享的纸型显示/隐藏状态
    const [paperVisibility, setPaperVisibility] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        Object.keys(PAPER_TYPE_LABELS).forEach(type => {
            initial[type] = true;
        });
        return initial;
    });

    const togglePaperVisibility = useCallback((paperType: string) => {
        setPaperVisibility(prev => ({
            ...prev,
            [paperType]: !prev[paperType]
        }));
    }, []);

    const cardStyle = cn(
        "backdrop-blur-xl border shadow-none overflow-hidden rounded-xl bg-slate-950",
        "border-white/10",
        isFullscreen && "rounded-none border-0 fixed inset-0 z-50",
        className
    );

    const inToleranceCount = paperProfiles.filter(p => p.deltaE !== null && p.deltaE <= deltaETolerance).length;
    const outToleranceCount = paperProfiles.length - inToleranceCount;

    return (
        <TooltipProvider>
            <Card ref={cardRef} className={cardStyle}>
                <CardContent className={cn(
                    "p-3 flex flex-col",
                    isFullscreen ? "h-full" : "min-h-[400px]"
                )}>
                    {/* 标题栏 */}
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-white/70">
                            色彩光谱
                        </h3>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-white/40 tabular-nums mr-1">
                                {zoom.toFixed(1)}×
                            </span>
                            <button
                                onClick={() => setToolbarExpanded(prev => !prev)}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
                            >
                                <Settings2 className="w-4 h-4 text-white/70" />
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="w-4 h-4 text-white/70" />
                                ) : (
                                    <Maximize2 className="w-4 h-4 text-white/70" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 可折叠工具栏 */}
                    {toolbarExpanded && (
                        <div className="mb-3 p-3 rounded-xl bg-white/5 space-y-3">
                            {/* 缩放控制 */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/50">缩放</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setZoom(Math.min(zoom * 1.5, 20))}
                                        className="p-2 rounded-lg bg-white/10 active:bg-white/30"
                                    >
                                        <ZoomIn className="w-4 h-4 text-white/70" />
                                    </button>
                                    <button
                                        onClick={() => setZoom(Math.max(zoom / 1.5, 1))}
                                        className="p-2 rounded-lg bg-white/10 active:bg-white/30"
                                    >
                                        <ZoomOut className="w-4 h-4 text-white/70" />
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="p-2 rounded-lg bg-white/10 active:bg-white/30"
                                    >
                                        <RotateCcw className="w-4 h-4 text-white/70" />
                                    </button>
                                    <button
                                        onClick={handleFocusSource}
                                        className="p-2 rounded-lg bg-white/10 active:bg-white/30"
                                    >
                                        <Crosshair className="w-4 h-4 text-white/70" />
                                    </button>
                                </div>
                            </div>

                            {/* 显示控制 */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/50">显示</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setShowSafeZone(prev => !prev)}
                                        className={cn(
                                            "p-2 rounded-lg",
                                            showSafeZone ? "bg-cyan-500/30" : "bg-white/10"
                                        )}
                                    >
                                        <Shield className={cn("w-4 h-4", showSafeZone ? "text-cyan-400" : "text-white/40")} />
                                    </button>
                                    <button
                                        onClick={() => setShowToleranceZone(prev => !prev)}
                                        className={cn(
                                            "p-2 rounded-lg",
                                            showToleranceZone ? "bg-amber-500/30" : "bg-white/10"
                                        )}
                                    >
                                        <AlertCircle className={cn("w-4 h-4", showToleranceZone ? "text-amber-400" : "text-white/40")} />
                                    </button>
                                    <button
                                        onClick={() => setShowConnections(prev => !prev)}
                                        className={cn(
                                            "p-2 rounded-lg",
                                            showConnections ? "bg-pink-500/30" : "bg-white/10"
                                        )}
                                    >
                                        <Link2 className={cn("w-4 h-4", showConnections ? "text-pink-400" : "text-white/40")} />
                                    </button>
                                </div>
                            </div>

                            {/* 纸型选择 - 下拉菜单 */}
                            {availablePaperTypes.length > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/50">纸型</span>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-xs text-white/70">
                                                <div className="flex items-center gap-0.5">
                                                    {availablePaperTypes.slice(0, 3).map(pt => (
                                                        <div
                                                            key={pt}
                                                            className="w-2.5 h-2.5 rounded-full"
                                                            style={{ backgroundColor: PAPER_COLORS[pt] || '#94a3b8' }}
                                                        />
                                                    ))}
                                                    {availablePaperTypes.length > 3 && (
                                                        <span className="text-[10px] text-white/50 ml-0.5">+{availablePaperTypes.length - 3}</span>
                                                    )}
                                                </div>
                                                <span>选择纸型</span>
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto min-w-44 p-2 bg-slate-900 border-white/10"
                                            align="end"
                                            sideOffset={8}
                                        >
                                            <div className="space-y-1">
                                                {availablePaperTypes.map(paperType => {
                                                    const color = PAPER_COLORS[paperType] || '#94a3b8';
                                                    const label = PAPER_TYPE_LABELS[paperType] || paperType;
                                                    const isVisible = paperVisibility[paperType] ?? true;
                                                    return (
                                                        <button
                                                            key={paperType}
                                                            onClick={() => togglePaperVisibility(paperType)}
                                                            className="w-full px-2 py-2 rounded-md hover:bg-white/10 active:bg-white/20 transition-colors flex items-center gap-3"
                                                        >
                                                            <div
                                                                className="w-3 h-3 rounded-full shrink-0"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                            <span className="text-sm text-white/80 flex-1 text-left">{label}</span>
                                                            {isVisible && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 坐标图区域 */}
                    <div className={cn(
                        "flex-1 min-h-0",
                        isFullscreen ? "flex-[3]" : ""
                    )}>
                        <div className="w-full h-full flex items-center justify-center">
                            <ChromaticityPlot
                                trueSource={trueSource}
                                paperProfiles={paperProfiles}
                                deltaETolerance={deltaETolerance}
                                zoom={zoom}
                                onZoomChange={setZoom}
                                pan={pan}
                                onPanChange={setPan}
                                paperVisibility={paperVisibility}
                                showSafeZone={showSafeZone}
                                showToleranceZone={showToleranceZone}
                                showConnections={showConnections}
                                isFullscreen={isFullscreen}
                            />
                        </div>
                    </div>

                    {/* 明度标尺 - 横向显示（随坐标图缩放） */}
                    {(() => {
                        // 计算可见的 L* 范围（与桌面版 LightnessScale 逻辑一致）
                        const visibleRange = 100 / zoom;
                        const minL = Math.max(0, trueSource.labL - visibleRange / 2);
                        const maxL = Math.min(100, trueSource.labL + visibleRange / 2);
                        const actualRange = maxL - minL;

                        // 将 L* 值转换为百分比位置
                        const toPercent = (l: number) => ((l - minL) / actualRange) * 100;

                        // 渐变停止点
                        const gradientStart = (minL / 100) * 100;
                        const gradientEnd = (maxL / 100) * 100;

                        return (
                            <div className="shrink-0 mt-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/50 shrink-0 tabular-nums w-4">
                                        {minL.toFixed(0)}
                                    </span>
                                    <div className="flex-1 relative h-4 overflow-hidden rounded-full">
                                        {/* 横向渐变条 */}
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                background: `linear-gradient(to right, hsl(0, 0%, ${gradientStart}%) 0%, hsl(0, 0%, ${gradientEnd}%) 100%)`,
                                            }}
                                        />
                                        {/* 纸张标记点 */}
                                        {paperProfiles.map((paper, i) => {
                                            if (!(paperVisibility[paper.paperType] ?? true)) return null;
                                            const color = PAPER_COLORS[paper.paperType] || '#94a3b8';
                                            const percent = toPercent(paper.labL);
                                            // 超出范围不显示
                                            if (percent < 0 || percent > 100) return null;
                                            return (
                                                <div
                                                    key={i}
                                                    className="absolute top-1/2 w-2.5 h-2.5 rounded-full border border-white/50"
                                                    style={{
                                                        left: `${percent}%`,
                                                        transform: 'translate(-50%, -50%)',
                                                        backgroundColor: color,
                                                    }}
                                                />
                                            );
                                        })}
                                        {/* 真源标记点（始终居中） */}
                                        <div
                                            className="absolute top-1/2 w-3 h-3 rounded-full bg-cyan-400 border-2 border-white shadow-sm shadow-cyan-400/50"
                                            style={{
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-white/50 shrink-0 tabular-nums w-4 text-right">
                                        {maxL.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* 底部统计 - 极简 */}
                    <div className="shrink-0 mt-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                    <span className="text-white/50">真源</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full border border-white/50" />
                                    <span className="text-white/50">纸张</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {inToleranceCount > 0 && (
                                    <span className="text-green-400">{inToleranceCount}✓</span>
                                )}
                                {outToleranceCount > 0 && (
                                    <span className="text-amber-400">{outToleranceCount}!</span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
