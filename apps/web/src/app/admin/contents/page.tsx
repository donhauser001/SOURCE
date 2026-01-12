'use client';

/**
 * 后台内容管理页面
 *
 * 管理所有用户发表的内容
 */

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
    Search,
    Eye,
    Star,
    Archive,
    RotateCcw,
    Loader2,
    ExternalLink,
    Palette,
    BookOpen,
    FileText,
    TrendingUp,
    Clock,
    CheckCircle,
    MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const typeIcons = {
    WORK: Palette,
    TUTORIAL: BookOpen,
    ARTICLE: FileText,
};

const statusVariants = {
    DRAFT: 'secondary',
    PENDING: 'outline',
    PUBLISHED: 'default',
    REJECTED: 'destructive',
    ARCHIVED: 'secondary',
} as const;

export default function AdminContentsPage() {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [featuredFilter, setFeaturedFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [featuredDialog, setFeaturedDialog] = useState<{ id: string; current: string } | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<string>('NONE');

    // 获取统计数据
    const { data: stats } = trpc.contentAdmin.stats.useQuery();

    // 获取内容列表
    const { data, isLoading, refetch } = trpc.contentAdmin.adminList.useQuery({
        status: statusFilter !== 'all' ? statusFilter as 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' : undefined,
        contentType: typeFilter !== 'all' ? typeFilter as 'WORK' | 'TUTORIAL' | 'ARTICLE' : undefined,
        featuredLevel: featuredFilter !== 'all' ? featuredFilter as 'NONE' | 'EDITOR_PICK' | 'HOMEPAGE' | 'HERO' : undefined,
        search: searchQuery || undefined,
        limit: 50,
    });

    // 设置推荐等级 mutation
    const setFeaturedMutation = trpc.contentAdmin.setFeatured.useMutation({
        onSuccess: () => {
            toast.success('推荐等级已更新');
            setFeaturedDialog(null);
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    // 归档 mutation
    const archiveMutation = trpc.contentAdmin.archive.useMutation({
        onSuccess: () => {
            toast.success('内容已归档');
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    // 恢复 mutation
    const restoreMutation = trpc.contentAdmin.restore.useMutation({
        onSuccess: () => {
            toast.success('内容已恢复');
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleSetFeatured = () => {
        if (featuredDialog && selectedLevel) {
            setFeaturedMutation.mutate({
                id: featuredDialog.id,
                level: selectedLevel as 'NONE' | 'EDITOR_PICK' | 'HOMEPAGE' | 'HERO',
            });
        }
    };

    const openFeaturedDialog = (id: string, current: string) => {
        setFeaturedDialog({ id, current });
        setSelectedLevel(current);
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">内容管理</h1>
                    <p className="text-muted-foreground mt-1">
                        管理所有用户发表的内容
                    </p>
                </div>
                <Button asChild>
                    <Link href={'/admin/content-review' as Route}>
                        <Clock className="h-4 w-4 mr-2" />
                        审核队列
                        {stats?.pending ? (
                            <Badge variant="secondary" className="ml-2">
                                {stats.pending}
                            </Badge>
                        ) : null}
                    </Link>
                </Button>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">总内容</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <p className="text-2xl font-bold">{stats?.total || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">待审核</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <p className="text-2xl font-bold text-orange-600">{stats?.pending || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">已发布</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <p className="text-2xl font-bold text-green-600">{stats?.byStatus?.PUBLISHED || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">今日发布</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <p className="text-2xl font-bold">{stats?.todayPublished || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">本周发布</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <p className="text-2xl font-bold">{stats?.weeklyPublished || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">推荐内容</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <p className="text-2xl font-bold text-purple-600">
                            {(stats?.byFeaturedLevel?.EDITOR_PICK || 0) + (stats?.byFeaturedLevel?.HOMEPAGE || 0) + (stats?.byFeaturedLevel?.HERO || 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 筛选栏 */}
            <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] max-w-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索标题、编号或作者..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="内容类型" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">所有类型</SelectItem>
                        <SelectItem value="WORK">作品</SelectItem>
                        <SelectItem value="TUTORIAL">教程</SelectItem>
                        <SelectItem value="ARTICLE">文章</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">所有状态</SelectItem>
                        <SelectItem value="DRAFT">草稿</SelectItem>
                        <SelectItem value="PENDING">待审核</SelectItem>
                        <SelectItem value="PUBLISHED">已发布</SelectItem>
                        <SelectItem value="REJECTED">已拒绝</SelectItem>
                        <SelectItem value="ARCHIVED">已归档</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="推荐等级" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">所有等级</SelectItem>
                        <SelectItem value="NONE">普通</SelectItem>
                        <SelectItem value="EDITOR_PICK">编辑推荐</SelectItem>
                        <SelectItem value="HOMEPAGE">首页推荐</SelectItem>
                        <SelectItem value="HERO">首焦图推荐</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 内容表格 */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">内容</TableHead>
                                    <TableHead>作者</TableHead>
                                    <TableHead>类型</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>推荐</TableHead>
                                    <TableHead>统计</TableHead>
                                    <TableHead>更新时间</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                            暂无内容
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.items.map((item) => {
                                        const Icon = typeIcons[item.contentType];
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                            {item.coverImageUrl ? (
                                                                <img
                                                                    src={item.coverImageUrl}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate">{item.title}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                {item.contentId}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                                            {item.author.name?.[0] || item.author.email?.[0] || '?'}
                                                        </div>
                                                        <span className="text-sm truncate max-w-[120px]">
                                                            {item.author.name || item.author.email}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{item.contentTypeLabel}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariants[item.status]}>
                                                        {item.statusLabel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {item.featuredLevel !== 'NONE' ? (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <Star className="h-3 w-3" />
                                                            {item.featuredLevelLabel}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="h-3.5 w-3.5" />
                                                            {item.viewCount}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="h-3.5 w-3.5" />
                                                            {item.likeCount}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(item.updatedAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {item.status === 'PUBLISHED' && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/collab/${item.id}` as Route} target="_blank">
                                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                                        查看详情
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {item.status === 'PENDING' && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/admin/content-review?id=${item.id}` as Route}>
                                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                                        去审核
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {item.status === 'PUBLISHED' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => openFeaturedDialog(item.id, item.featuredLevel)}
                                                                    >
                                                                        <Star className="h-4 w-4 mr-2" />
                                                                        设置推荐
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => archiveMutation.mutate({ id: item.id })}
                                                                    >
                                                                        <Archive className="h-4 w-4 mr-2" />
                                                                        归档
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {item.status === 'ARCHIVED' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => restoreMutation.mutate({ id: item.id })}
                                                                >
                                                                    <RotateCcw className="h-4 w-4 mr-2" />
                                                                    恢复
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* 设置推荐等级对话框 */}
            <Dialog open={!!featuredDialog} onOpenChange={() => setFeaturedDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>设置推荐等级</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>推荐等级</Label>
                            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">普通（无推荐）</SelectItem>
                                    <SelectItem value="EDITOR_PICK">编辑推荐</SelectItem>
                                    <SelectItem value="HOMEPAGE">首页推荐</SelectItem>
                                    <SelectItem value="HERO">首焦图推荐</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-2">
                                • 编辑推荐：显示在 ColLab 推荐选项卡中<br />
                                • 首页推荐：显示在网站首页<br />
                                • 首焦图推荐：显示在 ColLab 顶部轮播
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFeaturedDialog(null)}>
                            取消
                        </Button>
                        <Button
                            onClick={handleSetFeatured}
                            disabled={setFeaturedMutation.isPending}
                        >
                            {setFeaturedMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            确定
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
