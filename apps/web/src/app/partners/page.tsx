/**
 * 共建者列表页（前台）- 选项卡视图
 */

import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { SiteHeader } from '@/components/site-header';
import { PartnersTabs } from '@/components/partners/partners-tabs';

export const metadata: Metadata = {
    title: '共建者 | SOURCE',
    description: '查看 SOURCE 的合作印厂、纸商、油墨商等合作伙伴信息。',
    openGraph: {
        title: '共建者 | SOURCE',
        description: '查看 SOURCE 的合作伙伴信息。',
    },
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
    const [total, printers, paperVendors, inkVendors, labs, consultants] = await Promise.all([
        prisma.partner.count({ where: { status: 'ACTIVE' } }),
        prisma.partner.count({ where: { status: 'ACTIVE', types: { has: 'PRINTER' } } }),
        prisma.partner.count({ where: { status: 'ACTIVE', types: { has: 'PAPER_VENDOR' } } }),
        prisma.partner.count({ where: { status: 'ACTIVE', types: { has: 'INK_VENDOR' } } }),
        prisma.partner.count({ where: { status: 'ACTIVE', types: { has: 'LAB' } } }),
        prisma.partner.count({ where: { status: 'ACTIVE', types: { has: 'CONSULTANT' } } }),
    ]);
    return { total, printers, paperVendors, inkVendors, labs, consultants };
}

export default async function PartnersPage() {
    const [partners, stats] = await Promise.all([getPartners(), getStats()]);

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="max-w-[1600px] mx-auto px-6 py-8">
                    {/* 头部 */}
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">共建者</h1>
                        <p className="text-muted-foreground">
                            SOURCE 色彩体系的共建伙伴，共同打造高品质印刷色彩标准
                        </p>
                    </header>

                    {/* 选项卡内容 */}
                    <PartnersTabs partners={partners} stats={stats} />
                </div>
            </main>
        </>
    );
}
