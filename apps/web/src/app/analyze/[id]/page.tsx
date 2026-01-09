/**
 * 分析报告详情页面
 *
 * /analyze/[id]
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FileSearch, ArrowLeft, Download, Share2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SiteHeader } from '@/components/site-header';
import { auth } from '@/lib/auth';
import { getReport } from '@/lib/analyze/report-service';
import {
    ReportSummarySection,
    RisksSection,
    RecommendationsSection,
    AvoidSection,
    ColorListSection,
} from '@/components/analyze/report-sections';
import { ReportActions } from './report-actions';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const report = await getReport(id);

    if (!report) {
        return {
            title: '报告不存在 | SOURCE',
        };
    }

    return {
        title: `${report.summary.docInfo.name} - 分析报告 | SOURCE`,
        description: `SOURCE 工程色彩分析报告：${report.summary.colorStats.total} 个颜色，${report.recommendations.length} 个纸张推荐`,
    };
}

export default async function AnalysisReportPage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();
    const report = await getReport(id);

    if (!report) {
        notFound();
    }

    // 判断用户权限等级
    const userTier = (session?.user as { tier?: string })?.tier || 'FREE';
    const isPaid = userTier === 'PAID' || userTier === 'VERIFIED';

    // 计算剩余有效期
    const expiresAt = new Date(report.expiresAt);
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="container mx-auto px-4 py-8 max-w-5xl">
                    {/* 页面头部 */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Link href="/analyze" className="hover:text-foreground flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" />
                                返回分析
                            </Link>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileSearch className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">
                                        {report.summary.docInfo.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <Badge variant="secondary">
                                            {report.summary.colorStats.total} 个颜色
                                        </Badge>
                                        <Badge variant="outline">
                                            {report.recommendations.length} 个推荐
                                        </Badge>
                                        {report.risks.length > 0 && (
                                            <Badge variant="destructive">
                                                {report.risks.length} 个风险
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {daysRemaining > 0 ? `${daysRemaining} 天后过期` : '即将过期'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <ReportActions reportId={id} reportData={report} />
                        </div>
                    </div>

                    {/* 付费提示（免费用户） */}
                    {!isPaid && (
                        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-800 dark:text-amber-200">
                                        部分内容需要升级查看
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                        风险缓解建议、详细注意事项等内容为付费功能。
                                        <Link href="/activate" className="underline ml-1">
                                            激活升级
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 报告内容 */}
                    <div className="space-y-6">
                        {/* 摘要 */}
                        <ReportSummarySection
                            summary={report.summary}
                            printIntent={report.printIntent}
                        />

                        {/* 风险识别 */}
                        <RisksSection risks={report.risks} isPaid={isPaid} />

                        {/* 纸张推荐 */}
                        <RecommendationsSection
                            recommendations={report.recommendations}
                            isPaid={isPaid}
                        />

                        {/* 避坑提醒 */}
                        <AvoidSection avoidList={report.avoidList} />

                        {/* 颜色清单 */}
                        <ColorListSection colors={report.colorAnalysis} isPaid={isPaid} />
                    </div>

                    {/* 底部操作 */}
                    <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row justify-center gap-4">
                        <Button asChild variant="outline">
                            <Link href="/analyze">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                新建分析
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/colors">
                                浏览色彩库
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
        </>
    );
}
