'use client';

/**
 * 共建者管理列表页
 *
 * v0.5.1 - Admin 阶段
 * 使用 tRPC 统一架构
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
import { PartnerTypeLabels, PartnerStatusLabels } from '@/lib/validations/partner';

export default function AdminPartnersPage() {
    // 状态
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // 数据查询
    const { data, isLoading, refetch } = trpc.partner.adminList.useQuery({
        limit: 100,
    });

    // 筛选后的数据
    const filteredPartners = useMemo(() => {
        if (!data?.items) return [];

        return data.items.filter((partner) => {
            // 搜索
            if (search) {
                const searchLower = search.toLowerCase();
                const matchesSearch =
                    partner.partnerId.toLowerCase().includes(searchLower) ||
                    partner.name.toLowerCase().includes(searchLower) ||
                    (partner.shortName?.toLowerCase().includes(searchLower)) ||
                    (partner.contactEmail?.toLowerCase().includes(searchLower));
                if (!matchesSearch) return false;
            }

            // 类型筛选
            if (typeFilter !== 'all' && !partner.types.includes(typeFilter as 'PRINTER' | 'PAPER_VENDOR' | 'INK_VENDOR' | 'LAB' | 'CONSULTANT')) {
                return false;
            }

            // 状态筛选
            if (statusFilter !== 'all' && partner.status !== statusFilter) {
                return false;
            }

            return true;
        });
    }, [data?.items, search, typeFilter, statusFilter]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'PENDING':
                return 'secondary';
            case 'SUSPENDED':
            case 'INACTIVE':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'PRINTER':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
            case 'PAPER_VENDOR':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
            case 'INK_VENDOR':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
            case 'LAB':
                return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
            case 'CONSULTANT':
                return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* 操作按钮 */}
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/admin/partners/new">
                        <Plus className="h-4 w-4 mr-2" />
                        添加共建者
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
                                placeholder="搜索编号、名称、邮箱..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-32">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部类型</SelectItem>
                                    <SelectItem value="PRINTER">印厂</SelectItem>
                                    <SelectItem value="PAPER_VENDOR">纸商</SelectItem>
                                    <SelectItem value="INK_VENDOR">油墨商</SelectItem>
                                    <SelectItem value="LAB">实验室</SelectItem>
                                    <SelectItem value="CONSULTANT">顾问</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="状态" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部状态</SelectItem>
                                    <SelectItem value="PENDING">待审核</SelectItem>
                                    <SelectItem value="ACTIVE">正常</SelectItem>
                                    <SelectItem value="SUSPENDED">暂停</SelectItem>
                                    <SelectItem value="INACTIVE">停止</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 数据表格 */}
            <Card>
                <CardHeader>
                    <CardTitle>共建者列表</CardTitle>
                    <CardDescription>
                        {isLoading ? '加载中...' : `共 ${filteredPartners.length} 条记录`}
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
                                        <th className="text-left py-3 px-4 font-medium">编号</th>
                                        <th className="text-left py-3 px-4 font-medium">名称</th>
                                        <th className="text-left py-3 px-4 font-medium">类型</th>
                                        <th className="text-left py-3 px-4 font-medium">状态</th>
                                        <th className="text-left py-3 px-4 font-medium">参与颜色</th>
                                        <th className="text-left py-3 px-4 font-medium">用户</th>
                                        <th className="text-left py-3 px-4 font-medium">批次</th>
                                        <th className="text-left py-3 px-4 font-medium">地区</th>
                                        <th className="text-left py-3 px-4 font-medium">创建时间</th>
                                        <th className="text-right py-3 px-4 font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPartners.map((partner) => (
                                        <tr key={partner.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                    {partner.partnerId}
                                                </code>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium">{partner.name}</div>
                                                {partner.shortName && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {partner.shortName}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {partner.types.map((type) => (
                                                        <span
                                                            key={type}
                                                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeColor(type)}`}
                                                        >
                                                            {PartnerTypeLabels[type] || type}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={getStatusVariant(partner.status)}>
                                                    {PartnerStatusLabels[partner.status] || partner.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {partner._count.colorParticipations}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {partner._count.users}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {partner._count.batches}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {partner.region || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {new Date(partner.createdAt).toLocaleDateString('zh-CN')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/partners/${partner.partnerId}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/admin/partners/${partner.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPartners.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="py-8 text-center text-muted-foreground">
                                                {search || typeFilter !== 'all' || statusFilter !== 'all'
                                                    ? '没有匹配的记录'
                                                    : '暂无数据，点击右上角添加共建者'}
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
