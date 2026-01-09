'use client';

/**
 * Lab 光谱分析卡片 - 平板版
 * 
 * 针对平板设备优化的布局：
 * - 单行工具栏，自动换行
 * - 增大触控目标
 * - 左右布局，合理比例
 * - 简洁底部信息
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Crosshair, CheckCircle2, AlertTriangle, ZoomIn, ZoomOut, RotateCcw, Shield, AlertCircle, Link2, ChevronDown, Check, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { PAPER_TYPE_LABELS, PAPER_COLORS } from './constants';
import { ChromaticityPlot } from './chromaticity-plot';
import { LightnessScale } from './lightness-scale';
import type { LabSpectrumCardProps } from './types';

export function LabSpectrumCardTablet({
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
        "backdrop-blur-xl border shadow-none overflow-hidden rounded-2xl bg-slate-950",
        "border-white/10",
        isFullscreen && "rounded-none border-0 fixed inset-0 z-50 flex items-center justify-center",
        className
    );

    const inToleranceCount = paperProfiles.filter(p => p.deltaE !== null && p.deltaE <= deltaETolerance).length;
    const outToleranceCount = paperProfiles.length - inToleranceCount;

    return (
        <TooltipProvider>
            <Card ref={cardRef} className={cardStyle}>
                {/* 4:3 比例容器 */}
                <div className={cn(
                    "aspect-[4/3] flex flex-col",
                    isFullscreen && "w-full h-full max-w-[calc(100vh*4/3)] max-h-[calc(100vw*3/4)]"
                )}>
                    <CardContent className="flex-1 p-5 flex flex-col min-h-0">
                        {/* 标题区 */}
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white/70">
                                色彩光谱分析
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-white/40">
                                <Crosshair className="w-3.5 h-3.5" />
                                <span>Lab 色度空间</span>
                            </div>
                        </div>

                        {/* 工具栏 - 单行自动换行 */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-4 shrink-0">
                            {/* 缩放控制组 */}
                            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                                <button
                                    onClick={() => setZoom(Math.min(zoom * 1.5, 20))}
                                    className="p-2.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
                                    title="放大"
                                >
                                    <ZoomIn className="w-4 h-4 text-white/70" />
                                </button>
                                <button
                                    onClick={() => setZoom(Math.max(zoom / 1.5, 1))}
                                    className="p-2.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
                                    title="缩小"
                                >
                                    <ZoomOut className="w-4 h-4 text-white/70" />
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="p-2.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
                                    title="重置视图"
                                >
                                    <RotateCcw className="w-4 h-4 text-white/70" />
                                </button>
                                <button
                                    onClick={handleFocusSource}
                                    className="p-2.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
                                    title="聚焦真源"
                                >
                                    <Crosshair className="w-4 h-4 text-white/70" />
                                </button>
                                <span className="px-2 text-xs text-white/50 tabular-nums">
                                    {zoom.toFixed(1)}×
                                </span>
                            </div>

                            {/* 分隔 */}
                            <div className="w-px h-6 bg-white/10 mx-1" />

                            {/* 显示控制组 */}
                            <button
                                onClick={() => setShowSafeZone(prev => !prev)}
                                className={cn(
                                    "px-3 py-2 rounded-xl transition-colors text-xs font-medium flex items-center gap-1.5",
                                    showSafeZone ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-white/40"
                                )}
                            >
                                <Shield className="w-4 h-4" />
                                容差
                            </button>
                            <button
                                onClick={() => setShowToleranceZone(prev => !prev)}
                                className={cn(
                                    "px-3 py-2 rounded-xl transition-colors text-xs font-medium flex items-center gap-1.5",
                                    showToleranceZone ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/40"
                                )}
                            >
                                <AlertCircle className="w-4 h-4" />
                                警戒
                            </button>
                            <button
                                onClick={() => setShowConnections(prev => !prev)}
                                className={cn(
                                    "px-3 py-2 rounded-xl transition-colors text-xs font-medium flex items-center gap-1.5",
                                    showConnections ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-white/40"
                                )}
                            >
                                <Link2 className="w-4 h-4" />
                                连线
                            </button>

                            {/* 纸型下拉 */}
                            {availablePaperTypes.length > 0 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-medium text-white/70">
                                            <div className="flex -space-x-1">
                                                {availablePaperTypes.slice(0, 3).map(pt => {
                                                    const color = PAPER_COLORS[pt] || '#94a3b8';
                                                    const isVisible = paperVisibility[pt] ?? true;
                                                    return (
                                                        <div
                                                            key={pt}
                                                            className={cn(
                                                                "w-3 h-3 rounded-full border border-slate-900",
                                                                isVisible ? "opacity-100" : "opacity-30"
                                                            )}
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <span>纸型</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto min-w-44 p-2 bg-slate-900 border-white/10"
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
                                                        onClick={() => togglePaperVisibility(paperType)}
                                                        className="w-full px-2 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3"
                                                    >
                                                        <div
                                                            className="w-3.5 h-3.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                        <span className="text-sm text-white/80 flex-1 text-left truncate">{label}</span>
                                                        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                                                            {isVisible && <Check className="w-4 h-4 text-green-400" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}

                            {/* 右侧全屏按钮 */}
                            <div className="flex-1" />
                            <button
                                onClick={toggleFullscreen}
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 transition-colors"
                                title={isFullscreen ? "退出全屏" : "全屏查看"}
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="w-4 h-4 text-white/70" />
                                ) : (
                                    <Maximize2 className="w-4 h-4 text-white/70" />
                                )}
                            </button>
                        </div>

                        {/* 图表区域 */}
                        <div className="flex-1 min-h-0 flex gap-4">
                            {/* 左侧：ab 色度平面 */}
                            <div className="flex-1 flex items-center justify-center">
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

                            {/* 右侧：L 明度标尺 */}
                            <div className="w-36 flex items-center justify-center">
                                <div className="w-full relative" style={{ height: '77.78%' }}>
                                    <LightnessScale
                                        trueSourceL={trueSource.labL}
                                        paperProfiles={paperProfiles}
                                        zoom={zoom}
                                        paperVisibility={paperVisibility}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 底部：简洁的图例和统计 */}
                        <div className="shrink-0 mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between">
                                {/* 图例 */}
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-cyan-400" />
                                        <span className="text-xs text-white/60">真源</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full border-2 border-white/50" />
                                        <span className="text-xs text-white/60">纸张</span>
                                    </div>
                                </div>

                                {/* 容差统计 */}
                                <div className="flex items-center gap-4">
                                    {inToleranceCount > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            <span className="text-xs text-white/60">{inToleranceCount} 合格</span>
                                        </div>
                                    )}
                                    {outToleranceCount > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                            <span className="text-xs text-white/60">{outToleranceCount} 超差</span>
                                        </div>
                                    )}
                                    <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-lg">ΔE≤{deltaETolerance}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>
        </TooltipProvider>
    );
}
