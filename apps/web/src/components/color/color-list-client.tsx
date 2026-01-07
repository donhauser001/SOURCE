'use client';

/**
 * 色彩列表客户端组件
 * 
 * v0.4.0 - 基于使用量的动态 Bento 布局
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

// 随机分配卡片大小（基于 colorId 保持稳定）
function getCardSize(colorId: string): CardSize {
    const rand = seededRandom(colorId);
    // 分布：20% 2x2, 25% 2x1, 25% 1x2, 30% 1x1
    if (rand < 0.20) {
        return '2x2';
    } else if (rand < 0.45) {
        return '2x1';
    } else if (rand < 0.70) {
        return '1x2';
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

export function ColorListClient({ colors, paperTypeLabels, colorStatusLabels, auditStatusLabels }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [auditFilter, setAuditFilter] = useState<string>('all');
    const [cellSize, setCellSize] = useState(100);
    const gridRef = useRef<HTMLDivElement>(null);

    // 计算单元格大小（正方形）- 行高 = 列宽
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

        // 延迟执行以确保 DOM 已渲染
        const timer = setTimeout(calculateCellSize, 50);
        window.addEventListener('resize', calculateCellSize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateCellSize);
        };
    }, []);

    // 获取唯一的状态值用于筛选
    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(colors.map(c => c.status));
        return Array.from(statuses);
    }, [colors]);

    const uniqueAuditStatuses = useMemo(() => {
        const statuses = new Set(colors.map(c => c.auditStatus));
        return Array.from(statuses);
    }, [colors]);

    // 为每个颜色分配随机卡片大小，并随机排序
    const randomizedColors = useMemo(() => {
        const colorsWithSize = colors.map((color) => {
            const size = getCardSize(color.colorId);
            const sortOrder = seededRandom(color.colorId + 'sort');
            return { ...color, size, sortOrder };
        });
        // 随机排序（基于 colorId 保持稳定）
        return [...colorsWithSize].sort((a, b) => a.sortOrder - b.sortOrder);
    }, [colors]);

    const filteredColors = useMemo(() => {
        let result = randomizedColors;

        // 搜索过滤
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.colorId.toLowerCase().includes(q) ||
                    c.name.toLowerCase().includes(q)
            );
        }

        // 状态过滤
        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter);
        }

        // 审计状态过滤
        if (auditFilter !== 'all') {
            result = result.filter(c => c.auditStatus === auditFilter);
        }

        return result;
    }, [randomizedColors, search, statusFilter, auditFilter]);

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setAuditFilter('all');
    };

    const hasFilters = search || statusFilter !== 'all' || auditFilter !== 'all';

    // 获取状态徽章样式
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
            {/* 筛选栏 */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-muted/50 backdrop-blur-sm">
                {/* 搜索框 */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="搜索颜色编号或名称..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-card border-0 shadow-sm"
                    />
                </div>

                <div className="flex gap-2">
                    {/* 状态筛选 */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[120px] bg-card border-0 shadow-sm">
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

                    {/* 审计状态筛选 */}
                    <Select value={auditFilter} onValueChange={setAuditFilter}>
                        <SelectTrigger className="w-[120px] bg-card border-0 shadow-sm">
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

                    {/* 清除筛选 */}
                    {hasFilters && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0">
                            <Filter className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* 结果统计 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {hasFilters ? (
                    <span>找到 <strong className="text-foreground">{filteredColors.length}</strong> 个结果</span>
                ) : (
                    <span>共 <strong className="text-foreground">{colors.length}</strong> 个色彩</span>
                )}
            </div>

            {/* Bento 网格 - 8 列动态布局，正方形单元格，dense 填充 */}
            {filteredColors.length > 0 ? (
                <div
                    ref={gridRef}
                    className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 [grid-auto-flow:dense]"
                    style={{ gridAutoRows: `${cellSize}px` }}
                >
                    {filteredColors.map((color) => (
                        <ColorCard
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
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">没有找到匹配的颜色</p>
                    {hasFilters && (
                        <Button variant="outline" onClick={clearFilters}>
                            清除筛选条件
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// 根据明度决定文字颜色（黑/白）
function getTextColorByLuminance(labL: number): string {
    // Lab L 值：0 = 黑，100 = 白
    // 阈值约 55-60，浅色背景用黑字，深色背景用白字
    return labL > 58 ? 'text-black' : 'text-white';
}

// 大卡片的字号变化（4种）- 对比明显，但最小也要可读
type LargeFontSize = 'base' | '3xl' | '5xl' | '8xl';
const largeFontSizes: LargeFontSize[] = ['base', '3xl', '5xl', '8xl'];
const largeFontClasses: Record<LargeFontSize, string> = {
    'base': 'text-base tracking-[0.3em]',       // 16px - 精致但可读，加字间距
    '3xl': 'text-3xl',                          // 30px - 中等
    '5xl': 'text-5xl font-black',               // 48px - 醒目
    '8xl': 'text-8xl font-black leading-none',  // 96px - 超大冲击
};

// 通用位置配置（4个角）
type CornerPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
const cornerPositions: CornerPosition[] = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];

// 位置样式类（Tailwind 需要完整类名）
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

// 根据卡片大小获取位置样式类
function getPositionClasses(position: CornerPosition, size: 'large' | 'medium' | 'small'): string {
    return size === 'large' ? positionClassesLarge[position] : positionClassesSmall[position];
}

// 获取随机位置
function getRandomPosition(colorId: string, seed: string = 'pos'): CornerPosition {
    return cornerPositions[getStableIndex(colorId, seed, cornerPositions.length)];
}

// 中卡片的字号变化 - 对比明显，但最小也要可读
type MediumFontSize = 'sm' | 'xl' | '3xl' | '4xl';
const mediumFontSizes: MediumFontSize[] = ['sm', 'xl', '3xl', '4xl'];
const mediumFontClasses: Record<MediumFontSize, string> = {
    'sm': 'text-sm tracking-[0.25em]',          // 14px - 精致但可读
    'xl': 'text-xl',                            // 20px - 标准
    '3xl': 'text-3xl font-semibold',            // 30px - 醒目
    '4xl': 'text-4xl font-black leading-none',  // 36px - 冲击
};

// 基于 colorId 获取稳定的随机索引
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

// 色彩卡片组件
function ColorCard({
    color,
    size,
    paperTypeLabels,
    getStatusVariant
}: {
    color: Color;
    size: CardSize;
    paperTypeLabels: Record<string, string>;
    getStatusVariant: (status: string) => string;
}) {
    const gridStyle = getGridStyle(size);
    const isLarge = size === '2x2';
    const isMedium = size === '2x1' || size === '1x2';

    // 根据明度决定文字颜色
    const textColor = getTextColorByLuminance(color.labL);

    // 随机位置（所有卡片通用）
    const position = getRandomPosition(color.colorId);
    const sizeType = isLarge ? 'large' : isMedium ? 'medium' : 'small';
    const positionClass = getPositionClasses(position, sizeType);

    // 大卡片的随机字号
    const largeFontSize = largeFontSizes[getStableIndex(color.colorId, 'font', largeFontSizes.length)];

    // 中卡片的随机字号
    const mediumFontSize = mediumFontSizes[getStableIndex(color.colorId, 'mfont', mediumFontSizes.length)];

    return (
        <Link
            href={`/color/${color.colorId}`}
            className={`group block ${gridStyle}`}
        >
            <div className="relative w-full h-full overflow-hidden rounded-lg">
                {/* 色块填充整个卡片 */}
                <ColorSwatch
                    labL={color.labL}
                    labA={color.labA}
                    labB={color.labB}
                    size="lg"
                    className="w-full h-full rounded-none"
                />

                {/* 默认显示的编号 - 位置随机化，字号根据卡片大小 */}
                <div className={`${positionClass} group-hover:opacity-0 group-hover:translate-y-2 transition-all duration-300 ease-out`}>
                    <p className={`font-mono font-bold uppercase ${textColor} ${isLarge
                        ? largeFontClasses[largeFontSize]
                        : isMedium
                            ? mediumFontClasses[mediumFontSize]
                            : 'text-sm tracking-[0.2em]'
                        }`}>
                        {color.colorId}
                    </p>
                </div>

                {/* 悬停时显示的信息层 - 从底部滑入 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out flex flex-col justify-end p-3 overflow-hidden">
                    {/* 内容容器 - 滑入动画 */}
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out delay-75">
                        {/* 状态标签 */}
                        <div className="flex items-center gap-1.5 mb-2">
                            {color.auditStatus === 'VERIFIED' && (
                                <Badge variant="success" className="text-[9px] px-1.5 py-0 gap-0.5 bg-white/20 backdrop-blur-sm border-0">
                                    <ShieldCheck className="h-2.5 w-2.5" />
                                </Badge>
                            )}
                            <Badge
                                variant={getStatusVariant(color.status) as 'success' | 'warning' | 'destructive' | 'secondary'}
                                className="text-[9px] px-1.5 py-0 bg-white/20 backdrop-blur-sm border-0"
                            >
                                {color.statusLabel}
                            </Badge>
                        </div>

                        {/* 名称 */}
                        <h3 className={`font-semibold text-white truncate ${isLarge ? 'text-2xl' : isMedium ? 'text-lg' : 'text-base'}`}>
                            {color.name}
                        </h3>

                        {/* 编号 */}
                        <p className={`text-white/70 font-mono font-bold uppercase ${isLarge ? 'text-base' : 'text-sm'}`}>
                            {color.colorId}
                        </p>

                        {/* 元数据 */}
                        {(isLarge || isMedium) && (color.recipeCount > 0 || color.participantCount > 0 || color.bestPaper) && (
                            <div className="flex items-center gap-2 mt-2 text-[10px] text-white/60">
                                {color.recipeCount > 0 && (
                                    <span className="flex items-center gap-0.5">
                                        <Beaker className="h-3 w-3" />
                                        {color.recipeCount}
                                    </span>
                                )}
                                {color.participantCount > 0 && (
                                    <span className="flex items-center gap-0.5">
                                        <Users className="h-3 w-3" />
                                        {color.participantCount}
                                    </span>
                                )}
                                {color.bestPaper && (
                                    <span className="text-white/50">
                                        {paperTypeLabels[color.bestPaper] || color.bestPaper}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

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
