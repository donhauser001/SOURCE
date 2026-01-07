/**
 * 色彩页面加载状态
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ColorLoading() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 骨架屏 */}
                <div className="animate-pulse space-y-8">
                    {/* 头部 */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-32 h-32 bg-muted rounded-2xl" />
                        <div className="flex-1 space-y-4">
                            <div className="h-8 bg-muted rounded w-48" />
                            <div className="h-5 bg-muted rounded w-32" />
                            <div className="flex gap-4">
                                <div className="h-4 bg-muted rounded w-16" />
                                <div className="h-4 bg-muted rounded w-16" />
                                <div className="h-4 bg-muted rounded w-16" />
                            </div>
                        </div>
                    </div>

                    {/* 内容区域 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="h-6 bg-muted rounded w-24" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div key={i} className="h-9 bg-muted rounded w-20" />
                                            ))}
                                        </div>
                                        <div className="h-48 bg-muted rounded" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="h-6 bg-muted rounded w-20" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex justify-between">
                                            <div className="h-4 bg-muted rounded w-20" />
                                            <div className="h-4 bg-muted rounded w-24" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="h-6 bg-muted rounded w-20" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="h-4 bg-muted rounded w-full" />
                                            <div className="h-2 bg-muted rounded w-full" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

