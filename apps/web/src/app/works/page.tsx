/**
 * 作品展示页面
 *
 * @deprecated 此页面已废弃，请使用 /collab 页面
 * 已配置 301 重定向：/works → /collab
 *
 * 展示所有公开的用户作品
 * 此页面保留用于兼容旧链接，新用户应使用 /collab
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { WorksLibraryView, WorksHero } from './works-gallery';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
    title: 'ColLab | SOURCE',
    description: '探索使用 SOURCE 色彩体系创作的设计作品，发现灵感，分享创意',
};

// 获取公开作品
async function getPublicWorks() {
    const works = await prisma.userWork.findMany({
        where: { isPublic: true },
        orderBy: [
            { viewCount: 'desc' },
            { likeCount: 'desc' },
            { createdAt: 'desc' },
        ],
        take: 50,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            colorBook: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            colors: {
                include: {
                    color: {
                        select: {
                            id: true,
                            colorId: true,
                            name: true,
                            slug: true,
                            labL: true,
                            labA: true,
                            labB: true,
                        },
                    },
                },
                orderBy: { order: 'asc' },
                take: 10,
            },
        },
    });

    return works;
}

export default async function WorksPage() {
    const works = await getPublicWorks();

    // 取前3个作为推荐作品
    const featuredWorks = works.slice(0, 3);
    // 其余作品
    const remainingWorks = works.slice(3);

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                {/* 首焦区域 - 推荐作品 */}
                {featuredWorks.length > 0 && (
                    <section>
                        <div className="max-w-[1600px] mx-auto px-6 py-8">
                            <Suspense fallback={<HeroSkeleton />}>
                                <WorksHero works={featuredWorks} />
                            </Suspense>
                        </div>
                    </section>
                )}

                {/* 作品列表（带搜索筛选） */}
                <div className="max-w-[1600px] mx-auto px-6 pb-12">
                    <Suspense fallback={<WorksLoadingSkeleton />}>
                        <WorksLibraryView works={remainingWorks} />
                    </Suspense>
                </div>
            </main>
        </>
    );
}

function HeroSkeleton() {
    return (
        <div className="relative">
            <div className="w-full aspect-[21/9] bg-muted rounded-3xl overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 lg:p-12 space-y-4 max-w-2xl">
                    <div className="flex gap-2">
                        <div className="h-6 w-16 bg-background/50 rounded-full" />
                        <div className="h-6 w-20 bg-background/50 rounded-full" />
                    </div>
                    <div className="h-10 w-80 bg-background/50 rounded-lg" />
                    <div className="h-5 w-96 bg-background/50 rounded" />
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-background/50 rounded-full" />
                        <div className="h-4 w-24 bg-background/50 rounded" />
                    </div>
                </div>
            </div>
            {/* 指示器骨架 */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                <div className="h-2 w-8 bg-background/30 rounded-full" />
                <div className="h-2 w-2 bg-background/30 rounded-full" />
                <div className="h-2 w-2 bg-background/30 rounded-full" />
            </div>
        </div>
    );
}

function WorksLoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-muted rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-background/50" />
                    <div className="p-4 space-y-3">
                        <div className="h-5 bg-background rounded w-3/4" />
                        <div className="h-4 bg-background rounded w-full" />
                        <div className="h-4 bg-background rounded w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}
