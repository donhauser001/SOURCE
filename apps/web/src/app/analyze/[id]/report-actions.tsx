'use client';

/**
 * 报告操作组件
 *
 * 包含：分享、导出 JSON、复制链接
 */

import { useState } from 'react';
import { Download, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AnalysisReportData } from '@/lib/analyze/report-service';

interface ReportActionsProps {
    reportId: string;
    reportData: AnalysisReportData;
}

export function ReportActions({ reportId, reportData }: ReportActionsProps) {
    const [copied, setCopied] = useState(false);
    const [exporting, setExporting] = useState(false);

    // 复制报告链接
    const handleCopyLink = async () => {
        const url = `${window.location.origin}/analyze/${reportId}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 导出 JSON
    const handleExportJSON = () => {
        setExporting(true);
        try {
            const exportData = {
                ...reportData,
                exportedAt: new Date().toISOString(),
                source: 'SOURCE - 实体印刷色彩实操体系',
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportData.summary.docInfo.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}-分析报告.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    // 导出摘要文本
    const handleExportSummary = () => {
        const summary = generateTextSummary(reportData);
        const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportData.summary.docInfo.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}-分析摘要.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex items-center gap-2">
            {/* 复制链接 */}
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? (
                    <>
                        <Check className="w-4 h-4 mr-2" />
                        已复制
                    </>
                ) : (
                    <>
                        <Copy className="w-4 h-4 mr-2" />
                        复制链接
                    </>
                )}
            </Button>

            {/* 导出下拉菜单 */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={exporting}>
                        {exporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        导出
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportJSON}>
                        导出完整报告 (JSON)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportSummary}>
                        导出分析摘要 (TXT)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

/**
 * 生成文本摘要
 */
function generateTextSummary(report: AnalysisReportData): string {
    const paperTypeNames: Record<string, string> = {
        PREMIUM_MATTE: '高阶映画',
        COATED: '铜版纸',
        UNCOATED: '纯质纸',
        OFFSET: '双胶纸',
        LIGHTWEIGHT: '轻型纸',
    };

    const lines: string[] = [
        '═══════════════════════════════════════════════════════════════',
        '                    SOURCE 工程色彩分析报告',
        '═══════════════════════════════════════════════════════════════',
        '',
        `文档名称：${report.summary.docInfo.name}`,
        `分析时间：${new Date(report.createdAt).toLocaleString('zh-CN')}`,
        `报告 ID：${report.id}`,
        '',
        '───────────────────────────────────────────────────────────────',
        '                         颜色统计',
        '───────────────────────────────────────────────────────────────',
        `总颜色数：${report.summary.colorStats.total}`,
        `已验证：${report.summary.colorStats.verified}`,
        `未映射：${report.summary.colorStats.unmapped}`,
        `有风险：${report.summary.colorStats.withRisks}`,
        '',
    ];

    // 风险部分
    if (report.risks.length > 0) {
        lines.push('───────────────────────────────────────────────────────────────');
        lines.push('                         风险识别');
        lines.push('───────────────────────────────────────────────────────────────');
        for (const risk of report.risks) {
            lines.push(`【${risk.severity === 'high' ? '高风险' : risk.severity === 'medium' ? '中风险' : '低风险'}】${risk.type}`);
            lines.push(`  说明：${risk.description}`);
            lines.push(`  建议：${risk.mitigation}`);
            lines.push(`  影响颜色：${risk.affectedColors.join(', ')}`);
            lines.push('');
        }
    }

    // 推荐部分
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                         纸张推荐');
    lines.push('───────────────────────────────────────────────────────────────');
    for (let i = 0; i < report.recommendations.length; i++) {
        const rec = report.recommendations[i];
        lines.push(`#${i + 1} ${paperTypeNames[rec.paperType]} - ${rec.totalScore}分`);
        lines.push(`   还原度：${rec.dimensionScores.fidelity} | 风险：${rec.dimensionScores.risk} | 成本：${rec.dimensionScores.cost} | 适用：${rec.dimensionScores.suitability}`);
        if (rec.reasons.length > 0) {
            lines.push(`   推荐理由：${rec.reasons.join('；')}`);
        }
        if (rec.cautions.length > 0) {
            lines.push(`   注意事项：${rec.cautions.join('；')}`);
        }
        lines.push('');
    }

    // 避坑部分
    if (report.avoidList.length > 0) {
        lines.push('───────────────────────────────────────────────────────────────');
        lines.push('                         避坑提醒');
        lines.push('───────────────────────────────────────────────────────────────');
        for (const item of report.avoidList) {
            lines.push(`⚠ ${paperTypeNames[item.paperType]}：${item.reasons.join('；')}`);
        }
        lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                     由 SOURCE 生成');
    lines.push('              https://source.ink');
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
}
