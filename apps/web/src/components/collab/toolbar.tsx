'use client';

/**
 * ColLab 工具栏组件
 *
 * 功能：
 * - 推荐筛选（按钮组）
 * - 类型筛选（级联菜单，后台内容分类）
 * - 搜索框
 * 
 * 样式：与色彩库工具栏保持一致
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Search,
    X,
    ChevronRight,
    Check,
    Palette,
    BookOpen,
    FileText,
    FolderOpen,
    Sparkles,
    LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { trpc } from '@/lib/trpc';

// ============================================================================
// 类型定义
// ============================================================================

export type TabValue =
    | 'all_featured'
    | 'featured_works'
    | 'featured_tutorials'
    | 'featured_articles'
    | 'all_contents';

export type ContentTypeValue = 'WORK' | 'TUTORIAL' | 'ARTICLE';

/** 分类树节点类型 */
interface CategoryTreeNode {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    parentId: string | null;
    level: number;
    order: number;
    isActive: boolean;
    contentTypes: ContentTypeValue[];
    children?: CategoryTreeNode[];
    _count?: { contents: number };
}

export interface ToolbarFilters {
    tab: TabValue;
    contentTypes: ContentTypeValue[];
    categorySlug?: string;
    q?: string;
}

interface ToolbarProps {
    /** 当前筛选值 */
    filters: ToolbarFilters;
    /** 筛选变化回调 */
    onFiltersChange: (filters: ToolbarFilters) => void;
    /** 是否显示推荐筛选 */
    showTabs?: boolean;
    /** 是否显示类型筛选（后台内容分类） */
    showTypeFilter?: boolean;
    /** 是否显示搜索框 */
    showSearch?: boolean;
    /** 自定义类名 */
    className?: string;
}

// ============================================================================
// 常量
// ============================================================================

const tabs: { value: TabValue; label: string; shortLabel: string; icon: React.ElementType }[] = [
    { value: 'all_featured', label: '所有推荐', shortLabel: '推荐', icon: Sparkles },
    { value: 'featured_works', label: '推荐作品', shortLabel: '作品', icon: Palette },
    { value: 'featured_tutorials', label: '推荐教程', shortLabel: '教程', icon: BookOpen },
    { value: 'featured_articles', label: '推荐文章', shortLabel: '文章', icon: FileText },
    { value: 'all_contents', label: '所有内容', shortLabel: '全部', icon: LayoutGrid },
];

// Tab 与内容类型的映射
const tabToContentType: Record<TabValue, ContentTypeValue | null> = {
    all_featured: null,
    featured_works: 'WORK',
    featured_tutorials: 'TUTORIAL',
    featured_articles: 'ARTICLE',
    all_contents: null,
};

// ============================================================================
// 级联分类菜单组件
// ============================================================================

interface CascadeCategoryMenuProps {
    categories: CategoryTreeNode[];
    selectedSlug?: string;
    onSelect: (slug: string | undefined) => void;
}

function CascadeCategoryMenu({ categories, selectedSlug, onSelect }: CascadeCategoryMenuProps) {
    // 展开的分类路径（每一级展开的分类 ID）
    const [expandedPath, setExpandedPath] = useState<string[]>([]);

    // 根据 selectedSlug 找到分类的完整路径
    const findCategoryPath = useCallback((
        items: CategoryTreeNode[],
        targetSlug: string,
        path: string[] = []
    ): string[] | null => {
        for (const item of items) {
            if (item.slug === targetSlug) {
                return path;
            }
            if (item.children?.length) {
                const found = findCategoryPath(item.children, targetSlug, [...path, item.id]);
                if (found) return found;
            }
        }
        return null;
    }, []);

    // 初始化展开路径（如果有已选中的分类）
    useEffect(() => {
        if (selectedSlug && categories.length > 0) {
            const path = findCategoryPath(categories, selectedSlug);
            if (path) {
                setExpandedPath(path);
            }
        }
    }, [selectedSlug, categories, findCategoryPath]);

    // 获取当前层级的分类列表
    const getCurrentLevelCategories = (level: number): CategoryTreeNode[] => {
        if (level === 0) return categories;

        let current: CategoryTreeNode[] = categories;
        for (let i = 0; i < level; i++) {
            const expandedId = expandedPath[i];
            if (!expandedId) return [];
            const found = current.find(c => c.id === expandedId);
            if (!found?.children) return [];
            current = found.children;
        }
        return current;
    };

    // 处理分类点击
    const handleCategoryClick = (category: CategoryTreeNode, level: number) => {
        if (category.children && category.children.length > 0) {
            // 有子分类，只展开下一级（不可选中）
            const newPath = expandedPath.slice(0, level);
            newPath[level] = category.id;
            setExpandedPath(newPath);
        } else {
            // 没有子分类，直接选中
            onSelect(category.slug);
        }
    };

    // 渲染单个层级
    const renderLevel = (level: number) => {
        const items = getCurrentLevelCategories(level);
        if (items.length === 0) return null;

        const expandedId = expandedPath[level];

        return (
            <div
                key={level}
                className={`
                    min-w-48 p-2
                    ${level > 0 ? 'border-l border-gray-200' : ''}
                `}
            >
                {level === 0 && (
                    <button
                        type="button"
                        onClick={() => onSelect(undefined)}
                        className={`
                            w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm
                            transition-colors duration-150
                            ${!selectedSlug
                                ? 'bg-gray-900 text-white'
                                : 'hover:bg-gray-100 text-gray-700'
                            }
                        `}
                    >
                        <span>全部内容类型</span>
                        {!selectedSlug && <Check className="h-4 w-4 flex-shrink-0" />}
                    </button>
                )}
                {items.map((category) => {
                    const hasChildren = category.children && category.children.length > 0;
                    const isExpanded = expandedId === category.id;
                    const isSelected = category.slug === selectedSlug;

                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => handleCategoryClick(category, level)}
                            className={`
                                w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm
                                transition-colors duration-150
                                ${isSelected
                                    ? 'bg-gray-900 text-white'
                                    : isExpanded
                                        ? 'bg-gray-100 text-gray-900'
                                        : hasChildren
                                            ? 'hover:bg-gray-100 text-gray-500'
                                            : 'hover:bg-gray-100 text-gray-700'
                                }
                            `}
                        >
                            <span className="truncate">{category.name}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {isSelected && <Check className="h-4 w-4" />}
                                {hasChildren && (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    // 计算需要渲染的层级数
    const levelsToRender = expandedPath.length + 1;

    return (
        <div className="flex">
            {Array.from({ length: Math.min(levelsToRender, 3) }).map((_, i) => renderLevel(i))}
        </div>
    );
}

// ============================================================================
// 工具栏组件
// ============================================================================

export function Toolbar({
    filters,
    onFiltersChange,
    showTabs = true,
    showTypeFilter = true,
    showSearch = true,
    className = '',
}: ToolbarProps) {
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters.q || '');
    const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

    // 获取分类列表（使用树形结构）
    const { data: categoriesData } = trpc.contentCategory.list.useQuery({});
    const categories = (categoriesData?.tree || []) as CategoryTreeNode[];

    // 当前选中的分类
    const selectedCategory = useMemo(() => {
        if (!filters.categorySlug) return null;
        const findCategory = (items: CategoryTreeNode[]): CategoryTreeNode | null => {
            for (const item of items) {
                if (item.slug === filters.categorySlug) return item;
                if (item.children?.length) {
                    const found = findCategory(item.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findCategory(categories);
    }, [categories, filters.categorySlug]);

    // 处理 Tab 切换
    const handleTabChange = useCallback((tab: TabValue) => {
        const mappedType = tabToContentType[tab];
        onFiltersChange({
            ...filters,
            tab,
            contentTypes: mappedType ? [mappedType] : [],
        });
    }, [filters, onFiltersChange]);

    // 处理分类筛选
    const handleCategoryChange = useCallback((slug: string | undefined) => {
        onFiltersChange({
            ...filters,
            categorySlug: slug,
        });
        setCategoryMenuOpen(false);
    }, [filters, onFiltersChange]);

    // 处理搜索
    const handleSearch = useCallback(() => {
        onFiltersChange({
            ...filters,
            q: localSearch || undefined,
        });
    }, [filters, localSearch, onFiltersChange]);

    // 回车搜索
    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);

    // 清除搜索
    const handleClearSearch = useCallback(() => {
        setLocalSearch('');
        setSearchExpanded(false);
        onFiltersChange({
            ...filters,
            q: undefined,
        });
    }, [filters, onFiltersChange]);

    // 清除所有筛选
    const clearAllFilters = useCallback(() => {
        setLocalSearch('');
        onFiltersChange({
            tab: 'all_featured',
            contentTypes: [],
            categorySlug: undefined,
            q: undefined,
        });
    }, [onFiltersChange]);

    // 是否有活动筛选（不包括默认的 tab）
    const hasActiveFilters = useMemo(() => {
        return filters.q || filters.categorySlug;
    }, [filters]);

    // 同步外部 q 变化
    useEffect(() => {
        setLocalSearch(filters.q || '');
    }, [filters.q]);

    return (
        <div className={`${className}`}>
            {/* 工具栏 - 全圆角风格，与色彩库保持一致 */}
            <div className="flex items-center gap-2 p-2 rounded-full bg-gray-100">
                {/* 推荐类型按钮组 */}
                {showTabs && (
                    <div className="flex items-center gap-1 p-1 bg-white rounded-full">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = filters.tab === tab.value;
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => handleTabChange(tab.value)}
                                    className={`
                                        flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium
                                        whitespace-nowrap transition-colors duration-150
                                        ${isActive
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                    title={tab.label}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="hidden lg:inline">{tab.shortLabel}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* 分隔线 */}
                {showTabs && (showTypeFilter || showSearch) && (
                    <div className="h-8 w-px bg-gray-300 hidden sm:block" />
                )}

                {/* 搜索框 - 点击展开 */}
                {showSearch && (
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
                                placeholder="搜索..."
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                onBlur={() => {
                                    if (!localSearch) setSearchExpanded(false);
                                }}
                                className="w-full pl-12 pr-10 h-11 bg-white border-0 rounded-full text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                                autoFocus={searchExpanded}
                            />
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 类型筛选（级联分类菜单） */}
                {showTypeFilter && categories.length > 0 && (
                    <Popover open={categoryMenuOpen} onOpenChange={setCategoryMenuOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-11 min-w-24 bg-white border-0 rounded-full text-gray-700 gap-1 px-4 hover:bg-gray-50 justify-center"
                            >
                                <FolderOpen className="h-4 w-4" />
                                <span className="max-w-32 truncate">{selectedCategory?.name || '内容类型'}</span>
                                <ChevronRight className="h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto p-0 rounded-2xl"
                            align="start"
                            sideOffset={8}
                        >
                            <CascadeCategoryMenu
                                categories={categories}
                                selectedSlug={filters.categorySlug}
                                onSelect={handleCategoryChange}
                            />
                        </PopoverContent>
                    </Popover>
                )}

                {/* 清除筛选 */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-11 w-11 rounded-full text-gray-500 hover:text-gray-700 hover:bg-white p-0"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// 默认筛选值
// ============================================================================

export const defaultFilters: ToolbarFilters = {
    tab: 'all_featured',
    contentTypes: [],
    categorySlug: undefined,
    q: undefined,
};

// ============================================================================
// 辅助函数：将筛选转换为 API 参数
// ============================================================================

export function filtersToApiParams(filters: ToolbarFilters) {
    return {
        tab: filters.tab,
        contentTypes: filters.contentTypes.length > 0 ? filters.contentTypes : undefined,
        categorySlug: filters.categorySlug,
        q: filters.q,
    };
}
