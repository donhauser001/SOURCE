/**
 * 色彩管理列表页
 */

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Eye } from 'lucide-react';
import { ColorStatusLabels, AuditStatusLabels } from '@/lib/validations/color';

async function getColors() {
    return prisma.color.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    recipes: true,
                    paperProfiles: true,
                    participations: true,
                },
            },
        },
    });
}

export default async function AdminColorsPage() {
    const colors = await getColors();

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'VERIFIED':
                return 'success';
            case 'EXPERIMENTAL':
                return 'warning';
            case 'DEPRECATED':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getAuditVariant = (status: string) => {
        return status === 'VERIFIED' ? 'success' : 'warning';
    };

    return (
        <div className="p-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">色彩管理</h1>
                    <p className="text-muted-foreground mt-1">管理色彩身份证数据</p>
                </div>
                <Button asChild>
                    <Link href="/admin/colors/new">
                        <Plus className="h-4 w-4 mr-2" />
                        添加色彩
                    </Link>
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>色彩列表</CardTitle>
                    <CardDescription>共 {colors.length} 条记录</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">编号</th>
                                    <th className="text-left py-3 px-4 font-medium">名称</th>
                                    <th className="text-left py-3 px-4 font-medium">Lab 值</th>
                                    <th className="text-left py-3 px-4 font-medium">状态</th>
                                    <th className="text-left py-3 px-4 font-medium">审计</th>
                                    <th className="text-left py-3 px-4 font-medium">配方</th>
                                    <th className="text-left py-3 px-4 font-medium">纸张</th>
                                    <th className="text-left py-3 px-4 font-medium">参与者</th>
                                    <th className="text-left py-3 px-4 font-medium">创建时间</th>
                                    <th className="text-right py-3 px-4 font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {colors.map((color) => (
                                    <tr key={color.id} className="border-b hover:bg-muted/50">
                                        <td className="py-3 px-4">
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                {color.colorId}
                                            </code>
                                        </td>
                                        <td className="py-3 px-4 font-medium">{color.name}</td>
                                        <td className="py-3 px-4 font-mono text-xs">
                                            L*{color.labL.toFixed(1)} a*{color.labA.toFixed(1)} b*{color.labB.toFixed(1)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={getStatusVariant(color.status)}>
                                                {ColorStatusLabels[color.status] || color.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={getAuditVariant(color.auditStatus)}>
                                                {AuditStatusLabels[color.auditStatus] || color.auditStatus}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center">{color._count.recipes}</td>
                                        <td className="py-3 px-4 text-center">{color._count.paperProfiles}</td>
                                        <td className="py-3 px-4 text-center">{color._count.participations}</td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            {new Date(color.createdAt).toLocaleDateString('zh-CN')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-end gap-2">
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
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {colors.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-muted-foreground">
                                            暂无数据，点击右上角添加色彩
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

