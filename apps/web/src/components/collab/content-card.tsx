'use client';

/**
 * ColLab 内容卡片组件
 *
 * 支持三种内容类型的差异化展示：
 * - 作品：大图展示 + 色彩标签
 * - 教程：缩略图 + 摘要
 * - 文章：标题 + 摘要
 */

import Link from 'next/link';
import type { Route } from 'next';
import {
    Palette,
    BookOpen,
    FileText,
    Eye,
    ThumbsUp,
    Sparkles,
    TrendingUp,
    ImageIcon,
    ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { labToRgb } from '@/lib/color';

// ============================================================================
// 类型定义
// ============================================================================

export interface ContentCardItem {
    id: string;
    contentId: string;
    contentType: 'WORK' | 'TUTORIAL' | 'ARTICLE';
    title: string;
    summary: string | null;
    coverImageUrl: string;
    externalUrl?: string | null;
    viewCount: number;
    likeCount: number;
    featuredLevel: 'NONE' | 'EDITOR_PICK' | 'HOMEPAGE' | 'HERO';
    publishedAt: Date | null;
    author: {
        id?: string;
        name: string | null;
        image: string | null;
    };
    colors: Array<{
        color: {
            id: string;
            colorId: string;
            name: string;
            labL: number;
            labA: number;
            labB: number;
        };
    }>;
    category?: {
        id: string;
        name: string;
        slug: string;
    } | null;
    tags?: string[];
}

// ============================================================================
// 常量
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
// 内容卡片组件
// ============================================================================

interface ContentCardProps {
    item: ContentCardItem;
    /** 卡片变体 */
    variant?: 'default' | 'compact' | 'horizontal';
    /** 是否显示类型标签 */
    showType?: boolean;
    /** 是否显示推荐标签 */
    showFeatured?: boolean;
    /** 是否显示色彩 */
    showColors?: boolean;
    /** 是否显示作者 */
    showAuthor?: boolean;
    /** 是否显示统计 */
    showStats?: boolean;
}

export function ContentCard({
    item,
    variant = 'default',
    showType = true,
    showFeatured = true,
    showColors = true,
    showAuthor = true,
    showStats = true,
}: ContentCardProps) {
    const Icon = typeIcons[item.contentType];
    const colors = item.colors?.slice(0, 5) || [];

    if (variant === 'horizontal') {
        return <HorizontalCard item={item} showType={showType} showFeatured={showFeatured} />;
    }

    if (variant === 'compact') {
        return <CompactCard item={item} showType={showType} />;
    }

    return (
        <Link href={`/collab/${item.id}` as Route}>
            <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full rounded-2xl flex flex-col">
                {/* 封面图 */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted flex-shrink-0">
                    {item.coverImageUrl ? (
                        <img
                            src={item.coverImageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                    )}

                    {/* 类型标签 */}
                    {showType && (
                        <Badge
                            variant="secondary"
                            className="absolute top-3 left-3 gap-1 bg-background/80 backdrop-blur-sm rounded-full"
                        >
                            <Icon className="h-3 w-3" />
                            {typeLabels[item.contentType]}
                        </Badge>
                    )}

                    {/* 推荐标签 */}
                    {showFeatured && (item.featuredLevel === 'HOMEPAGE' || item.featuredLevel === 'HERO') && (
                        <Badge className="absolute top-3 right-3 gap-1 bg-amber-500">
                            <Sparkles className="h-3 w-3" />
                            首推
                        </Badge>
                    )}
                    {showFeatured && item.featuredLevel === 'EDITOR_PICK' && (
                        <Badge
                            variant="outline"
                            className="absolute top-3 right-3 gap-1 bg-background/80 backdrop-blur-sm"
                        >
                            <TrendingUp className="h-3 w-3" />
                            编推
                        </Badge>
                    )}

                    {/* 外部链接图标 */}
                    {item.externalUrl && (
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-background/80 backdrop-blur-sm p-1.5 rounded-full">
                                <ExternalLink className="h-3.5 w-3.5" />
                            </div>
                        </div>
                    )}
                </div>

                <CardContent className="p-4 flex flex-col flex-1">
                    {/* 主要内容区 */}
                    <div className="space-y-3 flex-1">
                        {/* 标题 */}
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {item.title}
                        </h3>


                        {/* 关联色彩 - 作品优先显示 */}
                        {showColors && colors.length > 0 && (
                            <div className="flex items-center gap-1">
                                {colors.map(({ color }) => {
                                    const rgb = labToRgb(color.labL, color.labA, color.labB);
                                    return (
                                        <div
                                            key={color.id}
                                            className="w-5 h-5 rounded-full border border-black/10"
                                            style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
                                            title={`${color.colorId} ${color.name}`}
                                        />
                                    );
                                })}
                                {item.colors.length > 5 && (
                                    <span className="text-xs text-muted-foreground">
                                        +{item.colors.length - 5}
                                    </span>
                                )}
                            </div>
                        )}

                    </div>

                    {/* 底部信息 - 固定在底部 */}
                    {(showAuthor || showStats) && (
                        <div className="flex items-center justify-between pt-3 mt-3 border-t">
                            {showAuthor && (
                                <div className="flex items-center gap-2">
                                    {item.author.image ? (
                                        <img
                                            src={item.author.image}
                                            alt={item.author.name || ''}
                                            className="w-6 h-6 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                            {(item.author.name || '?')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                        {item.author.name || '匿名'}
                                    </span>
                                </div>
                            )}
                            {showStats && (
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        {item.viewCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ThumbsUp className="h-3 w-3" />
                                        {item.likeCount}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}

// ============================================================================
// 水平卡片变体（用于列表视图）
// ============================================================================

function HorizontalCard({
    item,
    showType,
    showFeatured,
}: {
    item: ContentCardItem;
    showType: boolean;
    showFeatured: boolean;
}) {
    const Icon = typeIcons[item.contentType];

    return (
        <Link href={`/collab/${item.id}` as Route}>
            <Card className="group overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="flex">
                    {/* 封面图 */}
                    <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden bg-muted">
                        {item.coverImageUrl ? (
                            <img
                                src={item.coverImageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                        )}
                    </div>

                    {/* 内容 */}
                    <CardContent className="flex-1 p-4 flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                {showType && (
                                    <Badge variant="secondary" className="gap-1">
                                        <Icon className="h-3 w-3" />
                                        {typeLabels[item.contentType]}
                                    </Badge>
                                )}
                                {showFeatured && item.featuredLevel !== 'NONE' && (
                                    <Badge
                                        variant={(item.featuredLevel === 'HOMEPAGE' || item.featuredLevel === 'HERO') ? 'default' : 'outline'}
                                        className={(item.featuredLevel === 'HOMEPAGE' || item.featuredLevel === 'HERO') ? 'bg-amber-500' : ''}
                                    >
                                        {(item.featuredLevel === 'HOMEPAGE' || item.featuredLevel === 'HERO') ? '首推' : '编推'}
                                    </Badge>
                                )}
                            </div>
                            <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                                {item.title}
                            </h3>
                            {item.summary && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {item.summary}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                                {item.author.image ? (
                                    <img
                                        src={item.author.image}
                                        alt={item.author.name || ''}
                                        className="w-5 h-5 rounded-full"
                                    />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-muted" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                    {item.author.name || '匿名'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {item.viewCount}
                                </span>
                                <span className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    {item.likeCount}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>
        </Link>
    );
}

// ============================================================================
// 紧凑卡片变体（用于侧边栏等）
// ============================================================================

function CompactCard({
    item,
    showType,
}: {
    item: ContentCardItem;
    showType: boolean;
}) {
    const Icon = typeIcons[item.contentType];

    return (
        <Link href={`/collab/${item.id}` as Route}>
            <div className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                {/* 小缩略图 */}
                <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    {item.coverImageUrl ? (
                        <img
                            src={item.coverImageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                    )}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                        {showType && (
                            <Icon className="h-3 w-3 text-muted-foreground" />
                        )}
                        <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {item.title}
                        </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {item.author.name || '匿名'} · {item.viewCount} 浏览
                    </p>
                </div>
            </div>
        </Link>
    );
}

// ============================================================================
// 内容网格组件
// ============================================================================

interface ContentGridProps {
    items: ContentCardItem[];
    isLoading?: boolean;
    variant?: 'default' | 'compact' | 'horizontal';
    columns?: 2 | 3 | 4 | 5;
    emptyMessage?: string;
    showType?: boolean;
    showFeatured?: boolean;
    showColors?: boolean;
    showAuthor?: boolean;
    showStats?: boolean;
}

export function ContentGrid({
    items,
    isLoading = false,
    variant = 'default',
    columns = 4,
    emptyMessage = '暂无内容',
    showType = true,
    showFeatured = true,
    showColors = true,
    showAuthor = true,
    showStats = true,
}: ContentGridProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
        );
    }

    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    };

    if (variant === 'horizontal') {
        return (
            <div className="space-y-4">
                {items.map((item) => (
                    <ContentCard
                        key={item.id}
                        item={item}
                        variant="horizontal"
                        showType={showType}
                        showFeatured={showFeatured}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className={`grid ${gridCols[columns]} gap-6`}>
            {items.map((item) => (
                <ContentCard
                    key={item.id}
                    item={item}
                    variant={variant}
                    showType={showType}
                    showFeatured={showFeatured}
                    showColors={showColors}
                    showAuthor={showAuthor}
                    showStats={showStats}
                />
            ))}
        </div>
    );
}

// ============================================================================
// 导出
// ============================================================================

export { typeIcons, typeLabels };
