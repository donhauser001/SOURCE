'use client';

/**
 * 作品列表页
 *
 * 展示所有已发布的作品，支持筛选和搜索
 */

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Palette, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentGrid, type ContentCardItem } from '@/components/collab/content-card';
import { Toolbar, defaultFilters, type ToolbarFilters } from '@/components/collab/toolbar';
import { trpc } from '@/lib/trpc';

export default function WorksListPage() {
    const [filters, setFilters] = useState<ToolbarFilters>({
        ...defaultFilters,
        tab: 'all_contents',
        contentTypes: ['WORK'],
    });

    // 获取作品列表
    const { data, isLoading } = trpc.content.list.useQuery({
        contentTypes: ['WORK'],
        categorySlug: filters.categorySlug,
        q: filters.q,
    });

    const items = (data?.items || []) as ContentCardItem[];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* 页面头部 */}
            <div className="bg-gradient-to-br from-primary/10 via-background to-background">
                <div className="container mx-auto px-4 py-12">
                    <Button variant="ghost" size="sm" asChild className="mb-4">
                        <Link href="/collab">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            返回 ColLab
                        </Link>
                    </Button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-primary/10">
                            <Palette className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">作品</h1>
                            <p className="text-muted-foreground">
                                探索创作者们的色彩实践作品
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <Button asChild>
                            <Link href={'/collab/create?type=work' as Route}>
                                <Palette className="h-4 w-4 mr-2" />
                                发表作品
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="container mx-auto px-4 py-8">
                {/* 工具栏 - 锁定内容类型为作品 */}
                <Toolbar
                    filters={filters}
                    onFiltersChange={setFilters}
                    lockedContentType="WORK"
                    showTabs={false}
                    showTypeFilter={false}
                    showCategoryFilter={true}
                    showSearch={true}
                />

                {/* 作品列表 */}
                <div className="mt-6">
                    <ContentGrid
                        items={items}
                        isLoading={isLoading}
                        columns={4}
                        showType={false}
                        emptyMessage="暂无作品，成为第一个发表者吧！"
                    />
                </div>

                {/* 分页/加载更多 */}
                {data?.nextCursor && (
                    <div className="flex justify-center mt-8">
                        <Button variant="outline">加载更多</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
