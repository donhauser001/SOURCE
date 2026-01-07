/**
 * 购买意图统计页面
 * 
 * v0.3.1 - Bridge 阶段
 */

import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ShoppingBag, Calendar, Users } from 'lucide-react';

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

async function getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, today, thisWeek, thisMonth, uniqueUsers] = await Promise.all([
        prisma.buyIntent.count(),
        prisma.buyIntent.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.buyIntent.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.buyIntent.count({ where: { createdAt: { gte: monthAgo } } }),
        prisma.buyIntent.groupBy({
            by: ['userId'],
            where: { userId: { not: null } },
        }).then(r => r.length),
    ]);

    return { total, today, thisWeek, thisMonth, uniqueUsers };
}

async function getTopSkus(limit: number = 10) {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const results = await prisma.buyIntent.groupBy({
        by: ['proofingPackId'],
        _count: { _all: true },
        where: { createdAt: { gte: monthAgo } },
        orderBy: { _count: { proofingPackId: 'desc' } },
        take: limit,
    });

    const skuIds = results.map(r => r.proofingPackId);
    const skus = await prisma.proofingPack.findMany({
        where: { id: { in: skuIds } },
        include: {
            color: {
                select: { colorId: true, name: true },
            },
        },
    });

    const skuMap = new Map(skus.map(s => [s.id, s]));

    return results.map(r => ({
        proofingPackId: r.proofingPackId,
        count: r._count._all,
        sku: skuMap.get(r.proofingPackId),
    }));
}

async function getRecentIntents(limit: number = 20) {
    return prisma.buyIntent.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
            proofingPack: {
                include: {
                    color: {
                        select: { colorId: true, name: true },
                    },
                },
            },
        },
    });
}

export default async function BuyIntentsPage() {
    const [stats, topSkus, recentIntents] = await Promise.all([
        getStats(),
        getTopSkus(),
        getRecentIntents(),
    ]);

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div>
                <h1 className="text-2xl font-bold">购买意图统计</h1>
                <p className="text-muted-foreground">追踪用户购买行为和热门 SKU</p>
            </div>

            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <ShoppingBag className="h-4 w-4" />
                            总计
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            今日
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.today}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            近 7 天
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.thisWeek}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            近 30 天
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.thisMonth}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            独立用户
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 热门 SKU */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            热门 SKU（近 30 天）
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topSkus.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                暂无数据
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {topSkus.map((item, index) => (
                                    <div
                                        key={item.proofingPackId}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-muted-foreground w-6">
                                                #{index + 1}
                                            </span>
                                            <div>
                                                <div className="font-medium">
                                                    {item.sku?.color.colorId || '未知'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {item.sku?.color.name} / {PAPER_TYPE_LABELS[item.sku?.paperType || ''] || item.sku?.paperType}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{item.count}</div>
                                            <div className="text-xs text-muted-foreground">次点击</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 最近记录 */}
                <Card>
                    <CardHeader>
                        <CardTitle>最近记录</CardTitle>
                        <CardDescription>最近 20 条购买意图</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentIntents.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                暂无数据
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {recentIntents.map((intent) => (
                                    <div
                                        key={intent.id}
                                        className="flex items-center justify-between p-2 rounded border text-sm"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {intent.proofingPack.color.colorId} / {PAPER_TYPE_LABELS[intent.proofingPack.paperType] || intent.proofingPack.paperType}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {intent.user?.email || '匿名用户'}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(intent.createdAt).toLocaleString('zh-CN', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

