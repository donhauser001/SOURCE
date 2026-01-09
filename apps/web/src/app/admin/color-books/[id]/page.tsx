'use client';

/**
 * 编辑色彩簿页面 - 两栏布局
 * 左侧：色彩簿基本信息
 * 右侧：色彩列表管理
 */

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Trash2, Search, Palette, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ColorBookForm } from '@/components/admin/color-book-form';
import { trpc } from '@/lib/trpc';
import { useState, useMemo } from 'react';

const PAGE_SIZE = 15;

interface Props {
    params: Promise<{ id: string }>;
}

export default function EditColorBookPage({ params }: Props) {
    const { id } = use(params);
    const [colorSearch, setColorSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [orderChanges, setOrderChanges] = useState<Record<string, number>>({});

    const { data: colorBook, isLoading, refetch } = trpc.colorBook.adminGetById.useQuery({ id });

    const addColorsMutation = trpc.colorBook.addColors.useMutation({
        onSuccess: () => {
            refetch();
            setColorSearch('');
        },
    });

    const removeColorMutation = trpc.colorBook.removeColor.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    const updateOrderMutation = trpc.colorBook.updateColorOrder.useMutation({
        onSuccess: () => {
            refetch();
            setOrderChanges({});
        },
    });

    // 获取最新的颜色（默认显示）
    const { data: recentData, isLoading: isLoadingRecent } = trpc.color.adminListPaginated.useQuery(
        { limit: 50 }
    );
    const recentColors = recentData?.items || [];

    // 搜索色彩（输入时触发）- 使用无限查询支持加载更多
    const { 
        data: searchData, 
        isLoading: isSearching,
        fetchNextPage: fetchMoreSearch,
        hasNextPage: hasMoreSearch,
        isFetchingNextPage: isFetchingMoreSearch,
    } = trpc.color.adminListPaginated.useInfiniteQuery(
        { limit: 20, search: colorSearch },
        { 
            enabled: colorSearch.length >= 1,
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );
    const searchResults = searchData?.pages.flatMap((p) => p.items) || [];

    // 分页计算 - 必须在条件返回之前
    const entries = colorBook?.entries || [];
    const totalColors = entries.length;
    const totalPages = Math.ceil(totalColors / PAGE_SIZE);
    const paginatedEntries = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return entries.slice(start, start + PAGE_SIZE);
    }, [entries, currentPage]);

    // 已添加的色彩 ID 集合
    const addedColorIds = useMemo(() => new Set(entries.map((e) => e.colorId)), [entries]);

    // 过滤掉已添加的色彩
    const availableSearchResults = useMemo(() => {
        return searchResults.filter((c) => !addedColorIds.has(c.id));
    }, [searchResults, addedColorIds]);

    // 最新可添加的色彩
    const availableRecentColors = useMemo(() => {
        return recentColors.filter((c) => !addedColorIds.has(c.id)).slice(0, 10);
    }, [recentColors, addedColorIds]);


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!colorBook) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">色彩簿不存在</p>
                <Link href="/admin/color-books">
                    <Button variant="link">返回列表</Button>
                </Link>
            </div>
        );
    }

    const handleAddColor = (colorId: string) => {
        const maxOrder = entries.length > 0
            ? Math.max(...entries.map((e) => e.order)) + 1
            : 0;

        addColorsMutation.mutate({
            colorBookId: id,
            colors: [{ colorId, order: maxOrder }],
        });
    };

    const handleRemoveColor = (colorId: string) => {
        removeColorMutation.mutate({ colorBookId: id, colorId });
    };

    const handleOrderChange = (colorId: string, newOrder: number) => {
        setOrderChanges((prev) => ({ ...prev, [colorId]: newOrder }));
    };

    const handleSaveOrder = () => {
        // 合并原有序号和修改后的序号
        const allEntries = entries.map((entry) => {
            const newOrder = orderChanges[entry.colorId];
            const originalOrder = entry.order;
            
            // 计算排序用的权重
            let sortOrder: number;
            if (newOrder === undefined) {
                // 未修改，使用原序号
                sortOrder = originalOrder;
            } else if (newOrder > originalOrder) {
                // 往后移：插入到目标位置的后面（+0.5）
                sortOrder = newOrder + 0.5;
            } else if (newOrder < originalOrder) {
                // 往前移：插入到目标位置的前面（-0.5）
                sortOrder = newOrder - 0.5;
            } else {
                // 序号没变
                sortOrder = newOrder;
            }
            
            return { colorId: entry.colorId, sortOrder, originalOrder };
        });
        
        // 按排序权重排序，相同时按原序号排序（保证确定性）
        const sortedEntries = allEntries
            .sort((a, b) => {
                if (a.sortOrder !== b.sortOrder) {
                    return a.sortOrder - b.sortOrder;
                }
                // 相同 sortOrder 时，按原序号排序
                return a.originalOrder - b.originalOrder;
            })
            .map((entry, index) => ({
                colorId: entry.colorId,
                order: index,
            }));
        
        updateOrderMutation.mutate({ colorBookId: id, entries: sortedEntries });
    };

    const hasOrderChanges = Object.keys(orderChanges).length > 0;

    return (
        <div className="space-y-6">
            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
                <Link href="/admin/color-books">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href={`/color-book/${colorBook.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                        预览
                    </Button>
                </Link>
            </div>

            {/* 两栏布局 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：色彩簿信息编辑 */}
                <div className="space-y-6">
                    <ColorBookForm
                        colorBookId={id}
                        initialData={{
                            bookId: colorBook.bookId,
                            name: colorBook.name,
                            slug: colorBook.slug,
                            description: colorBook.description,
                            shortDesc: colorBook.shortDesc,
                            coverImageUrl: colorBook.coverImageUrl,
                            publishedYear: colorBook.publishedYear,
                            edition: colorBook.edition,
                            categoryId: colorBook.categoryId,
                            tags: colorBook.tags,
                            status: colorBook.status,
                        }}
                    />
                </div>

                {/* 右侧：色彩列表管理 */}
                <div className="space-y-4">
                    {/* 色彩搜索添加 */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                添加色彩
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* 搜索框 */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="输入色彩编号或名称搜索..."
                                    value={colorSearch}
                                    onChange={(e) => setColorSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            
                            {/* 搜索结果或最新颜色 */}
                            {colorSearch.length > 0 ? (
                                // 搜索模式 - 列表展示
                                isSearching ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                        搜索中...
                                    </div>
                                ) : availableSearchResults.length > 0 ? (
                                    <div className="divide-y border rounded-lg max-h-80 overflow-y-auto">
                                        {availableSearchResults.map((color) => (
                                            <div
                                                key={color.id}
                                                className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                                                onClick={() => handleAddColor(color.id)}
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-md shadow-sm flex-shrink-0"
                                                    style={{
                                                        backgroundColor: `lab(${color.labL}% ${color.labA} ${color.labB})`,
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{color.name}</p>
                                                    <p className="text-xs text-muted-foreground">{color.colorId}</p>
                                                </div>
                                                <Plus className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        ))}
                                        {hasMoreSearch && (
                                            <div className="p-2 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => fetchMoreSearch()}
                                                    disabled={isFetchingMoreSearch}
                                                    className="text-xs"
                                                >
                                                    {isFetchingMoreSearch ? (
                                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                    ) : null}
                                                    加载更多
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        搜索结果都已添加
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        没有找到匹配的色彩
                                    </div>
                                )
                            ) : (
                                // 默认显示最新颜色 - 卡片式五列
                                isLoadingRecent ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                        加载中...
                                    </div>
                                ) : availableRecentColors.length > 0 ? (
                                    <>
                                        <p className="text-xs text-muted-foreground mb-2">最新色彩（点击添加）</p>
                                        <div className="grid grid-cols-10 gap-1.5">
                                            {availableRecentColors.map((color) => (
                                                <button
                                                    key={color.id}
                                                    className="aspect-square rounded-lg cursor-pointer hover:scale-110 hover:z-10 transition-transform relative group flex flex-col items-center justify-center p-1.5"
                                                    onClick={() => handleAddColor(color.id)}
                                                    disabled={addColorsMutation.isPending}
                                                    style={{
                                                        backgroundColor: `lab(${color.labL}% ${color.labA} ${color.labB})`,
                                                    }}
                                                >
                                                    <span 
                                                        className="text-xs font-semibold truncate w-full text-center leading-tight opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm"
                                                        style={{ color: color.labL > 55 ? '#000' : '#fff' }}
                                                    >
                                                        {color.name}
                                                    </span>
                                                    <span 
                                                        className="text-[11px] truncate w-full text-center leading-tight opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm"
                                                        style={{ color: color.labL > 55 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)' }}
                                                    >
                                                        {color.colorId}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        所有色彩都已添加
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* 已添加的色彩列表 */}
                    <Card className="flex-1">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    色彩列表
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    {hasOrderChanges && (
                                        <Button
                                            size="sm"
                                            onClick={handleSaveOrder}
                                            disabled={updateOrderMutation.isPending}
                                            className="h-7 text-xs"
                                        >
                                            {updateOrderMutation.isPending ? (
                                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                            ) : (
                                                <Save className="h-3 w-3 mr-1" />
                                            )}
                                            保存排序
                                        </Button>
                                    )}
                                    <Badge variant="secondary">{totalColors} 色</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {totalColors > 0 ? (
                                <>
                                    <div className="divide-y">
                                        {paginatedEntries.map((entry) => {
                                            const currentOrder = orderChanges[entry.colorId] ?? entry.order;
                                            const isChanged = orderChanges[entry.colorId] !== undefined;
                                            return (
                                                <div
                                                    key={entry.id}
                                                    className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 group"
                                                >
                                                    <Input
                                                        type="number"
                                                        value={currentOrder}
                                                        onChange={(e) => handleOrderChange(entry.colorId, parseInt(e.target.value) || 0)}
                                                        className={`w-14 h-7 text-xs text-center ${isChanged ? 'border-primary bg-primary/5' : ''}`}
                                                        min={0}
                                                    />
                                                    <div
                                                        className="w-8 h-8 rounded-md flex-shrink-0 shadow-sm"
                                                        style={{
                                                            backgroundColor: `lab(${entry.color.labL}% ${entry.color.labA} ${entry.color.labB})`,
                                                        }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{entry.color.name}</p>
                                                        <p className="text-xs text-muted-foreground">{entry.color.colorId}</p>
                                                    </div>
                                                    {entry.pageNumber && (
                                                        <Badge variant="outline" className="text-xs">
                                                            #{entry.pageNumber}
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleRemoveColor(entry.colorId)}
                                                        disabled={removeColorMutation.isPending}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* 分页控件 */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between px-4 py-3 border-t">
                                            <p className="text-xs text-muted-foreground">
                                                第 {currentPage} / {totalPages} 页
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                                    <Palette className="h-10 w-10 mb-3 opacity-20" />
                                    <p className="text-sm">暂无色彩</p>
                                    <p className="text-xs">在上方搜索框中添加色彩</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
