/**
 * 合作者列表页（前台）
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Globe, Award } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
    title: '合作者库 | SOURCE',
    description: '查看 SOURCE 的合作印厂、纸商、油墨商等合作伙伴信息。',
    openGraph: {
        title: '合作者库 | SOURCE',
        description: '查看 SOURCE 的合作伙伴信息。',
    },
};

// 合作者类型标签
const partnerTypeLabels: Record<string, string> = {
    PRINTER: '印厂',
    PAPER_VENDOR: '纸商',
    INK_VENDOR: '油墨商',
    LAB: '实验室',
    CONSULTANT: '顾问',
};

async function getPartners() {
    return prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: {
                    colorParticipations: true,
                },
            },
        },
    });
}

async function getStats() {
    const [total, printers, paperVendors, inkVendors, labs] = await Promise.all([
        prisma.partner.count({ where: { status: 'ACTIVE' } }),
        prisma.partner.count({ where: { status: 'ACTIVE', types: { has: 'PRINTER' } } }),
        prisma.partner.count({ where: { status: 'ACTIVE', types: { has: 'PAPER_VENDOR' } } }),
        prisma.partner.count({ where: { status: 'ACTIVE', types: { has: 'INK_VENDOR' } } }),
        prisma.partner.count({ where: { status: 'ACTIVE', types: { has: 'LAB' } } }),
    ]);
    return { total, printers, paperVendors, inkVendors, labs };
}

export default async function PartnersPage() {
    const [partners, stats] = await Promise.all([getPartners(), getStats()]);

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

    // 按类型分组
    const printers = partners.filter(p => p.types.includes('PRINTER'));
    const paperVendors = partners.filter(p => p.types.includes('PAPER_VENDOR'));
    const inkVendors = partners.filter(p => p.types.includes('INK_VENDOR'));
    const labs = partners.filter(p => p.types.includes('LAB'));
    const consultants = partners.filter(p => p.types.includes('CONSULTANT'));

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    {/* 头部 */}
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">合作者库</h1>
                        <p className="text-muted-foreground">
                            共 {stats.total} 个活跃合作者 · {stats.printers} 印厂 · {stats.paperVendors} 纸商 · {stats.inkVendors} 油墨商 · {stats.labs} 实验室
                        </p>
                    </header>

                    {/* 合作者分类展示 */}
                    <div className="space-y-8">
                        {/* 印厂 */}
                        {printers.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-500" />
                                    印厂合作伙伴
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {printers.map((partner) => (
                                        <PartnerCard key={partner.id} partner={partner} getTypeColor={getTypeColor} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 纸商 */}
                        {paperVendors.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-amber-500" />
                                    纸张供应商
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {paperVendors.map((partner) => (
                                        <PartnerCard key={partner.id} partner={partner} getTypeColor={getTypeColor} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 油墨商 */}
                        {inkVendors.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-purple-500" />
                                    油墨供应商
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {inkVendors.map((partner) => (
                                        <PartnerCard key={partner.id} partner={partner} getTypeColor={getTypeColor} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 实验室 */}
                        {labs.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-green-500" />
                                    检测实验室
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {labs.map((partner) => (
                                        <PartnerCard key={partner.id} partner={partner} getTypeColor={getTypeColor} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 顾问 */}
                        {consultants.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-cyan-500" />
                                    专家顾问
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {consultants.map((partner) => (
                                        <PartnerCard key={partner.id} partner={partner} getTypeColor={getTypeColor} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {partners.length === 0 && (
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">暂无合作者信息</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

// 合作者卡片组件
interface PartnerWithCount {
    id: string;
    partnerId: string;
    name: string;
    shortName: string | null;
    types: string[];
    description: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
    region: string | null;
    certifications: string[];
    establishedYear: number | null;
    _count: {
        colorParticipations: number;
    };
}

function PartnerCard({
    partner,
    getTypeColor
}: {
    partner: PartnerWithCount;
    getTypeColor: (type: string) => string;
}) {
    return (
        <Link href={`/partners/${partner.partnerId}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-lg">{partner.name}</CardTitle>
                            {partner.shortName && (
                                <CardDescription>{partner.shortName}</CardDescription>
                            )}
                        </div>
                        {partner.logoUrl && (
                            <Image
                                src={partner.logoUrl}
                                alt={partner.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 object-contain"
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* 类型标签 */}
                    <div className="flex flex-wrap gap-1">
                        {partner.types.map((type) => (
                            <span
                                key={type}
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(type)}`}
                            >
                                {partnerTypeLabels[type] || type}
                            </span>
                        ))}
                    </div>

                    {/* 描述 */}
                    {partner.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {partner.description}
                        </p>
                    )}

                    {/* 元数据 */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {partner.region && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {partner.region}
                            </span>
                        )}
                        {partner.websiteUrl && (
                            <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                官网
                            </span>
                        )}
                        {partner.certifications.length > 0 && (
                            <span className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                {partner.certifications.length} 项资质
                            </span>
                        )}
                    </div>

                    {/* 参与颜色数量 */}
                    {partner._count.colorParticipations > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            参与 {partner._count.colorParticipations} 个颜色
                        </Badge>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}

