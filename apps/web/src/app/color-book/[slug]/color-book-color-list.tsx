'use client';

/**
 * 色彩簿色彩列表客户端组件
 * 
 * 遵循 SOURCE 列表页面视觉交互规范
 * - 全圆角工具栏
 * - 搜索框展开/收缩动画
 * - Popover 多选筛选器（状态、审计、色系）
 * - 视图切换（卡片/极简/列表）
 * - 分页功能
 */

import { useState, useMemo, useEffect } from 'react';
import { Search, X, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, Grid3X3, List, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { StandardColorCard } from '@/components/color/standard-color-card';
import { MinimalColorCard } from '@/components/color/minimal-color-card';
import { ColorListItem } from '@/components/color/color-list-item';

// =============================================================================
// 类型定义
// =============================================================================

type ViewMode = 'cards' | 'minimal' | 'list';

interface ColorEntry {
    id: string;
    sectionName: string | null;
    pageNumber: string | null;
    color: {
        id: string;
        colorId: string;
        name: string;
        slug: string;
        labL: number;
        labA: number;
        labB: number;
        status: string;
        auditStatus: string;
        colorFamily: string | null;
    };
}

interface Props {
    entries: ColorEntry[];
}

// =============================================================================
// 常量
// =============================================================================

const COLOR_STATUS_LABELS: Record<string, string> = {
    ACTIVE: '激活',
    EXPERIMENTAL: '实验中',
    DRAFT: '草稿',
};

const AUDIT_STATUS_LABELS: Record<string, string> = {
    PENDING: '待审核',
    VERIFIED: '已验证',
    REJECTED: '已拒绝',
};

const COLOR_FAMILY_LABELS: Record<string, string> = {
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

const COLOR_FAMILY_COLORS: Record<string, string> = {
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

// =============================================================================
// 主组件
// =============================================================================

export function ColorBookColorList({ entries }: Props) {
    // 状态
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [search, setSearch] = useState('');
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [statusFilters, setStatusFilters] = useState<string[]>([]);
    const [auditFilters, setAuditFilters] = useState<string[]>([]);
    const [familyFilters, setFamilyFilters] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    // 根据视图模式设置每页数量
    const pageSize = useMemo(() => {
        switch (viewMode) {
            case 'cards': return 30;      // 5列 x 6行
            case 'minimal': return 32;    // 8列 x 4行
            case 'list': return 20;       // 2列 x 10行
            default: return 30;
        }
    }, [viewMode]);

    // 从 localStorage 恢复视图模式
    useEffect(() => {
        const saved = localStorage.getItem('color-book-view-mode');
        if (saved && ['cards', 'minimal', 'list'].includes(saved)) {
            setViewMode(saved as ViewMode);
        }
    }, []);

    // 保存视图模式到 localStorage
    useEffect(() => {
        localStorage.setItem('color-book-view-mode', viewMode);
    }, [viewMode]);

    // 获取唯一的筛选值
    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(entries.map(e => e.color.status));
        return Array.from(statuses);
    }, [entries]);

    const uniqueAuditStatuses = useMemo(() => {
        const statuses = new Set(entries.map(e => e.color.auditStatus));
        return Array.from(statuses);
    }, [entries]);

    const uniqueFamilies = useMemo(() => {
        const families = new Set<string>();
        entries.forEach(e => {
            if (e.color.colorFamily) families.add(e.color.colorFamily);
        });
        return Array.from(families);
    }, [entries]);

    // 筛选颜色
    const filteredColors = useMemo(() => {
        let result = entries;

        // 搜索筛选
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                e => e.color.colorId.toLowerCase().includes(q) ||
                    e.color.name.toLowerCase().includes(q)
            );
        }

        // 状态筛选
        if (statusFilters.length > 0) {
            result = result.filter(e => statusFilters.includes(e.color.status));
        }

        // 审计状态筛选
        if (auditFilters.length > 0) {
            result = result.filter(e => auditFilters.includes(e.color.auditStatus));
        }

        // 色系筛选
        if (familyFilters.length > 0) {
            result = result.filter(e => e.color.colorFamily && familyFilters.includes(e.color.colorFamily));
        }

        return result;
    }, [entries, search, statusFilters, auditFilters, familyFilters]);

    // 分页计算
    const totalPages = Math.ceil(filteredColors.length / pageSize);

    const paginatedColors = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredColors.slice(start, end);
    }, [filteredColors, currentPage, pageSize]);

    // 当筛选条件或视图模式变化时，重置到第一页
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilters, auditFilters, familyFilters, viewMode]);

    // 清除筛选
    const clearFilters = () => {
        setSearch('');
        setStatusFilters([]);
        setAuditFilters([]);
        setFamilyFilters([]);
        setCurrentPage(1);
    };

    const hasFilters = search || statusFilters.length > 0 || auditFilters.length > 0 || familyFilters.length > 0;

    // 分页控制
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // 筛选器切换
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
            {/* 工具栏 - 全圆角风格 */}
            <div className="flex items-center gap-2 p-2 rounded-full bg-gray-100">
                {/* 搜索框 - 点击展开 */}
                <div
                    className={`
                        relative flex items-center
                        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${searchExpanded ? 'flex-1 min-w-0' : 'w-11 flex-shrink-0'}
                    `}
                >
                    <button
                        type="button"
                        onClick={() => setSearchExpanded(true)}
                        className={`
                            absolute left-0 top-0 h-11 w-11 rounded-full bg-white
                            flex items-center justify-center
                            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                            ${searchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-gray-50'}
                        `}
                    >
                        <Search className="h-5 w-5 text-gray-500" />
                    </button>
                    <div
                        className={`
                            relative w-full
                            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                            ${searchExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                        `}
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="搜索颜色编号或名称..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onBlur={() => {
                                if (!search) setSearchExpanded(false);
                            }}
                            className="w-full pl-12 pr-10 h-11 bg-white border-0 rounded-full text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            autoFocus={searchExpanded}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setSearchExpanded(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* 右侧固定区域 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* 筛选按钮组 - 固定宽度 */}
                    <div className="flex items-center gap-2">
                        {/* 状态筛选 */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-11 w-24 bg-white border-0 rounded-full text-gray-700 gap-1 px-0 hover:bg-gray-50 justify-center">
                                    <span>状态</span>
                                    {statusFilters.length > 0 && (
                                        <span className="h-5 min-w-5 px-1.5 rounded-full bg-gray-900 text-white text-xs inline-flex items-center justify-center font-medium">
                                            {statusFilters.length}
                                        </span>
                                    )}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2 rounded-2xl" align="start">
                                <div className="space-y-1">
                                    {uniqueStatuses.map(status => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => toggleFilter(status, statusFilters, setStatusFilters)}
                                            className={`
                                                w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm
                                                transition-colors duration-150
                                                ${statusFilters.includes(status)
                                                    ? 'bg-gray-900 text-white'
                                                    : 'hover:bg-gray-100 text-gray-700'}
                                            `}
                                        >
                                            <span>{COLOR_STATUS_LABELS[status] || status}</span>
                                            {statusFilters.includes(status) && (
                                                <Check className="h-4 w-4 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* 审计状态筛选 */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-11 w-24 bg-white border-0 rounded-full text-gray-700 gap-1 px-0 hover:bg-gray-50 justify-center">
                                    <span>审计</span>
                                    {auditFilters.length > 0 && (
                                        <span className="h-5 min-w-5 px-1.5 rounded-full bg-gray-900 text-white text-xs inline-flex items-center justify-center font-medium">
                                            {auditFilters.length}
                                        </span>
                                    )}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2 rounded-2xl" align="start">
                                <div className="space-y-1">
                                    {uniqueAuditStatuses.map(status => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => toggleFilter(status, auditFilters, setAuditFilters)}
                                            className={`
                                                w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm
                                                transition-colors duration-150
                                                ${auditFilters.includes(status)
                                                    ? 'bg-gray-900 text-white'
                                                    : 'hover:bg-gray-100 text-gray-700'}
                                            `}
                                        >
                                            <span>{AUDIT_STATUS_LABELS[status] || status}</span>
                                            {auditFilters.includes(status) && (
                                                <Check className="h-4 w-4 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* 色系筛选 */}
                        {uniqueFamilies.length > 0 && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-11 w-24 bg-white border-0 rounded-full text-gray-700 gap-1 px-0 hover:bg-gray-50 justify-center">
                                        <span>色系</span>
                                        {familyFilters.length > 0 && (
                                            <span className="h-5 min-w-5 px-1.5 rounded-full bg-gray-900 text-white text-xs inline-flex items-center justify-center font-medium">
                                                {familyFilters.length}
                                            </span>
                                        )}
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2 rounded-2xl" align="start">
                                    <div className="space-y-1 max-h-64 overflow-y-auto">
                                        {uniqueFamilies.map(family => (
                                            <button
                                                key={family}
                                                type="button"
                                                onClick={() => toggleFilter(family, familyFilters, setFamilyFilters)}
                                                className={`
                                                    w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm
                                                    transition-colors duration-150
                                                    ${familyFilters.includes(family)
                                                        ? 'bg-gray-900 text-white'
                                                        : 'hover:bg-gray-100 text-gray-700'}
                                                `}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: COLOR_FAMILY_COLORS[family] || '#6B7280' }}
                                                    />
                                                    {COLOR_FAMILY_LABELS[family] || family}
                                                </span>
                                                {familyFilters.includes(family) && (
                                                    <Check className="h-4 w-4 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}

                        {/* 清除筛选 */}
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-11 w-11 rounded-full text-gray-500 hover:text-gray-700 hover:bg-white p-0"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    {/* 分隔线 */}
                    <div className="h-8 w-px bg-gray-300" />

                    {/* 视图切换 */}
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(v) => v && setViewMode(v as ViewMode)}
                        className="bg-white rounded-full p-1"
                    >
                        <ToggleGroupItem
                            value="cards"
                            aria-label="卡片视图"
                            className="h-9 w-9 rounded-full data-[state=on]:bg-gray-900 data-[state=on]:text-white"
                        >
                            <LayoutGrid className="h-5 w-5" />
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="minimal"
                            aria-label="极简视图"
                            className="h-9 w-9 rounded-full data-[state=on]:bg-gray-900 data-[state=on]:text-white"
                        >
                            <Grid3X3 className="h-5 w-5" />
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="list"
                            aria-label="列表视图"
                            className="h-9 w-9 rounded-full data-[state=on]:bg-gray-900 data-[state=on]:text-white"
                        >
                            <List className="h-5 w-5" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            {/* 色彩列表 */}
            {filteredColors.length > 0 ? (
                <>
                    {/* 卡片视图 */}
                    {viewMode === 'cards' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                            {paginatedColors.map((entry) => (
                                <StandardColorCard
                                    key={entry.id}
                                    color={{
                                        id: entry.color.id,
                                        colorId: entry.color.colorId,
                                        name: entry.color.name,
                                        labL: entry.color.labL,
                                        labA: entry.color.labA,
                                        labB: entry.color.labB,
                                        status: entry.color.status,
                                        auditStatus: entry.color.auditStatus,
                                    }}
                                    searchQuery={search}
                                />
                            ))}
                        </div>
                    )}

                    {/* 极简视图 */}
                    {viewMode === 'minimal' && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {paginatedColors.map((entry) => (
                                <MinimalColorCard
                                    key={entry.id}
                                    color={{
                                        id: entry.color.id,
                                        colorId: entry.color.colorId,
                                        name: entry.color.name,
                                        labL: entry.color.labL,
                                        labA: entry.color.labA,
                                        labB: entry.color.labB,
                                        status: entry.color.status,
                                        auditStatus: entry.color.auditStatus,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* 列表视图 */}
                    {viewMode === 'list' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {paginatedColors.map((entry) => (
                                <ColorListItem
                                    key={entry.id}
                                    color={{
                                        id: entry.color.id,
                                        colorId: entry.color.colorId,
                                        name: entry.color.name,
                                        labL: entry.color.labL,
                                        labA: entry.color.labA,
                                        labB: entry.color.labB,
                                        status: entry.color.status,
                                        auditStatus: entry.color.auditStatus,
                                        colorFamily: entry.color.colorFamily,
                                    }}
                                    searchQuery={search}
                                    colorFamilyLabels={COLOR_FAMILY_LABELS}
                                />
                            ))}
                        </div>
                    )}

                    {/* 分页控件 */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-8">
                            {/* 上一页 */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="h-10 w-10 p-0 rounded-full border-gray-200 disabled:opacity-40"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>

                            {/* 页码 */}
                            <div className="flex items-center gap-1">
                                {/* 始终显示第一页 */}
                                <Button
                                    variant={currentPage === 1 ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => goToPage(1)}
                                    className={`h-10 w-10 p-0 rounded-full ${currentPage === 1 ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}`}
                                >
                                    1
                                </Button>

                                {/* 前省略号 */}
                                {currentPage > 3 && totalPages > 5 && (
                                    <span className="px-2 text-gray-400">···</span>
                                )}

                                {/* 中间页码 */}
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        if (page === 1 || page === totalPages) return false;
                                        if (totalPages <= 5) return true;
                                        return Math.abs(page - currentPage) <= 1;
                                    })
                                    .map(page => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => goToPage(page)}
                                            className={`h-10 w-10 p-0 rounded-full ${currentPage === page ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}`}
                                        >
                                            {page}
                                        </Button>
                                    ))
                                }

                                {/* 后省略号 */}
                                {currentPage < totalPages - 2 && totalPages > 5 && (
                                    <span className="px-2 text-gray-400">···</span>
                                )}

                                {/* 始终显示最后一页（如果不是第一页） */}
                                {totalPages > 1 && (
                                    <Button
                                        variant={currentPage === totalPages ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => goToPage(totalPages)}
                                        className={`h-10 w-10 p-0 rounded-full ${currentPage === totalPages ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}`}
                                    >
                                        {totalPages}
                                    </Button>
                                )}
                            </div>

                            {/* 下一页 */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="h-10 w-10 p-0 rounded-full border-gray-200 disabled:opacity-40"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                </>
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
