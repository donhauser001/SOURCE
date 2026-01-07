/**
 * 合作者管理列表页
 */

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Eye } from 'lucide-react';

// 合作者类型标签
const partnerTypeLabels: Record<string, string> = {
    PRINTER: '印厂',
    PAPER_VENDOR: '纸商',
    INK_VENDOR: '油墨商',
    LAB: '实验室',
    CONSULTANT: '顾问',
};

// 状态标签
const statusLabels: Record<string, string> = {
    PENDING: '待审核',
    ACTIVE: '活跃',
    SUSPENDED: '暂停',
    INACTIVE: '停止',
};

async function getPartners() {
    return prisma.partner.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    colorParticipations: true,
                    users: true,
                    batches: true,
                },
            },
        },
    });
}

export default async function AdminPartnersPage() {
    const partners = await getPartners();

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'PENDING':
                return 'warning';
            case 'SUSPENDED':
            case 'INACTIVE':
                return 'destructive';
            default:
                return 'secondary';
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
        <div className="p-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">合作者管理</h1>
                    <p className="text-muted-foreground mt-1">管理印厂、纸商、油墨商等合作伙伴</p>
                </div>
                <Button asChild>
                    {/* @ts-expect-error - Next.js 15 strict route types */}
                    <Link href="/admin/partners/new">
                        <Plus className="h-4 w-4 mr-2" />
                        添加合作者
                    </Link>
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>合作者列表</CardTitle>
                    <CardDescription>共 {partners.length} 条记录</CardDescription>
                </CardHeader>
                <CardContent>
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
                                {partners.map((partner) => (
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
                                                        {partnerTypeLabels[type] || type}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={getStatusVariant(partner.status)}>
                                                {statusLabels[partner.status] || partner.status}
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
                                                    {/* @ts-expect-error - Next.js 15 strict route types */}
                                                    <Link href={`/admin/partners/${partner.id}/edit`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {partners.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-muted-foreground">
                                            暂无数据，点击右上角添加合作者
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

