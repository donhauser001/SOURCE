'use client';

/**
 * ab 色度坐标系组件
 * 
 * 4:3 矩形，支持缩放和平移
 * - 展示真源点和纸张漂移点
 * - 容差椭圆和警戒范围
 * - 动态网格和坐标轴
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PAPER_TYPE_LABELS, PAPER_COLORS, PLOT_DIMENSIONS } from './constants';
import type { ChromaticityPlotProps } from './types';

const {
    viewWidth,
    viewHeight,
    padding,
    plotWidth,
    plotHeight,
    centerX,
    centerY,
    baseRangeA,
    baseRangeB,
} = PLOT_DIMENSIONS;

export function ChromaticityPlot({
    trueSource,
    paperProfiles,
    deltaETolerance,
    zoom,
    onZoomChange,
    pan,
    onPanChange,
    paperVisibility,
    showSafeZone,
    showToleranceZone,
    showConnections,
}: ChromaticityPlotProps) {
    // 拖拽状态
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // 应用缩放后的范围
    const rangeA = baseRangeA / zoom;
    const rangeB = baseRangeB / zoom;

    // 转换为 viewBox 坐标（考虑平移）
    const toSvgX = useCallback((a: number) => {
        return centerX + ((a - pan.x) / rangeA) * (plotWidth / 2);
    }, [pan.x, rangeA]);

    const toSvgY = useCallback((b: number) => {
        return centerY - ((b - pan.y) / rangeB) * (plotHeight / 2);
    }, [pan.y, rangeB]);

    // 转换为绘图区域内的百分比位置
    const toPercentX = useCallback((a: number) => {
        const svgX = toSvgX(a);
        return ((svgX - padding) / plotWidth) * 100;
    }, [toSvgX]);

    const toPercentY = useCallback((b: number) => {
        const svgY = toSvgY(b);
        return ((svgY - padding) / plotHeight) * 100;
    }, [toSvgY]);

    const sourceX = toSvgX(trueSource.labA);
    const sourceY = toSvgY(trueSource.labB);

    // 容差椭圆
    const toleranceRadiusX = (deltaETolerance / rangeA) * (plotWidth / 2);
    const toleranceRadiusY = (deltaETolerance / rangeB) * (plotHeight / 2);

    // 滚轮缩放 - 使用 useEffect 添加非被动事件监听器以阻止页面滚动
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            onZoomChange(Math.min(Math.max(zoom * delta, 1), 20));
        };

        // passive: false 是必须的，否则无法调用 preventDefault
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [zoom, onZoomChange]);

    // 开始拖拽
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (zoom <= 1) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [zoom]);

    // 拖拽中
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = rangeA / (rect.width * 0.833); // 0.833 = plotWidth / viewWidth
        const scaleY = rangeB / (rect.height * 0.778); // 0.778 = plotHeight / viewHeight

        const dx = (e.clientX - dragStart.x) * scaleX;
        const dy = (e.clientY - dragStart.y) * scaleY;

        onPanChange({
            x: Math.min(Math.max(pan.x - dx, -baseRangeA), baseRangeA),
            y: Math.min(Math.max(pan.y + dy, -baseRangeB), baseRangeB),
        });
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isDragging, dragStart, rangeA, rangeB, pan, onPanChange]);

    // 结束拖拽
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 动态网格：根据缩放级别调整
    const gridStep = zoom >= 10 ? 2 : zoom >= 5 ? 5 : zoom >= 2 ? 10 : 20;
    const gridLines: Array<{ type: 'v' | 'h'; pos: number; value: number; major: boolean }> = [];

    // 计算可见范围
    const visibleMinA = pan.x - rangeA;
    const visibleMaxA = pan.x + rangeA;
    const visibleMinB = pan.y - rangeB;
    const visibleMaxB = pan.y + rangeB;

    // 生成网格线
    for (let a = Math.ceil(visibleMinA / gridStep) * gridStep; a <= visibleMaxA; a += gridStep) {
        const x = toSvgX(a);
        if (x >= padding && x <= viewWidth - padding) {
            gridLines.push({ type: 'v', pos: x, value: a, major: a % (gridStep * 2) === 0 });
        }
    }
    for (let b = Math.ceil(visibleMinB / gridStep) * gridStep; b <= visibleMaxB; b += gridStep) {
        const y = toSvgY(b);
        if (y >= padding && y <= viewHeight - padding) {
            gridLines.push({ type: 'h', pos: y, value: b, major: b % (gridStep * 2) === 0 });
        }
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full select-none touch-none flex items-center justify-center",
                isDragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-crosshair"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* 固定宽高比的内容容器，确保 SVG 和 HTML 层对齐 */}
            <div
                className="relative w-full h-full"
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: `${viewWidth} / ${viewHeight}`,
                }}
            >
                {/* SVG 背景层 */}
                <svg
                    viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="none"
                >
                    {/* 定义裁剪区域 */}
                    <defs>
                        <clipPath id="plot-clip">
                            <rect x={padding} y={padding} width={plotWidth} height={plotHeight} rx="8" ry="8" />
                        </clipPath>
                    </defs>

                    {/* 绘图区域背景和边框 */}
                    <rect
                        x={padding}
                        y={padding}
                        width={plotWidth}
                        height={plotHeight}
                        rx="8"
                        ry="8"
                        fill="rgba(0, 0, 0, 0.3)"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* 裁剪区域内的内容 */}
                    <g clipPath="url(#plot-clip)">
                        {/* 动态网格线 */}
                        {gridLines.map((line, i) => (
                            line.type === 'v' ? (
                                <line
                                    key={`grid-${i}`}
                                    x1={line.pos}
                                    y1={padding}
                                    x2={line.pos}
                                    y2={viewHeight - padding}
                                    stroke={line.major ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.06)"}
                                    strokeWidth="0.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            ) : (
                                <line
                                    key={`grid-${i}`}
                                    x1={padding}
                                    y1={line.pos}
                                    x2={viewWidth - padding}
                                    y2={line.pos}
                                    stroke={line.major ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.06)"}
                                    strokeWidth="0.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            )
                        ))}

                        {/* 坐标轴（在原点位置） */}
                        {toSvgY(0) >= padding && toSvgY(0) <= viewHeight - padding && (
                            <line
                                x1={padding}
                                y1={toSvgY(0)}
                                x2={viewWidth - padding}
                                y2={toSvgY(0)}
                                stroke="rgba(255, 255, 255, 0.4)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                        {toSvgX(0) >= padding && toSvgX(0) <= viewWidth - padding && (
                            <line
                                x1={toSvgX(0)}
                                y1={padding}
                                x2={toSvgX(0)}
                                y2={viewHeight - padding}
                                stroke="rgba(255, 255, 255, 0.4)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                            />
                        )}

                        {/* ΔE 容差椭圆 - 警戒范围 (2x)，环形填充不与容差范围重叠 */}
                        {showToleranceZone && (
                            <>
                                {/* 环形背景填充（外椭圆 - 内椭圆） */}
                                <path
                                    d={`
                                        M ${sourceX - toleranceRadiusX * 2} ${sourceY}
                                        A ${toleranceRadiusX * 2} ${toleranceRadiusY * 2} 0 1 1 ${sourceX + toleranceRadiusX * 2} ${sourceY}
                                        A ${toleranceRadiusX * 2} ${toleranceRadiusY * 2} 0 1 1 ${sourceX - toleranceRadiusX * 2} ${sourceY}
                                        M ${sourceX - toleranceRadiusX} ${sourceY}
                                        A ${toleranceRadiusX} ${toleranceRadiusY} 0 1 0 ${sourceX + toleranceRadiusX} ${sourceY}
                                        A ${toleranceRadiusX} ${toleranceRadiusY} 0 1 0 ${sourceX - toleranceRadiusX} ${sourceY}
                                    `}
                                    fill="rgba(251, 191, 36, 0.06)"
                                    fillRule="evenodd"
                                />
                                {/* 外边框 */}
                                <ellipse
                                    cx={sourceX}
                                    cy={sourceY}
                                    rx={toleranceRadiusX * 2}
                                    ry={toleranceRadiusY * 2}
                                    fill="none"
                                    stroke="rgba(251, 191, 36, 0.25)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </>
                        )}
                        {/* ΔE 容差椭圆 - 容差范围 (1x) */}
                        {showSafeZone && (
                            <ellipse
                                cx={sourceX}
                                cy={sourceY}
                                rx={toleranceRadiusX}
                                ry={toleranceRadiusY}
                                fill="rgba(34, 211, 238, 0.08)"
                                stroke="rgba(34, 211, 238, 0.4)"
                                strokeWidth="1.5"
                                strokeDasharray="6 3"
                                vectorEffect="non-scaling-stroke"
                            />
                        )}

                        {/* 真源点辅助线 */}
                        <line
                            x1={sourceX}
                            y1={padding}
                            x2={sourceX}
                            y2={viewHeight - padding}
                            stroke="rgba(34, 211, 238, 0.2)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            vectorEffect="non-scaling-stroke"
                        />
                        <line
                            x1={padding}
                            y1={sourceY}
                            x2={viewWidth - padding}
                            y2={sourceY}
                            stroke="rgba(34, 211, 238, 0.2)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* 纸张漂移点连线 */}
                        {showConnections && paperProfiles.map((paper, i) => {
                            // 根据纸型显示状态决定是否渲染
                            if (!(paperVisibility[paper.paperType] ?? true)) return null;

                            const px = toSvgX(paper.labA);
                            const py = toSvgY(paper.labB);
                            const color = PAPER_COLORS[paper.paperType] || '#94a3b8';
                            return (
                                <line
                                    key={`line-${i}`}
                                    x1={sourceX}
                                    y1={sourceY}
                                    x2={px}
                                    y2={py}
                                    stroke={color}
                                    strokeWidth="1"
                                    strokeOpacity="0.4"
                                    vectorEffect="non-scaling-stroke"
                                />
                            );
                        })}
                    </g>

                    {/* 边框（在裁剪区域外，确保显示在最上层） */}
                    <rect
                        x={padding}
                        y={padding}
                        width={plotWidth}
                        height={plotHeight}
                        rx="8"
                        ry="8"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>

                {/* HTML 层：轴标签（固定大小，不随缩放变化，紧贴线框外侧） */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* +a 右侧 */}
                    <div
                        className="absolute text-[18px] font-medium text-red-400"
                        style={{
                            right: `${((padding - 8) / viewWidth) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-50%) translateX(100%)'
                        }}
                    >
                        +a
                    </div>
                    {/* -a 左侧 */}
                    <div
                        className="absolute text-[18px] font-medium text-green-400"
                        style={{
                            left: `${((padding - 8) / viewWidth) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-50%) translateX(-100%)'
                        }}
                    >
                        -a
                    </div>
                    {/* +b 顶部 */}
                    <div
                        className="absolute text-[18px] font-medium text-yellow-400"
                        style={{
                            left: '50%',
                            top: `${((padding - 8) / viewHeight) * 100}%`,
                            transform: 'translateX(-50%) translateY(-100%)'
                        }}
                    >
                        +b
                    </div>
                    {/* -b 底部 */}
                    <div
                        className="absolute text-[18px] font-medium text-blue-400"
                        style={{
                            left: '50%',
                            bottom: `${((padding - 8) / viewHeight) * 100}%`,
                            transform: 'translateX(-50%) translateY(100%)'
                        }}
                    >
                        -b
                    </div>

                    {/* 当前可见范围标签 - 在线框内部显示 */}
                    {/* 右侧数字 */}
                    <div
                        className="absolute text-[18px] text-white/30 tabular-nums text-right"
                        style={{
                            right: `${((padding + 8) / viewWidth) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-150%)'
                        }}
                    >
                        {(pan.x + rangeA).toFixed(0)}
                    </div>
                    {/* 左侧数字 */}
                    <div
                        className="absolute text-[18px] text-white/30 tabular-nums"
                        style={{
                            left: `${((padding + 8) / viewWidth) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-150%)'
                        }}
                    >
                        {(pan.x - rangeA).toFixed(0)}
                    </div>
                    {/* 上方数字 */}
                    <div
                        className="absolute text-[18px] text-white/30 tabular-nums"
                        style={{
                            left: '50%',
                            top: `${((padding + 8) / viewHeight) * 100}%`,
                            transform: 'translateX(8px)'
                        }}
                    >
                        {(pan.y + rangeB).toFixed(0)}
                    </div>
                    {/* 下方数字 */}
                    <div
                        className="absolute text-[18px] text-white/30 tabular-nums"
                        style={{
                            left: '50%',
                            bottom: `${((padding + 8) / viewHeight) * 100}%`,
                            transform: 'translateX(8px)'
                        }}
                    >
                        {(pan.y - rangeB).toFixed(0)}
                    </div>
                </div>

                {/* HTML 层：固定大小的标记点（裁剪到绘图区域） */}
                <div
                    className="absolute pointer-events-none overflow-hidden rounded-lg"
                    style={{
                        left: `${(padding / viewWidth) * 100}%`,
                        top: `${(padding / viewHeight) * 100}%`,
                        right: `${(padding / viewWidth) * 100}%`,
                        bottom: `${(padding / viewHeight) * 100}%`,
                    }}
                >
                    {/* 纸张漂移点 */}
                    {paperProfiles.map((paper, i) => {
                        // 根据纸型显示状态决定是否渲染
                        if (!(paperVisibility[paper.paperType] ?? true)) return null;

                        const isInTolerance = paper.deltaE !== null && paper.deltaE <= deltaETolerance;
                        const color = PAPER_COLORS[paper.paperType] || '#94a3b8';
                        const percentX = toPercentX(paper.labA);
                        const percentY = toPercentY(paper.labB);

                        // 只渲染在可见范围附近的点（overflow-hidden 会裁剪超出部分）
                        if (percentX < -10 || percentX > 110 || percentY < -10 || percentY > 110) return null;

                        return (
                            <Tooltip key={`point-${i}`}>
                                <TooltipTrigger asChild>
                                    <div
                                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto"
                                        style={{
                                            left: `${percentX}%`,
                                            top: `${percentY}%`
                                        }}
                                    >
                                        <div
                                            className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                                            style={{ borderColor: color }}
                                        >
                                            <div
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-slate-800 border-slate-700">
                                    <div className="text-sm space-y-1">
                                        <div className="font-medium text-white">{PAPER_TYPE_LABELS[paper.paperType] || paper.paperType}</div>
                                        <div className="text-slate-400">
                                            a*{paper.labA >= 0 ? '+' : ''}{paper.labA.toFixed(1)}
                                            b*{paper.labB >= 0 ? '+' : ''}{paper.labB.toFixed(1)}
                                        </div>
                                        <div className={isInTolerance ? 'text-green-400' : 'text-amber-400'}>
                                            ΔE {paper.deltaE?.toFixed(2) ?? 'N/A'}
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}

                    {/* 真源点 */}
                    {(() => {
                        const percentX = toPercentX(trueSource.labA);
                        const percentY = toPercentY(trueSource.labB);

                        // 只渲染在可见范围附近的点
                        if (percentX < -10 || percentX > 110 || percentY < -10 || percentY > 110) return null;

                        return (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto"
                                        style={{
                                            left: `${percentX}%`,
                                            top: `${percentY}%`
                                        }}
                                    >
                                        <div className="relative">
                                            <div className="absolute inset-0 w-8 h-8 -m-1.5 rounded-full bg-cyan-400/20" />
                                            <div className="w-5 h-5 rounded-full bg-cyan-400 border-2 border-cyan-700 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            </div>
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-slate-800 border-slate-700">
                                    <div className="text-sm space-y-1">
                                        <div className="font-medium text-cyan-400">真源</div>
                                        <div className="text-slate-300">
                                            a*{trueSource.labA >= 0 ? '+' : ''}{trueSource.labA.toFixed(2)}
                                            b*{trueSource.labB >= 0 ? '+' : ''}{trueSource.labB.toFixed(2)}
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
