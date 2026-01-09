'use client';

/**
 * ab 色度坐标系组件
 * 
 * 4:3 矩形，支持缩放和平移
 * - 展示真源点和纸张漂移点
 * - 容差椭圆和警戒范围
 * - 动态网格和坐标轴
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
    isFullscreen = false,
}: ChromaticityPlotProps) {
    // 拖拽状态
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // 触摸状态
    const lastTouchDistance = useRef<number | null>(null);
    const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

    // 容器尺寸（用于全屏模式的动态比例）
    const [containerSize, setContainerSize] = useState({ width: 600, height: 450 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setContainerSize({ width: rect.width, height: rect.height });
            }
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, []);

    // 动态计算尺寸参数
    // 全屏模式：根据容器比例动态调整 Lab 显示范围
    // 非全屏模式：保持固定 4:3 比例
    const dynamicParams = useMemo(() => {
        if (!isFullscreen) {
            // 非全屏：使用固定参数
            return {
                viewWidth,
                viewHeight,
                plotWidth,
                plotHeight,
                centerX,
                centerY,
                rangeA: baseRangeA / zoom,
                rangeB: baseRangeB / zoom,
            };
        }

        // 全屏模式：根据容器比例动态计算
        const containerAspect = containerSize.width / containerSize.height;
        const baseAspect = viewWidth / viewHeight; // 4:3 = 1.333

        let dynViewWidth = viewWidth;
        let dynViewHeight = viewHeight;

        if (containerAspect < baseAspect) {
            // 容器更高（竖屏），增加高度
            const heightRatio = baseAspect / containerAspect;
            dynViewHeight = viewHeight * heightRatio;
        } else if (containerAspect > baseAspect) {
            // 容器更宽（横屏），增加宽度
            const widthRatio = containerAspect / baseAspect;
            dynViewWidth = viewWidth * widthRatio;
        }

        const dynPlotWidth = dynViewWidth - padding * 2;
        const dynPlotHeight = dynViewHeight - padding * 2;

        // 关键修复：根据实际 plotSize 比例计算 range，保持椭圆形状不变
        // 原始比例：rangeA/plotWidth = baseRangeA/plotWidth, rangeB/plotHeight = baseRangeB/plotHeight
        // 保持这个比例关系，才能让 ΔE 容差椭圆形状正确
        const dynRangeA = (baseRangeA / zoom) * (dynPlotWidth / plotWidth);
        const dynRangeB = (baseRangeB / zoom) * (dynPlotHeight / plotHeight);

        return {
            viewWidth: dynViewWidth,
            viewHeight: dynViewHeight,
            plotWidth: dynPlotWidth,
            plotHeight: dynPlotHeight,
            centerX: dynViewWidth / 2,
            centerY: dynViewHeight / 2,
            rangeA: dynRangeA,
            rangeB: dynRangeB,
        };
    }, [isFullscreen, containerSize, zoom]);

    // 使用动态参数
    const rangeA = dynamicParams.rangeA;
    const rangeB = dynamicParams.rangeB;
    const dynViewWidth = dynamicParams.viewWidth;
    const dynViewHeight = dynamicParams.viewHeight;
    const dynPlotWidth = dynamicParams.plotWidth;
    const dynPlotHeight = dynamicParams.plotHeight;
    const dynCenterX = dynamicParams.centerX;
    const dynCenterY = dynamicParams.centerY;

    // 转换为 viewBox 坐标（考虑平移）- 使用动态参数
    const toSvgX = useCallback((a: number) => {
        return dynCenterX + ((a - pan.x) / rangeA) * (dynPlotWidth / 2);
    }, [pan.x, rangeA, dynCenterX, dynPlotWidth]);

    const toSvgY = useCallback((b: number) => {
        return dynCenterY - ((b - pan.y) / rangeB) * (dynPlotHeight / 2);
    }, [pan.y, rangeB, dynCenterY, dynPlotHeight]);

    // 转换为绘图区域内的百分比位置
    const toPercentX = useCallback((a: number) => {
        const svgX = toSvgX(a);
        return ((svgX - padding) / dynPlotWidth) * 100;
    }, [toSvgX, dynPlotWidth]);

    const toPercentY = useCallback((b: number) => {
        const svgY = toSvgY(b);
        return ((svgY - padding) / dynPlotHeight) * 100;
    }, [toSvgY, dynPlotHeight]);

    const sourceX = toSvgX(trueSource.labA);
    const sourceY = toSvgY(trueSource.labB);

    // 容差椭圆 - 使用动态参数
    const toleranceRadiusX = (deltaETolerance / rangeA) * (dynPlotWidth / 2);
    const toleranceRadiusY = (deltaETolerance / rangeB) * (dynPlotHeight / 2);

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

    // 触摸事件处理 - 支持单指拖动和双指缩放
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 计算两点之间的距离
        const getDistance = (touches: TouchList) => {
            if (touches.length < 2) return null;
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        // 计算两点的中心
        const getCenter = (touches: TouchList) => {
            if (touches.length < 2) return null;
            return {
                x: (touches[0].clientX + touches[1].clientX) / 2,
                y: (touches[0].clientY + touches[1].clientY) / 2,
            };
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                // 单指拖动开始
                setIsDragging(true);
                setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            } else if (e.touches.length === 2) {
                // 双指缩放开始
                e.preventDefault();
                lastTouchDistance.current = getDistance(e.touches);
                lastTouchCenter.current = getCenter(e.touches);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 1 && isDragging) {
                // 单指拖动
                e.preventDefault();
                const rect = container.getBoundingClientRect();
                // 使用动态参数计算比例
                const plotRatioX = dynPlotWidth / dynViewWidth;
                const plotRatioY = dynPlotHeight / dynViewHeight;
                const scaleX = rangeA / (rect.width * plotRatioX);
                const scaleY = rangeB / (rect.height * plotRatioY);

                const dx = (e.touches[0].clientX - dragStart.x) * scaleX;
                const dy = (e.touches[0].clientY - dragStart.y) * scaleY;

                onPanChange({
                    x: Math.min(Math.max(pan.x - dx, -baseRangeA), baseRangeA),
                    y: Math.min(Math.max(pan.y + dy, -baseRangeB), baseRangeB),
                });
                setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            } else if (e.touches.length === 2) {
                // 双指缩放
                e.preventDefault();
                const newDistance = getDistance(e.touches);
                const newCenter = getCenter(e.touches);

                if (lastTouchDistance.current && newDistance) {
                    // 缩放
                    const scale = newDistance / lastTouchDistance.current;
                    const newZoom = Math.min(Math.max(zoom * scale, 1), 20);
                    onZoomChange(newZoom);
                    lastTouchDistance.current = newDistance;
                }

                // 双指拖动
                if (lastTouchCenter.current && newCenter) {
                    const rect = container.getBoundingClientRect();
                    const plotRatioX = dynPlotWidth / dynViewWidth;
                    const plotRatioY = dynPlotHeight / dynViewHeight;
                    const scaleX = rangeA / (rect.width * plotRatioX);
                    const scaleY = rangeB / (rect.height * plotRatioY);

                    const dx = (newCenter.x - lastTouchCenter.current.x) * scaleX;
                    const dy = (newCenter.y - lastTouchCenter.current.y) * scaleY;

                    onPanChange({
                        x: Math.min(Math.max(pan.x - dx, -baseRangeA), baseRangeA),
                        y: Math.min(Math.max(pan.y + dy, -baseRangeB), baseRangeB),
                    });
                    lastTouchCenter.current = newCenter;
                }
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (e.touches.length === 0) {
                setIsDragging(false);
                lastTouchDistance.current = null;
                lastTouchCenter.current = null;
            } else if (e.touches.length === 1) {
                // 从双指变为单指
                lastTouchDistance.current = null;
                lastTouchCenter.current = null;
                setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [zoom, onZoomChange, pan, onPanChange, rangeA, rangeB, isDragging, dragStart, dynPlotWidth, dynPlotHeight, dynViewWidth, dynViewHeight]);

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
        // 使用动态参数计算比例
        const plotRatioX = dynPlotWidth / dynViewWidth;
        const plotRatioY = dynPlotHeight / dynViewHeight;
        const scaleX = rangeA / (rect.width * plotRatioX);
        const scaleY = rangeB / (rect.height * plotRatioY);

        const dx = (e.clientX - dragStart.x) * scaleX;
        const dy = (e.clientY - dragStart.y) * scaleY;

        onPanChange({
            x: Math.min(Math.max(pan.x - dx, -baseRangeA), baseRangeA),
            y: Math.min(Math.max(pan.y + dy, -baseRangeB), baseRangeB),
        });
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isDragging, dragStart, rangeA, rangeB, pan, onPanChange, dynPlotWidth, dynPlotHeight, dynViewWidth, dynViewHeight]);

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

    // 生成网格线 - 使用动态参数
    for (let a = Math.ceil(visibleMinA / gridStep) * gridStep; a <= visibleMaxA; a += gridStep) {
        const x = toSvgX(a);
        if (x >= padding && x <= dynViewWidth - padding) {
            gridLines.push({ type: 'v', pos: x, value: a, major: a % (gridStep * 2) === 0 });
        }
    }
    for (let b = Math.ceil(visibleMinB / gridStep) * gridStep; b <= visibleMaxB; b += gridStep) {
        const y = toSvgY(b);
        if (y >= padding && y <= dynViewHeight - padding) {
            gridLines.push({ type: 'h', pos: y, value: b, major: b % (gridStep * 2) === 0 });
        }
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full select-none touch-none flex items-center justify-center overflow-hidden",
                isDragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-crosshair"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* 全屏模式：填满容器；非全屏：保持 4:3 比例 */}
            <div
                className="relative w-full h-full"
                style={isFullscreen ? {} : {
                    aspectRatio: `${viewWidth} / ${viewHeight}`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                }}
            >
                {/* SVG 背景层 - 使用动态尺寸 */}
                <svg
                    viewBox={`0 0 ${dynViewWidth} ${dynViewHeight}`}
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio={isFullscreen ? "xMidYMid meet" : "none"}
                >
                    {/* 定义裁剪区域 */}
                    <defs>
                        <clipPath id="plot-clip">
                            <rect x={padding} y={padding} width={dynPlotWidth} height={dynPlotHeight} rx="8" ry="8" />
                        </clipPath>
                    </defs>

                    {/* 绘图区域背景和边框 */}
                    <rect
                        x={padding}
                        y={padding}
                        width={dynPlotWidth}
                        height={dynPlotHeight}
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
                                    y2={dynViewHeight - padding}
                                    stroke={line.major ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.06)"}
                                    strokeWidth="0.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            ) : (
                                <line
                                    key={`grid-${i}`}
                                    x1={padding}
                                    y1={line.pos}
                                    x2={dynViewWidth - padding}
                                    y2={line.pos}
                                    stroke={line.major ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.06)"}
                                    strokeWidth="0.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            )
                        ))}

                        {/* 坐标轴（在原点位置） */}
                        {toSvgY(0) >= padding && toSvgY(0) <= dynViewHeight - padding && (
                            <line
                                x1={padding}
                                y1={toSvgY(0)}
                                x2={dynViewWidth - padding}
                                y2={toSvgY(0)}
                                stroke="rgba(255, 255, 255, 0.4)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                        {toSvgX(0) >= padding && toSvgX(0) <= dynViewWidth - padding && (
                            <line
                                x1={toSvgX(0)}
                                y1={padding}
                                x2={toSvgX(0)}
                                y2={dynViewHeight - padding}
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
                            y2={dynViewHeight - padding}
                            stroke="rgba(34, 211, 238, 0.2)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            vectorEffect="non-scaling-stroke"
                        />
                        <line
                            x1={padding}
                            y1={sourceY}
                            x2={dynViewWidth - padding}
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
                        width={dynPlotWidth}
                        height={dynPlotHeight}
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
                        className="absolute text-[10px] sm:text-[12px] md:text-[14px] lg:text-[18px] font-medium text-red-400"
                        style={{
                            right: `${((padding - 8) / dynViewWidth) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-50%) translateX(100%)'
                        }}
                    >
                        +a
                    </div>
                    {/* -a 左侧 */}
                    <div
                        className="absolute text-[10px] sm:text-[12px] md:text-[14px] lg:text-[18px] font-medium text-green-400"
                        style={{
                            left: `${((padding - 8) / dynViewWidth) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-50%) translateX(-100%)'
                        }}
                    >
                        -a
                    </div>
                    {/* +b 顶部 */}
                    <div
                        className="absolute text-[10px] sm:text-[12px] md:text-[14px] lg:text-[18px] font-medium text-yellow-400"
                        style={{
                            left: '50%',
                            top: `${((padding - 8) / dynViewHeight) * 100}%`,
                            transform: 'translateX(-50%) translateY(-100%)'
                        }}
                    >
                        +b
                    </div>
                    {/* -b 底部 */}
                    <div
                        className="absolute text-[10px] sm:text-[12px] md:text-[14px] lg:text-[18px] font-medium text-blue-400"
                        style={{
                            left: '50%',
                            bottom: `${((padding - 8) / dynViewHeight) * 100}%`,
                            transform: 'translateX(-50%) translateY(100%)'
                        }}
                    >
                        -b
                    </div>

                    {/* 当前可见范围标签 - 在线框内部显示 */}
                    {/* 右侧数字 */}
                    <div
                        className="absolute text-[9px] sm:text-[10px] md:text-[12px] lg:text-[18px] text-white/30 tabular-nums text-right"
                        style={{
                            right: `${((padding + 8) / dynViewWidth) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-150%)'
                        }}
                    >
                        {(pan.x + rangeA).toFixed(0)}
                    </div>
                    {/* 左侧数字 */}
                    <div
                        className="absolute text-[9px] sm:text-[10px] md:text-[12px] lg:text-[18px] text-white/30 tabular-nums"
                        style={{
                            left: `${((padding + 8) / dynViewWidth) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-150%)'
                        }}
                    >
                        {(pan.x - rangeA).toFixed(0)}
                    </div>
                    {/* 上方数字 */}
                    <div
                        className="absolute text-[9px] sm:text-[10px] md:text-[12px] lg:text-[18px] text-white/30 tabular-nums"
                        style={{
                            left: '50%',
                            top: `${((padding + 8) / dynViewHeight) * 100}%`,
                            transform: 'translateX(8px)'
                        }}
                    >
                        {(pan.y + rangeB).toFixed(0)}
                    </div>
                    {/* 下方数字 */}
                    <div
                        className="absolute text-[9px] sm:text-[10px] md:text-[12px] lg:text-[18px] text-white/30 tabular-nums"
                        style={{
                            left: '50%',
                            bottom: `${((padding + 8) / dynViewHeight) * 100}%`,
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
                        left: `${(padding / dynViewWidth) * 100}%`,
                        top: `${(padding / dynViewHeight) * 100}%`,
                        right: `${(padding / dynViewWidth) * 100}%`,
                        bottom: `${(padding / dynViewHeight) * 100}%`,
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
