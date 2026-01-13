/**
 * 后台管理仪表盘
 */

import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Building2, Users, FileText, Beaker, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

async function getStats() {
    const [
        colorCount,
        activeColorCount,
        verifiedColorCount,
        partnerCount,
        activePartnerCount,
        userCount,
        batchCount,
        recipeCount,
        participationCount,
    ] = await Promise.all([
        prisma.color.count(),
        prisma.color.count({ where: { status: 'ACTIVE' } }),
        prisma.color.count({ where: { auditStatus: 'VERIFIED' } }),
        prisma.partner.count(),
        prisma.partner.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count(),
        prisma.batch.count(),
        prisma.recipe.count(),
        prisma.colorParticipation.count(),
    ]);

    return {
        colorCount,
        activeColorCount,
        verifiedColorCount,
        partnerCount,
        activePartnerCount,
        userCount,
        batchCount,
        recipeCount,
        participationCount,
    };
}

async function getRecentColors() {
    return prisma.color.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            colorId: true,
            name: true,
            status: true,
            auditStatus: true,
            createdAt: true,
        },
    });
}

async function getRecentPartners() {
    return prisma.partner.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            partnerId: true,
            name: true,
            types: true,
            status: true,
            createdAt: true,
        },
    });
}

export default async function AdminDashboard() {
    const [stats, recentColors, recentPartners] = await Promise.all([
        getStats(),
        getRecentColors(),
        getRecentPartners(),
    ]);

    const statCards = [
        {
            title: '色彩总数',
            value: stats.colorCount,
            description: `${stats.activeColorCount} 激活 / ${stats.verifiedColorCount} 已验证`,
            icon: Palette,
            href: '/admin/colors',
            color: 'text-blue-500',
        },
        {
            title: '共建者',
            value: stats.partnerCount,
            description: `${stats.activePartnerCount} 个活跃共建者`,
            icon: Building2,
            href: '/admin/partners',
            color: 'text-amber-500',
        },
        {
            title: '用户',
            value: stats.userCount,
            description: '注册用户总数',
            icon: Users,
            href: '/admin/users',
            color: 'text-green-500',
        },
        {
            title: '配方',
            value: stats.recipeCount,
            description: '油墨配方总数',
            icon: Beaker,
            href: '/admin/colors',
            color: 'text-purple-500',
        },
        {
            title: '批次',
            value: stats.batchCount,
            description: '验证批次总数',
            icon: FileText,
            href: '/admin/batches',
            color: 'text-orange-500',
        },
        {
            title: '参与记录',
            value: stats.participationCount,
            description: '共建者参与关联',
            icon: ShieldCheck,
            href: '/admin/colors',
            color: 'text-cyan-500',
        },
    ];

    return (
        <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((card) => (
                    <Link
                        key={card.title}
                        // @ts-expect-error - Next.js 15 strict route types
                        href={card.href}
                    >
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </CardTitle>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* 最近数据 */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* 最近添加的色彩 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">最近添加的色彩</CardTitle>
                        <CardDescription>最新 5 条记录</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentColors.map((color) => (
                                <Link
                                    key={color.id}
                                    href={`/admin/colors/${color.id}/edit`}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <div>
                                        <div className="font-medium">{color.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {color.colorId}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(color.createdAt).toLocaleDateString('zh-CN')}
                                    </div>
                                </Link>
                            ))}
                            {recentColors.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    暂无数据
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 最近添加的共建者 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">最近添加的共建者</CardTitle>
                        <CardDescription>最新 5 条记录</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentPartners.map((partner) => (
                                <Link
                                    key={partner.id}
                                    href={`/admin/partners/${partner.id}/edit`}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <div>
                                        <div className="font-medium">{partner.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {partner.partnerId}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(partner.createdAt).toLocaleDateString('zh-CN')}
                                    </div>
                                </Link>
                            ))}
                            {recentPartners.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    暂无数据
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

