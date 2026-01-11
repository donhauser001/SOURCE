'use client';

/**
 * 色彩列表客户端组件 - B Plan
 * 
 * 设计理念：语义化布局
 * - 卡片大小基于"成熟度"（验证状态 + 配方数量）
 * - 字号统一，不传递错误层级
 * - 位置保持随机（视觉丰富）
 * 
 * 性能优化：
 * - Lab 转 RGB 计算缓存
 * - 卡片组件使用 React.memo
 * - 筛选列表使用 useMemo
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { StandardColorCard } from './standard-color-card';

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
    colorFamily?: string | null;
    colorFamilyLabel?: string | null;
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
    colorFamilyLabels?: Record<string, string>;
    colorFamilyColors?: Record<string, string>;
    recommendationLabels?: Record<string, string>;
}

// 推荐等级标签（默认值）
const defaultRecommendationLabels: Record<string, string> = {
    BEST: '最佳拍档',
    GOOD: '表现良好',
    CAUTION: '需注意',
    AVOID: '建议慎用',
};

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

// 默认色系标签
const defaultColorFamilyLabels: Record<string, string> = {
    RED: '红色系',
    ORANGE: '橙色系',
    YELLOW: '黄色系',
    GREEN: '绿色系',
    CYAN: '青色系',
    BLUE: '蓝色系',
    PURPLE: '紫色系',
    PINK: '粉色系',
    BROWN: '棕色系',
    NEUTRAL: '中性色',
};

const defaultColorFamilyColors: Record<string, string> = {
    RED: '#DC2626',
    ORANGE: '#EA580C',
    YELLOW: '#CA8A04',
    GREEN: '#16A34A',
    CYAN: '#0891B2',
    BLUE: '#2563EB',
    PURPLE: '#9333EA',
    PINK: '#EC4899',
    BROWN: '#92400E',
    NEUTRAL: '#6B7280',
};

export function ColorListClientB({
    colors,
    paperTypeLabels,
    colorStatusLabels,
    auditStatusLabels,
    colorFamilyLabels = defaultColorFamilyLabels,
    colorFamilyColors = defaultColorFamilyColors,
    recommendationLabels = defaultRecommendationLabels
}: Props) {
    const [search, setSearch] = useState('');
    const [statusFilters, setStatusFilters] = useState<string[]>([]);
    const [auditFilters, setAuditFilters] = useState<string[]>([]);
    const [familyFilters, setFamilyFilters] = useState<string[]>([]);
    const [paperTypeFilters, setPaperTypeFilters] = useState<string[]>([]);
    const [recommendationFilters, setRecommendationFilters] = useState<string[]>([]);
    const [hasParticipants, setHasParticipants] = useState<boolean | null>(null);
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

    // 获取唯一的筛选值
    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(colors.map(c => c.status));
        return Array.from(statuses);
    }, [colors]);

    const uniqueAuditStatuses = useMemo(() => {
        const statuses = new Set(colors.map(c => c.auditStatus));
        return Array.from(statuses);
    }, [colors]);

    const uniquePaperTypes = useMemo(() => {
        const types = new Set<string>();
        colors.forEach(c => {
            if (c.bestPaper) types.add(c.bestPaper);
        });
        return Array.from(types);
    }, [colors]);

    const uniqueColorFamilies = useMemo(() => {
        const families = new Set<string>();
        colors.forEach(c => {
            if (c.colorFamily) families.add(c.colorFamily);
        });
        return Array.from(families);
    }, [colors]);

    const uniqueRecommendations = ['BEST', 'GOOD', 'CAUTION', 'AVOID'];

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

        if (statusFilters.length > 0) {
            result = result.filter(c => statusFilters.includes(c.status));
        }

        if (auditFilters.length > 0) {
            result = result.filter(c => auditFilters.includes(c.auditStatus));
        }

        if (familyFilters.length > 0) {
            result = result.filter(c => c.colorFamily && familyFilters.includes(c.colorFamily));
        }

        if (paperTypeFilters.length > 0) {
            result = result.filter(c => c.bestPaper && paperTypeFilters.includes(c.bestPaper));
        }

        if (recommendationFilters.length > 0) {
            // 这里需要根据 bestPaper 的推荐等级筛选
            // 简化实现：筛选有 bestPaper 的颜色
            result = result.filter(c => c.bestPaper);
        }

        if (hasParticipants !== null) {
            result = result.filter(c => hasParticipants ? c.participantCount > 0 : c.participantCount === 0);
        }

        return result;
    }, [semanticColors, search, statusFilters, auditFilters, familyFilters, paperTypeFilters, recommendationFilters, hasParticipants]);

    const clearFilters = () => {
        setSearch('');
        setStatusFilters([]);
        setAuditFilters([]);
        setFamilyFilters([]);
        setPaperTypeFilters([]);
        setRecommendationFilters([]);
        setHasParticipants(null);
    };

    const hasFilters = search || statusFilters.length > 0 || auditFilters.length > 0 ||
        familyFilters.length > 0 || paperTypeFilters.length > 0 || recommendationFilters.length > 0 || hasParticipants !== null;

    const activeFilterCount = [
        statusFilters.length > 0,
        auditFilters.length > 0,
        familyFilters.length > 0,
        paperTypeFilters.length > 0,
        recommendationFilters.length > 0,
        hasParticipants !== null,
    ].filter(Boolean).length;

    // 筛选器切换函数
    const toggleFilter = (
        value: string,
        current: string[],
        setter: (v: string[]) => void
    ) => {
        if (current.includes(value)) {
            setter(current.filter(v => v !== value));
        } else {
            setter([...current, value]);
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

                <div className="flex flex-wrap gap-2">
                    {/* 状态筛选 */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="bg-white border-0 shadow-sm text-gray-700 gap-1">
                                状态
                                {statusFilters.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                        {statusFilters.length}
                                    </Badge>
                                )}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                            <div className="space-y-2">
                                {uniqueStatuses.map(status => (
                                    <label key={status} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 cursor-pointer">
                                        <Checkbox
                                            checked={statusFilters.includes(status)}
                                            onCheckedChange={() => toggleFilter(status, statusFilters, setStatusFilters)}
                                        />
                                        <span className="text-sm">{colorStatusLabels[status] || status}</span>
                                    </label>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* 审计状态筛选 */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="bg-white border-0 shadow-sm text-gray-700 gap-1">
                                审计
                                {auditFilters.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                        {auditFilters.length}
                                    </Badge>
                                )}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                            <div className="space-y-2">
                                {uniqueAuditStatuses.map(status => (
                                    <label key={status} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 cursor-pointer">
                                        <Checkbox
                                            checked={auditFilters.includes(status)}
                                            onCheckedChange={() => toggleFilter(status, auditFilters, setAuditFilters)}
                                        />
                                        <span className="text-sm">{auditStatusLabels[status] || status}</span>
                                    </label>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* 色系筛选 */}
                    {uniqueColorFamilies.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="bg-white border-0 shadow-sm text-gray-700 gap-1">
                                    色系
                                    {familyFilters.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                            {familyFilters.length}
                                        </Badge>
                                    )}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2" align="start">
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {uniqueColorFamilies.map(family => (
                                        <label key={family} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 cursor-pointer">
                                            <Checkbox
                                                checked={familyFilters.includes(family)}
                                                onCheckedChange={() => toggleFilter(family, familyFilters, setFamilyFilters)}
                                            />
                                            <span
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: colorFamilyColors[family] || '#6B7280' }}
                                            />
                                            <span className="text-sm">{colorFamilyLabels[family] || family}</span>
                                        </label>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* 纸张类型筛选 */}
                    {uniquePaperTypes.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="bg-white border-0 shadow-sm text-gray-700 gap-1">
                                    纸张
                                    {paperTypeFilters.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                            {paperTypeFilters.length}
                                        </Badge>
                                    )}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2" align="start">
                                <div className="space-y-2">
                                    {uniquePaperTypes.map(type => (
                                        <label key={type} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 cursor-pointer">
                                            <Checkbox
                                                checked={paperTypeFilters.includes(type)}
                                                onCheckedChange={() => toggleFilter(type, paperTypeFilters, setPaperTypeFilters)}
                                            />
                                            <span className="text-sm">{paperTypeLabels[type] || type}</span>
                                        </label>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* 参与者筛选 */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="bg-white border-0 shadow-sm text-gray-700 gap-1">
                                参与者
                                {hasParticipants !== null && (
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                        1
                                    </Badge>
                                )}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 cursor-pointer">
                                    <Checkbox
                                        checked={hasParticipants === true}
                                        onCheckedChange={() => setHasParticipants(hasParticipants === true ? null : true)}
                                    />
                                    <span className="text-sm">有参与者</span>
                                </label>
                                <label className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 cursor-pointer">
                                    <Checkbox
                                        checked={hasParticipants === false}
                                        onCheckedChange={() => setHasParticipants(hasParticipants === false ? null : false)}
                                    />
                                    <span className="text-sm">无参与者</span>
                                </label>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* 清除筛选 */}
                    {hasFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-gray-500 hover:text-gray-700 gap-1"
                        >
                            <X className="h-4 w-4" />
                            清除 ({activeFilterCount})
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
                        <StandardColorCard
                            key={color.id}
                            color={color}
                            searchQuery={search}
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


