'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Book, Palette, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ColorBookCardProps {
    book: {
        id: string;
        bookId: string;
        name: string;
        slug: string;
        shortDesc: string | null;
        coverImageUrl: string | null;
        publishedYear: number | null;
        category: { name: string };
        totalColors: number;
    };
}

export function ColorBookCard({ book }: ColorBookCardProps) {
    return (
        <Link
            href={`/color-book/${book.slug}`}
            className="group block"
        >
            <article className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* 封面图 */}
                <div className="aspect-[4/3] relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                    {book.coverImageUrl ? (
                        <Image
                            src={book.coverImageUrl}
                            alt={book.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Book className="w-16 h-16 text-slate-300 dark:text-slate-700" />
                        </div>
                    )}
                    {/* 色彩簿类别标签 */}
                    <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                            {book.category.name}
                        </Badge>
                    </div>
                </div>

                {/* 信息区 */}
                <div className="p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {book.name}
                    </h3>
                    
                    {book.shortDesc && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {book.shortDesc}
                        </p>
                    )}

                    {/* 元信息 */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Palette className="w-4 h-4" />
                            {book.totalColors} 色
                        </span>
                        {book.publishedYear && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {book.publishedYear}
                            </span>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
}
