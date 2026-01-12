'use client';

/**
 * ColLab 首页
 *
 * 基于《ColLab 内容系统改造方案》4.5 节设计
 *
 * 功能：
 * - 顶部首焦图轮播（仅首焦图推荐级别）
 * - 选项卡切换筛选：所有推荐、推荐作品、推荐教程、推荐文章、所有内容
 * - 内容列表（无限滚动）
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
    ChevronLeft,
    ChevronRight,
    ImageIcon,
    Loader2,
} from 'lucide-react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from '@/components/ui/carousel';
import { ContentGrid, type ContentCardItem } from '@/components/collab/content-card';
import { Toolbar, defaultFilters, filtersToApiParams, type ToolbarFilters } from '@/components/collab/toolbar';
import { SiteHeader } from '@/components/site-header';
import { trpc } from '@/lib/trpc';
import { labToRgb } from '@/lib/color';

// ============================================================================
// 首焦图轮播组件
// ============================================================================

interface HeroCarouselProps {
    items: ContentCardItem[];
}

function HeroCarousel({ items }: HeroCarouselProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!api) return;

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap());

        api.on('select', () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    const scrollPrev = useCallback(() => {
        api?.scrollPrev();
    }, [api]);

    const scrollNext = useCallback(() => {
        api?.scrollNext();
    }, [api]);

    const scrollTo = useCallback((index: number) => {
        api?.scrollTo(index);
    }, [api]);

    if (items.length === 0) return null;

    const currentItem = items[current];
    const colors = currentItem?.colors?.slice(0, 6) || [];

    return (
        <div className="relative">
            <Carousel
                setApi={setApi}
                opts={{
                    align: 'start',
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-0">
                    {items.map((item) => (
                        <CarouselItem key={item.id} className="pl-0">
                            <Link href={`/collab/${item.id}` as Route}>
                                <div className="relative w-full aspect-[3/1] rounded-3xl overflow-hidden group cursor-pointer bg-muted">
                                    {item.coverImageUrl ? (
                                        <img
                                            src={item.coverImageUrl}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="h-20 w-20 text-muted-foreground/30" />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* 底部信息栏 */}
            <div className="absolute bottom-0 left-0 right-0 z-10 rounded-b-3xl overflow-hidden">
                <div className="bg-gradient-to-t from-black/70 to-transparent pt-16 pb-6 px-8 lg:px-12">
                    <div className="flex items-center justify-between gap-6">
                        {/* 左侧信息 */}
                        <div className="flex items-center gap-6 min-w-0 flex-1">
                            <h3 className="text-xl lg:text-2xl font-bold text-white truncate max-w-xs lg:max-w-md">
                                {currentItem?.title}
                            </h3>

                            <div className="h-6 w-px bg-white/30 hidden sm:block" />

                            {/* 作者 */}
                            <div className="hidden sm:flex items-center gap-2">
                                {currentItem?.author.image ? (
                                    <img
                                        src={currentItem.author.image}
                                        alt={currentItem.author.name || ''}
                                        className="h-7 w-7 rounded-full border border-white/30"
                                    />
                                ) : (
                                    <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium text-white">
                                        {(currentItem?.author.name || '?')[0].toUpperCase()}
                                    </div>
                                )}
                                <span className="text-sm text-white/90">
                                    {currentItem?.author.name || '匿名用户'}
                                </span>
                            </div>

                            {/* 颜色 */}
                            {colors.length > 0 && (
                                <>
                                    <div className="h-6 w-px bg-white/30 hidden md:block" />
                                    <div className="hidden md:flex items-center gap-1.5">
                                        {colors.map(({ color }) => {
                                            const rgb = labToRgb(color.labL, color.labA, color.labB);
                                            return (
                                                <div
                                                    key={color.id}
                                                    className="h-6 w-6 rounded-full border border-white/30"
                                                    style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
                                                    title={color.name}
                                                />
                                            );
                                        })}
                                        {currentItem.colors.length > 6 && (
                                            <span className="text-xs text-white/60 ml-1">
                                                +{currentItem.colors.length - 6}
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 右侧导航 */}
                        {count > 1 && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: count }).map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => scrollTo(index)}
                                            className={`h-1.5 rounded-full transition-all ${index === current
                                                    ? 'w-6 bg-white'
                                                    : 'w-1.5 bg-white/40 hover:bg-white/60'
                                                }`}
                                            aria-label={`跳转到第 ${index + 1} 张`}
                                        />
                                    ))}
                                </div>
                                <div className="h-6 w-px bg-white/30" />
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={scrollPrev}
                                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        aria-label="上一张"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={scrollNext}
                                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        aria-label="下一张"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// 主页组件
// ============================================================================

export default function CollabPage() {
    const [filters, setFilters] = useState<ToolbarFilters>(defaultFilters);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 获取首焦图推荐（仅用于顶部轮播）
    const { data: heroData } = trpc.content.publicList.useQuery({
        featuredLevel: 3, // HERO = 首焦图推荐
        limit: 5,
    });

    // 获取内容列表（无限滚动，根据选项卡筛选）
    const {
        data: contentData,
        isLoading: contentLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = trpc.content.list.useInfiniteQuery(
        filtersToApiParams(filters),
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    // IntersectionObserver 实现无限滚动
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const heroItems = (heroData?.items || []) as ContentCardItem[];

    // 合并所有页面的数据
    const listItems = (contentData?.pages.flatMap((page) => page.items) || []) as ContentCardItem[];

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
                    {/* 首焦图轮播 */}
                    {heroItems.length > 0 && (
                        <section>
                            <HeroCarousel items={heroItems} />
                        </section>
                    )}

                    {/* 工具栏 + 内容列表 */}
                    <section className="space-y-6">
                        <Toolbar
                            filters={filters}
                            onFiltersChange={setFilters}
                            showTabs={true}
                            showTypeFilter={true}
                            showSearch={true}
                        />

                        <ContentGrid
                            items={listItems}
                            isLoading={contentLoading}
                            columns={5}
                            emptyMessage="暂无内容，成为第一个发表者吧！"
                            showFeatured={false}
                        />

                        {/* 无限滚动触发器 */}
                        <div ref={loadMoreRef} className="flex justify-center py-8">
                            {isFetchingNextPage && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>加载更多...</span>
                                </div>
                            )}
                            {!hasNextPage && listItems.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    已加载全部内容
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
