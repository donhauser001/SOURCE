'use client';

/**
 * 标准色彩卡片组件
 * 
 * 设计风格：Coolors 风格
 * - 默认显示柔和背景色 + 深色对比文字
 * - Hover 时显示原始颜色 + 自适应文字颜色
 * - 右上角明度渐变色块预览
 * 
 * 使用场景：
 * - 色彩库列表
 * - 色彩簿详情
 * - 搜索结果
 * - 推荐色彩展示
 */

import { useState, useMemo, memo } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

// =============================================================================
// 类型定义
// =============================================================================

export interface StandardColorData {
    id: string;
    colorId: string;
    name: string;
    labL: number;
    labA: number;
    labB: number;
    status: string;
    auditStatus: string;
    recipeCount?: number;
}

export interface StandardColorCardProps {
    /** 色彩数据 */
    color: StandardColorData;
    /** 搜索关键词（用于高亮） */
    searchQuery?: string;
    /** 是否显示渐变色块预览 */
    showGradient?: boolean;
    /** 是否显示验证徽章 */
    showVerifiedBadge?: boolean;
    /** 是否显示配方数量徽章 */
    showRecipeCount?: boolean;
    /** 自定义链接（默认为 /color/{colorId}） */
    href?: string;
    /** 点击回调（如果提供则不使用 Link） */
    onClick?: (color: StandardColorData) => void;
    /** 自定义类名 */
    className?: string;
}

// =============================================================================
// Lab 转 RGB 缓存系统
// =============================================================================

const labToRgbCache = new Map<string, string>();
const softBgCache = new Map<string, string>();
const contrastCache = new Map<string, string>();

function labToRgbCore(labL: number, labA: number, labB: number): string {
    const y = (labL + 16) / 116;
    const x = labA / 500 + y;
    const z = y - labB / 200;

    const x3 = x * x * x;
    const y3 = y * y * y;
    const z3 = z * z * z;

    const xn = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787;
    const yn = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787;
    const zn = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787;

    const xr = xn * 95.047;
    const yr = yn * 100.0;
    const zr = zn * 108.883;

    let r = xr * 3.2406 + yr * -1.5372 + zr * -0.4986;
    let g = xr * -0.9689 + yr * 1.8758 + zr * 0.0415;
    let b = xr * 0.0557 + yr * -0.2040 + zr * 1.0570;

    r = r > 0.0031308 ? 1.055 * Math.pow(r / 100, 1 / 2.4) - 0.055 : 12.92 * r / 100;
    g = g > 0.0031308 ? 1.055 * Math.pow(g / 100, 1 / 2.4) - 0.055 : 12.92 * g / 100;
    b = b > 0.0031308 ? 1.055 * Math.pow(b / 100, 1 / 2.4) - 0.055 : 12.92 * b / 100;

    r = Math.min(255, Math.max(0, Math.round(r * 255)));
    g = Math.min(255, Math.max(0, Math.round(g * 255)));
    b = Math.min(255, Math.max(0, Math.round(b * 255)));

    return `rgb(${r}, ${g}, ${b})`;
}

function labToRgb(labL: number, labA: number, labB: number): string {
    const key = `${labL.toFixed(1)}|${labA.toFixed(1)}|${labB.toFixed(1)}`;
    const cached = labToRgbCache.get(key);
    if (cached) return cached;

    const result = labToRgbCore(labL, labA, labB);

    if (labToRgbCache.size > 1000) {
        const firstKey = labToRgbCache.keys().next().value;
        if (firstKey) labToRgbCache.delete(firstKey);
    }

    labToRgbCache.set(key, result);
    return result;
}

function getSoftBackgroundColor(labL: number, labA: number, labB: number): string {
    const key = `soft|${labL.toFixed(1)}|${labA.toFixed(1)}|${labB.toFixed(1)}`;
    const cached = softBgCache.get(key);
    if (cached) return cached;

    const softL = Math.min(94, Math.max(82, labL * 0.4 + 55));
    const softA = labA * 0.45;
    const softB = labB * 0.45;

    const result = labToRgbCore(softL, softA, softB);

    if (softBgCache.size > 500) {
        const firstKey = softBgCache.keys().next().value;
        if (firstKey) softBgCache.delete(firstKey);
    }

    softBgCache.set(key, result);
    return result;
}

function getContrastTextColor(labL: number, labA: number, labB: number): string {
    const key = `contrast|${labL.toFixed(1)}|${labA.toFixed(1)}|${labB.toFixed(1)}`;
    const cached = contrastCache.get(key);
    if (cached) return cached;

    const darkL = Math.max(25, labL * 0.4);
    const darkA = labA * 1.2;
    const darkB = labB * 1.2;

    const result = labToRgbCore(darkL, darkA, darkB);

    if (contrastCache.size > 500) {
        const firstKey = contrastCache.keys().next().value;
        if (firstKey) contrastCache.delete(firstKey);
    }

    contrastCache.set(key, result);
    return result;
}

// =============================================================================
// 子组件
// =============================================================================

/** 明度渐变色块预览 */
const GradientSwatches = memo(function GradientSwatches({
    labL,
    labA,
    labB,
    isHovered
}: {
    labL: number;
    labA: number;
    labB: number;
    isHovered: boolean;
}) {
    const gradientColors = useMemo(() => {
        return [0, 0.25, 0.5, 0.75, 1].map((factor) => {
            const adjustedL = labL + (100 - labL) * factor;
            const adjustedA = labA * (1 - factor * 0.8);
            const adjustedB = labB * (1 - factor * 0.8);
            return labToRgb(adjustedL, adjustedA, adjustedB);
        });
    }, [labL, labA, labB]);

    return (
        <div
            className="absolute top-4 right-4 transition-opacity duration-300"
            style={{ opacity: isHovered ? 0 : 1 }}
        >
            <div className="flex flex-col rounded-lg overflow-hidden ring-2 ring-white/50 shadow-sm">
                {gradientColors.map((rgb, index) => (
                    <div
                        key={index}
                        className="w-5 h-5"
                        style={{ backgroundColor: rgb }}
                    />
                ))}
            </div>
        </div>
    );
});

/** 搜索高亮文本 */
function HighlightText({
    text,
    query,
    className
}: {
    text: string;
    query: string;
    className?: string;
}) {
    if (!query.trim()) {
        return <span className={className}>{text}</span>;
    }

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
        return <span className={className}>{text}</span>;
    }

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return (
        <span className={className}>
            {before}
            <mark className="bg-yellow-300/80 text-inherit rounded px-0.5">{match}</mark>
            {after}
        </span>
    );
}

// =============================================================================
// 主组件
// =============================================================================

export const StandardColorCard = memo(function StandardColorCard({
    color,
    searchQuery = '',
    showGradient = true,
    showVerifiedBadge = true,
    showRecipeCount = true,
    href,
    onClick,
    className = ''
}: StandardColorCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // 颜色计算（带缓存）
    const softBg = useMemo(
        () => getSoftBackgroundColor(color.labL, color.labA, color.labB),
        [color.labL, color.labA, color.labB]
    );
    const originalBg = useMemo(
        () => labToRgb(color.labL, color.labA, color.labB),
        [color.labL, color.labA, color.labB]
    );
    const textColor = useMemo(
        () => getContrastTextColor(color.labL, color.labA, color.labB),
        [color.labL, color.labA, color.labB]
    );

    // Hover 时根据明度决定文字颜色
    const hoverTextColor = color.labL > 58 ? '#000000' : '#ffffff';

    // 状态描述文字
    const statusDescription = color.status === 'EXPERIMENTAL'
        ? '实验中的色彩，数据待验证'
        : color.auditStatus === 'VERIFIED'
            ? '已通过验证的标准色彩'
            : '活跃色彩，可用于生产';

    // 卡片内容
    const cardContent = (
        <div
            className={`relative overflow-hidden rounded-2xl p-6 aspect-[4/3] flex flex-col transition-all duration-300 hover:scale-[1.02] ${className}`}
            style={{ backgroundColor: isHovered ? originalBg : softBg }}
        >
            {/* 顶部：名称 + 描述 */}
            <div style={{ color: isHovered ? hoverTextColor : textColor }} className="transition-colors duration-300">
                <h3 className="font-bold leading-tight text-2xl">
                    <HighlightText text={color.name} query={searchQuery} />
                </h3>
                <p className="text-sm opacity-70 mt-1">{statusDescription}</p>
            </div>

            {/* 中间：Lab 值 */}
            <div
                className="text-base font-bold uppercase tracking-wider space-y-0.5 opacity-80 transition-colors duration-300 my-auto"
                style={{ color: isHovered ? hoverTextColor : textColor }}
            >
                <div>L* {color.labL.toFixed(1)}</div>
                <div>a* {color.labA >= 0 ? '+' : ''}{color.labA.toFixed(1)}</div>
                <div>b* {color.labB >= 0 ? '+' : ''}{color.labB.toFixed(1)}</div>
            </div>

            {/* 底部：颜色编号 + 徽章 */}
            <div className="flex items-center justify-between mt-4">
                <span
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all duration-300"
                    style={{ color: isHovered ? hoverTextColor : textColor }}
                >
                    <HighlightText text={color.colorId} query={searchQuery} />
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>

                {/* 元数据徽章 */}
                <div className="flex items-center gap-1.5">
                    {showVerifiedBadge && color.auditStatus === 'VERIFIED' && (
                        <span
                            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300"
                            style={{
                                backgroundColor: isHovered
                                    ? (color.labL > 58 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)')
                                    : 'rgba(255,255,255,0.5)'
                            }}
                        >
                            <ShieldCheck
                                className="h-3.5 w-3.5 transition-colors duration-300"
                                style={{ color: isHovered ? hoverTextColor : '#16a34a' }}
                            />
                        </span>
                    )}
                    {showRecipeCount && color.recipeCount && color.recipeCount > 0 && (
                        <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-300"
                            style={{
                                backgroundColor: isHovered
                                    ? (color.labL > 58 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)')
                                    : 'rgba(255,255,255,0.5)',
                                color: isHovered ? hoverTextColor : '#4b5563'
                            }}
                        >
                            {color.recipeCount}
                        </span>
                    )}
                </div>
            </div>

            {/* 明度渐变色块预览 */}
            {showGradient && (
                <GradientSwatches
                    labL={color.labL}
                    labA={color.labA}
                    labB={color.labB}
                    isHovered={isHovered}
                />
            )}
        </div>
    );

    // 根据是否有 onClick 决定渲染方式
    if (onClick) {
        return (
            <button
                type="button"
                className="group block w-full text-left"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => onClick(color)}
            >
                {cardContent}
            </button>
        );
    }

    return (
        <Link
            href={(href || `/color/${color.colorId}`) as `/color/${string}`}
            className="group block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {cardContent}
        </Link>
    );
}, (prevProps, nextProps) => {
    // 自定义比较：仅在关键属性变化时重新渲染
    return (
        prevProps.color.id === nextProps.color.id &&
        prevProps.color.labL === nextProps.color.labL &&
        prevProps.color.labA === nextProps.color.labA &&
        prevProps.color.labB === nextProps.color.labB &&
        prevProps.searchQuery === nextProps.searchQuery &&
        prevProps.showGradient === nextProps.showGradient &&
        prevProps.showVerifiedBadge === nextProps.showVerifiedBadge &&
        prevProps.showRecipeCount === nextProps.showRecipeCount
    );
});

// 导出工具函数供外部使用
export { labToRgb, getSoftBackgroundColor, getContrastTextColor };
