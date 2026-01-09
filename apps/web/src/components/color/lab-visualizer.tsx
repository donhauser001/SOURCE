'use client';

/**
 * Lab 色彩空间可视化组件
 * 
 * 用直观的方式展示颜色在 Lab 色彩空间中的位置：
 * - L* 明度条：黑→白
 * - a*b* 色度图：绿-红 × 蓝-黄 平面
 */

import { cn } from '@/lib/utils';

interface LabVisualizerProps {
    labL: number;
    labA: number;
    labB: number;
    size?: 'sm' | 'md' | 'lg';
    showValues?: boolean;
    className?: string;
}

export function LabVisualizer({
    labL,
    labA,
    labB,
    size = 'md',
    showValues = true,
    className,
}: LabVisualizerProps) {
    // 尺寸配置
    const sizeConfig = {
        sm: { chromaSize: 120, lightnessWidth: 24, gap: 12 },
        md: { chromaSize: 160, lightnessWidth: 32, gap: 16 },
        lg: { chromaSize: 200, lightnessWidth: 40, gap: 20 },
    };
    const config = sizeConfig[size];

    // 计算 a*b* 在色度图上的位置 (范围 -128 ~ 127 映射到 0% ~ 100%)
    const aPercent = ((labA + 128) / 255) * 100;
    const bPercent = 100 - ((labB + 128) / 255) * 100; // 反转 y 轴，让 +b 在上方

    // 计算 L* 在明度条上的位置
    const lPercent = 100 - labL; // 反转，让白色在上方

    return (
        <div className={cn('flex items-start', className)} style={{ gap: config.gap }}>
            {/* a*b* 色度图 */}
            <div className="relative">
                <ChromaPlane size={config.chromaSize} />
                {/* 当前颜色位置标记 */}
                <div
                    className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${aPercent}%`, top: `${bPercent}%` }}
                >
                    <div className="w-full h-full rounded-full border-2 border-white shadow-lg" />
                    <div className="absolute inset-1 rounded-full border border-black/30" />
                </div>
                {/* 坐标轴标签 */}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 -translate-x-full text-[10px] text-muted-foreground font-medium">
                    -a*
                    <br />
                    <span className="text-green-600">绿</span>
                </div>
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full text-[10px] text-muted-foreground font-medium">
                    +a*
                    <br />
                    <span className="text-red-600">红</span>
                </div>
                <div className="absolute left-1/2 -top-1 -translate-x-1/2 -translate-y-full text-[10px] text-muted-foreground font-medium text-center">
                    +b* <span className="text-yellow-600">黄</span>
                </div>
                <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 translate-y-full text-[10px] text-muted-foreground font-medium text-center">
                    -b* <span className="text-blue-600">蓝</span>
                </div>
            </div>

            {/* L* 明度条 */}
            <div className="relative" style={{ width: config.lightnessWidth, height: config.chromaSize }}>
                <LightnessBar />
                {/* 当前明度位置标记 */}
                <div
                    className="absolute left-0 right-0 h-1 -translate-y-1/2 pointer-events-none"
                    style={{ top: `${lPercent}%` }}
                >
                    <div className="w-full h-full bg-primary rounded-full shadow" />
                    <div className="absolute -left-1 -right-1 top-1/2 -translate-y-1/2 h-2 border-l-2 border-r-2 border-primary" />
                </div>
                {/* 标签 */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] text-muted-foreground">
                    L*
                </div>
                <div className="absolute top-0 -right-1 translate-x-full text-[10px] text-muted-foreground pl-1">
                    100
                </div>
                <div className="absolute bottom-0 -right-1 translate-x-full text-[10px] text-muted-foreground pl-1">
                    0
                </div>
            </div>

            {/* 数值显示 */}
            {showValues && (
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-8 text-muted-foreground">L*</span>
                        <div className="flex-1 h-2 bg-gradient-to-r from-black to-white rounded-full relative">
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full border border-white shadow"
                                style={{ left: `${labL}%` }}
                            />
                        </div>
                        <span className="font-mono w-12 text-right">{labL.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-8 text-muted-foreground">a*</span>
                        <div className="flex-1 h-2 bg-gradient-to-r from-green-500 via-gray-300 to-red-500 rounded-full relative">
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full border border-white shadow"
                                style={{ left: `${aPercent}%` }}
                            />
                        </div>
                        <span className="font-mono w-12 text-right">{labA >= 0 ? '+' : ''}{labA.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-8 text-muted-foreground">b*</span>
                        <div className="flex-1 h-2 bg-gradient-to-r from-blue-500 via-gray-300 to-yellow-500 rounded-full relative">
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full border border-white shadow"
                                style={{ left: `${((labB + 128) / 255) * 100}%` }}
                            />
                        </div>
                        <span className="font-mono w-12 text-right">{labB >= 0 ? '+' : ''}{labB.toFixed(1)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * a*b* 色度平面
 * 使用 CSS 渐变模拟 Lab 色度图
 */
function ChromaPlane({ size }: { size: number }) {
    return (
        <div
            className="rounded-lg overflow-hidden border border-border shadow-inner"
            style={{
                width: size,
                height: size,
                // 使用多层渐变模拟 a*b* 平面
                background: `
                    linear-gradient(to top, 
                        hsl(240, 60%, 50%) 0%, 
                        hsl(0, 0%, 70%) 50%, 
                        hsl(60, 80%, 55%) 100%
                    ),
                    linear-gradient(to right, 
                        hsl(120, 50%, 45%) 0%, 
                        transparent 50%, 
                        hsl(0, 60%, 50%) 100%
                    )
                `,
                backgroundBlendMode: 'multiply',
            }}
        >
            {/* 中心十字线 */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
            </div>
        </div>
    );
}

/**
 * L* 明度条
 */
function LightnessBar() {
    return (
        <div
            className="w-full h-full rounded-lg overflow-hidden border border-border shadow-inner"
            style={{
                background: 'linear-gradient(to bottom, white 0%, black 100%)',
            }}
        />
    );
}

/**
 * 紧凑版 Lab 可视化 - 只显示三个滑轨
 */
export function LabBars({
    labL,
    labA,
    labB,
    className,
}: {
    labL: number;
    labA: number;
    labB: number;
    className?: string;
}) {
    const aPercent = ((labA + 128) / 255) * 100;
    const bPercent = ((labB + 128) / 255) * 100;

    return (
        <div className={cn('space-y-3', className)}>
            <LabBar
                label="L*"
                value={labL}
                percent={labL}
                gradient="from-black to-white"
                descLeft="暗"
                descRight="亮"
            />
            <LabBar
                label="a*"
                value={labA}
                percent={aPercent}
                gradient="from-green-500 via-neutral-400 to-red-500"
                descLeft="绿"
                descRight="红"
                showSign
            />
            <LabBar
                label="b*"
                value={labB}
                percent={bPercent}
                gradient="from-blue-500 via-neutral-400 to-yellow-500"
                descLeft="蓝"
                descRight="黄"
                showSign
            />
        </div>
    );
}

function LabBar({
    label,
    value,
    percent,
    gradient,
    descLeft,
    descRight,
    showSign,
}: {
    label: string;
    value: number;
    percent: number;
    gradient: string;
    descLeft: string;
    descRight: string;
    showSign?: boolean;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-8 text-right">
                <span className="font-mono text-sm font-medium">{label}</span>
            </div>
            <span className="text-[10px] text-muted-foreground w-4">{descLeft}</span>
            <div className="flex-1 relative">
                <div className={cn('h-3 rounded-full bg-gradient-to-r', gradient)} />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-primary shadow-md transition-all"
                    style={{ left: `calc(${percent}% - 6px)` }}
                />
            </div>
            <span className="text-[10px] text-muted-foreground w-4">{descRight}</span>
            <div className="w-16 text-right">
                <span className="font-mono text-sm font-medium">
                    {showSign && value >= 0 ? '+' : ''}{value.toFixed(1)}
                </span>
            </div>
        </div>
    );
}
