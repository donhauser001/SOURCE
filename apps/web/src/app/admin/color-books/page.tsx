'use client';

/**
 * 色彩簿管理页面
 */

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Eye, Trash2, Book, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { ColorBookStatus } from '@prisma/client';

const STATUS_LABELS: Record<ColorBookStatus, string> = {
    DRAFT: '草稿',
    ACTIVE: '已发布',
    ARCHIVED: '已归档',
};

export default function AdminColorBooksPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // 获取分类列表
    const { data: categories } = trpc.colorBookCategory.list.useQuery();

    const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
        trpc.colorBook.adminList.useInfiniteQuery(
            {
                limit: 20,
                search: search || undefined,
                status: statusFilter === 'all' ? undefined : (statusFilter as ColorBookStatus),
                categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
            },
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor,
            }
        );

    const deleteMutation = trpc.colorBook.delete.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    const books = data?.pages.flatMap((page) => page.items) || [];

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除此色彩簿吗？删除后无法恢复。')) return;
        deleteMutation.mutate({ id });
    };

    return (
        <div className="space-y-6">
            {/* 操作按钮 */}
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/admin/color-books/new">
                        <Plus className="h-4 w-4 mr-2" />
                        新建色彩簿
                    </Link>
                </Button>
            </div>

            {/* 筛选条件 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索编号或名称..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部状态</SelectItem>
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="分类" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部分类</SelectItem>
                                {categories?.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 数据表格 */}
            <Card>
                <CardHeader>
                    <CardTitle>色彩簿列表</CardTitle>
                    <CardDescription>
                        {isLoading ? '加载中...' : `共 ${books.length} 个色彩簿`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">编号</th>
                                    <th className="text-left py-3 px-4 font-medium">名称</th>
                                    <th className="text-left py-3 px-4 font-medium">分类</th>
                                    <th className="text-left py-3 px-4 font-medium">状态</th>
                                    <th className="text-center py-3 px-4 font-medium">色彩数</th>
                                    <th className="text-left py-3 px-4 font-medium">创建时间</th>
                                    <th className="text-right py-3 px-4 font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            加载中...
                                        </td>
                                    </tr>
                                ) : books.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                            {search || statusFilter !== 'all' || categoryFilter !== 'all'
                                                ? '没有匹配的记录'
                                                : '暂无色彩簿，点击右上角新建'}
                                        </td>
                                    </tr>
                                ) : (
                                    books.map((book) => (
                                        <tr key={book.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                    {book.bookId}
                                                </code>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Book className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{book.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline">
                                                    {book.category?.name || '未分类'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={book.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                    {STATUS_LABELS[book.status]}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-center">{book.totalColors}</td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {new Date(book.createdAt).toLocaleDateString('zh-CN')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/color-book/${book.slug}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/admin/color-books/${book.id}`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(book.id)}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 加载更多 */}
                    {hasNextPage && (
                        <div className="mt-4 text-center">
                            <Button
                                variant="outline"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        加载中...
                                    </>
                                ) : (
                                    '加载更多'
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
