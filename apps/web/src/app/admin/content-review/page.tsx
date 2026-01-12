'use client';

/**
 * 后台审核队列页面
 *
 * 审核用户提交的内容
 */

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
    CheckCircle,
    XCircle,
    RotateCcw,
    Loader2,
    Palette,
    BookOpen,
    FileText,
    User,
    Calendar,
    ChevronLeft,
    MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { ContentTypeLabels, ReviewActionLabels } from '@/lib/validations/content';
import { labToRgb } from '@/lib/color';

const typeIcons = {
    WORK: Palette,
    TUTORIAL: BookOpen,
    ARTICLE: FileText,
};

export default function ContentReviewPage() {
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [selectedContent, setSelectedContent] = useState<string | null>(null);
    const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGE' | null>(null);
    const [reviewReason, setReviewReason] = useState('');
    const [reviewNote, setReviewNote] = useState('');

    // 获取待审核列表
    const { data, isLoading, refetch } = trpc.contentAdmin.pendingList.useQuery({
        contentType: typeFilter !== 'all' ? typeFilter as 'WORK' | 'TUTORIAL' | 'ARTICLE' : undefined,
        limit: 50,
    });

    // 获取内容详情
    const { data: contentDetail, isLoading: isLoadingDetail } = trpc.contentAdmin.getContent.useQuery(
        { id: selectedContent! },
        { enabled: !!selectedContent }
    );

    // 审核 mutation
    const reviewMutation = trpc.contentAdmin.review.useMutation({
        onSuccess: (_, variables) => {
            const actionLabel = ReviewActionLabels[variables.action];
            toast.success(`内容已${actionLabel}`);
            setReviewAction(null);
            setReviewReason('');
            setReviewNote('');
            refetch();
            // 如果列表只有一个，清除选中
            if (data?.items.length === 1) {
                setSelectedContent(null);
            } else {
                // 选择下一个
                const currentIndex = data?.items.findIndex(i => i.id === selectedContent) || 0;
                const nextItem = data?.items[currentIndex + 1] || data?.items[0];
                if (nextItem && nextItem.id !== selectedContent) {
                    setSelectedContent(nextItem.id);
                }
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleReview = () => {
        if (!selectedContent || !reviewAction) return;

        if ((reviewAction === 'REJECT' || reviewAction === 'REQUEST_CHANGE') && !reviewReason.trim()) {
            toast.error('请填写原因');
            return;
        }

        reviewMutation.mutate({
            id: selectedContent,
            action: reviewAction,
            reason: reviewReason || undefined,
            note: reviewNote || undefined,
        });
    };

    const openReviewDialog = (action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGE') => {
        setReviewAction(action);
        setReviewReason('');
        setReviewNote('');
    };

    // 快速操作按钮
    const QuickActions = () => (
        <div className="flex gap-2">
            <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => openReviewDialog('APPROVE')}
                disabled={!selectedContent}
            >
                <CheckCircle className="h-4 w-4 mr-2" />
                通过
            </Button>
            <Button
                variant="outline"
                onClick={() => openReviewDialog('REQUEST_CHANGE')}
                disabled={!selectedContent}
            >
                <RotateCcw className="h-4 w-4 mr-2" />
                退回修改
            </Button>
            <Button
                variant="destructive"
                onClick={() => openReviewDialog('REJECT')}
                disabled={!selectedContent}
            >
                <XCircle className="h-4 w-4 mr-2" />
                拒绝
            </Button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">审核队列</h1>
                    <p className="text-muted-foreground mt-1">
                        共 {data?.stats.total || 0} 条待审核内容
                        {data?.stats.byType && (
                            <span className="ml-2">
                                （作品 {data.stats.byType.WORK}，
                                教程 {data.stats.byType.TUTORIAL}，
                                文章 {data.stats.byType.ARTICLE}）
                            </span>
                        )}
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href={'/admin/contents' as Route}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        返回内容管理
                    </Link>
                </Button>
            </div>

            {/* 筛选栏 */}
            <div className="flex items-center gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="所有类型" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">所有类型</SelectItem>
                        <SelectItem value="WORK">作品</SelectItem>
                        <SelectItem value="TUTORIAL">教程</SelectItem>
                        <SelectItem value="ARTICLE">文章</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : data?.items.length === 0 ? (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-medium mb-2">暂无待审核内容</h3>
                        <p className="text-muted-foreground">
                            所有内容都已审核完毕
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid lg:grid-cols-[350px_1fr] gap-6">
                    {/* 左侧列表 */}
                    <div className="space-y-2">
                        {data?.items.map((item) => {
                            const Icon = typeIcons[item.contentType];
                            const isSelected = selectedContent === item.id;
                            return (
                                <Card
                                    key={item.id}
                                    className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                                        }`}
                                    onClick={() => setSelectedContent(item.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex gap-3">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                {item.coverImageUrl ? (
                                                    <img
                                                        src={item.coverImageUrl}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Icon className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {ContentTypeLabels[item.contentType]}
                                                    </Badge>
                                                </div>
                                                <h4 className="font-medium truncate text-sm">{item.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {item.author.name || item.author.email}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* 右侧详情 */}
                    <div className="space-y-4">
                        {!selectedContent ? (
                            <Card className="py-12">
                                <CardContent className="text-center text-muted-foreground">
                                    点击左侧列表选择要审核的内容
                                </CardContent>
                            </Card>
                        ) : isLoadingDetail ? (
                            <Card className="py-12">
                                <CardContent className="text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </CardContent>
                            </Card>
                        ) : contentDetail ? (
                            <>
                                {/* 操作按钮 */}
                                <Card>
                                    <CardContent className="py-4">
                                        <QuickActions />
                                    </CardContent>
                                </Card>

                                {/* 内容详情 */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle>{contentDetail.title}</CardTitle>
                                                <CardDescription className="mt-1 font-mono">
                                                    {contentDetail.contentId}
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline">
                                                {contentDetail.contentTypeLabel}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* 作者信息 */}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {contentDetail.author.name || contentDetail.author.email}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(contentDetail.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* 封面图 */}
                                        {contentDetail.coverImageUrl && (
                                            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                                                <img
                                                    src={contentDetail.coverImageUrl}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* 摘要 */}
                                        {contentDetail.summary && (
                                            <div>
                                                <Label className="text-muted-foreground">摘要</Label>
                                                <p className="mt-1">{contentDetail.summary}</p>
                                            </div>
                                        )}

                                        {/* 正文预览 */}
                                        {contentDetail.body && (
                                            <div>
                                                <Label className="text-muted-foreground">正文预览</Label>
                                                <div className="mt-1 prose prose-sm max-w-none max-h-[300px] overflow-y-auto p-4 rounded-lg bg-muted/50">
                                                    <pre className="whitespace-pre-wrap font-sans">
                                                        {contentDetail.body.slice(0, 1000)}
                                                        {contentDetail.body.length > 1000 && '...'}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}

                                        {/* 关联色彩 */}
                                        {contentDetail.colors.length > 0 && (
                                            <div>
                                                <Label className="text-muted-foreground">关联色彩</Label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {contentDetail.colors.map((c) => {
                                                        const rgbStr = labToRgb(c.color.labL, c.color.labA, c.color.labB);
                                                        return (
                                                            <Badge
                                                                key={c.color.id}
                                                                variant="outline"
                                                                className="gap-2"
                                                            >
                                                                <span
                                                                    className="w-4 h-4 rounded-full border"
                                                                    style={{ backgroundColor: rgbStr }}
                                                                />
                                                                {c.color.colorId}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* 色彩簿 */}
                                        {contentDetail.colorBook && (
                                            <div>
                                                <Label className="text-muted-foreground">关联色彩簿</Label>
                                                <p className="mt-1">
                                                    {contentDetail.colorBook.name}
                                                    <span className="text-muted-foreground ml-2 font-mono text-sm">
                                                        ({contentDetail.colorBook.bookId})
                                                    </span>
                                                </p>
                                            </div>
                                        )}

                                        {/* 标签 */}
                                        {contentDetail.tags.length > 0 && (
                                            <div>
                                                <Label className="text-muted-foreground">标签</Label>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {contentDetail.tags.map((tag) => (
                                                        <Badge key={tag} variant="secondary">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* 审核历史 */}
                                {contentDetail.reviews.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">审核历史</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {contentDetail.reviews.map((review) => (
                                                    <div
                                                        key={review.id}
                                                        className="flex items-start gap-3 text-sm"
                                                    >
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">
                                                                    {review.actionLabel}
                                                                </Badge>
                                                                <span className="text-muted-foreground">
                                                                    {review.reviewer.name || review.reviewer.email}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {new Date(review.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {review.reason && (
                                                                <p className="mt-1 text-muted-foreground">
                                                                    原因：{review.reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            )}

            {/* 审核对话框 */}
            <Dialog open={!!reviewAction} onOpenChange={() => setReviewAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {reviewAction === 'APPROVE' && '确认通过'}
                            {reviewAction === 'REJECT' && '拒绝内容'}
                            {reviewAction === 'REQUEST_CHANGE' && '退回修改'}
                        </DialogTitle>
                        <DialogDescription>
                            {reviewAction === 'APPROVE' && '通过后内容将立即发布'}
                            {reviewAction === 'REJECT' && '请填写拒绝原因，作者将收到通知'}
                            {reviewAction === 'REQUEST_CHANGE' && '请说明需要修改的内容，作者将收到通知'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {(reviewAction === 'REJECT' || reviewAction === 'REQUEST_CHANGE') && (
                            <div className="space-y-2">
                                <Label>
                                    原因 <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    placeholder={
                                        reviewAction === 'REJECT'
                                            ? '请说明拒绝的原因...'
                                            : '请说明需要修改的内容...'
                                    }
                                    value={reviewReason}
                                    onChange={(e) => setReviewReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>内部备注（可选）</Label>
                            <Textarea
                                placeholder="仅管理员可见的备注..."
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewAction(null)}>
                            取消
                        </Button>
                        <Button
                            onClick={handleReview}
                            disabled={reviewMutation.isPending}
                            variant={reviewAction === 'REJECT' ? 'destructive' : 'default'}
                            className={reviewAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            {reviewMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            确认
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
