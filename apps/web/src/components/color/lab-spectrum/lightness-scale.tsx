'use client';

/**
 * L 明度标尺组件
 * 
 * 高度与坐标图绘图区域对齐，支持缩放
 * - 渐变条显示 L* 值范围
 * - 真源和纸张标记点
 * - 动态刻度标签
 */

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PAPER_TYPE_LABELS, PAPER_COLORS } from './constants';
import type { LightnessScaleProps } from './types';

export function LightnessScale({
    trueSourceL,
    paperProfiles,
    zoom,
    paperVisibility,
}: LightnessScaleProps) {
    // 基础范围是 0-100，缩放后范围变小
    const baseRange = 100;
    const visibleRange = baseRange / zoom;
    const halfRange = visibleRange / 2;

    // 真源点始终在中心，计算可见的 L 值范围
    const minL = Math.max(0, trueSourceL - halfRange);
    const maxL = Math.min(100, trueSourceL + halfRange);
    const actualRange = maxL - minL;

    // 将 L 值转换为百分比位置（0% 在顶部表示最大 L，100% 在底部表示最小 L）
    const toPercent = (l: number) => {
        if (actualRange === 0) return 50;
        return ((maxL - l) / actualRange) * 100;
    };

    // 动态生成刻度：根据缩放级别调整
    const tickStep = zoom >= 10 ? 2 : zoom >= 5 ? 5 : zoom >= 2 ? 10 : 25;
    const ticks: number[] = [];
    for (let t = Math.ceil(minL / tickStep) * tickStep; t <= maxL; t += tickStep) {
        ticks.push(t);
    }

    return (
        <div className="h-full relative">
            {/* 标题 - 绝对定位在顶部外侧 */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-white/50">
                L*
            </div>

            {/* 内容容器 - 只在垂直方向裁剪，水平方向保持可见 */}
            <div className="h-full w-full relative overflow-x-visible overflow-y-clip">
                {/* 渐变条 - 居中 */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 w-10 h-full rounded border border-white/20"
                    style={{
                        background: `linear-gradient(to bottom, 
                            hsl(0, 0%, ${maxL}%) 0%, 
                            hsl(0, 0%, ${minL}%) 100%)`,
                    }}
                />

                {/* 纸张 L 值标记 - 左侧：名称 + 箭头 + 横线 */}
                {paperProfiles.map((paper, i) => {
                    // 根据纸型显示状态决定是否渲染
                    if (!(paperVisibility[paper.paperType] ?? true)) return null;

                    const color = PAPER_COLORS[paper.paperType] || '#94a3b8';
                    const label = PAPER_TYPE_LABELS[paper.paperType] || paper.paperType;
                    const percent = toPercent(paper.labL);
                    if (percent < -10 || percent > 110) return null;
                    return (
                        <Tooltip key={i}>
                            <TooltipTrigger asChild>
                                <div
                                    className="absolute cursor-pointer z-10 flex items-center justify-end"
                                    style={{
                                        top: `${percent}%`,
                                        transform: 'translateY(-50%)',
                                        right: 'calc(50% + 20px)',  // 从渐变条右边缘向左（渐变条宽40px，半宽20px）
                                    }}
                                >
                                    {/* 纸型名称 */}
                                    <span
                                        className="text-xs font-medium whitespace-nowrap mr-1"
                                        style={{ color }}
                                    >
                                        {label}
                                    </span>
                                    {/* 箭头（指向右侧横线） */}
                                    <div
                                        style={{
                                            width: 0,
                                            height: 0,
                                            borderTop: '4px solid transparent',
                                            borderBottom: '4px solid transparent',
                                            borderLeft: `6px solid ${color}`,
                                        }}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="bg-slate-800 border-slate-700">
                                <div className="text-sm">
                                    <span style={{ color }}>{label}</span>
                                    <span className="ml-2 font-mono text-white">L*{paper.labL.toFixed(1)}</span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}

                {/* 纸张横线 - 贯穿渐变条 */}
                {paperProfiles.map((paper, i) => {
                    if (!(paperVisibility[paper.paperType] ?? true)) return null;
                    const color = PAPER_COLORS[paper.paperType] || '#94a3b8';
                    const percent = toPercent(paper.labL);
                    if (percent < -10 || percent > 110) return null;
                    return (
                        <div
                            key={`line-${i}`}
                            className="absolute left-1/2 -translate-x-1/2 w-10 h-0.5 z-5"
                            style={{
                                top: `${percent}%`,
                                transform: 'translateX(-50%) translateY(-50%)',
                                backgroundColor: color,
                            }}
                        />
                    );
                })}

                {/* 真源横线 - 贯穿渐变条 */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 w-10 h-0.5 bg-cyan-400 shadow-sm shadow-cyan-400/50 z-15"
                    style={{
                        top: `${toPercent(trueSourceL)}%`,
                        transform: 'translateX(-50%) translateY(-50%)',
                    }}
                />

                {/* 真源 L 值指针 - 右侧：横线 + 箭头 + 文字 */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="absolute cursor-pointer z-20 flex items-center"
                            style={{
                                top: `${toPercent(trueSourceL)}%`,
                                transform: 'translateY(-50%)',
                                left: 'calc(50% + 20px)',  // 从渐变条右边缘向右（渐变条宽40px，半宽20px）
                            }}
                        >
                            {/* 箭头（指向左侧横线） */}
                            <div
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderTop: '5px solid transparent',
                                    borderBottom: '5px solid transparent',
                                    borderRight: '8px solid rgb(34, 211, 238)',
                                }}
                            />
                            {/* 文字 */}
                            <span className="text-xs font-medium text-cyan-400 whitespace-nowrap ml-1">
                                真源
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                        <div className="text-sm">
                            <span className="font-medium text-cyan-400">真源</span>
                            <span className="ml-2 font-mono text-white">L*{trueSourceL.toFixed(2)}</span>
                        </div>
                    </TooltipContent>
                </Tooltip>

                {/* 刻度标签 - 在渐变条左侧边缘 */}
                {ticks.map(tick => {
                    const percent = toPercent(tick);
                    if (percent < 0 || percent > 100) return null;
                    return (
                        <div
                            key={tick}
                            className="absolute flex items-center justify-end"
                            style={{
                                top: `${percent}%`,
                                transform: 'translateY(-50%)',
                                right: 'calc(50% + 22px)',  // 紧贴渐变条左边缘
                            }}
                        >
                            <span className="text-[10px] mr-1 tabular-nums text-white/40">
                                {tick}
                            </span>
                            <div className="w-1.5 h-px bg-white/30" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
