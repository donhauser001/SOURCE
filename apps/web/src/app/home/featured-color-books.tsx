'use client';

/**
 * 首页色彩簿推荐组件
 */

import Link from 'next/link';
import { Book, Palette, Calendar } from 'lucide-react';

interface ColorBook {
    id: string;
    bookId: string;
    name: string;
    slug: string;
    shortDesc: string | null;
    coverImageUrl: string | null;
    publishedYear: number | null;
    totalColors: number;
    category: { name: string };
}

interface FeaturedColorBooksProps {
    colorBooks: ColorBook[];
}

export function FeaturedColorBooks({ colorBooks }: FeaturedColorBooksProps) {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {colorBooks.map((book) => (
                <Link
                    key={book.id}
                    href={`/color-book/${book.slug}`}
                    className="group block"
                >
                    <article className="rounded-2xl overflow-hidden border border-foreground/5 bg-background hover:border-foreground/10 transition-all duration-300 hover:shadow-lg">
                        {/* 封面图 */}
                        <div className="aspect-[4/3] relative bg-gradient-to-br from-foreground/5 to-foreground/10">
                            {book.coverImageUrl ? (
                                <img
                                    src={book.coverImageUrl}
                                    alt={book.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Book className="w-12 h-12 text-foreground/10" />
                                </div>
                            )}
                            {/* 类别标签 */}
                            <div className="absolute top-3 left-3">
                                <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-background/90 backdrop-blur text-foreground/60">
                                    {book.category.name}
                                </span>
                            </div>
                        </div>

                        {/* 信息区 */}
                        <div className="p-4">
                            <h3 className="text-sm font-medium text-foreground/80 mb-1 group-hover:text-foreground transition-colors truncate">
                                {book.name}
                            </h3>

                            {book.shortDesc && (
                                <p className="text-xs text-foreground/40 mb-3 line-clamp-2">
                                    {book.shortDesc}
                                </p>
                            )}

                            {/* 元信息 */}
                            <div className="flex items-center gap-3 text-[11px] text-foreground/30">
                                <span className="flex items-center gap-1">
                                    <Palette className="w-3 h-3" />
                                    {book.totalColors} 色
                                </span>
                                {book.publishedYear && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {book.publishedYear}
                                    </span>
                                )}
                            </div>
                        </div>
                    </article>
                </Link>
            ))}
        </div>
    );
}
