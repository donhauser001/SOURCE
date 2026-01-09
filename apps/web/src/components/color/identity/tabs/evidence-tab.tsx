'use client';

import { FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useViewMode } from '../view-mode-context';
import { getConclusionVariant } from '../utils';
import type { ColorData } from '../types';

interface EvidenceTabProps {
    testReports: ColorData['testReports'];
}

export function EvidenceTab({ testReports }: EvidenceTabProps) {
    const { isDark } = useViewMode();

    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none",
        isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
    );

    if (!testReports || testReports.length === 0) {
        return (
            <Card className={cardStyle}>
                <CardContent className="py-12 text-center opacity-50">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>暂无测试报告</p>
                    <p className="text-sm mt-2">测试报告将在验证后发布</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className={cardStyle}>
                <CardHeader>
                    <CardTitle className={cn(
                        "flex items-center gap-2",
                        isDark ? "text-white" : "text-black"
                    )}>
                        <FileText className="h-5 w-5" />
                        配方测试报告
                    </CardTitle>
                    <CardDescription className={isDark ? "text-white/40" : "text-black/40"}>摘要展示，每条结论都有实体验证支撑</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {testReports.map((report) => (
                            <TestReportCard key={report.id} report={report} isDark={isDark} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// 测试报告卡片
function TestReportCard({ report, isDark }: { report: NonNullable<ColorData['testReports']>[number]; isDark: boolean }) {
    return (
        <Card className={cn(
            "border-0 shadow-none",
            isDark ? "bg-white/5" : "bg-black/5"
        )}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <code className={cn(
                        "text-xs px-2 py-1 rounded",
                        isDark ? "bg-white/10 text-white/70" : "bg-black/5 text-black/70"
                    )}>{report.reportId}</code>
                    <Badge variant={getConclusionVariant(report.conclusionLevel) as 'success' | 'warning' | 'destructive' | 'secondary'}>
                        {report.conclusionLevelLabel}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className={isDark ? "text-white/40" : "text-black/40"}>测试机构</span>
                        <div className={isDark ? "text-white/90" : "text-black/90"}>{report.printerPartner}</div>
                    </div>
                    <div>
                        <span className={isDark ? "text-white/40" : "text-black/40"}>测试日期</span>
                        <div className={isDark ? "text-white/90" : "text-black/90"} suppressHydrationWarning>
                            {new Date(report.testDate).toLocaleDateString('zh-CN')}
                        </div>
                    </div>
                    <div>
                        <span className={isDark ? "text-white/40" : "text-black/40"}>测量设备</span>
                        <div className={isDark ? "text-white/90" : "text-black/90"}>{report.measurementDevice}</div>
                    </div>
                    {report.pressModel && (
                        <div>
                            <span className={isDark ? "text-white/40" : "text-black/40"}>印刷机型</span>
                            <div className={isDark ? "text-white/90" : "text-black/90"}>{report.pressModel}</div>
                        </div>
                    )}
                </div>
                <Separator className={isDark ? "bg-white/10" : "bg-black/10"} />
                <div>
                    <span className={isDark ? "text-white/40" : "text-black/40"}>结论摘要</span>
                    <p className={cn("mt-1", isDark ? "text-white/80" : "text-black/80")}>{report.summary}</p>
                </div>
                {report.collabLink && (
                    <div className="pt-2">
                        <a
                            href={report.collabLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "hover:underline inline-flex items-center gap-1",
                                isDark ? "text-cyan-400" : "text-cyan-600"
                            )}
                        >
                            查看完整报告
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
