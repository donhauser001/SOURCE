'use client';

/**
 * 通用数据表格组件
 * 
 * 用于后台管理页面的数据列表展示
 */

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export interface Column<T> {
    key: string;
    header: string | ReactNode;
    cell: (row: T, index: number) => ReactNode;
    className?: string;
    headerClassName?: string;
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    rowKey?: (row: T) => string;

    // 选择功能
    selectable?: boolean;
    selectedIds?: Set<string>;
    onSelectChange?: (ids: Set<string>) => void;

    // 分页
    hasMore?: boolean;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;

    className?: string;
}

export function DataTable<T>({
    columns,
    data,
    isLoading = false,
    emptyMessage = '暂无数据',
    onRowClick,
    rowKey,
    selectable = false,
    selectedIds = new Set(),
    onSelectChange,
    hasMore = false,
    onLoadMore,
    isLoadingMore = false,
    className = '',
}: DataTableProps<T>) {
    // 获取行的 key
    const getRowKey = (row: T, index: number): string => {
        if (rowKey) return rowKey(row);
        // 尝试从常见字段获取
        const anyRow = row as any;
        return anyRow.id ?? anyRow.key ?? String(index);
    };

    // 全选处理
    const handleSelectAll = (checked: boolean) => {
        if (!onSelectChange) return;
        if (checked) {
            const allIds = new Set(data.map((row, index) => getRowKey(row, index)));
            onSelectChange(allIds);
        } else {
            onSelectChange(new Set());
        }
    };

    // 单行选择处理
    const handleSelectRow = (rowKey: string, checked: boolean) => {
        if (!onSelectChange) return;
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(rowKey);
        } else {
            newSelected.delete(rowKey);
        }
        onSelectChange(newSelected);
    };

    // 检查是否全选
    const isAllSelected = data.length > 0 && selectedIds.size === data.length;
    const isSomeSelected = selectedIds.size > 0 && selectedIds.size < data.length;

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            {selectable && (
                                <th className="py-3 px-4 w-12">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="全选"
                                        className={isSomeSelected ? 'data-[state=checked]:bg-muted' : ''}
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`text-left py-3 px-4 font-medium ${column.headerClassName ?? ''}`}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => {
                            const key = getRowKey(row, index);
                            const isSelected = selectedIds.has(key);

                            return (
                                <tr
                                    key={key}
                                    className={`border-b hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''
                                        } ${isSelected ? 'bg-muted/30' : ''}`}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {selectable && (
                                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) =>
                                                    handleSelectRow(key, checked as boolean)
                                                }
                                                aria-label={`选择行 ${index + 1}`}
                                            />
                                        </td>
                                    )}
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`py-3 px-4 ${column.className ?? ''}`}
                                        >
                                            {column.cell(row, index)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                        {data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    className="py-12 text-center text-muted-foreground"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 加载更多 */}
            {hasMore && onLoadMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                加载中...
                            </>
                        ) : (
                            '加载更多'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// 常用单元格渲染器
// =============================================================================

import { Badge } from '@/components/ui/badge';
import {
    getColorStatusVariant,
    getAuditStatusVariant,
    getPartnerStatusVariant,
    getRecommendationVariant,
    getUserRoleVariant,
    getUserTierVariant,
    COLOR_STATUS_LABELS,
    AUDIT_STATUS_LABELS,
    PARTNER_STATUS_LABELS,
    RECOMMENDATION_LABELS,
    USER_ROLE_LABELS,
    USER_TIER_LABELS,
    type ColorStatus,
    type AuditStatus,
    type PartnerStatus,
    type Recommendation,
    type UserRole,
    type UserTier,
} from '@/lib/labels';

/**
 * 色彩状态 Badge
 */
export function ColorStatusBadge({ status }: { status: ColorStatus }) {
    return (
        <Badge variant={getColorStatusVariant(status)}>
            {COLOR_STATUS_LABELS[status] || status}
        </Badge>
    );
}

/**
 * 审计状态 Badge
 */
export function AuditStatusBadge({ status }: { status: AuditStatus }) {
    return (
        <Badge variant={getAuditStatusVariant(status)}>
            {AUDIT_STATUS_LABELS[status] || status}
        </Badge>
    );
}

/**
 * 共建者状态 Badge
 */
export function PartnerStatusBadge({ status }: { status: PartnerStatus }) {
    return (
        <Badge variant={getPartnerStatusVariant(status)}>
            {PARTNER_STATUS_LABELS[status] || status}
        </Badge>
    );
}

/**
 * 推荐等级 Badge
 */
export function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
    return (
        <Badge variant={getRecommendationVariant(recommendation)}>
            {RECOMMENDATION_LABELS[recommendation] || recommendation}
        </Badge>
    );
}

/**
 * 用户角色 Badge
 */
export function UserRoleBadge({ role }: { role: UserRole }) {
    return (
        <Badge variant={getUserRoleVariant(role)}>
            {USER_ROLE_LABELS[role] || role}
        </Badge>
    );
}

/**
 * 用户等级 Badge
 */
export function UserTierBadge({ tier }: { tier: UserTier }) {
    return (
        <Badge variant={getUserTierVariant(tier)}>
            {USER_TIER_LABELS[tier] || tier}
        </Badge>
    );
}

/**
 * 日期时间单元格
 */
export function DateTimeCell({ date, format = 'datetime' }: { date: string | Date | null; format?: 'datetime' | 'date' | 'relative' }) {
    if (!date) return <span className="text-muted-foreground">-</span>;

    const d = new Date(date);

    if (format === 'relative') {
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes} 分钟前`;
        if (hours < 24) return `${hours} 小时前`;
        if (days < 30) return `${days} 天前`;
    }

    const options: Intl.DateTimeFormatOptions = format === 'date'
        ? { year: 'numeric', month: '2-digit', day: '2-digit' }
        : { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };

    return <span className="text-muted-foreground whitespace-nowrap">{d.toLocaleString('zh-CN', options)}</span>;
}

/**
 * 代码单元格（用于 ID 等）
 */
export function CodeCell({ value, maxWidth = 150 }: { value: string | null; maxWidth?: number }) {
    if (!value) return <span className="text-muted-foreground">-</span>;

    return (
        <code
            className="text-xs bg-muted px-1.5 py-0.5 rounded truncate inline-block"
            style={{ maxWidth }}
            title={value}
        >
            {value}
        </code>
    );
}
