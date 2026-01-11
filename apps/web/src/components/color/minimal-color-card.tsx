'use client';

/**
 * 极简色彩卡片组件 - 潘通风格
 * 
 * 设计理念：
 * - 1:1 色块 + 名称编号
 * - 简洁优雅，适合大量色彩快速浏览
 * - 悬停时色块铺满整个卡片
 * 
 * 使用场景：
 * - 色彩库极简视图
 * - 色彩选择器
 * - 色彩簿预览
 */

import { useMemo, memo } from 'react';
import Link from 'next/link';
import { ShieldCheck, FlaskConical } from 'lucide-react';

// =============================================================================
// 类型定义
// =============================================================================

export interface MinimalColorData {
    id: string;
    colorId: string;
    name: string;
    labL: number;
    labA: number;
    labB: number;
    status?: string;
    auditStatus?: string;
}

export interface MinimalColorCardProps {
    /** 色彩数据 */
    color: MinimalColorData;
    /** 自定义链接 */
    href?: string;
    /** 点击回调 */
    onClick?: (color: MinimalColorData) => void;
    /** 自定义类名 */
    className?: string;
}

// =============================================================================
// Lab 转 RGB
// =============================================================================

const labToRgbCache = new Map<string, string>();

function labToRgb(labL: number, labA: number, labB: number): string {
    const key = `${labL.toFixed(1)}|${labA.toFixed(1)}|${labB.toFixed(1)}`;
    const cached = labToRgbCache.get(key);
    if (cached) return cached;

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

    const result = `rgb(${r}, ${g}, ${b})`;
    
    if (labToRgbCache.size > 1000) {
        const firstKey = labToRgbCache.keys().next().value;
        if (firstKey) labToRgbCache.delete(firstKey);
    }
    
    labToRgbCache.set(key, result);
    return result;
}

// =============================================================================
// 主组件
// =============================================================================

export const MinimalColorCard = memo(function MinimalColorCard({
    color,
    href,
    onClick,
    className = '',
}: MinimalColorCardProps) {
    const bgColor = useMemo(
        () => labToRgb(color.labL, color.labA, color.labB),
        [color.labL, color.labA, color.labB]
    );
    
    // 根据明度动态计算边框透明度：浅色用高透明度，深色用低透明度
    // 明度 0-100，透明度映射为 0.6-0.15
    const borderColor = useMemo(() => {
        const opacity = 0.15 + (color.labL / 100) * 0.45; // 深色 0.15，浅色 0.6
        return bgColor.replace('rgb(', 'rgba(').replace(')', `, ${opacity.toFixed(2)})`);
    }, [bgColor, color.labL]);
    
    const isVerified = color.auditStatus === 'VERIFIED';
    const isExperimental = color.status === 'EXPERIMENTAL';
    
    // 根据明度判断悬停时文字颜色
    const isLightBg = color.labL > 55;
    const hoverTextClass = isLightBg ? 'group-hover:text-gray-900' : 'group-hover:text-white';

    // 悬停时的边框颜色（100% 不透明）
    const borderColorHover = bgColor;

    const cardContent = (
        <div
            className={`
                relative overflow-hidden rounded-3xl
                group
                transition-[border-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                hover:border-current
                ${className}
            `}
            style={{ 
                borderWidth: '4px', 
                borderStyle: 'solid',
                borderColor,
                // @ts-ignore - CSS custom property for hover
                '--border-hover': borderColorHover,
            } as React.CSSProperties}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = borderColorHover;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = borderColor;
            }}
        >
            {/* 色块背景 - 悬停时铺满 */}
            <div 
                className="absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ 
                    backgroundColor: bgColor,
                    clipPath: 'inset(0 0 30% 0)',
                }}
            />
            <div 
                className="absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] opacity-0 group-hover:opacity-100"
                style={{ backgroundColor: bgColor }}
            />

            {/* 色块区域 - 1:1 正方形 */}
            <div className="relative aspect-square w-full">
                {/* 实验中标签 - 右上角 */}
                {isExperimental && (
                    <div className="absolute top-2 right-2 z-20">
                        <span className={`inline-block px-2 py-0.5 text-[10px] rounded-full transition-colors duration-500 ease-out text-white bg-gray-800 ${isLightBg ? 'group-hover:bg-gray-900 group-hover:text-white' : 'group-hover:bg-white group-hover:text-gray-900'}`}>
                            实验中
                        </span>
                    </div>
                )}
            </div>

            {/* 信息区域 */}
            <div className="relative p-3 bg-white transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:bg-transparent z-10">
                {/* 名称 + 状态图标 */}
                <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium text-gray-900 truncate transition-colors duration-500 ease-out ${hoverTextClass}`}>
                        {color.name}
                    </span>
                    {isVerified && (
                        <ShieldCheck className={`h-3.5 w-3.5 flex-shrink-0 text-gray-500 transition-colors duration-500 ease-out ${hoverTextClass}`} />
                    )}
                    {isExperimental && (
                        <FlaskConical className={`h-3.5 w-3.5 flex-shrink-0 text-gray-500 transition-colors duration-500 ease-out ${hoverTextClass}`} />
                    )}
                </div>
                
                {/* 编号 */}
                <div className={`text-xs text-gray-500 font-mono mt-0.5 transition-colors duration-500 ease-out ${hoverTextClass}`}>
                    {color.colorId}
                </div>
            </div>
        </div>
    );

    if (onClick) {
        return (
            <button
                type="button"
                className="block w-full text-left"
                onClick={() => onClick(color)}
            >
                {cardContent}
            </button>
        );
    }

    return (
        <Link href={href || `/color/${color.colorId}`} className="block">
            {cardContent}
        </Link>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.color.id === nextProps.color.id &&
        prevProps.color.labL === nextProps.color.labL &&
        prevProps.color.labA === nextProps.color.labA &&
        prevProps.color.labB === nextProps.color.labB &&
        prevProps.color.status === nextProps.color.status &&
        prevProps.color.auditStatus === nextProps.color.auditStatus
    );
});
