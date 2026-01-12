'use client';

/**
 * 教程列表页
 *
 * 展示所有已发布的教程，支持筛选和搜索
 */

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentGrid, type ContentCardItem } from '@/components/collab/content-card';
import { Toolbar, defaultFilters, type ToolbarFilters } from '@/components/collab/toolbar';
import { trpc } from '@/lib/trpc';

export default function TutorialsListPage() {
    const [filters, setFilters] = useState<ToolbarFilters>({
        ...defaultFilters,
        tab: 'all_contents',
        contentTypes: ['TUTORIAL'],
    });

    // 获取教程列表
    const { data, isLoading } = trpc.content.list.useQuery({
        contentTypes: ['TUTORIAL'],
        categorySlug: filters.categorySlug,
        q: filters.q,
    });

    const items = (data?.items || []) as ContentCardItem[];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* 页面头部 */}
            <div className="bg-gradient-to-br from-blue-500/10 via-background to-background">
                <div className="container mx-auto px-4 py-12">
                    <Button variant="ghost" size="sm" asChild className="mb-4">
                        <Link href="/collab">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            返回 ColLab
                        </Link>
                    </Button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10">
                            <BookOpen className="h-8 w-8 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">教程</h1>
                            <p className="text-muted-foreground">
                                学习色彩应用技巧和创作方法
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <Button asChild>
                            <Link href={'/collab/create?type=tutorial' as Route}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                发布教程
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="container mx-auto px-4 py-8">
                {/* 工具栏 - 锁定内容类型为教程 */}
                <Toolbar
                    filters={filters}
                    onFiltersChange={setFilters}
                    lockedContentType="TUTORIAL"
                    showTabs={false}
                    showTypeFilter={false}
                    showCategoryFilter={true}
                    showSearch={true}
                />

                {/* 教程列表 - 水平卡片更适合教程 */}
                <div className="mt-6">
                    <ContentGrid
                        items={items}
                        isLoading={isLoading}
                        columns={3}
                        showType={false}
                        emptyMessage="暂无教程，成为第一个发布者吧！"
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
