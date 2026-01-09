'use client';

/**
 * Lab 光谱分析卡片 - 桌面版
 * 
 * 4:3 比例卡片，响应式图表布局
 * - ab 色度坐标系：笛卡尔坐标展示色相位置
 * - 真源 vs 漂移：对比真源与各纸张实测值
 * - L 明度标尺：独立的深度计展示
 * - ΔE 容差圆：可视化容差范围和警戒范围
 * - 支持滚轮缩放和拖拽平移
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PAPER_TYPE_LABELS } from './constants';
import { Toolbar } from './toolbar';
import { ChromaticityPlot } from './chromaticity-plot';
import { LightnessScale } from './lightness-scale';
import type { LabSpectrumCardProps } from './types';

export function LabSpectrumCardDesktop({
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
        "backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-slate-950",
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
                    <CardContent className="flex-1 p-6 flex flex-col min-h-0">
                        {/* 标题区 */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white/70">
                                色彩光谱分析
                            </h3>
                        </div>

                        {/* 工具栏 */}
                        <Toolbar
                            zoom={zoom}
                            onZoomIn={() => setZoom(Math.min(zoom * 1.5, 20))}
                            onZoomOut={() => setZoom(Math.max(zoom / 1.5, 1))}
                            onReset={handleReset}
                            onFocusSource={handleFocusSource}
                            showSafeZone={showSafeZone}
                            onToggleSafeZone={() => setShowSafeZone(prev => !prev)}
                            showToleranceZone={showToleranceZone}
                            onToggleToleranceZone={() => setShowToleranceZone(prev => !prev)}
                            showConnections={showConnections}
                            onToggleConnections={() => setShowConnections(prev => !prev)}
                            availablePaperTypes={availablePaperTypes}
                            paperVisibility={paperVisibility}
                            onTogglePaperVisibility={togglePaperVisibility}
                            isFullscreen={isFullscreen}
                            onToggleFullscreen={toggleFullscreen}
                        />

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

                            {/* 右侧：L 明度标尺 - 高度与左侧坐标图绘图区域对齐 */}
                            {/* 左侧坐标图 padding=50, viewHeight=450, 所以绘图区域占比 = (450-100)/450 = 77.78% */}
                            {/* 顶部 padding 占比 = 50/450 = 11.11% */}
                            <div className="w-40 flex items-center justify-center">
                                <div
                                    className="w-full relative"
                                    style={{
                                        height: '77.78%',  /* 与左侧绘图区域高度比例一致 */
                                    }}
                                >
                                    <LightnessScale
                                        trueSourceL={trueSource.labL}
                                        paperProfiles={paperProfiles}
                                        zoom={zoom}
                                        paperVisibility={paperVisibility}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 底部：图例和统计 */}
                        <div className="shrink-0 mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between">
                                {/* 图例 */}
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-cyan-400" />
                                        <span className="text-sm text-white/60">真源</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full border-2 border-white/50" />
                                        <span className="text-sm text-white/60">纸张实测</span>
                                    </div>
                                </div>

                                {/* 容差统计 */}
                                <div className="flex items-center gap-4">
                                    {inToleranceCount > 0 && (
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            <span className="text-white/60">{inToleranceCount} 在容差内</span>
                                        </div>
                                    )}
                                    {outToleranceCount > 0 && (
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                            <span className="text-white/60">{outToleranceCount} 超出容差</span>
                                        </div>
                                    )}
                                    <span className="text-sm text-white/40">
                                        ΔE ≤ {deltaETolerance}
                                    </span>
                                </div>
                            </div>
                            {/* 说明文字 */}
                            <div className="mt-3 text-xs text-white/40 leading-relaxed">
                                <span className="text-cyan-400/70">容差范围</span>（ΔE ≤ {deltaETolerance}）内的纸张印刷效果与真源颜色接近，
                                <span className="text-amber-400/70">警戒范围</span>（ΔE ≤ {deltaETolerance * 2}）内有一定偏差但可接受，
                                超出警戒范围的纸张印刷可能产生明显色差。
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>
        </TooltipProvider>
    );
}
