'use client';

/**
 * 内容创建页面
 *
 * 支持通过 URL 参数指定内容类型：
 * - /collab/create?type=work - 创建作品
 * - /collab/create?type=tutorial - 创建教程
 * - /collab/create?type=article - 创建文章
 */

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Palette, BookOpen, FileText } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/button';
import { ContentForm } from '@/components/collab/content-form';

const typeConfig = {
    work: {
        type: 'WORK' as const,
        icon: Palette,
        title: '发表作品',
        description: '分享您的色彩创作与设计作品',
    },
    tutorial: {
        type: 'TUTORIAL' as const,
        icon: BookOpen,
        title: '发布教程',
        description: '分享您的色彩知识与技巧',
    },
    article: {
        type: 'ARTICLE' as const,
        icon: FileText,
        title: '发表文章',
        description: '分享您的色彩见解与观点',
    },
};

function CreateContentPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { status } = useSession();

    const typeParam = searchParams.get('type') as keyof typeof typeConfig || 'work';
    const config = typeConfig[typeParam] || typeConfig.work;
    const Icon = config.icon;

    // 加载中
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">加载中...</div>
            </div>
        );
    }

    // 未登录跳转登录页
    if (status === 'unauthenticated') {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/collab/create?type=${typeParam}`)}`);
        return null;
    }

    const handleSuccess = (_data: { id: string }) => {
        router.push('/account/contents' as Route);
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* 顶部导航 */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={'/collab' as Route}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold">{config.title}</h1>
                                <p className="text-sm text-muted-foreground">{config.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 表单区域 */}
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <ContentForm
                    type={config.type}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    );
}

export default function CreateContentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">加载中...</div>
            </div>
        }>
            <CreateContentPageInner />
        </Suspense>
    );
}
