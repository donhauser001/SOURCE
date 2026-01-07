'use client';

/**
 * 色彩列表客户端组件 - B Plan
 * 
 * 设计理念：语义化布局
 * - 卡片大小基于"成熟度"（验证状态 + 配方数量）
 * - 字号统一，不传递错误层级
 * - 位置保持随机（视觉丰富）
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Filter, Beaker, ShieldCheck, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ColorSwatch } from './color-swatch';

interface Color {
    id: string;
    colorId: string;
    name: string;
    slug: string;
    labL: number;
    labA: number;
    labB: number;
    status: string;
    statusLabel: string;
    auditStatus: string;
    auditStatusLabel: string;
    version: string;
    paperProfileCount: number;
    recipeCount: number;
    participantCount: number;
    bestPaper?: string;
    lastVerifiedAt: string | null;
}

interface Props {
    colors: Color[];
    paperTypeLabels: Record<string, string>;
    colorStatusLabels: Record<string, string>;
    auditStatusLabels: Record<string, string>;
}

// 卡片尺寸类型
type CardSize = '1x1' | '2x1' | '1x2' | '2x2';

// 基于 colorId 生成稳定的伪随机数（0-1）
function seededRandom(colorId: string): number {
    let hash = 0;
    for (let i = 0; i < colorId.length; i++) {
        const char = colorId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return (Math.abs(hash) % 1000) / 1000;
}

/**
 * 语义化卡片大小分配
 * 基于颜色的"成熟度"决定卡片大小
 */
function getSemanticCardSize(color: Color): CardSize {
    // 计算成熟度分数
    let maturityScore = 0;

    // 验证状态权重最高
    if (color.auditStatus === 'VERIFIED') maturityScore += 3;
    if (color.status === 'ACTIVE') maturityScore += 2;
    if (color.status === 'EXPERIMENTAL') maturityScore += 0;

    // 配方数量
    if (color.recipeCount >= 3) maturityScore += 2;
    else if (color.recipeCount >= 1) maturityScore += 1;

    // 参与者数量
    if (color.participantCount >= 2) maturityScore += 1;

    // 纸张档案数量
    if (color.paperProfileCount >= 3) maturityScore += 1;

    // 根据分数分配大小
    // 高成熟度 (7+) → 2x2
    // 中高成熟度 (5-6) → 2x1 或 1x2
    // 中成熟度 (3-4) → 1x2 或 2x1（随机）
    // 低成熟度 (0-2) → 1x1
    if (maturityScore >= 7) {
        return '2x2';
    } else if (maturityScore >= 5) {
        // 用随机决定横向还是纵向
        return seededRandom(color.colorId) > 0.5 ? '2x1' : '1x2';
    } else if (maturityScore >= 3) {
        return seededRandom(color.colorId + 'mid') > 0.5 ? '2x1' : '1x2';
    } else {
        return '1x1';
    }
}

// 获取卡片的 grid 样式
function getGridStyle(size: CardSize): string {
    switch (size) {
        case '2x2':
            return 'col-span-2 row-span-2';
        case '2x1':
            return 'col-span-2 row-span-1';
        case '1x2':
            return 'col-span-1 row-span-2';
        case '1x1':
        default:
            return 'col-span-1 row-span-1';
    }
}

export function ColorListClientB({ colors, paperTypeLabels, colorStatusLabels, auditStatusLabels }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [auditFilter, setAuditFilter] = useState<string>('all');
    const [cellSize, setCellSize] = useState(100);
    const gridRef = useRef<HTMLDivElement>(null);

    // 计算单元格大小
    useEffect(() => {
        const calculateCellSize = () => {
            if (gridRef.current) {
                const computedStyle = window.getComputedStyle(gridRef.current);
                const gap = parseFloat(computedStyle.gap) || 4;
                const cols = window.innerWidth >= 1024 ? 8 : window.innerWidth >= 640 ? 6 : 4;
                const containerWidth = gridRef.current.clientWidth;
                const cellWidth = (containerWidth - (cols - 1) * gap) / cols;
                setCellSize(cellWidth);
            }
        };

        const timer = setTimeout(calculateCellSize, 50);
        window.addEventListener('resize', calculateCellSize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateCellSize);
        };
    }, []);

    // 获取唯一的状态值
    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(colors.map(c => c.status));
        return Array.from(statuses);
    }, [colors]);

    const uniqueAuditStatuses = useMemo(() => {
        const statuses = new Set(colors.map(c => c.auditStatus));
        return Array.from(statuses);
    }, [colors]);

    // 为每个颜色分配语义化卡片大小，并按成熟度排序
    const semanticColors = useMemo(() => {
        const colorsWithSize = colors.map((color) => {
            const size = getSemanticCardSize(color);
            // 计算排序分数（成熟度高的排前面）
            let sortScore = 0;
            if (color.auditStatus === 'VERIFIED') sortScore += 100;
            if (color.status === 'ACTIVE') sortScore += 50;
            sortScore += color.recipeCount * 10;
            sortScore += color.participantCount * 5;
            // 加入随机因子避免完全按分数排序
            sortScore += seededRandom(color.colorId + 'sort') * 20;
            return { ...color, size, sortScore };
        });
        // 按成熟度分数降序排列
        return [...colorsWithSize].sort((a, b) => b.sortScore - a.sortScore);
    }, [colors]);

    const filteredColors = useMemo(() => {
        let result = semanticColors;

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.colorId.toLowerCase().includes(q) ||
                    c.name.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter);
        }

        if (auditFilter !== 'all') {
            result = result.filter(c => c.auditStatus === auditFilter);
        }

        return result;
    }, [semanticColors, search, statusFilter, auditFilter]);

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setAuditFilter('all');
    };

    const hasFilters = search || statusFilter !== 'all' || auditFilter !== 'all';

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'VERIFIED':
                return 'success';
            case 'EXPERIMENTAL':
                return 'warning';
            case 'DEPRECATED':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="space-y-6">
            {/* 筛选栏 - 浅色主题 */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="search"
                        placeholder="搜索颜色编号或名称..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-white border-0 shadow-sm text-gray-900 placeholder:text-gray-400"
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[120px] bg-white border-0 shadow-sm text-gray-700">
                            <SelectValue placeholder="状态" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部状态</SelectItem>
                            {uniqueStatuses.map(status => (
                                <SelectItem key={status} value={status}>
                                    {colorStatusLabels[status] || status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={auditFilter} onValueChange={setAuditFilter}>
                        <SelectTrigger className="w-[120px] bg-white border-0 shadow-sm text-gray-700">
                            <SelectValue placeholder="审计" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部审计</SelectItem>
                            {uniqueAuditStatuses.map(status => (
                                <SelectItem key={status} value={status}>
                                    {auditStatusLabels[status] || status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasFilters && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 text-gray-500 hover:text-gray-700">
                            <Filter className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* 结果统计 */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                {hasFilters ? (
                    <span>找到 <strong className="text-gray-900">{filteredColors.length}</strong> 个结果</span>
                ) : (
                    <span>共 <strong className="text-gray-900">{colors.length}</strong> 个色彩</span>
                )}
            </div>

            {/* Coolors 风格网格 - 简洁 3 列布局 */}
            {filteredColors.length > 0 ? (
                <div
                    ref={gridRef}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    {filteredColors.map((color) => (
                        <ColorCardB
                            key={color.id}
                            color={color}
                            size={color.size}
                            paperTypeLabels={paperTypeLabels}
                            getStatusVariant={getStatusVariant}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">没有找到匹配的颜色</p>
                    {hasFilters && (
                        <Button variant="outline" onClick={clearFilters} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                            清除筛选条件
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// 根据明度决定文字颜色
function getTextColorByLuminance(labL: number): string {
    return labL > 58 ? 'text-black' : 'text-white';
}

// 通用位置配置（4个角）
type CornerPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
const cornerPositions: CornerPosition[] = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];

const positionClassesLarge: Record<CornerPosition, string> = {
    'bottom-left': 'absolute bottom-4 left-4 text-left',
    'bottom-right': 'absolute bottom-4 right-4 text-right',
    'top-left': 'absolute top-4 left-4 text-left',
    'top-right': 'absolute top-4 right-4 text-right',
};

const positionClassesSmall: Record<CornerPosition, string> = {
    'bottom-left': 'absolute bottom-3 left-3 text-left',
    'bottom-right': 'absolute bottom-3 right-3 text-right',
    'top-left': 'absolute top-3 left-3 text-left',
    'top-right': 'absolute top-3 right-3 text-right',
};

function getPositionClasses(position: CornerPosition, size: 'large' | 'medium' | 'small'): string {
    return size === 'large' ? positionClassesLarge[position] : positionClassesSmall[position];
}

function getStableIndex(colorId: string, seed: string, max: number): number {
    let hash = 0;
    const str = colorId + seed;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash) % max;
}

function getRandomPosition(colorId: string): CornerPosition {
    return cornerPositions[getStableIndex(colorId, 'pos', cornerPositions.length)];
}

// 生成柔和的背景色（基于 Lab 值，提高明度和降低饱和度）
function getSoftBackgroundColor(labL: number, labA: number, labB: number): string {
    // 将 Lab 转换为更柔和的版本：提高明度，适度保留饱和度
    const softL = Math.min(94, Math.max(82, labL * 0.4 + 55)); // 明度在 82-94 之间，更浅
    const softA = labA * 0.45; // 适度保留饱和度
    const softB = labB * 0.45;
    
    // Lab to RGB 近似转换
    const y = (softL + 16) / 116;
    const x = softA / 500 + y;
    const z = y - softB / 200;
    
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

// 生成对比色文字（基于原始颜色，但更深更饱和）
function getContrastTextColor(labL: number, labA: number, labB: number): string {
    // 降低明度，保持或增强色相
    const darkL = Math.max(25, labL * 0.4);
    const darkA = labA * 1.2;
    const darkB = labB * 1.2;
    
    const y = (darkL + 16) / 116;
    const x = darkA / 500 + y;
    const z = y - darkB / 200;
    
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

// Lab 转 RGB（用于原始色彩背景）
function labToRgb(labL: number, labA: number, labB: number): string {
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

// B-Plan 色彩卡片组件 - Coolors 风格
function ColorCardB({
    color,
    size,
    paperTypeLabels,
    getStatusVariant
}: {
    color: Color & { size: CardSize };
    size: CardSize;
    paperTypeLabels: Record<string, string>;
    getStatusVariant: (status: string) => string;
}) {
    const [isHovered, setIsHovered] = useState(false);
    
    // Coolors 风格：柔和背景 + 深色对比文字
    const softBg = getSoftBackgroundColor(color.labL, color.labA, color.labB);
    const originalBg = labToRgb(color.labL, color.labA, color.labB);
    const textColor = getContrastTextColor(color.labL, color.labA, color.labB);
    
    // Hover 时根据明度决定文字颜色（白或黑）
    const hoverTextColor = color.labL > 58 ? '#000000' : '#ffffff';

    return (
        <Link
            href={`/color/${color.colorId}`}
            className="group block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                className="relative overflow-hidden rounded-2xl p-6 aspect-[4/3] flex flex-col transition-all duration-300 hover:scale-[1.02]"
                style={{ backgroundColor: isHovered ? originalBg : softBg }}
            >
                {/* 顶部：名称 + 描述 */}
                <div style={{ color: isHovered ? hoverTextColor : textColor }} className="transition-colors duration-300">
                    {/* 名称 - 大标题 */}
                    <h3 className="font-bold leading-tight text-2xl">
                        {color.name}
                    </h3>
                    
                    {/* 描述/状态信息 */}
                    <p className="text-sm opacity-70 mt-1">
                        {color.status === 'EXPERIMENTAL' 
                            ? '实验中的色彩，数据待验证'
                            : color.auditStatus === 'VERIFIED'
                                ? '已通过验证的标准色彩'
                                : '活跃色彩，可用于生产'
                        }
                    </p>
                </div>
                
                {/* 中间：Lab 值 - 在上下内容之间垂直居中，上下间距一致 */}
                <div 
                    className="text-base font-bold uppercase tracking-wider space-y-0.5 opacity-80 transition-colors duration-300 my-auto"
                    style={{ color: isHovered ? hoverTextColor : textColor }}
                >
                    <div>L* {color.labL.toFixed(1)}</div>
                    <div>a* {color.labA >= 0 ? '+' : ''}{color.labA.toFixed(1)}</div>
                    <div>b* {color.labB >= 0 ? '+' : ''}{color.labB.toFixed(1)}</div>
                </div>

                {/* 底部：CTA 链接 */}
                <div className="flex items-center justify-between mt-4">
                    <span 
                        className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all duration-300"
                        style={{ color: isHovered ? hoverTextColor : textColor }}
                    >
                        {color.colorId}
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                    
                    {/* 元数据徽章 */}
                    <div className="flex items-center gap-1.5">
                        {color.auditStatus === 'VERIFIED' && (
                            <span 
                                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300"
                                style={{ backgroundColor: isHovered ? (color.labL > 58 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.5)' }}
                            >
                                <ShieldCheck 
                                    className="h-3.5 w-3.5 transition-colors duration-300" 
                                    style={{ color: isHovered ? hoverTextColor : '#16a34a' }}
                                />
                            </span>
                        )}
                        {color.recipeCount > 0 && (
                            <span 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-300"
                                style={{ 
                                    backgroundColor: isHovered ? (color.labL > 58 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.5)',
                                    color: isHovered ? hoverTextColor : '#4b5563'
                                }}
                            >
                                {color.recipeCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* 明度变化色块组 - hover 时隐藏 */}
                <div 
                    className="absolute top-4 right-4 transition-opacity duration-300"
                    style={{ opacity: isHovered ? 0 : 1 }}
                >
                    <div className="flex flex-col rounded-lg overflow-hidden ring-2 ring-white/50 shadow-sm">
                        {[0, 0.25, 0.5, 0.75, 1].map((factor, index) => {
                            // 从原色逐渐变浅（向白色过渡）
                            const adjustedL = color.labL + (100 - color.labL) * factor;
                            // 同时降低饱和度使其更接近白色
                            const adjustedA = color.labA * (1 - factor * 0.8);
                            const adjustedB = color.labB * (1 - factor * 0.8);
                            const rgb = labToRgb(adjustedL, adjustedA, adjustedB);
                            return (
                                <div
                                    key={index}
                                    className="w-5 h-5"
                                    style={{ backgroundColor: rgb }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </Link>
    );
}

