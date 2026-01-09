'use client';

/**
 * 通用搜索筛选栏组件
 * 
 * 用于后台管理页面的搜索和筛选功能
 */

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    placeholder?: string;
    options: FilterOption[];
}

export interface SearchFilterBarProps {
    searchPlaceholder?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    filters?: FilterConfig[];
    filterValues?: Record<string, string>;
    onFilterChange?: (key: string, value: string) => void;
    className?: string;
}

export function SearchFilterBar({
    searchPlaceholder = '搜索...',
    searchValue,
    onSearchChange,
    filters = [],
    filterValues = {},
    onFilterChange,
    className = '',
}: SearchFilterBarProps) {
    return (
        <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
            {/* 搜索框 */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* 筛选器 */}
            {filters.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {filters.map((filter) => (
                        <Select
                            key={filter.key}
                            value={filterValues[filter.key] ?? 'all'}
                            onValueChange={(value) => onFilterChange?.(filter.key, value)}
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder={filter.placeholder || filter.label} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{filter.label}</SelectItem>
                                {filter.options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// 预设筛选配置
// =============================================================================

import {
    COLOR_STATUS_LABELS,
    AUDIT_STATUS_LABELS,
    PARTNER_STATUS_LABELS,
    PARTNER_TYPE_LABELS,
    USER_ROLE_LABELS,
    USER_TIER_LABELS,
    PAPER_TYPE_LABELS,
    RECOMMENDATION_LABELS,
} from '@/lib/labels';

/**
 * 色彩状态筛选配置
 */
export const colorStatusFilterConfig: FilterConfig = {
    key: 'status',
    label: '全部状态',
    options: Object.entries(COLOR_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
};

/**
 * 审计状态筛选配置
 */
export const auditStatusFilterConfig: FilterConfig = {
    key: 'auditStatus',
    label: '审计状态',
    options: Object.entries(AUDIT_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
};

/**
 * 合作者状态筛选配置
 */
export const partnerStatusFilterConfig: FilterConfig = {
    key: 'status',
    label: '全部状态',
    options: Object.entries(PARTNER_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
};

/**
 * 合作者类型筛选配置
 */
export const partnerTypeFilterConfig: FilterConfig = {
    key: 'type',
    label: '全部类型',
    options: Object.entries(PARTNER_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
};

/**
 * 用户角色筛选配置
 */
export const userRoleFilterConfig: FilterConfig = {
    key: 'role',
    label: '全部角色',
    options: Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
};

/**
 * 用户等级筛选配置
 */
export const userTierFilterConfig: FilterConfig = {
    key: 'tier',
    label: '全部等级',
    options: Object.entries(USER_TIER_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
};

/**
 * 纸张类型筛选配置
 */
export const paperTypeFilterConfig: FilterConfig = {
    key: 'paperType',
    label: '全部纸张',
    options: Object.entries(PAPER_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
};

/**
 * 推荐等级筛选配置
 */
export const recommendationFilterConfig: FilterConfig = {
    key: 'recommendation',
    label: '推荐等级',
    options: Object.entries(RECOMMENDATION_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
};
