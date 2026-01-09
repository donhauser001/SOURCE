/**
 * 色彩簿详情页
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { labToRgb } from '@/lib/color';
import { Book, Calendar, Palette, ArrowLeft } from 'lucide-react';
import type { ColorBookCategory } from '@prisma/client';

interface Props {
    params: Promise<{ slug: string }>;
}

const CATEGORY_LABELS: Record<ColorBookCategory, string> = {
    CLASSIC: '经典系列',
    SEASONAL: '季节系列',
    THEMED: '主题系列',
    REGIONAL: '地域系列',
    CUSTOM: '定制系列',
};

async function getColorBook(slug: string) {
    const book = await prisma.colorBook.findUnique({
        where: { slug },
        include: {
            entries: {
                orderBy: { order: 'asc' },
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
                            status: true,
                            auditStatus: true,
                        },
                    },
                },
            },
        },
    });

    if (!book || book.status !== 'ACTIVE') {
        return null;
    }

    return book;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const book = await getColorBook(slug);

    if (!book) {
        return {
            title: '色彩簿不存在 | SOURCE',
        };
    }

    return {
        title: `${book.name} | SOURCE 色彩簿`,
        description: book.shortDesc || book.description || `探索 ${book.name} 色彩簿中的 ${book.entries.length} 种精选色彩。`,
    };
}

export default async function ColorBookPage({ params }: Props) {
    const { slug } = await params;
    const book = await getColorBook(slug);

    if (!book) {
        notFound();
    }

    // 按章节分组
    const sections = groupBySection(book.entries);

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                {/* 返回按钮 */}
                <div className="max-w-6xl mx-auto px-6 pt-6">
                    <Link href="/color-books">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            返回色彩簿列表
                        </Button>
                    </Link>
                </div>

                {/* 头部区域 */}
                <header className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* 封面 */}
                        <div className="w-full md:w-72 flex-shrink-0">
                            <div className="aspect-[3/4] relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden shadow-lg">
                                {book.coverImageUrl ? (
                                    <Image
                                        src={book.coverImageUrl}
                                        alt={book.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Book className="w-24 h-24 text-slate-300 dark:text-slate-700" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 信息 */}
                        <div className="flex-1">
                            <Badge variant="secondary" className="mb-4">
                                {CATEGORY_LABELS[book.category]}
                            </Badge>

                            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                                {book.name}
                            </h1>

                            {book.shortDesc && (
                                <p className="text-lg text-muted-foreground mb-4">
                                    {book.shortDesc}
                                </p>
                            )}

                            {book.description && (
                                <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
                                    <p>{book.description}</p>
                                </div>
                            )}

                            {/* 元信息 */}
                            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                                <span className="flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    <strong className="text-foreground">{book.entries.length}</strong> 种色彩
                                </span>
                                {book.publishedYear && (
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {book.publishedYear} 年
                                    </span>
                                )}
                                {book.edition && (
                                    <span>{book.edition}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* 色彩列表 */}
                <section className="max-w-6xl mx-auto px-6 pb-16">
                    {sections.map((section, idx) => (
                        <div key={section.name || idx} className="mb-12">
                            {section.name && (
                                <h2 className="text-xl font-semibold text-foreground mb-6 pb-2 border-b">
                                    {section.name}
                                </h2>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {section.entries.map((entry) => (
                                    <ColorCard
                                        key={entry.id}
                                        color={entry.color}
                                        pageNumber={entry.pageNumber}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </>
    );
}

// 色彩卡片组件
function ColorCard({
    color,
    pageNumber,
}: {
    color: {
        id: string;
        colorId: string;
        name: string;
        slug: string;
        labL: number;
        labA: number;
        labB: number;
    };
    pageNumber: string | null;
}) {
    const rgb = labToRgb(color.labL, color.labA, color.labB);
    const bgColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const isLight = color.labL > 60;

    return (
        <Link
            href={`/color/${color.slug}`}
            className="group block"
        >
            <div
                className="aspect-square rounded-xl shadow-sm transition-all duration-200 group-hover:shadow-lg group-hover:scale-105 relative overflow-hidden"
                style={{ backgroundColor: bgColor }}
            >
                {/* 悬停时显示信息 */}
                <div className={`absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isLight ? 'bg-black/30' : 'bg-white/20'
                }`}>
                    <span className={`text-xs font-medium truncate ${
                        isLight ? 'text-white' : 'text-white'
                    }`}>
                        {color.colorId}
                    </span>
                </div>
                
                {/* 页码标记 */}
                {pageNumber && (
                    <div className={`absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        isLight ? 'bg-black/20 text-black/70' : 'bg-white/20 text-white/70'
                    }`}>
                        {pageNumber}
                    </div>
                )}
            </div>
            <div className="mt-2 text-center">
                <p className="text-sm font-medium text-foreground truncate">
                    {color.name}
                </p>
                <p className="text-xs text-muted-foreground">
                    {color.colorId}
                </p>
            </div>
        </Link>
    );
}

// 按章节分组
function groupBySection(entries: Array<{
    id: string;
    sectionName: string | null;
    pageNumber: string | null;
    color: {
        id: string;
        colorId: string;
        name: string;
        slug: string;
        labL: number;
        labA: number;
        labB: number;
        status: string;
        auditStatus: string;
    };
}>) {
    const groups: Map<string, typeof entries> = new Map();

    for (const entry of entries) {
        const key = entry.sectionName || '';
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(entry);
    }

    return Array.from(groups.entries()).map(([name, entries]) => ({
        name: name || null,
        entries,
    }));
}
