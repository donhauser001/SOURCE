/**
 * 合作者详情页
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SiteHeader } from '@/components/site-header';
import {
    ArrowLeft,
    Building2,
    MapPin,
    Globe,
    Mail,
    Phone,
    Award,
    Calendar,
    Palette,
    ExternalLink,
} from 'lucide-react';

interface Props {
    params: Promise<{ id: string }>;
}

// 合作者类型标签
const partnerTypeLabels: Record<string, string> = {
    PRINTER: '印厂',
    PAPER_VENDOR: '纸商',
    INK_VENDOR: '油墨商',
    LAB: '实验室',
    CONSULTANT: '顾问',
};

// 参与角色标签
const roleLabels: Record<string, string> = {
    PRINTER: '印厂',
    PAPER_SUPPLIER: '纸张供应',
    INK_SUPPLIER: '油墨供应',
    AUDITOR: '审计顾问',
    CO_BUILDER: '共建者',
    TESTER: '测试员',
    RESEARCHER: '研究员',
};

async function getPartner(partnerId: string) {
    return prisma.partner.findUnique({
        where: { partnerId },
        include: {
            colorParticipations: {
                where: { status: 'ACTIVE' },
                include: {
                    color: {
                        select: {
                            id: true,
                            colorId: true,
                            name: true,
                            labL: true,
                            labA: true,
                            labB: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
            _count: {
                select: {
                    colorParticipations: true,
                    batches: true,
                    testReports: true,
                },
            },
        },
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const partner = await getPartner(id);

    if (!partner) {
        return { title: '合作者不存在 | SOURCE' };
    }

    const typeLabels = partner.types.map(t => partnerTypeLabels[t] || t).join('、');

    return {
        title: `${partner.name} | SOURCE 合作者`,
        description: `查看 ${partner.name}（${typeLabels}）的详细信息和参与的颜色项目。`,
    };
}

export default async function PartnerPage({ params }: Props) {
    const { id } = await params;
    const partner = await getPartner(id);

    if (!partner || partner.status !== 'ACTIVE') {
        notFound();
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'PRINTER':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
            case 'PAPER_VENDOR':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
            case 'INK_VENDOR':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
            case 'LAB':
                return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
            case 'CONSULTANT':
                return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    // 按角色分组参与记录
    const participationsByRole = partner.colorParticipations.reduce((acc, p) => {
        const role = p.roleInColor;
        if (!acc[role]) acc[role] = [];
        acc[role].push(p);
        return acc;
    }, {} as Record<string, typeof partner.colorParticipations>);

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    {/* 顶部导航 */}
                    <div className="mb-6">
                        <Link href="/partners">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                返回合作者列表
                            </Button>
                        </Link>
                    </div>

                    {/* 头部信息 */}
                    <header className="mb-8">
                        <div className="flex items-start gap-6">
                            {/* Logo */}
                            {partner.logoUrl ? (
                                <Image
                                    src={partner.logoUrl}
                                    alt={partner.name}
                                    width={80}
                                    height={80}
                                    className="w-20 h-20 object-contain rounded-lg border bg-white"
                                />
                            ) : (
                                <div className="w-20 h-20 flex items-center justify-center rounded-lg border bg-muted">
                                    <Building2 className="h-10 w-10 text-muted-foreground" />
                                </div>
                            )}

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h1 className="text-3xl font-bold tracking-tight">{partner.name}</h1>
                                    {partner.shortName && (
                                        <span className="text-lg text-muted-foreground">({partner.shortName})</span>
                                    )}
                                </div>

                                {/* 类型标签 */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {partner.types.map((type) => (
                                        <span
                                            key={type}
                                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(type)}`}
                                        >
                                            {partnerTypeLabels[type] || type}
                                        </span>
                                    ))}
                                </div>

                                {/* 描述 */}
                                {partner.description && (
                                    <p className="text-muted-foreground">{partner.description}</p>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* 左侧：详细信息 */}
                        <div className="md:col-span-2 space-y-6">
                            {/* 参与的颜色 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="h-5 w-5" />
                                        参与的颜色
                                    </CardTitle>
                                    <CardDescription>
                                        共参与 {partner._count.colorParticipations} 个颜色项目
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {Object.keys(participationsByRole).length > 0 ? (
                                        <div className="space-y-6">
                                            {Object.entries(participationsByRole).map(([role, participations]) => (
                                                <div key={role}>
                                                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                                                        {roleLabels[role] || role}（{participations.length}）
                                                    </h4>
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        {participations.map((p) => (
                                                            <Link
                                                                key={p.id}
                                                                href={`/color/${p.color.colorId}`}
                                                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                                            >
                                                                {/* 色块 */}
                                                                <div
                                                                    className="w-10 h-10 rounded-lg border shadow-sm shrink-0"
                                                                    style={{
                                                                        backgroundColor: `lab(${p.color.labL}% ${p.color.labA} ${p.color.labB})`,
                                                                    }}
                                                                />
                                                                <div className="min-w-0">
                                                                    <div className="font-medium truncate">
                                                                        {p.color.name}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground font-mono">
                                                                        {p.color.colorId}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            暂无参与记录
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 资质认证 */}
                            {partner.certifications.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Award className="h-5 w-5" />
                                            资质认证
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {partner.certifications.map((cert, idx) => (
                                                <Badge key={idx} variant="outline">
                                                    {cert}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* 右侧：联系信息 */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>联系方式</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {partner.region && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <div className="text-sm text-muted-foreground">地区</div>
                                                <div>{partner.region}</div>
                                            </div>
                                        </div>
                                    )}
                                    {partner.address && (
                                        <div className="flex items-start gap-3">
                                            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <div className="text-sm text-muted-foreground">地址</div>
                                                <div>{partner.address}</div>
                                            </div>
                                        </div>
                                    )}
                                    {partner.contactEmail && (
                                        <div className="flex items-start gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <div className="text-sm text-muted-foreground">邮箱</div>
                                                <a
                                                    href={`mailto:${partner.contactEmail}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    {partner.contactEmail}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {partner.contactPhone && (
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <div className="text-sm text-muted-foreground">电话</div>
                                                <div>{partner.contactPhone}</div>
                                            </div>
                                        </div>
                                    )}
                                    {partner.websiteUrl && (
                                        <div className="flex items-start gap-3">
                                            <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <div className="text-sm text-muted-foreground">网站</div>
                                                <a
                                                    href={partner.websiteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                                >
                                                    访问官网
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {partner.establishedYear && (
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <div className="text-sm text-muted-foreground">成立年份</div>
                                                <div>{partner.establishedYear} 年</div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 统计 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>统计</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">参与颜色</span>
                                        <span className="font-medium">{partner._count.colorParticipations}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">执行批次</span>
                                        <span className="font-medium">{partner._count.batches}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">测试报告</span>
                                        <span className="font-medium">{partner._count.testReports}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

