/**
 * 色彩库列表页
 * 
 * 支持三种视图模式：
 * - cards: 标准卡片视图（Coolors 风格）
 * - minimal: 极简卡片视图
 * - list: 列表视图
 * 
 * 性能优化：
 * - 使用缓存查询减少数据库负载
 * - ISR 静态生成，60秒重新验证
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { ColorLibraryView } from '@/components/color/color-library-view';
import { PaperTypeLabels, ColorStatusLabels, AuditStatusLabels } from '@/lib/validations/color';
import { COLOR_FAMILY_LABELS, COLOR_FAMILY_COLORS } from '@/lib/labels';
import { SiteHeader } from '@/components/site-header';

// ISR: 60秒重新验证
export const revalidate = 60;

export const metadata: Metadata = {
    title: '色彩库 | SOURCE',
    description: '浏览 SOURCE 色彩身份证库，查看已验证的印刷色彩数据、纸张表现、油墨配方。',
    openGraph: {
        title: '色彩库 | SOURCE',
        description: '浏览 SOURCE 色彩身份证库，查看已验证的印刷色彩数据。',
    },
};

async function getColors() {
    // 直接查询获取基础数据
    const cachedColors = await prisma.color.findMany({
        orderBy: { colorId: 'asc' },
        select: {
            id: true,
            colorId: true,
            name: true,
            slug: true,
            labL: true,
            labA: true,
            labB: true,
            status: true,
            auditStatus: true,
            colorFamily: true,
            version: true,
            lastVerifiedAt: true,
            _count: {
                select: {
                    paperProfiles: true,
                    recipes: true,
                    participations: true,
                },
            },
        },
    });
    
    // 获取需要额外关联的数据（bestPaper）
    // 使用单独查询避免 N+1，只查询有 BEST 推荐的纸张档案
    const bestPapers = await prisma.paperProfile.findMany({
        where: {
            recommendation: 'BEST',
            colorId: { in: cachedColors.map(c => c.id) },
        },
        select: {
            colorId: true,
            paperType: {
                select: { code: true },
            },
        },
    });
    
    // 构建 colorId -> bestPaper 映射
    const bestPaperMap = new Map<string, string>();
    bestPapers.forEach(bp => {
        if (!bestPaperMap.has(bp.colorId)) {
            bestPaperMap.set(bp.colorId, bp.paperType.code);
        }
    });

    return cachedColors.map((color) => ({
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
        colorFamily: color.colorFamily,
        colorFamilyLabel: color.colorFamily ? COLOR_FAMILY_LABELS[color.colorFamily] : null,
        version: color.version,
        paperProfileCount: color._count.paperProfiles,
        recipeCount: color._count.recipes,
        participantCount: color._count.participations,
        bestPaper: bestPaperMap.get(color.id),
        lastVerifiedAt: color.lastVerifiedAt?.toISOString() || null,
    }));
}

export default async function ColorsPage() {
    const colors = await getColors();

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="max-w-[1600px] mx-auto px-6 py-8">
                    {/* 简洁标题 */}
                    <header className="mb-8">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">色彩库</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            浏览 SOURCE 色彩身份证库，查看已验证的印刷色彩数据
                        </p>
                    </header>

                    {/* 色彩列表 - 支持多种视图模式 */}
                    <Suspense fallback={<ColorListSkeleton />}>
                        <ColorLibraryView
                            colors={colors}
                            paperTypeLabels={PaperTypeLabels}
                            colorStatusLabels={ColorStatusLabels}
                            auditStatusLabels={AuditStatusLabels}
                            colorFamilyLabels={COLOR_FAMILY_LABELS}
                            colorFamilyColors={COLOR_FAMILY_COLORS}
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
