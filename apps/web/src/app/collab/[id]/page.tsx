'use client';

/**
 * 内容详情页
 *
 * 基于《ColLab 内容系统改造方案》设计
 *
 * 根据内容类型差异化布局：
 * - 作品：大图/图集展示 + 色彩信息
 * - 教程/文章：正文渲染 + Markdown 支持
 */

import { use } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import {
    Palette,
    BookOpen,
    FileText,
    Eye,
    ThumbsUp,
    Calendar,
    User,
    ExternalLink,
    ArrowLeft,
    Share2,
    Bookmark,
    Tag,
    FolderOpen,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    TrendingUp,
    ImageIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/ui/markdown';
import { SiteHeader } from '@/components/site-header';
import { trpc } from '@/lib/trpc';
import { labToRgb } from '@/lib/color';
import { useState, useCallback, useEffect } from 'react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from '@/components/ui/carousel';

// ============================================================================
// 类型和常量
// ============================================================================

const typeIcons = {
    WORK: Palette,
    TUTORIAL: BookOpen,
    ARTICLE: FileText,
};

const typeLabels = {
    WORK: '作品',
    TUTORIAL: '教程',
    ARTICLE: '文章',
};

// ============================================================================
// 页面组件
// ============================================================================

export default function ContentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    const { data: content, isLoading, error } = trpc.content.get.useQuery({ id });

    if (isLoading) {
        return <LoadingState />;
    }

    if (error || !content) {
        notFound();
    }

    const Icon = typeIcons[content.contentType];

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-14 bg-gradient-to-b from-background to-muted/30">
                {/* 顶部导航 */}
                <div className="sticky top-14 z-40 bg-background border-b">
                    <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/collab">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                返回
                            </Link>
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Bookmark className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1200px] mx-auto px-6 py-8">
                    {/* 标题区域 */}
                    <header className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h1>

                        {content.summary && (
                            <p className="text-lg text-muted-foreground mb-6">
                                {content.summary}
                            </p>
                        )}

                        {/* 作者信息和标签 */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                {content.author.image ? (
                                    <img
                                        src={content.author.image}
                                        alt={content.author.name || ''}
                                        className="h-10 w-10 rounded-full"
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium">{content.author.name || '匿名用户'}</p>
                                    {content.publishedAt && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(content.publishedAt).toLocaleDateString('zh-CN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm">
                                    <Icon className="h-4 w-4" />
                                    {typeLabels[content.contentType]}
                                </span>
                                {content.featuredLevel === 'HOMEPAGE' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm">
                                        <Sparkles className="h-4 w-4" />
                                        首页推荐
                                    </span>
                                )}
                                {content.featuredLevel === 'EDITOR_PICK' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm">
                                        <TrendingUp className="h-4 w-4" />
                                        编辑推荐
                                    </span>
                                )}
                                {content.category && (
                                    <Link href={`/collab/category/${content.category.slug}` as Route}>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm hover:bg-muted transition-colors">
                                            <FolderOpen className="h-4 w-4" />
                                            {content.category.name}
                                        </span>
                                    </Link>
                                )}
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm text-muted-foreground">
                                    <Eye className="h-4 w-4" />
                                    {content.viewCount} 浏览
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm text-muted-foreground">
                                    <ThumbsUp className="h-4 w-4" />
                                    {content.likeCount} 喜欢
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* 主要内容区域 */}
                    <div className="space-y-8">
                        {/* 封面/图集 */}
                        {content.contentType === 'WORK' ? (
                            <WorkGallery
                                coverImageUrl={content.coverImageUrl}
                                galleryImages={content.galleryImages || []}
                            />
                        ) : (
                            <div className="aspect-video rounded-2xl overflow-hidden bg-muted">
                                {content.coverImageUrl ? (
                                    <img
                                        src={content.coverImageUrl}
                                        alt={content.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 正文内容 */}
                        {content.body && (
                            <Markdown content={content.body} />
                        )}

                        {/* 关联色彩 */}
                        {content.colors && content.colors.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    关联色彩
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {content.colors.map(({ color }) => {
                                        const rgb = labToRgb(color.labL, color.labA, color.labB);
                                        return (
                                            <Link
                                                key={color.id}
                                                href={`/color/${color.slug}` as Route}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-lg border"
                                                    style={{
                                                        backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
                                                    }}
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {color.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {color.colorId}
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 关联色彩簿 */}
                        {content.colorBook && (
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    关联色彩簿
                                </h3>
                                <Link
                                    href={`/color-book/${content.colorBook.slug}` as Route}
                                    className="inline-flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">{content.colorBook.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {content.colorBook.bookId}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        )}

                        {/* 外部链接 */}
                        {content.externalUrl && (
                            <div className="p-4 rounded-xl bg-muted/50">
                                <a
                                    href={content.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-primary hover:underline"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    查看原文/项目链接
                                </a>
                            </div>
                        )}

                        {/* 标签 */}
                        {content.tags && content.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {content.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="gap-1">
                                        <Tag className="h-3 w-3" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}

// ============================================================================
// 作品图集组件
// ============================================================================

function WorkGallery({
    coverImageUrl,
    galleryImages,
}: {
    coverImageUrl: string;
    galleryImages: string[];
}) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    const allImages = [coverImageUrl, ...galleryImages].filter(Boolean);

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

    if (allImages.length === 0) {
        return (
            <div className="aspect-video rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
            </div>
        );
    }

    if (allImages.length === 1) {
        return (
            <div className="rounded-2xl overflow-hidden bg-muted">
                <img
                    src={allImages[0]}
                    alt="作品图片"
                    className="w-full h-auto"
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Carousel setApi={setApi} className="w-full">
                    <CarouselContent>
                        {allImages.map((image, index) => (
                            <CarouselItem key={index}>
                                <div className="rounded-2xl overflow-hidden bg-muted">
                                    <img
                                        src={image}
                                        alt={`图片 ${index + 1}`}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>

                {/* 导航按钮 */}
                {count > 1 && (
                    <>
                        <button
                            onClick={scrollPrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md transition-colors"
                            aria-label="上一张"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={scrollNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md transition-colors"
                            aria-label="下一张"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            {/* 缩略图导航 */}
            {count > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {allImages.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => api?.scrollTo(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === current
                                ? 'border-primary'
                                : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                        >
                            <img
                                src={image}
                                alt={`缩略图 ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// 加载状态
// ============================================================================

function LoadingState() {
    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-14 bg-gradient-to-b from-background to-muted/30">
                <div className="max-w-[1200px] mx-auto px-6 py-8">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 w-24 bg-muted rounded-full" />
                        <div className="h-12 w-3/4 bg-muted rounded-lg" />
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-muted rounded-full" />
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-muted rounded" />
                                <div className="h-3 w-32 bg-muted rounded" />
                            </div>
                        </div>
                        <div className="aspect-video bg-muted rounded-2xl" />
                        <div className="space-y-4">
                            <div className="h-4 w-full bg-muted rounded" />
                            <div className="h-4 w-5/6 bg-muted rounded" />
                            <div className="h-4 w-4/6 bg-muted rounded" />
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
