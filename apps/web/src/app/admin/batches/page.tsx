'use client';

/**
 * 批次管理列表页
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Eye, Search, Filter, Loader2 } from 'lucide-react';
import { BatchTypeLabels } from '@/lib/validations/batch';

export default function AdminBatchesPage() {
    // 状态
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // 数据查询
    const { data, isLoading } = trpc.batch.adminList.useQuery({
        limit: 100,
    });

    // 筛选后的数据
    const filteredBatches = useMemo(() => {
        if (!data?.items) return [];

        return data.items.filter((batch) => {
            // 搜索
            if (search) {
                const searchLower = search.toLowerCase();
                const matchesSearch =
                    batch.batchNo.toLowerCase().includes(searchLower) ||
                    batch.createdBy.toLowerCase().includes(searchLower) ||
                    (batch.notes?.toLowerCase().includes(searchLower)) ||
                    (batch.partner?.name.toLowerCase().includes(searchLower));
                if (!matchesSearch) return false;
            }

            // 类型筛选
            if (typeFilter !== 'all' && batch.type !== typeFilter) {
                return false;
            }

            return true;
        });
    }, [data?.items, search, typeFilter]);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'MEASURE':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
            case 'SCAN':
                return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
            case 'PRINT':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
            case 'AUDIT':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* 操作按钮 */}
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/admin/batches/new">
                        <Plus className="h-4 w-4 mr-2" />
                        创建批次
                    </Link>
                </Button>
            </div>

            {/* 搜索和筛选 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索批次编号、创建人、共建者..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-40">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部类型</SelectItem>
                                    <SelectItem value="MEASURE">分光仪测量</SelectItem>
                                    <SelectItem value="SCAN">高清扫描</SelectItem>
                                    <SelectItem value="PRINT">印刷打样</SelectItem>
                                    <SelectItem value="AUDIT">审计复核</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 数据表格 */}
            <Card>
                <CardHeader>
                    <CardTitle>批次列表</CardTitle>
                    <CardDescription>
                        {isLoading ? '加载中...' : `共 ${filteredBatches.length} 条记录`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium">批次编号</th>
                                        <th className="text-left py-3 px-4 font-medium">类型</th>
                                        <th className="text-left py-3 px-4 font-medium">共建者</th>
                                        <th className="text-left py-3 px-4 font-medium">仪器型号</th>
                                        <th className="text-left py-3 px-4 font-medium">色彩数</th>
                                        <th className="text-left py-3 px-4 font-medium">纸张表现</th>
                                        <th className="text-left py-3 px-4 font-medium">创建人</th>
                                        <th className="text-left py-3 px-4 font-medium">创建时间</th>
                                        <th className="text-right py-3 px-4 font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBatches.map((batch) => (
                                        <tr key={batch.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                    {batch.batchNo}
                                                </code>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getTypeColor(batch.type)}`}
                                                >
                                                    {BatchTypeLabels[batch.type]}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {batch.partner ? (
                                                    <div>
                                                        <div className="font-medium">{batch.partner.shortName || batch.partner.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {batch.partner.partnerId}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {batch.instrumentModel || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {batch._count.colors}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {batch._count.paperProfiles}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {batch.createdBy}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {new Date(batch.createdAt).toLocaleDateString('zh-CN')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/admin/batches/${batch.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/admin/batches/${batch.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredBatches.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="py-8 text-center text-muted-foreground">
                                                {search || typeFilter !== 'all'
                                                    ? '没有匹配的记录'
                                                    : '暂无数据，点击右上角创建批次'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
