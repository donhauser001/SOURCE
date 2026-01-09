'use client';

/**
 * 新建色彩簿页面 - 两栏布局
 * 左侧：色彩簿基本信息表单
 * 右侧：预先选择要添加的色彩
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, X, Search, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ColorBookForm } from '@/components/admin/color-book-form';
import { trpc } from '@/lib/trpc';

export default function NewColorBookPage() {
    const router = useRouter();
    const [colorSearch, setColorSearch] = useState('');
    const [selectedColors, setSelectedColors] = useState<Array<{
        id: string;
        colorId: string;
        name: string;
        labL: number;
        labA: number;
        labB: number;
    }>>([]);

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

    // 添加色彩的 mutation
    const addColorsMutation = trpc.colorBook.addColors.useMutation();

    // 已选择的色彩 ID 集合
    const selectedColorIds = useMemo(() => new Set(selectedColors.map((c) => c.id)), [selectedColors]);

    // 过滤掉已选择的色彩
    const availableSearchResults = useMemo(() => {
        return searchResults.filter((c) => !selectedColorIds.has(c.id));
    }, [searchResults, selectedColorIds]);

    // 最新可选择的色彩
    const availableRecentColors = useMemo(() => {
        return recentColors.filter((c) => !selectedColorIds.has(c.id)).slice(0, 10);
    }, [recentColors, selectedColorIds]);

    const handleAddColor = (color: typeof recentColors[0]) => {
        setSelectedColors((prev) => [...prev, {
            id: color.id,
            colorId: color.colorId,
            name: color.name,
            labL: color.labL,
            labA: color.labA,
            labB: color.labB,
        }]);
        setColorSearch('');
    };

    const handleRemoveColor = (colorId: string) => {
        setSelectedColors((prev) => prev.filter((c) => c.id !== colorId));
    };

    // 创建成功后，添加已选择的色彩
    const handleCreateSuccess = async (colorBookId: string) => {
        if (selectedColors.length > 0) {
            // 添加选中的色彩
            await addColorsMutation.mutateAsync({
                colorBookId,
                colors: selectedColors.map((c, index) => ({
                    colorId: c.id,
                    order: index,
                })),
            });
        }
        // 跳转到编辑页面
        router.push(`/admin/color-books/${colorBookId}`);
    };

    return (
        <div className="space-y-6">
            <Link href="/admin/color-books">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>

            {/* 两栏布局 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：色彩簿信息表单 */}
                <div className="space-y-6">
                    <ColorBookForm onCreateSuccess={handleCreateSuccess} />
                </div>

                {/* 右侧：色彩选择 */}
                <div className="space-y-4">
                    {/* 色彩搜索添加 */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                选择色彩
                            </CardTitle>
                            <CardDescription>
                                预先选择要添加到色彩簿的色彩
                            </CardDescription>
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
                                                onClick={() => handleAddColor(color)}
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
                                        搜索结果都已选择
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        没有找到匹配的色彩
                                    </div>
                                )
                            ) : (
                                // 默认显示最新颜色 - 卡片式
                                isLoadingRecent ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                        加载中...
                                    </div>
                                ) : availableRecentColors.length > 0 ? (
                                    <>
                                        <p className="text-xs text-muted-foreground mb-2">最新色彩（点击选择）</p>
                                        <div className="grid grid-cols-10 gap-1.5">
                                            {availableRecentColors.map((color) => (
                                                <button
                                                    key={color.id}
                                                    className="aspect-square rounded-lg cursor-pointer hover:scale-110 hover:z-10 transition-transform relative group flex flex-col items-center justify-center p-1.5"
                                                    onClick={() => handleAddColor(color)}
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
                                        没有可选择的色彩
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* 已选择的色彩列表 */}
                    <Card className="flex-1">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    已选择
                                </CardTitle>
                                <Badge variant="secondary">{selectedColors.length} 色</Badge>
                            </div>
                            <CardDescription>
                                这些色彩将在创建后自动添加到色彩簿
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {selectedColors.length > 0 ? (
                                <div className="divide-y">
                                    {selectedColors.map((color, index) => (
                                        <div
                                            key={color.id}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 group"
                                        >
                                            <span className="text-xs text-muted-foreground w-6 text-right">
                                                {index + 1}
                                            </span>
                                            <div
                                                className="w-8 h-8 rounded-md flex-shrink-0 shadow-sm"
                                                style={{
                                                    backgroundColor: `lab(${color.labL}% ${color.labA} ${color.labB})`,
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{color.name}</p>
                                                <p className="text-xs text-muted-foreground">{color.colorId}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveColor(color.id)}
                                            >
                                                <X className="h-3.5 w-3.5 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                                    <Palette className="h-10 w-10 mb-3 opacity-20" />
                                    <p className="text-sm">暂未选择色彩</p>
                                    <p className="text-xs">在上方搜索框中选择色彩</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
