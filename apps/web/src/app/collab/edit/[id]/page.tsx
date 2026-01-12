'use client';

/**
 * 内容编辑页面
 *
 * 只有草稿和已拒绝状态的内容可以编辑
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Palette, BookOpen, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContentForm } from '@/components/collab/content-form';
import { trpc } from '@/lib/trpc';
import { ContentTypeLabels } from '@/lib/validations/content';

const typeIcons = {
    WORK: Palette,
    TUTORIAL: BookOpen,
    ARTICLE: FileText,
};

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { status } = useSession();

    // 获取内容详情
    const { data: content, isLoading, error } = trpc.content.getMyContent.useQuery(
        { id },
        { enabled: status === 'authenticated' }
    );

    // 提交审核 mutation
    const submitMutation = trpc.content.submit.useMutation();

    // 加载中
    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">加载中...</div>
            </div>
        );
    }

    // 未登录跳转登录页
    if (status === 'unauthenticated') {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/collab/edit/${id}`)}`);
        return null;
    }

    // 错误处理
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-destructive">内容不存在或无权限访问</p>
                    <Button variant="outline" onClick={() => router.back()}>
                        返回
                    </Button>
                </div>
            </div>
        );
    }

    // 检查是否可编辑
    if (content && !content.canEdit) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-destructive">
                        当前状态（{content.statusLabel}）不允许编辑
                    </p>
                    <Button variant="outline" onClick={() => router.back()}>
                        返回
                    </Button>
                </div>
            </div>
        );
    }

    if (!content) return null;

    const Icon = typeIcons[content.contentType];

    const handleSuccess = () => {
        router.push('/account/contents' as Route);
    };

    // 处理提交审核
    const handleSubmit = async () => {
        try {
            await submitMutation.mutateAsync({ id: content.id });
            router.push('/account/contents' as Route);
        } catch {
            // 错误会在 mutation 中处理
        }
    };

    // 准备初始数据
    const initialData = {
        id: content.id,
        title: content.title,
        summary: content.summary,
        body: content.body,
        coverImageUrl: content.coverImageUrl,
        galleryImages: content.galleryImages,
        externalUrl: content.externalUrl,
        categoryId: content.categoryId,
        tags: content.tags,
        colorIds: content.colors.map(c => c.color.id),
        colorBookId: content.colorBookId,
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* 顶部导航 */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={'/account/contents' as Route}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-lg font-semibold">
                                            编辑{ContentTypeLabels[content.contentType]}
                                        </h1>
                                        <Badge variant={content.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                            {content.statusLabel}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-mono">
                                        {content.contentId}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 提交审核按钮 */}
                        {content.canSubmit && (
                            <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                                提交审核
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* 拒绝原因提示 */}
            {content.status === 'REJECTED' && content.rejectReason && (
                <div className="container mx-auto px-4 pt-4 max-w-3xl">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>拒绝原因：</strong>{content.rejectReason}
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* 表单区域 */}
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <ContentForm
                    type={content.contentType}
                    initialData={initialData}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    );
}
