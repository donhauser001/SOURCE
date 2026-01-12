'use client';

/**
 * 虚拟滚动表格组件
 * 
 * 基于 @tanstack/react-virtual 实现高性能大数据表格
 * 
 * v0.6.0 - Phase 6: 虚拟滚动
 */

import { useRef, useCallback, ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// 列定义
export interface VirtualTableColumn<T> {
    id: string;
    header: ReactNode;
    width?: number | string;
    minWidth?: number;
    cell: (row: T, index: number) => ReactNode;
    className?: string;
}

// 组件属性
export interface VirtualTableProps<T> {
    data: T[];
    columns: VirtualTableColumn<T>[];
    rowHeight?: number;
    maxHeight?: number | string;
    
    // 行选择
    selectable?: boolean;
    selectedIds?: Set<string>;
    onSelectChange?: (ids: Set<string>) => void;
    getRowId: (row: T) => string;
    
    // 行样式
    getRowClassName?: (row: T) => string;
    
    // 空状态
    emptyMessage?: string;
    
    // 加载状态
    loading?: boolean;
}

export function VirtualTable<T>({
    data,
    columns,
    rowHeight = 52,
    maxHeight = 600,
    selectable = false,
    selectedIds = new Set(),
    onSelectChange,
    getRowId,
    getRowClassName,
    emptyMessage = '暂无数据',
    loading = false,
}: VirtualTableProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);

    // 虚拟化
    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 5,
    });

    // 选择处理
    const handleSelectAll = useCallback(() => {
        if (!onSelectChange) return;
        
        if (selectedIds.size === data.length) {
            onSelectChange(new Set());
        } else {
            onSelectChange(new Set(data.map(getRowId)));
        }
    }, [data, selectedIds, onSelectChange, getRowId]);

    const handleSelectRow = useCallback((id: string) => {
        if (!onSelectChange) return;
        
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        onSelectChange(newSet);
    }, [selectedIds, onSelectChange]);

    // 计算总宽度
    const totalWidth = columns.reduce((acc, col) => {
        if (typeof col.width === 'number') return acc + col.width;
        return acc;
    }, selectable ? 48 : 0);

    const virtualItems = rowVirtualizer.getVirtualItems();

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* 固定表头 */}
            <div className="bg-muted/50 border-b sticky top-0 z-10">
                <div 
                    className="flex"
                    style={{ minWidth: totalWidth || '100%' }}
                >
                    {selectable && (
                        <div className="flex items-center justify-center w-12 px-2 py-3 border-r">
                            <Checkbox
                                checked={data.length > 0 && selectedIds.size === data.length}
                                onCheckedChange={handleSelectAll}
                            />
                        </div>
                    )}
                    {columns.map((column) => (
                        <div
                            key={column.id}
                            className={cn(
                                "px-4 py-3 font-medium text-sm text-muted-foreground",
                                column.className
                            )}
                            style={{
                                width: column.width,
                                minWidth: column.minWidth,
                                flex: column.width ? 'none' : '1',
                            }}
                        >
                            {column.header}
                        </div>
                    ))}
                </div>
            </div>

            {/* 虚拟滚动容器 */}
            <div
                ref={parentRef}
                className="overflow-auto"
                style={{ maxHeight }}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        加载中...
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        {emptyMessage}
                    </div>
                ) : (
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualItems.map((virtualRow) => {
                            const row = data[virtualRow.index];
                            const rowId = getRowId(row);
                            const isSelected = selectedIds.has(rowId);

                            return (
                                <div
                                    key={virtualRow.key}
                                    className={cn(
                                        "absolute top-0 left-0 w-full flex border-b hover:bg-muted/50 transition-colors",
                                        isSelected && "bg-primary/5",
                                        getRowClassName?.(row)
                                    )}
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                        minWidth: totalWidth || '100%',
                                    }}
                                >
                                    {selectable && (
                                        <div className="flex items-center justify-center w-12 px-2 border-r">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleSelectRow(rowId)}
                                            />
                                        </div>
                                    )}
                                    {columns.map((column) => (
                                        <div
                                            key={column.id}
                                            className={cn(
                                                "flex items-center px-4 text-sm",
                                                column.className
                                            )}
                                            style={{
                                                width: column.width,
                                                minWidth: column.minWidth,
                                                flex: column.width ? 'none' : '1',
                                            }}
                                        >
                                            {column.cell(row, virtualRow.index)}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
