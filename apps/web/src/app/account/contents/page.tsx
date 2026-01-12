'use client';

/**
 * 我的发表页面
 *
 * 展示用户发表的所有内容，支持筛选和操作
 */

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
    Plus,
    Edit,
    Trash2,
    Send,
    Palette,
    BookOpen,
    FileText,
    Star,
    Eye,
    ThumbsUp,
    Loader2,
    MoreHorizontal,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { labToRgb } from '@/lib/color';

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

export default function MyContentsPage() {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // 获取内容列表
    const { data, isLoading, refetch } = trpc.content.myContents.useQuery({
        status: statusFilter !== 'all' ? statusFilter as 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' : undefined,
        contentType: typeFilter !== 'all' ? typeFilter as 'WORK' | 'TUTORIAL' | 'ARTICLE' : undefined,
        limit: 50,
    });

    // 删除 mutation
    const deleteMutation = trpc.content.delete.useMutation({
        onSuccess: () => {
            toast.success('内容已删除');
            setDeleteId(null);
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    // 提交审核 mutation
    const submitMutation = trpc.content.submit.useMutation({
        onSuccess: () => {
            toast.success('已提交审核');
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleDelete = () => {
        if (deleteId) {
            deleteMutation.mutate({ id: deleteId });
        }
    };

    const handleSubmit = (id: string) => {
        submitMutation.mutate({ id });
    };

    return (
        <div className="space-y-6">
            {/* 页面标题和操作 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">我的发表</h1>
                    <p className="text-muted-foreground mt-1">
                        管理您发表的作品、教程和文章
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            发表内容
                            <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={'/collab/create?type=work' as Route} className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                发表作品
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={'/collab/create?type=tutorial' as Route} className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                发布教程
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={'/collab/create?type=article' as Route} className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                发表文章
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* 筛选栏 */}
            <div className="flex gap-3 flex-wrap">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="所有类型" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">所有类型</SelectItem>
                        <SelectItem value="WORK">作品</SelectItem>
                        <SelectItem value="TUTORIAL">教程</SelectItem>
                        <SelectItem value="ARTICLE">文章</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="所有状态" />
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
            </div>

            {/* 内容列表 */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : data?.items.length === 0 ? (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">暂无内容</h3>
                        <p className="text-muted-foreground mb-4">
                            开始创作您的第一篇内容吧
                        </p>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    开始创作
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem asChild>
                                    <Link href={'/collab/create?type=work' as Route}>发表作品</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={'/collab/create?type=tutorial' as Route}>发布教程</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={'/collab/create?type=article' as Route}>发表文章</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {data?.items.map((item) => {
                        const Icon = typeIcons[item.contentType];
                        return (
                            <Card key={item.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex gap-4 p-4">
                                        {/* 封面图 */}
                                        <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                            {item.coverImageUrl ? (
                                                <img
                                                    src={item.coverImageUrl}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Icon className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* 内容信息 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant={statusVariants[item.status]}>
                                                            {item.statusLabel}
                                                        </Badge>
                                                        {item.featuredLevel !== 'NONE' && (
                                                            <Badge variant="outline" className="gap-1">
                                                                <Star className="h-3 w-3" />
                                                                {item.featuredLevelLabel}
                                                            </Badge>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.contentTypeLabel}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-medium truncate">{item.title}</h3>
                                                    {item.summary && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                            {item.summary}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* 操作菜单 */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {item.status === 'PUBLISHED' && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/collab/${item.id}` as Route}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    查看
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {item.canEdit && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/collab/edit/${item.id}` as Route}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    编辑
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {item.canSubmit && (
                                                            <DropdownMenuItem onClick={() => handleSubmit(item.id)}>
                                                                <Send className="h-4 w-4 mr-2" />
                                                                提交审核
                                                            </DropdownMenuItem>
                                                        )}
                                                        {item.canDelete && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => setDeleteId(item.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    删除
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* 统计和色彩 */}
                                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                                {item.status === 'PUBLISHED' && (
                                                    <>
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="h-3.5 w-3.5" />
                                                            {item.viewCount}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <ThumbsUp className="h-3.5 w-3.5" />
                                                            {item.likeCount}
                                                        </span>
                                                    </>
                                                )}

                                                {/* 关联色彩预览 */}
                                                {item.colors.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        {item.colors.slice(0, 5).map((c) => {
                                                            const rgbStr = labToRgb(c.color.labL, c.color.labA, c.color.labB);
                                                            return (
                                                                <span
                                                                    key={c.color.id}
                                                                    className="w-4 h-4 rounded-full border"
                                                                    style={{ backgroundColor: rgbStr }}
                                                                    title={c.color.name}
                                                                />
                                                            );
                                                        })}
                                                        {item._count.colors > 5 && (
                                                            <span className="text-xs">+{item._count.colors - 5}</span>
                                                        )}
                                                    </div>
                                                )}

                                                <span className="ml-auto">
                                                    {new Date(item.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* 拒绝原因 */}
                                            {item.status === 'REJECTED' && item.rejectReason && (
                                                <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
                                                    拒绝原因：{item.rejectReason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* 删除确认对话框 */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            删除后将无法恢复，确定要删除这篇内容吗？
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
