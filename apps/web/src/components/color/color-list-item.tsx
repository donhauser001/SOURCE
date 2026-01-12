'use client';

/**
 * 色彩横向卡片组件
 * 
 * 设计理念：
 * - 横向卡片布局，左侧色块 + 右侧信息
 * - 看起来像列表，实际是卡片
 * - 信息密度适中，适合对比浏览
 * 
 * 使用场景：
 * - 色彩库列表视图
 * - 搜索结果
 * - 管理后台
 */

import { useMemo, memo } from 'react';
import Link from 'next/link';
import { ShieldCheck, FlaskConical, ChevronRight } from 'lucide-react';

// =============================================================================
// 类型定义
// =============================================================================

export interface ColorListItemData {
    id: string;
    colorId: string;
    name: string;
    labL: number;
    labA: number;
    labB: number;
    status: string;
    auditStatus: string;
    colorFamily?: string | null;
    recipeCount?: number;
    paperProfileCount?: number;
    participantCount?: number;
}

export interface ColorListItemProps {
    /** 色彩数据 */
    color: ColorListItemData;
    /** 搜索关键词（用于高亮） */
    searchQuery?: string;
    /** 是否显示 Lab 值 */
    showLabValues?: boolean;
    /** 自定义链接 */
    href?: string;
    /** 点击回调 */
    onClick?: (color: ColorListItemData) => void;
    /** 自定义类名 */
    className?: string;
    /** 色系标签映射 */
    colorFamilyLabels?: Record<string, string>;
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
// 搜索高亮
// =============================================================================

function HighlightText({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return <>{text}</>;

    return (
        <>
            {text.slice(0, index)}
            <mark className="bg-yellow-200 text-inherit rounded px-0.5">
                {text.slice(index, index + query.length)}
            </mark>
            {text.slice(index + query.length)}
        </>
    );
}

// =============================================================================
// 默认色系标签
// =============================================================================

const defaultColorFamilyLabels: Record<string, string> = {
    RED: '红',
    ORANGE: '橙',
    YELLOW: '黄',
    GREEN: '绿',
    CYAN: '青',
    BLUE: '蓝',
    PURPLE: '紫',
    PINK: '粉',
    BROWN: '棕',
    NEUTRAL: '灰',
};

// =============================================================================
// 主组件
// =============================================================================

export const ColorListItem = memo(function ColorListItem({
    color,
    searchQuery = '',
    showLabValues = true,
    href,
    onClick,
    className = '',
    colorFamilyLabels = defaultColorFamilyLabels,
}: ColorListItemProps) {
    const bgColor = useMemo(
        () => labToRgb(color.labL, color.labA, color.labB),
        [color.labL, color.labA, color.labB]
    );
    
    // 根据明度动态计算边框透明度：浅色用高透明度，深色用低透明度
    // 明度 0-100，透明度映射为 0.15-0.6
    const borderColor = useMemo(() => {
        const opacity = 0.15 + (color.labL / 100) * 0.45; // 深色 0.15，浅色 0.6
        return bgColor.replace('rgb(', 'rgba(').replace(')', `, ${opacity.toFixed(2)})`);
    }, [bgColor, color.labL]);

    const isVerified = color.auditStatus === 'VERIFIED';
    const isExperimental = color.status === 'EXPERIMENTAL';
    
    // 根据明度判断悬停时文字颜色 - 所有元素保持一致
    const isLightBg = color.labL > 55;
    const hoverTextClass = isLightBg ? 'group-hover:text-gray-900' : 'group-hover:text-white';
    const hoverBorderClass = isLightBg ? 'group-hover:border-gray-900' : 'group-hover:border-white';

    // 悬停时的边框颜色（100% 不透明）
    const borderColorHover = bgColor;

    const itemContent = (
        <div
            className={`
                relative flex rounded-full overflow-hidden
                group
                transition-[border-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${className}
            `}
            style={{ borderColor, borderWidth: '4px', borderStyle: 'solid' }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = borderColorHover;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = borderColor;
            }}
        >
            {/* 色块背景 - 悬停时铺满 */}
            <div 
                className="absolute inset-0 w-1/3 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:w-full"
                style={{ backgroundColor: bgColor }}
            />
            
            {/* 白色背景层 */}
            <div className="absolute inset-0 bg-white transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-0" style={{ left: '33.333%' }} />
            
            {/* 左侧色块占位 */}
            <div className="relative flex-shrink-0 w-1/3" />

            {/* 右侧信息 */}
            <div className="relative flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-center z-10">
                {/* 名称 + 状态图标 + 编号 */}
                <div className="flex items-center gap-2">
                    <span className={`font-medium truncate transition-colors duration-500 ease-out text-gray-900 ${hoverTextClass}`}>
                        <HighlightText text={color.name} query={searchQuery} />
                    </span>
                    {isVerified && (
                        <ShieldCheck className={`h-3.5 w-3.5 flex-shrink-0 transition-colors duration-500 ease-out text-gray-500 ${hoverTextClass}`} />
                    )}
                    {isExperimental && (
                        <FlaskConical className={`h-3.5 w-3.5 flex-shrink-0 transition-colors duration-500 ease-out text-gray-500 ${hoverTextClass}`} />
                    )}
                    <span className={`text-xs font-mono flex-shrink-0 transition-colors duration-500 ease-out text-gray-500 ${hoverTextClass}`}>
                        <HighlightText text={color.colorId} query={searchQuery} />
                    </span>
                </div>
                
                {/* Lab 值 + 色系 */}
                <div className={`flex items-center gap-2 mt-1 text-xs transition-colors duration-500 ease-out text-gray-500 ${hoverTextClass}`}>
                    {showLabValues && (
                        <span className="font-mono">
                            L*{color.labL.toFixed(0)} a*{color.labA >= 0 ? '+' : ''}{color.labA.toFixed(0)} b*{color.labB >= 0 ? '+' : ''}{color.labB.toFixed(0)}
                        </span>
                    )}
                    {color.colorFamily && (
                        <span className={`px-2 py-0.5 text-[10px] border rounded-full transition-colors duration-500 ease-out border-gray-400 text-gray-500 ${hoverTextClass} ${hoverBorderClass}`}>
                            {colorFamilyLabels[color.colorFamily] || color.colorFamily}
                        </span>
                    )}
                </div>
            </div>

            {/* 右侧状态区 + 箭头 */}
            <div className="relative flex items-center gap-2 px-4 sm:px-5 z-10">
                {/* 实验中标签 - 悬停时反色 */}
                {isExperimental && (
                    <span className={`px-3 py-1 text-xs rounded-full transition-colors duration-500 ease-out text-white bg-gray-800 ${isLightBg ? 'group-hover:bg-gray-900 group-hover:text-white' : 'group-hover:bg-white group-hover:text-gray-900'}`}>
                        实验中
                    </span>
                )}
                <ChevronRight 
                    className={`h-4 w-4 transition-all duration-300 ease-out opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-gray-400 ${hoverTextClass}`}
                />
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
                {itemContent}
            </button>
        );
    }

    return (
        <Link href={(href || `/color/${color.colorId}`) as `/color/${string}`} className="block">
            {itemContent}
        </Link>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.color.id === nextProps.color.id &&
        prevProps.color.labL === nextProps.color.labL &&
        prevProps.color.labA === nextProps.color.labA &&
        prevProps.color.labB === nextProps.color.labB &&
        prevProps.color.status === nextProps.color.status &&
        prevProps.color.auditStatus === nextProps.color.auditStatus &&
        prevProps.searchQuery === nextProps.searchQuery &&
        prevProps.showLabValues === nextProps.showLabValues
    );
});
