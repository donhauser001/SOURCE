'use client';

/**
 * 作品画廊组件
 * 
 * 展示公开作品的卡片列表
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, BookOpen, Heart, Eye, ImageIcon, ChevronLeft, ChevronRight, Search, X, ChevronDown, Check, User, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from '@/components/ui/carousel';

// Lab to RGB 转换
function labToRgb(L: number, a: number, b: number): string {
    let y = (L + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    const y3 = Math.pow(y, 3);
    const x3 = Math.pow(x, 3);
    const z3 = Math.pow(z, 3);

    y = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787;
    x = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787;
    z = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787;

    x *= 95.047;
    y *= 100.0;
    z *= 108.883;

    x = x / 100;
    y = y / 100;
    z = z / 100;

    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let bVal = x * 0.0557 + y * -0.204 + z * 1.057;

    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
    bVal = bVal > 0.0031308 ? 1.055 * Math.pow(bVal, 1 / 2.4) - 0.055 : 12.92 * bVal;

    const toHex = (c: number) => {
        const val = Math.max(0, Math.min(255, Math.round(c * 255)));
        return val.toString(16).padStart(2, '0');
    };

    return `#${toHex(r)}${toHex(g)}${toHex(bVal)}`;
}

interface Work {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    externalUrl: string | null;
    tags: string[];
    viewCount: number;
    likeCount: number;
    createdAt: Date;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
    colorBook: {
        id: string;
        name: string;
        slug: string;
    } | null;
    colors: Array<{
        color: {
            id: string;
            colorId: string;
            name: string;
            slug: string;
            labL: number;
            labA: number;
            labB: number;
        };
    }>;
}

interface WorksGalleryProps {
    works: Work[];
}

/**
 * 首焦推荐作品组件 - 轮播图
 */
export function WorksHero({ works }: WorksGalleryProps) {
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

    if (works.length === 0) return null;

    const currentWork = works[current];

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
                    {works.map((work) => (
                        <CarouselItem key={work.id} className="pl-0">
                            <HeroSlide work={work} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* 底部信息栏 - 所有信息一行 */}
            <div className="absolute bottom-0 left-0 right-0 z-10 rounded-b-3xl overflow-hidden">
                <div className="bg-gradient-to-t from-black/70 to-transparent pt-16 pb-6 px-8 lg:px-12">
                    <div className="flex items-center justify-between gap-6">
                        {/* 左侧：标题 + 作者 + 颜色（横排） */}
                        <div className="flex items-center gap-6 min-w-0 flex-1">
                            {/* 标题 */}
                            <h3 className="text-xl lg:text-2xl font-bold text-white truncate max-w-xs lg:max-w-md">
                                {currentWork?.title}
                            </h3>

                            {/* 分隔线 */}
                            <div className="h-6 w-px bg-white/30 hidden sm:block" />

                            {/* 作者信息 */}
                            <div className="hidden sm:flex items-center gap-2">
                                {currentWork?.user.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={currentWork.user.image}
                                        alt={currentWork.user.name || ''}
                                        className="h-7 w-7 rounded-full border border-white/30"
                                    />
                                ) : (
                                    <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium text-white">
                                        {(currentWork?.user.name || '?')[0].toUpperCase()}
                                    </div>
                                )}
                                <span className="text-sm text-white/90">
                                    {currentWork?.user.name || '匿名用户'}
                                </span>
                            </div>

                            {/* 分隔线 */}
                            {currentWork?.colors && currentWork.colors.length > 0 && (
                                <div className="h-6 w-px bg-white/30 hidden md:block" />
                            )}

                            {/* 关联颜色 */}
                            {currentWork?.colors && currentWork.colors.length > 0 && (
                                <div className="hidden md:flex items-center gap-1.5">
                                    {currentWork.colors.slice(0, 6).map(({ color }) => {
                                        const bgColor = labToRgb(color.labL, color.labA, color.labB);
                                        return (
                                            <div
                                                key={color.id}
                                                className="h-6 w-6 rounded-full border border-white/30"
                                                style={{ backgroundColor: bgColor }}
                                                title={color.name}
                                            />
                                        );
                                    })}
                                    {currentWork.colors.length > 6 && (
                                        <span className="text-xs text-white/60 ml-1">
                                            +{currentWork.colors.length - 6}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 右侧：导航控制 */}
                        {count > 1 && (
                            <div className="flex items-center gap-3">
                                {/* 指示器 */}
                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: count }).map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => scrollTo(index)}
                                            className={`h-1.5 rounded-full transition-all ${
                                                index === current
                                                    ? 'w-6 bg-white'
                                                    : 'w-1.5 bg-white/40 hover:bg-white/60'
                                            }`}
                                            aria-label={`跳转到第 ${index + 1} 张`}
                                        />
                                    ))}
                                </div>

                                {/* 分隔线 */}
                                <div className="h-6 w-px bg-white/30" />

                                {/* 导航按钮 */}
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

/**
 * 轮播图单张幻灯片
 * 简化版：纯图片展示
 */
function HeroSlide({ work }: { work: Work }) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="relative w-full aspect-[3/1] rounded-3xl overflow-hidden group cursor-pointer bg-muted">
            {/* 背景图片 */}
            <div className="absolute inset-0">
                {imageError ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ImageIcon className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={work.imageUrl}
                        alt={work.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                )}
            </div>
        </div>
    );
}

export function WorksGallery({ works }: WorksGalleryProps) {
    if (works.length === 0) {
        return (
            <div className="text-center py-16">
                <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    暂无公开作品
                </h3>
                <p className="text-muted-foreground">
                    成为第一个分享作品的设计师吧！
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {works.map((work) => (
                <WorkCard key={work.id} work={work} />
            ))}
        </div>
    );
}

/**
 * 作品库视图组件
 * 带搜索、筛选、分页功能
 */
export function WorksLibraryView({ works }: WorksGalleryProps) {
    // 状态
    const [search, setSearch] = useState('');
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [authorFilters, setAuthorFilters] = useState<string[]>([]);
    const [tagFilters, setTagFilters] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15; // 5列 x 3行

    // 获取唯一的作者
    const uniqueAuthors = useMemo(() => {
        const authors = new Map<string, string>();
        works.forEach(work => {
            if (work.user.name) {
                authors.set(work.user.id, work.user.name);
            }
        });
        return Array.from(authors.entries()).map(([id, name]) => ({ id, name }));
    }, [works]);

    // 获取唯一的标签
    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        works.forEach(work => {
            work.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [works]);

    // 筛选结果
    const filteredWorks = useMemo(() => {
        return works.filter(work => {
            // 搜索
            if (search) {
                const searchLower = search.toLowerCase();
                const matchTitle = work.title.toLowerCase().includes(searchLower);
                const matchDesc = work.description?.toLowerCase().includes(searchLower);
                const matchTags = work.tags.some(t => t.toLowerCase().includes(searchLower));
                const matchAuthor = work.user.name?.toLowerCase().includes(searchLower);
                if (!matchTitle && !matchDesc && !matchTags && !matchAuthor) {
                    return false;
                }
            }

            // 作者筛选
            if (authorFilters.length > 0) {
                if (!authorFilters.includes(work.user.id)) {
                    return false;
                }
            }

            // 标签筛选
            if (tagFilters.length > 0) {
                if (!work.tags.some(tag => tagFilters.includes(tag))) {
                    return false;
                }
            }

            return true;
        });
    }, [works, search, authorFilters, tagFilters]);

    // 分页
    const totalPages = Math.ceil(filteredWorks.length / pageSize);
    const paginatedWorks = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredWorks.slice(start, start + pageSize);
    }, [filteredWorks, currentPage, pageSize]);

    // 重置分页
    useEffect(() => {
        setCurrentPage(1);
    }, [search, authorFilters, tagFilters]);

    // 筛选器切换
    const toggleFilter = (
        value: string,
        current: string[],
        setter: (v: string[]) => void
    ) => {
        if (current.includes(value)) {
            setter(current.filter(v => v !== value));
        } else {
            setter([...current, value]);
        }
    };

    // 清除筛选
    const clearFilters = () => {
        setSearch('');
        setAuthorFilters([]);
        setTagFilters([]);
        setCurrentPage(1);
    };

    const hasFilters = search || authorFilters.length > 0 || tagFilters.length > 0;

    // 分页控制
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-6">
            {/* 工具栏 - 全圆角风格 */}
            <div className="flex items-center gap-2 p-2 rounded-full bg-gray-100">
                {/* 搜索框 - 点击展开 */}
                <div
                    className={`
                        relative flex items-center
                        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${searchExpanded ? 'flex-1 min-w-0' : 'w-11 flex-shrink-0'}
                    `}
                >
                    <button
                        type="button"
                        onClick={() => setSearchExpanded(true)}
                        className={`
                            absolute left-0 top-0 h-11 w-11 rounded-full bg-white
                            flex items-center justify-center
                            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                            ${searchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-gray-50'}
                        `}
                    >
                        <Search className="h-5 w-5 text-gray-500" />
                    </button>
                    <div
                        className={`
                            relative w-full
                            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                            ${searchExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                        `}
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="搜索作品标题、描述、标签..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onBlur={() => {
                                if (!search) setSearchExpanded(false);
                            }}
                            className="w-full pl-12 pr-10 h-11 bg-white border-0 rounded-full text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            autoFocus={searchExpanded}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setSearchExpanded(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* 右侧固定区域 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* 作者筛选 */}
                    {uniqueAuthors.length > 1 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-11 px-4 bg-white border-0 rounded-full text-gray-700 gap-1 hover:bg-gray-50 justify-center">
                                    <User className="h-4 w-4" />
                                    <span>作者</span>
                                    {authorFilters.length > 0 && (
                                        <span className="h-5 min-w-5 px-1.5 rounded-full bg-gray-900 text-white text-xs inline-flex items-center justify-center font-medium">
                                            {authorFilters.length}
                                        </span>
                                    )}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 rounded-2xl" align="end">
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                    {uniqueAuthors.map(author => (
                                        <button
                                            key={author.id}
                                            type="button"
                                            onClick={() => toggleFilter(author.id, authorFilters, setAuthorFilters)}
                                            className={`
                                                w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm
                                                transition-colors duration-150
                                                ${authorFilters.includes(author.id)
                                                    ? 'bg-gray-900 text-white'
                                                    : 'hover:bg-gray-100 text-gray-700'}
                                            `}
                                        >
                                            <span>{author.name}</span>
                                            {authorFilters.includes(author.id) && (
                                                <Check className="h-4 w-4 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* 标签筛选 */}
                    {uniqueTags.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-11 px-4 bg-white border-0 rounded-full text-gray-700 gap-1 hover:bg-gray-50 justify-center">
                                    <Tag className="h-4 w-4" />
                                    <span>标签</span>
                                    {tagFilters.length > 0 && (
                                        <span className="h-5 min-w-5 px-1.5 rounded-full bg-gray-900 text-white text-xs inline-flex items-center justify-center font-medium">
                                            {tagFilters.length}
                                        </span>
                                    )}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 rounded-2xl" align="end">
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                    {uniqueTags.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleFilter(tag, tagFilters, setTagFilters)}
                                            className={`
                                                w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm
                                                transition-colors duration-150
                                                ${tagFilters.includes(tag)
                                                    ? 'bg-gray-900 text-white'
                                                    : 'hover:bg-gray-100 text-gray-700'}
                                            `}
                                        >
                                            <span>{tag}</span>
                                            {tagFilters.includes(tag) && (
                                                <Check className="h-4 w-4 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* 清除筛选 */}
                    {hasFilters && (
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="h-11 px-4 rounded-full text-gray-500 hover:text-gray-700 hover:bg-white"
                        >
                            <X className="h-4 w-4 mr-1" />
                            清除
                        </Button>
                    )}
                </div>
            </div>

            {/* 作品列表 */}
            {paginatedWorks.length === 0 ? (
                <div className="text-center py-16">
                    <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        {hasFilters ? '没有找到匹配的作品' : '暂无公开作品'}
                    </h3>
                    <p className="text-muted-foreground">
                        {hasFilters ? '试试调整筛选条件' : '成为第一个分享作品的设计师吧！'}
                    </p>
                    {hasFilters && (
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="mt-4 rounded-full"
                        >
                            清除筛选
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {paginatedWorks.map((work) => (
                        <WorkCard key={work.id} work={work} />
                    ))}
                </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-10 w-10 rounded-full"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                            let page: number;
                            if (totalPages <= 7) {
                                page = i + 1;
                            } else if (currentPage <= 4) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 3) {
                                page = totalPages - 6 + i;
                            } else {
                                page = currentPage - 3 + i;
                            }

                            return (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? 'default' : 'ghost'}
                                    onClick={() => goToPage(page)}
                                    className={`h-10 w-10 rounded-full ${
                                        currentPage === page ? 'bg-gray-900 text-white' : ''
                                    }`}
                                >
                                    {page}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-10 w-10 rounded-full"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
    );
}

function WorkCard({ work }: { work: Work }) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden group hover:border-border transition-colors">
            {/* 作品图片 */}
            <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {imageError ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={work.imageUrl}
                        alt={work.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                )}
                
                {/* 悬浮遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* 外部链接 */}
                {work.externalUrl && (
                    <a
                        href={work.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="h-4 w-4" />
                    </a>
                )}

                {/* 统计信息 */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1 text-white/90 text-sm">
                        <Eye className="h-4 w-4" />
                        {work.viewCount}
                    </span>
                    <span className="flex items-center gap-1 text-white/90 text-sm">
                        <Heart className="h-4 w-4" />
                        {work.likeCount}
                    </span>
                </div>
            </div>

            {/* 作品信息 */}
            <div className="p-4 space-y-3">
                {/* 标题 */}
                <h3 className="font-semibold text-foreground truncate">{work.title}</h3>

                {/* 描述 */}
                {work.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{work.description}</p>
                )}

                {/* 关联的色彩簿 */}
                {work.colorBook && (
                    <Link
                        href={`/color-book/${work.colorBook.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <BookOpen className="h-3.5 w-3.5" />
                        {work.colorBook.name}
                    </Link>
                )}

                {/* 关联的颜色 */}
                {work.colors.length > 0 && (
                    <div className="flex items-center gap-1">
                        {work.colors.slice(0, 8).map(({ color }) => {
                            const bgColor = labToRgb(color.labL, color.labA, color.labB);
                            return (
                                <Link
                                    key={color.id}
                                    href={`/color/${color.slug}`}
                                    className="h-5 w-5 rounded-full border border-border transition-transform hover:scale-110"
                                    style={{ backgroundColor: bgColor }}
                                    title={color.name}
                                />
                            );
                        })}
                        {work.colors.length > 8 && (
                            <span className="text-xs text-muted-foreground ml-1">
                                +{work.colors.length - 8}
                            </span>
                        )}
                    </div>
                )}

                {/* 标签 */}
                {work.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {work.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                        {work.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                                +{work.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {/* 作者信息 */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        {work.user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={work.user.image}
                                alt={work.user.name || ''}
                                className="h-6 w-6 rounded-full"
                            />
                        ) : (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                {(work.user.name || '?')[0].toUpperCase()}
                            </div>
                        )}
                        <span className="text-sm text-muted-foreground">
                            {work.user.name || '匿名用户'}
                        </span>
                    </div>
                    <span className="text-xs text-muted-foreground/70">
                        {new Date(work.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                </div>
            </div>
        </div>
    );
}
