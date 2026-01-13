/**
 * 批次详情页
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Calendar, User, Beaker, FileText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { BatchTypeLabels } from '@/lib/validations/batch';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BatchDetailPage({ params }: PageProps) {
    const { id } = await params;

    const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
            partner: {
                select: {
                    partnerId: true,
                    name: true,
                    shortName: true,
                    types: true,
                },
            },
            colors: {
                select: {
                    id: true,
                    colorId: true,
                    name: true,
                    status: true,
                    labL: true,
                    labA: true,
                    labB: true,
                },
                orderBy: { colorId: 'asc' },
            },
            paperProfiles: {
                select: {
                    id: true,
                    recommendation: true,
                    color: {
                        select: {
                            colorId: true,
                            name: true,
                        },
                    },
                    paperType: {
                        select: {
                            code: true,
                            name: true,
                        },
                    },
                },
                orderBy: { paperType: { order: 'asc' } },
            },
        },
    });

    if (!batch) {
        notFound();
    }

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
        <div className="max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href="/admin/batches">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        返回列表
                    </Link>
                </Button>
                <Button asChild>
                    <Link href={`/admin/batches/${batch.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        编辑批次
                    </Link>
                </Button>
            </div>

            {/* Basic Info */}
            <Card>
                <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">批次编号</div>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{batch.batchNo}</code>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">类型</div>
                        <span className={`inline-flex px-3 py-1 rounded text-sm font-medium ${getTypeColor(batch.type)}`}>
                            {BatchTypeLabels[batch.type]}
                        </span>
                    </div>
                    {batch.partner && (
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">关联共建者</div>
                            <div>
                                <div className="font-medium">{batch.partner.shortName || batch.partner.name}</div>
                                <div className="text-sm text-muted-foreground">{batch.partner.partnerId}</div>
                            </div>
                        </div>
                    )}
                    <div>
                        <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            创建人
                        </div>
                        <div>{batch.createdBy}</div>
                    </div>
                    {batch.instrumentModel && (
                        <div>
                            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                <Beaker className="h-3 w-3" />
                                仪器型号
                            </div>
                            <div>{batch.instrumentModel}</div>
                        </div>
                    )}
                    {batch.calibratedAt && (
                        <div>
                            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                校准时间
                            </div>
                            <div>{new Date(batch.calibratedAt).toLocaleDateString('zh-CN')}</div>
                        </div>
                    )}
                    <div>
                        <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            创建时间
                        </div>
                        <div>{new Date(batch.createdAt).toLocaleString('zh-CN')}</div>
                    </div>
                    {batch.notes && (
                        <div className="col-span-2">
                            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                备注
                            </div>
                            <p className="text-sm">{batch.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>关联色彩</CardTitle>
                        <CardDescription>{batch.colors.length} 个色彩</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {batch.colors.length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {batch.colors.map((color) => (
                                    <Link
                                        key={color.id}
                                        href={`/color/${color.colorId}`}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div>
                                            <div className="font-medium">{color.colorId}</div>
                                            <div className="text-sm text-muted-foreground">{color.name}</div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            L*{color.labL.toFixed(1)} a*{color.labA.toFixed(1)} b*{color.labB.toFixed(1)}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                暂无关联色彩
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>纸张表现</CardTitle>
                        <CardDescription>{batch.paperProfiles.length} 条记录</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {batch.paperProfiles.length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {batch.paperProfiles.map((profile) => (
                                    <div
                                        key={profile.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div>
                                            <div className="font-medium">{profile.color.colorId}</div>
                                            <div className="text-sm text-muted-foreground">{profile.paperType.name}</div>
                                        </div>
                                        <Badge variant="outline">{profile.recommendation}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                暂无纸张表现数据
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
