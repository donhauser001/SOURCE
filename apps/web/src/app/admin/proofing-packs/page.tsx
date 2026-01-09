/**
 * 后台打样包 SKU 管理页面
 * 
 * v0.3.0 - Bridge 阶段
 */

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, ExternalLink, TrendingUp } from 'lucide-react';

// 纸张类型标签
const PAPER_TYPE_LABELS: Record<string, string> = {
    PREMIUM_MATTE: '高阶映画',
    UNCOATED: '纯质纸',
    COATED: '铜版纸',
    OFFSET: '双胶纸',
    LIGHTWEIGHT: '轻型纸',
};

// 格式化价格
function formatPrice(priceInCents: number): string {
    return `¥${(priceInCents / 100).toFixed(2)}`;
}

async function getProofingPacks() {
    const proofingPacks = await prisma.proofingPack.findMany({
        orderBy: [
            { color: { colorId: 'asc' } },
            { paperType: 'asc' },
        ],
        include: {
            color: {
                select: {
                    id: true,
                    colorId: true,
                    name: true,
                },
            },
            _count: {
                select: { buyIntents: true },
            },
        },
    });

    return proofingPacks;
}

async function getStats() {
    const [total, active, totalIntents] = await Promise.all([
        prisma.proofingPack.count(),
        prisma.proofingPack.count({ where: { isActive: true } }),
        prisma.buyIntent.count(),
    ]);

    // 最近 7 天的购买意图
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentIntents = await prisma.buyIntent.count({
        where: { createdAt: { gte: weekAgo } },
    });

    return { total, active, totalIntents, recentIntents };
}

export default async function ProofingPacksPage() {
    const [proofingPacks, stats] = await Promise.all([
        getProofingPacks(),
        getStats(),
    ]);

    return (
        <div className="space-y-6">
            {/* 操作按钮 */}
            <div className="flex justify-end">
                <Link href="/admin/proofing-packs/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        新增打样包
                    </Button>
                </Link>
            </div>

            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            打样包总数
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            在售
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            总购买意图
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalIntents}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            近 7 天
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.recentIntents}</div>
                    </CardContent>
                </Card>
            </div>

            {/* 打样包列表 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        打样包列表
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {proofingPacks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            暂无打样包数据
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">色彩</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">纸张</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">价格</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">购买意图</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">外链</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {proofingPacks.map((pack) => (
                                        <tr key={pack.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium">{pack.color.colorId}</div>
                                                    <div className="text-sm text-muted-foreground">{pack.color.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {PAPER_TYPE_LABELS[pack.paperType] || pack.paperType}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {formatPrice(pack.price)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={pack.isActive ? 'default' : 'secondary'}>
                                                    {pack.isActive ? '在售' : '下架'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm">{pack._count.buyIntents}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {pack.externalUrl ? (
                                                    <a
                                                        href={pack.externalUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        查看
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/admin/proofing-packs/${pack.id}/edit` as never}>
                                                    <Button variant="ghost" size="sm">
                                                        编辑
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

