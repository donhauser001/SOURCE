/**
 * 后台激活码管理页面
 * 
 * v0.4.0 - Access 阶段
 */

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Key, CheckCircle, XCircle, Clock } from 'lucide-react';

// 状态标签
const STATUS_CONFIG = {
    unused: { label: '未使用', variant: 'default' as const, icon: Key },
    used: { label: '已使用', variant: 'secondary' as const, icon: CheckCircle },
    expired: { label: '已过期', variant: 'destructive' as const, icon: XCircle },
};

function getCodeStatus(code: {
    usedAt: Date | null;
    expiresAt: Date | null;
}): 'unused' | 'used' | 'expired' {
    if (code.usedAt) return 'used';
    if (code.expiresAt && code.expiresAt < new Date()) return 'expired';
    return 'unused';
}

async function getStats() {
    const now = new Date();

    const [total, used, expired, unused] = await Promise.all([
        prisma.activationCode.count(),
        prisma.activationCode.count({
            where: { usedAt: { not: null } },
        }),
        prisma.activationCode.count({
            where: {
                usedAt: null,
                expiresAt: { lt: now },
            },
        }),
        prisma.activationCode.count({
            where: {
                usedAt: null,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } },
                ],
            },
        }),
    ]);

    return { total, used, expired, unused };
}

async function getBatches() {
    const batches = await prisma.activationCode.groupBy({
        by: ['batchLabel'],
        _count: { _all: true },
        _min: { createdAt: true },
    });

    const batchStats = await Promise.all(
        batches.map(async (batch) => {
            const [total, used] = await Promise.all([
                prisma.activationCode.count({
                    where: { batchLabel: batch.batchLabel },
                }),
                prisma.activationCode.count({
                    where: {
                        batchLabel: batch.batchLabel,
                        usedAt: { not: null },
                    },
                }),
            ]);

            return {
                batchLabel: batch.batchLabel,
                total,
                used,
                unused: total - used,
                createdAt: batch._min.createdAt,
            };
        })
    );

    return batchStats.sort((a, b) => 
        (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
}

async function getRecentCodes(limit: number = 20) {
    return prisma.activationCode.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
    });
}

export default async function ActivationCodesPage() {
    const [stats, batches, recentCodes] = await Promise.all([
        getStats(),
        getBatches(),
        getRecentCodes(),
    ]);

    return (
        <div className="space-y-6">
            {/* 操作按钮 */}
            <div className="flex justify-end">
                <Link href="/admin/activation-codes/generate">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        生成激活码
                    </Button>
                </Link>
            </div>

            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
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
                            <Key className="h-4 w-4" />
                            可用
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.unused}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            已使用
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.used}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            已过期
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 批次列表 */}
                <Card>
                    <CardHeader>
                        <CardTitle>批次概览</CardTitle>
                        <CardDescription>按批次查看激活码使用情况</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {batches.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                暂无激活码批次
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {batches.map((batch) => (
                                    <div
                                        key={batch.batchLabel}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <div className="font-medium">{batch.batchLabel || '未命名批次'}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {batch.createdAt?.toLocaleDateString('zh-CN')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">
                                                {batch.used} / {batch.total}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                剩余 {batch.unused}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 最近激活码 */}
                <Card>
                    <CardHeader>
                        <CardTitle>最近生成</CardTitle>
                        <CardDescription>最近 20 个激活码</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentCodes.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                暂无激活码
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {recentCodes.map((code) => {
                                    const status = getCodeStatus(code);
                                    const config = STATUS_CONFIG[status];
                                    const StatusIcon = config.icon;

                                    return (
                                        <div
                                            key={code.id}
                                            className="flex items-center justify-between p-2 rounded border text-sm"
                                        >
                                            <div>
                                                <div className="font-mono">{code.code}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {code.batchLabel}
                                                </div>
                                            </div>
                                            <Badge variant={config.variant} className="gap-1">
                                                <StatusIcon className="h-3 w-3" />
                                                {config.label}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

