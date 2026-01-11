'use client';

/**
 * 色彩管理列表页（增强版）
 * 
 * v0.5.2 - 服务端分页和筛选
 * 
 * 功能：
 * - 服务端搜索和筛选（Cursor-based Pagination）
 * - 批量选择和操作
 * - CSV/JSON 导出
 */

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
    Plus, Edit, Eye, Search, Download, Trash2, 
    CheckSquare, Square, MoreHorizontal, FileJson, FileSpreadsheet,
    Loader2, ChevronDown, BookOpen, LayoutGrid, LayoutList
} from 'lucide-react';
import { labToRgb } from '@/lib/color';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc';
import {
    COLOR_STATUS_LABELS,
    AUDIT_STATUS_LABELS,
    COLOR_FAMILY_LABELS,
    COLOR_FAMILY_COLORS,
    getColorStatusVariant,
    getAuditStatusVariant,
    type ColorStatus,
    type AuditStatus,
    type ColorFamily,
} from '@/lib/labels';

// 每页显示条数
const PAGE_SIZE = 20;

export default function AdminColorsPage() {
    // 筛选状态
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [auditFilter, setAuditFilter] = useState<string>('all');
    const [familyFilter, setFamilyFilter] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    // 从 localStorage 恢复视图模式
    useEffect(() => {
        const saved = localStorage.getItem('admin-colors-view-mode');
        if (saved === 'table' || saved === 'grid') {
            setViewMode(saved);
        }
    }, []);

    // 视图模式变化时持久化
    const handleViewModeChange = (mode: 'table' | 'grid') => {
        setViewMode(mode);
        localStorage.setItem('admin-colors-view-mode', mode);
    };

    // 防抖搜索
    const handleSearchChange = (value: string) => {
        setSearch(value);
        // 简单防抖
        setTimeout(() => {
            setDebouncedSearch(value);
        }, 300);
    };

    // 数据查询（使用新的分页 API）
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
        trpc.color.adminListPaginated.useInfiniteQuery(
            {
                limit: PAGE_SIZE,
                search: debouncedSearch || undefined,
                status: statusFilter !== 'all' ? (statusFilter as ColorStatus) : undefined,
                auditStatus: auditFilter !== 'all' ? (auditFilter as AuditStatus) : undefined,
                colorFamily: familyFilter !== 'all' ? (familyFilter as ColorFamily) : undefined,
            },
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor,
            }
        );

    // 批量删除 mutation
    const deleteMutation = trpc.color.adminBatchDelete.useMutation({
        onSuccess: () => {
            setSelectedIds(new Set());
            refetch();
        },
    });

    // 合并所有分页数据
    const allColors = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.items);
    }, [data]);

    // 总数（从第一页获取）
    const totalCount = data?.pages[0]?.totalCount ?? 0;

    // 全选/取消全选
    const handleSelectAll = () => {
        if (selectedIds.size === allColors.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allColors.map((c) => c.id)));
        }
    };

    // 单选/取消单选
    const handleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // 导出 CSV
    const handleExportCSV = () => {
        const colorsToExport = selectedIds.size > 0
            ? allColors.filter((c) => selectedIds.has(c.id))
            : allColors;

        const headers = ['colorId', 'name', 'labL', 'labA', 'labB', 'status', 'auditStatus', 'createdAt'];
        const rows = colorsToExport.map((c) => [
            c.colorId,
            c.name,
            c.labL,
            c.labA,
            c.labB,
            c.status,
            c.auditStatus,
            new Date(c.createdAt).toISOString(),
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        downloadFile(csv, 'colors.csv', 'text/csv');
    };

    // 导出 JSON
    const handleExportJSON = () => {
        const colorsToExport = selectedIds.size > 0
            ? allColors.filter((c) => selectedIds.has(c.id))
            : allColors;

        const json = JSON.stringify(colorsToExport, null, 2);
        downloadFile(json, 'colors.json', 'application/json');
    };

    // 下载文件
    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 批量删除
    const handleBatchDelete = () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？此操作不可撤销。`)) return;

        deleteMutation.mutate({ ids: Array.from(selectedIds) });
    };

    // 清除筛选
    const handleClearFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setStatusFilter('all');
        setAuditFilter('all');
        setFamilyFilter('all');
    };

    const hasFilters = debouncedSearch || statusFilter !== 'all' || auditFilter !== 'all' || familyFilter !== 'all';

    return (
        <div className="space-y-6">
            {/* 工具栏：视图切换 + 搜索筛选 + 操作按钮 */}
            <div className="flex flex-wrap items-center gap-3">
                {/* 视图切换 */}
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                    <Button
                        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => handleViewModeChange('table')}
                        className="h-8 px-2"
                    >
                        <LayoutList className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => handleViewModeChange('grid')}
                        className="h-8 px-2"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                </div>

                {/* 搜索框 */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索色彩编号或名称..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                {/* 筛选器 */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-28 h-9">
                        <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        {Object.entries(COLOR_STATUS_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={auditFilter} onValueChange={setAuditFilter}>
                    <SelectTrigger className="w-28 h-9">
                        <SelectValue placeholder="审计" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部审计</SelectItem>
                        {Object.entries(AUDIT_STATUS_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={familyFilter} onValueChange={setFamilyFilter}>
                    <SelectTrigger className="w-28 h-9">
                        <SelectValue placeholder="色系" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部色系</SelectItem>
                        {Object.entries(COLOR_FAMILY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLOR_FAMILY_COLORS[key as ColorFamily] }}
                                    />
                                    {label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9">
                        清除
                    </Button>
                )}

                {/* 分隔 */}
                <div className="flex-1" />

                {/* 操作按钮 */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                            <Download className="h-4 w-4" />
                            导出
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            导出 CSV
                            {selectedIds.size > 0 && (
                                <Badge variant="secondary" className="ml-auto">
                                    {selectedIds.size} 条
                                </Badge>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportJSON} className="gap-2">
                            <FileJson className="h-4 w-4" />
                            导出 JSON
                            {selectedIds.size > 0 && (
                                <Badge variant="secondary" className="ml-auto">
                                    {selectedIds.size} 条
                                </Badge>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Link href="/admin/colors/new">
                    <Button size="sm" className="h-9 gap-2">
                        <Plus className="h-4 w-4" />
                        添加色彩
                    </Button>
                </Link>
            </div>

            {/* 批量操作栏 */}
            {selectedIds.size > 0 && (
                <Card className="bg-muted/50">
                    <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">
                                已选择 <strong>{selectedIds.size}</strong> 条记录
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedIds(new Set())}
                                >
                                    取消选择
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleBatchDelete}
                                    disabled={deleteMutation.isPending}
                                    className="gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    删除选中
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 数据表格 */}
            <Card>
                <CardHeader>
                    <CardTitle>色彩列表</CardTitle>
                    <CardDescription>
                        {isLoading ? '加载中...' : (
                            <>
                                共 {totalCount} 条记录
                                {allColors.length < totalCount && (
                                    <span className="text-muted-foreground">（已加载 {allColors.length} 条）</span>
                                )}
                            </>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            {/* 网格视图 */}
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {allColors.map((color) => {
                                        const rgb = labToRgb(color.labL, color.labA, color.labB);
                                        const bgColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                                        const isLight = color.labL > 60;
                                        
                                        return (
                                            <div
                                                key={color.id}
                                                className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 border border-border"
                                            >
                                                {/* 颜色区域 */}
                                                <div
                                                    className="aspect-square relative"
                                                    style={{ backgroundColor: bgColor }}
                                                >
                                                    {/* 选择框 */}
                                                    <button
                                                        onClick={() => handleSelect(color.id)}
                                                        className={`absolute top-2 left-2 p-1 rounded-md transition-opacity ${
                                                            selectedIds.has(color.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        } ${isLight ? 'bg-black/20 hover:bg-black/30' : 'bg-white/20 hover:bg-white/30'}`}
                                                    >
                                                        {selectedIds.has(color.id) ? (
                                                            <CheckSquare className={`h-4 w-4 ${isLight ? 'text-black' : 'text-white'}`} />
                                                        ) : (
                                                            <Square className={`h-4 w-4 ${isLight ? 'text-black/60' : 'text-white/60'}`} />
                                                        )}
                                                    </button>
                                                    
                                                    {/* 快捷操作 */}
                                                    <div className={`absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                        <Link
                                                            href={`/color/${color.colorId}`}
                                                            className={`p-1 rounded-md ${isLight ? 'bg-black/20 hover:bg-black/30 text-black' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                        <Link
                                                            href={`/admin/colors/${color.id}/edit`}
                                                            className={`p-1 rounded-md ${isLight ? 'bg-black/20 hover:bg-black/30 text-black' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </div>
                                                    
                                                    {/* 状态标签 */}
                                                    <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
                                                        <Badge 
                                                            variant={getColorStatusVariant(color.status as ColorStatus)}
                                                            className="text-[10px] px-1.5 py-0"
                                                        >
                                                            {COLOR_STATUS_LABELS[color.status as ColorStatus] || color.status}
                                                        </Badge>
                                                        {color._count.recipes > 0 && (
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                {color._count.recipes} 配方
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* 信息区域 */}
                                                <div className="p-3 bg-card">
                                                    <div className="font-medium text-sm truncate">{color.name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{color.colorId}</div>
                                                    {color.colorBookEntries && color.colorBookEntries.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {color.colorBookEntries.slice(0, 1).map((entry) => (
                                                                <Link
                                                                    key={entry.colorBook.id}
                                                                    href={`/color-book/${entry.colorBook.slug}`}
                                                                    className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800 truncate max-w-full"
                                                                >
                                                                    <BookOpen className="h-2.5 w-2.5 flex-shrink-0" />
                                                                    <span className="truncate">{entry.colorBook.name}</span>
                                                                </Link>
                                                            ))}
                                                            {color.colorBookEntries.length > 1 && (
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    +{color.colorBookEntries.length - 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {allColors.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-muted-foreground">
                                            {hasFilters ? '没有匹配的记录' : '暂无数据，点击右上角添加色彩'}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 列表视图 */}
                            {viewMode === 'table' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 font-medium w-10">
                                                <button
                                                    onClick={handleSelectAll}
                                                    className="hover:text-foreground text-muted-foreground"
                                                >
                                                    {selectedIds.size === allColors.length && allColors.length > 0 ? (
                                                        <CheckSquare className="h-4 w-4" />
                                                    ) : (
                                                        <Square className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium w-12">颜色</th>
                                            <th className="text-left py-3 px-4 font-medium">编号</th>
                                            <th className="text-left py-3 px-4 font-medium">名称</th>
                                            <th className="text-left py-3 px-4 font-medium">色彩簿</th>
                                            <th className="text-left py-3 px-4 font-medium">状态</th>
                                            <th className="text-left py-3 px-4 font-medium">审计</th>
                                            <th className="text-left py-3 px-4 font-medium">配方</th>
                                            <th className="text-right py-3 px-4 font-medium">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allColors.map((color) => {
                                            const rgb = labToRgb(color.labL, color.labA, color.labB);
                                            const bgColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                                            
                                            return (
                                            <tr key={color.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => handleSelect(color.id)}
                                                        className="hover:text-foreground text-muted-foreground"
                                                    >
                                                        {selectedIds.has(color.id) ? (
                                                            <CheckSquare className="h-4 w-4 text-primary" />
                                                        ) : (
                                                            <Square className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div
                                                        className="w-8 h-8 rounded-md shadow-sm border border-border"
                                                        style={{ backgroundColor: bgColor }}
                                                        title={`L*${color.labL.toFixed(1)} a*${color.labA.toFixed(1)} b*${color.labB.toFixed(1)}`}
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                        {color.colorId}
                                                    </code>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-medium">{color.name}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {color.colorBookEntries && color.colorBookEntries.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {color.colorBookEntries.slice(0, 2).map((entry) => (
                                                                <Link
                                                                    key={entry.colorBook.id}
                                                                    href={`/color-book/${entry.colorBook.slug}`}
                                                                    className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors"
                                                                >
                                                                    <BookOpen className="h-3 w-3" />
                                                                    {entry.colorBook.name}
                                                                </Link>
                                                            ))}
                                                            {color.colorBookEntries.length > 2 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    +{color.colorBookEntries.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={getColorStatusVariant(color.status as ColorStatus)}>
                                                        {COLOR_STATUS_LABELS[color.status as ColorStatus] || color.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={getAuditStatusVariant(color.auditStatus as AuditStatus)}>
                                                        {AUDIT_STATUS_LABELS[color.auditStatus as AuditStatus] || color.auditStatus}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {color._count.recipes}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/color/${color.colorId}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/admin/colors/${color.id}/edit`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem asChild>
                                                                    {/* @ts-expect-error - Next.js 15 strict route types */}
                                                                    <Link href={`/admin/colors/${color.id}/audit-notes`}>
                                                                        审计注记
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => {
                                                                        if (confirm('确定要删除此色彩吗？')) {
                                                                            deleteMutation.mutate({ ids: [color.id] });
                                                                        }
                                                                    }}
                                                                >
                                                                    删除
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        )})}
                                        {allColors.length === 0 && (
                                            <tr>
                                                <td colSpan={10} className="py-8 text-center text-muted-foreground">
                                                    {hasFilters
                                                        ? '没有匹配的记录'
                                                        : '暂无数据，点击右上角添加色彩'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            )}

                            {/* 加载更多按钮 */}
                            {hasNextPage && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="gap-2"
                                    >
                                        {isFetchingNextPage ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                加载中...
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="h-4 w-4" />
                                                加载更多
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
