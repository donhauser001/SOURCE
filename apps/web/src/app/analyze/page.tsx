/**
 * 工程分析页面（占位）
 *
 * v0.6.x 阶段实现
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { FileSearch, Upload, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
    title: '工程分析 | SOURCE',
    description: '上传工程色彩包，获取纸张推荐、风险识别、成本估算。',
};

export default function AnalyzePage() {
    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="container mx-auto px-4 py-16 max-w-4xl">
                    <div className="text-center space-y-6">
                        {/* 图标 */}
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <FileSearch className="w-10 h-10 text-primary" />
                        </div>

                        {/* 标题 */}
                        <div className="space-y-2">
                            <Badge variant="secondary" className="gap-1">
                                <Clock className="w-3 h-3" />
                                即将推出
                            </Badge>
                            <h1 className="text-3xl font-bold tracking-tight">工程色彩分析</h1>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                上传 .sourcepack.json 工程色彩包，系统自动解析用色、识别风险、推荐纸张。
                            </p>
                        </div>

                        {/* 功能预览 */}
                        <div className="grid md:grid-cols-3 gap-4 pt-8">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">颜色解析</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    自动识别工程中使用的 SOURCE 颜色，标注未验证颜色
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">风险识别</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    检测大色块、渐变、叠印等潜在印刷风险点
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">纸张推荐</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    基于规则引擎推荐 Top 3 纸张，每条建议都有据可查
                                </CardContent>
                            </Card>
                        </div>

                        {/* CTA */}
                        <div className="pt-8 space-y-4">
                            <div className="p-8 border-2 border-dashed rounded-xl bg-muted/30">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">
                                    上传功能将在 v0.6.x 版本中推出
                                </p>
                            </div>

                            <Button asChild variant="outline">
                                <Link href="/colors" className="gap-2">
                                    先浏览色彩库
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

