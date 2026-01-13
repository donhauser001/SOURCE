'use client';

/**
 * 首页 ColLab 精选组件
 */

import Link from 'next/link';
import type { Route } from 'next';
import { Palette, BookOpen, FileText, Plus } from 'lucide-react';

interface ContentColor {
    color: {
        id: string;
        colorId: string;
        name: string;
        labL: number;
        labA: number;
        labB: number;
    };
}

interface Content {
    id: string;
    contentId: string;
    contentType: string;
    title: string;
    summary: string | null;
    coverImageUrl: string | null;
    viewCount: number;
    likeCount: number;
    author: {
        id: string;
        name: string | null;
        image: string | null;
    };
    colors: ContentColor[];
}

interface CollabSectionProps {
    contents: Content[];
}

// 内容类型图标
const typeIcons: Record<string, typeof Palette> = {
    WORK: Palette,
    TUTORIAL: BookOpen,
    ARTICLE: FileText,
};

// 内容类型标签
const typeLabels: Record<string, string> = {
    WORK: '作品',
    TUTORIAL: '教程',
    ARTICLE: '文章',
};

// Lab 转 RGB
function labToRgb(labL: number, labA: number, labB: number): string {
    const y = (labL + 16) / 116;
    const x = labA / 500 + y;
    const z = y - labB / 200;

    const x3 = x * x * x;
    const y3 = y * y * y;
    const z3 = z * z * z;

    const xn = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787;
    const yn = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787;
    const zn = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787;

    const xr = xn * 95.047;
    const yr = yn * 100.0;
    const zr = zn * 108.883;

    let r = xr * 3.2406 + yr * -1.5372 + zr * -0.4986;
    let g = xr * -0.9689 + yr * 1.8758 + zr * 0.0415;
    let b = xr * 0.0557 + yr * -0.2040 + zr * 1.0570;

    r = r > 0.0031308 ? 1.055 * Math.pow(r / 100, 1 / 2.4) - 0.055 : 12.92 * r / 100;
    g = g > 0.0031308 ? 1.055 * Math.pow(g / 100, 1 / 2.4) - 0.055 : 12.92 * g / 100;
    b = b > 0.0031308 ? 1.055 * Math.pow(b / 100, 1 / 2.4) - 0.055 : 12.92 * b / 100;

    r = Math.min(255, Math.max(0, Math.round(r * 255)));
    g = Math.min(255, Math.max(0, Math.round(g * 255)));
    b = Math.min(255, Math.max(0, Math.round(b * 255)));

    return `rgb(${r}, ${g}, ${b})`;
}

export function CollabSection({ contents }: CollabSectionProps) {
    // 如果没有内容，显示创作入口
    if (contents.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-foreground/40 mb-6">还没有精选内容，成为第一个创作者吧！</p>
                <div className="flex items-center justify-center gap-4">
                    <Link
                        href="/collab/create?type=work"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 text-sm text-foreground/60 hover:bg-foreground/5 transition-all"
                    >
                        <Palette className="h-4 w-4" />
                        发表作品
                    </Link>
                    <Link
                        href="/collab/create?type=tutorial"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 text-sm text-foreground/60 hover:bg-foreground/5 transition-all"
                    >
                        <BookOpen className="h-4 w-4" />
                        发布教程
                    </Link>
                    <Link
                        href="/collab/create?type=article"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 text-sm text-foreground/60 hover:bg-foreground/5 transition-all"
                    >
                        <FileText className="h-4 w-4" />
                        发表文章
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {contents.map((item) => {
                const Icon = typeIcons[item.contentType] || FileText;
                const colors = item.colors?.slice(0, 4) || [];

                return (
                    <Link
                        key={item.id}
                        href={`/collab/${item.id}` as Route}
                        className="group block"
                    >
                        <article className="rounded-2xl overflow-hidden border border-foreground/5 bg-background hover:border-foreground/10 transition-all duration-300 hover:shadow-lg">
                            {/* 封面图 */}
                            <div className="aspect-[16/10] overflow-hidden bg-foreground/5">
                                {item.coverImageUrl ? (
                                    <img
                                        src={item.coverImageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Icon className="h-10 w-10 text-foreground/10" />
                                    </div>
                                )}
                            </div>

                            {/* 内容 */}
                            <div className="p-4">
                                {/* 类型标签 */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/5 text-[10px] text-foreground/50">
                                        <Icon className="h-3 w-3" />
                                        {typeLabels[item.contentType] || item.contentType}
                                    </span>
                                </div>

                                {/* 标题 */}
                                <h3 className="text-sm font-medium text-foreground/80 line-clamp-2 group-hover:text-foreground transition-colors">
                                    {item.title}
                                </h3>

                                {/* 摘要 */}
                                {item.summary && (
                                    <p className="mt-1.5 text-xs text-foreground/40 line-clamp-2">
                                        {item.summary}
                                    </p>
                                )}

                                {/* 底部信息 */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-foreground/5">
                                    {/* 作者 */}
                                    <div className="flex items-center gap-2">
                                        {item.author.image ? (
                                            <img
                                                src={item.author.image}
                                                alt={item.author.name || ''}
                                                className="h-5 w-5 rounded-full"
                                            />
                                        ) : (
                                            <div className="h-5 w-5 rounded-full bg-foreground/10 flex items-center justify-center text-[9px] font-medium text-foreground/40">
                                                {(item.author.name || '?')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-[11px] text-foreground/40">
                                            {item.author.name || '匿名'}
                                        </span>
                                    </div>

                                    {/* 关联色彩 */}
                                    {colors.length > 0 && (
                                        <div className="flex items-center gap-0.5">
                                            {colors.map(({ color }) => {
                                                const rgb = labToRgb(color.labL, color.labA, color.labB);
                                                return (
                                                    <div
                                                        key={color.id}
                                                        className="h-3.5 w-3.5 rounded-full border border-foreground/10"
                                                        style={{ backgroundColor: rgb }}
                                                        title={color.name}
                                                    />
                                                );
                                            })}
                                            {(item.colors?.length || 0) > 4 && (
                                                <span className="text-[9px] text-foreground/30 ml-0.5">
                                                    +{(item.colors?.length || 0) - 4}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    </Link>
                );
            })}
        </div>
    );
}
