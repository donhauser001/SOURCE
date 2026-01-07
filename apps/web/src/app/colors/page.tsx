/**
 * 色彩库列表页
 * 
 * 设计理念：语义化布局
 * - 字号统一，不传递错误层级
 * - 卡片大小基于"成熟度"（验证状态 + 配方数量）
 * - 位置保持随机（视觉丰富）
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { ColorListClientB } from '@/components/color/color-list-client-b';
import { PaperTypeLabels, ColorStatusLabels, AuditStatusLabels } from '@/lib/validations/color';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
    title: '色彩库 | SOURCE',
    description: '浏览 SOURCE 色彩身份证库，查看已验证的印刷色彩数据、纸张表现、油墨配方。',
    openGraph: {
        title: '色彩库 | SOURCE',
        description: '浏览 SOURCE 色彩身份证库，查看已验证的印刷色彩数据。',
    },
};

async function getColors() {
    const colors = await prisma.color.findMany({
        orderBy: { colorId: 'asc' },
        include: {
            paperProfiles: {
                select: {
                    paperType: true,
                    recommendation: true,
                },
            },
            _count: {
                select: {
                    paperProfiles: true,
                    recipes: true,
                    participations: true,
                },
            },
        },
    });

    return colors.map((color) => ({
        id: color.id,
        colorId: color.colorId,
        name: color.name,
        slug: color.slug,
        labL: color.labL,
        labA: color.labA,
        labB: color.labB,
        status: color.status,
        statusLabel: ColorStatusLabels[color.status] || color.status,
        auditStatus: color.auditStatus,
        auditStatusLabel: AuditStatusLabels[color.auditStatus] || color.auditStatus,
        version: color.version,
        paperProfileCount: color._count.paperProfiles,
        recipeCount: color._count.recipes,
        participantCount: color._count.participations,
        bestPaper: color.paperProfiles.find((p) => p.recommendation === 'BEST')?.paperType,
        lastVerifiedAt: color.lastVerifiedAt?.toISOString() || null,
    }));
}

export default async function ColorsPage() {
    const colors = await getColors();

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    {/* 简洁标题 */}
                    <header className="mb-8">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">色彩库</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            语义化布局：卡片大小 = 成熟度（已验证 &gt; 实验中），字号统一
                        </p>
                    </header>

                    {/* 色彩列表 */}
                    <Suspense fallback={<ColorListSkeleton />}>
                        <ColorListClientB
                            colors={colors}
                            paperTypeLabels={PaperTypeLabels}
                            colorStatusLabels={ColorStatusLabels}
                            auditStatusLabels={AuditStatusLabels}
                        />
                    </Suspense>
                </div>
            </main>
        </>
    );
}

function ColorListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex gap-3 p-4 rounded-2xl bg-muted">
                <div className="h-9 flex-1 max-w-md bg-background rounded-lg animate-pulse" />
                <div className="h-9 w-[120px] bg-background rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[4/3] bg-muted rounded-2xl animate-pulse" />
                ))}
            </div>
        </div>
    );
}
