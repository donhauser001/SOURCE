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

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
    Plus, Edit, Eye, Search, Filter, Download, Trash2, 
    CheckSquare, Square, MoreHorizontal, FileJson, FileSpreadsheet,
    Loader2, ChevronDown
} from 'lucide-react';
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
    getColorStatusVariant,
    getAuditStatusVariant,
    type ColorStatus,
    type AuditStatus,
} from '@/lib/labels';

// 每页显示条数
const PAGE_SIZE = 20;

export default function AdminColorsPage() {
    // 筛选状态
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [auditFilter, setAuditFilter] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    };

    const hasFilters = debouncedSearch || statusFilter !== 'all' || auditFilter !== 'all';

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">色彩管理</h1>
                    <p className="text-muted-foreground">管理色彩身份证数据</p>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
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
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            添加色彩
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 搜索和筛选 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索色彩编号或名称..."
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-32">
                                    <Filter className="h-4 w-4 mr-2" />
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
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="审计状态" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部审计</SelectItem>
                                    {Object.entries(AUDIT_STATUS_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {hasFilters && (
                                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                                    清除筛选
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                            <th className="text-left py-3 px-4 font-medium">编号</th>
                                            <th className="text-left py-3 px-4 font-medium">名称</th>
                                            <th className="text-left py-3 px-4 font-medium">Lab</th>
                                            <th className="text-left py-3 px-4 font-medium">状态</th>
                                            <th className="text-left py-3 px-4 font-medium">审计</th>
                                            <th className="text-left py-3 px-4 font-medium">配方</th>
                                            <th className="text-left py-3 px-4 font-medium">创建时间</th>
                                            <th className="text-right py-3 px-4 font-medium">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allColors.map((color) => (
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
                                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                        {color.colorId}
                                                    </code>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-medium">{color.name}</span>
                                                </td>
                                                <td className="py-3 px-4 font-mono text-xs">
                                                    L*{color.labL.toFixed(1)} a*{color.labA.toFixed(1)} b*{color.labB.toFixed(1)}
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
                                                <td className="py-3 px-4 text-muted-foreground">
                                                    {new Date(color.createdAt).toLocaleDateString('zh-CN')}
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
                                        ))}
                                        {allColors.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                                                    {hasFilters
                                                        ? '没有匹配的记录'
                                                        : '暂无数据，点击右上角添加色彩'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

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
