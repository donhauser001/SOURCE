'use client';

import { FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ColorData } from '../types';

interface EvidenceTabProps {
    testReports: ColorData['testReports'];
}

export function EvidenceTab({ testReports }: EvidenceTabProps) {
    if (!testReports || testReports.length === 0) {
        return (
            <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
                <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-black/30" />
                    <p className="text-black/50">暂无测试报告</p>
                    <p className="text-sm mt-2 text-black/30">测试报告将在验证后发布</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
                <CardContent className="p-6 space-y-5">
                    {/* 标题区 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-black/70" />
                            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/70">
                                配方测试报告
                            </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-black/5 text-black/50">
                            {testReports.length} 份报告
                        </span>
                    </div>
                    <p className="text-xs text-black/40">摘要展示，每条结论都有实体验证支撑</p>

                    {/* 报告列表 */}
                    <div className="space-y-4">
                        {testReports.map((report) => (
                            <TestReportCard key={report.id} report={report} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// 测试报告卡片
function TestReportCard({ report }: { report: NonNullable<ColorData['testReports']>[number] }) {
    const getConclusionStyle = (level: string) => {
        switch (level) {
            case 'EXCELLENT': return 'bg-emerald-100 text-emerald-700';
            case 'GOOD': return 'bg-blue-100 text-blue-700';
            case 'ACCEPTABLE': return 'bg-amber-100 text-amber-700';
            case 'POOR': return 'bg-red-100 text-red-700';
            default: return 'bg-black/5 text-black/50';
        }
    };

    return (
        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5 space-y-4">
            {/* 头部 */}
            <div className="flex items-center justify-between">
                <code className="text-xs px-2 py-1 rounded-full bg-black/5 text-black/70 font-mono">
                    {report.reportId}
                </code>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getConclusionStyle(report.conclusionLevel)}`}>
                    {report.conclusionLevelLabel}
                </span>
            </div>

            {/* 数据网格 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                    <span className="text-xs text-black/40">测试机构</span>
                    <div className="text-black/90">{report.printerPartner}</div>
                </div>
                <div className="space-y-1">
                    <span className="text-xs text-black/40">测试日期</span>
                    <div className="text-black/90" suppressHydrationWarning>
                        {new Date(report.testDate).toLocaleDateString('zh-CN')}
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-xs text-black/40">测量设备</span>
                    <div className="text-black/90">{report.measurementDevice}</div>
                </div>
                {report.pressModel && (
                    <div className="space-y-1">
                        <span className="text-xs text-black/40">印刷机型</span>
                        <div className="text-black/90">{report.pressModel}</div>
                    </div>
                )}
            </div>

            {/* 分隔线 */}
            <div className="border-t border-black/5" />

            {/* 结论摘要 */}
            <div className="space-y-1">
                <span className="text-xs text-black/40">结论摘要</span>
                <p className="text-sm text-black/70">{report.summary}</p>
            </div>

            {/* 链接 */}
            {report.collabLink && (
                <a
                    href={report.collabLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black transition-colors"
                >
                    查看完整报告
                    <ExternalLink className="h-3 w-3" />
                </a>
            )}
        </div>
    );
}
