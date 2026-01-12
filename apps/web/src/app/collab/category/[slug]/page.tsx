'use client';

/**
 * 分类页面
 *
 * 展示特定分类下的所有内容
 */

import { use, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { FolderOpen, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentGrid, type ContentCardItem } from '@/components/collab/content-card';
import { Toolbar, defaultFilters, type ToolbarFilters, type ContentTypeValue } from '@/components/collab/toolbar';
import { trpc } from '@/lib/trpc';

/** 分类树节点类型 */
interface CategoryTreeNode {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    parentId: string | null;
    level: number;
    order: number;
    isActive: boolean;
    contentTypes: ContentTypeValue[];
    children?: CategoryTreeNode[];
    _count?: { contents: number };
}

export default function CategoryPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);

    const [filters, setFilters] = useState<ToolbarFilters>({
        ...defaultFilters,
        tab: 'all_contents',
        categorySlug: slug,
    });

    // 获取分类信息（使用树形结构）
    const { data: categoriesData } = trpc.contentCategory.list.useQuery({});
    const categories = (categoriesData?.tree || []) as CategoryTreeNode[];

    // 查找当前分类
    const findCategory = (
        items: CategoryTreeNode[],
        targetSlug: string
    ): CategoryTreeNode | null => {
        for (const item of items) {
            if (item.slug === targetSlug) return item;
            if (item.children?.length) {
                const found = findCategory(item.children, targetSlug);
                if (found) return found;
            }
        }
        return null;
    };

    const category = findCategory(categories, slug);

    // 获取内容列表
    const { data, isLoading } = trpc.content.list.useQuery({
        categorySlug: slug,
        contentTypes: filters.contentTypes.length > 0 ? filters.contentTypes : undefined,
        q: filters.q,
    });

    if (!category && categories.length > 0) {
        notFound();
    }

    const items = (data?.items || []) as ContentCardItem[];

    // 获取父分类路径
    const getBreadcrumb = () => {
        if (!category) return [];

        const path: { name: string; slug: string }[] = [];

        // 查找父分类
        const findParent = (items: CategoryTreeNode[], targetId: string): CategoryTreeNode | null => {
            for (const item of items) {
                if (item.children?.some((c) => c.id === targetId)) {
                    return item;
                }
                if (item.children?.length) {
                    const found = findParent(item.children, targetId);
                    if (found) return found;
                }
            }
            return null;
        };

        let current: CategoryTreeNode | null = category;
        while (current) {
            path.unshift({ name: current.name, slug: current.slug });
            const parent = findParent(categories, current.id);
            if (parent) {
                current = parent;
            } else {
                break;
            }
        }

        return path;
    };

    const breadcrumb = getBreadcrumb();

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* 页面头部 */}
            <div className="bg-gradient-to-br from-violet-500/10 via-background to-background">
                <div className="container mx-auto px-4 py-12">
                    <Button variant="ghost" size="sm" asChild className="mb-4">
                        <Link href="/collab">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            返回 ColLab
                        </Link>
                    </Button>

                    {/* 面包屑 */}
                    {breadcrumb.length > 1 && (
                        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                            <Link href="/collab" className="hover:text-foreground">
                                ColLab
                            </Link>
                            {breadcrumb.map((item, index) => (
                                <span key={item.slug} className="flex items-center gap-1">
                                    <ChevronRight className="h-4 w-4" />
                                    {index === breadcrumb.length - 1 ? (
                                        <span className="text-foreground">{item.name}</span>
                                    ) : (
                                        <Link
                                            href={`/collab/category/${item.slug}` as Route}
                                            className="hover:text-foreground"
                                        >
                                            {item.name}
                                        </Link>
                                    )}
                                </span>
                            ))}
                        </nav>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-violet-500/10">
                            <FolderOpen className="h-8 w-8 text-violet-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{category?.name || '分类'}</h1>
                            {category?.description && (
                                <p className="text-muted-foreground">{category.description}</p>
                            )}
                        </div>
                    </div>

                    {/* 子分类导航 */}
                    {category?.children && category.children.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            {category.children.map((child) => (
                                <Link
                                    key={child.id}
                                    href={`/collab/category/${child.slug}` as Route}
                                >
                                    <Badge
                                        variant="secondary"
                                        className="px-3 py-1 hover:bg-muted cursor-pointer"
                                    >
                                        {child.name}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 内容区域 */}
            <div className="container mx-auto px-4 py-8">
                {/* 工具栏 */}
                <Toolbar
                    filters={filters}
                    onFiltersChange={(newFilters) =>
                        setFilters({ ...newFilters, categorySlug: slug })
                    }
                    showTabs={false}
                    showTypeFilter={true}
                    showCategoryFilter={false}
                    showSearch={true}
                />

                {/* 内容列表 */}
                <div className="mt-6">
                    <ContentGrid
                        items={items}
                        isLoading={isLoading}
                        columns={4}
                        emptyMessage={`「${category?.name || '该分类'}」下暂无内容`}
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
