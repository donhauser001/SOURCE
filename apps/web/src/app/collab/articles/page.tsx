'use client';

/**
 * 文章列表页
 *
 * 展示所有已发布的文章，支持筛选和搜索
 */

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentGrid, type ContentCardItem } from '@/components/collab/content-card';
import { Toolbar, defaultFilters, type ToolbarFilters } from '@/components/collab/toolbar';
import { trpc } from '@/lib/trpc';

export default function ArticlesListPage() {
    const [filters, setFilters] = useState<ToolbarFilters>({
        ...defaultFilters,
        tab: 'all_contents',
        contentTypes: ['ARTICLE'],
    });

    // 获取文章列表
    const { data, isLoading } = trpc.content.list.useQuery({
        contentTypes: ['ARTICLE'],
        categorySlug: filters.categorySlug,
        q: filters.q,
    });

    const items = (data?.items || []) as ContentCardItem[];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* 页面头部 */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-background to-background">
                <div className="container mx-auto px-4 py-12">
                    <Button variant="ghost" size="sm" asChild className="mb-4">
                        <Link href="/collab">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            返回 ColLab
                        </Link>
                    </Button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10">
                            <FileText className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">文章</h1>
                            <p className="text-muted-foreground">
                                阅读色彩理论、行业见解与深度分析
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <Button asChild>
                            <Link href={'/collab/create?type=article' as Route}>
                                <FileText className="h-4 w-4 mr-2" />
                                发表文章
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="container mx-auto px-4 py-8">
                {/* 工具栏 - 锁定内容类型为文章 */}
                <Toolbar
                    filters={filters}
                    onFiltersChange={setFilters}
                    lockedContentType="ARTICLE"
                    showTabs={false}
                    showTypeFilter={false}
                    showCategoryFilter={true}
                    showSearch={true}
                />

                {/* 文章列表 */}
                <div className="mt-6">
                    <ContentGrid
                        items={items}
                        isLoading={isLoading}
                        columns={3}
                        showType={false}
                        showColors={false}
                        emptyMessage="暂无文章，成为第一个发表者吧！"
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
