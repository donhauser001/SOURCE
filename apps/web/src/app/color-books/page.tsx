/**
 * 色彩簿列表页
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { SiteHeader } from '@/components/site-header';
import { ColorBookCard } from '@/components/color-book/color-book-card';

export const metadata: Metadata = {
    title: '色彩簿 | SOURCE',
    description: '浏览 SOURCE 色彩簿收藏，探索精心策划的色彩系列。',
};

async function getColorBooks() {
    const books = await prisma.colorBook.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { entries: true },
            },
        },
    });

    return books.map((book) => ({
        ...book,
        totalColors: book._count.entries,
    }));
}

export default async function ColorBooksPage() {
    const books = await getColorBooks();

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    {/* 页面标题 */}
                    <header className="mb-12 text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
                            色彩簿
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            探索精心策划的色彩系列，从经典传统到当代潮流，
                            每一本色彩簿都是一段独特的色彩旅程。
                        </p>
                    </header>

                    {/* 色彩簿列表 */}
                    <Suspense fallback={<ColorBooksLoading />}>
                        {books.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {books.map((book) => (
                                    <ColorBookCard key={book.id} book={book} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-muted-foreground">
                                    暂无色彩簿，敬请期待...
                                </p>
                            </div>
                        )}
                    </Suspense>
                </div>
            </main>
        </>
    );
}

function ColorBooksLoading() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="aspect-[3/4] bg-muted rounded-2xl animate-pulse"
                />
            ))}
        </div>
    );
}
