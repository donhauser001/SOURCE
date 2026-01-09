'use client';

/**
 * 分析报告各区块组件
 *
 * 包含：
 * - 摘要卡片
 * - 风险区块
 * - 推荐区块
 * - 避坑区块
 * - 证据链区块
 */

import { useState } from 'react';
import Link from 'next/link';
import {
    FileText,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Sparkles,
    ShieldAlert,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Star,
    TrendingUp,
    Palette,
    Lock,
    Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { RiskItem, PaperRecommendationItem, AvoidItem } from '@/lib/analyze/recommendation-engine';
import type { MappedColorItem } from '@/lib/analyze/parser';
import type { DocInfo, PrintIntent, ColorRiskTag } from '@/lib/validations/sourcepack';

// =============================================================================
// 类型定义
// =============================================================================

interface ReportSummary {
    docInfo: DocInfo;
    colorStats: {
        total: number;
        verified: number;
        partialMatch: number;
        unmapped: number;
        withRisks: number;
    };
}

// =============================================================================
// 常量配置
// =============================================================================

const PAPER_TYPE_NAMES: Record<string, string> = {
    PREMIUM_MATTE: '高阶映画',
    COATED: '铜版纸',
    UNCOATED: '纯质纸',
    OFFSET: '双胶纸',
    LIGHTWEIGHT: '轻型纸',
};

const RISK_TAG_NAMES: Record<ColorRiskTag, string> = {
    large_area: '大色块',
    gradient: '渐变',
    overprint: '叠印',
    fine_line: '细线条',
    small_text: '小字',
    bleed: '出血区',
    critical: '关键色',
};

const SEVERITY_CONFIG = {
    high: { label: '高风险', className: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
    medium: { label: '中等风险', className: 'text-amber-600 bg-amber-50 border-amber-200', icon: AlertTriangle },
    low: { label: '低风险', className: 'text-blue-600 bg-blue-50 border-blue-200', icon: Info },
};

const RECOMMENDATION_LEVEL_CONFIG = {
    highly_recommended: { label: '强烈推荐', className: 'text-emerald-600', stars: 3 },
    recommended: { label: '推荐', className: 'text-blue-600', stars: 2 },
    usable: { label: '可用', className: 'text-amber-600', stars: 1 },
    not_recommended: { label: '不推荐', className: 'text-red-600', stars: 0 },
};

// =============================================================================
// 摘要区块
// =============================================================================

export function ReportSummarySection({
    summary,
    printIntent,
}: {
    summary: ReportSummary;
    printIntent?: PrintIntent;
}) {
    const { docInfo, colorStats } = summary;
    const verificationRate = colorStats.total > 0 ? Math.round((colorStats.verified / colorStats.total) * 100) : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    分析摘要
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 文档信息 */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">文档名称</p>
                        <p className="font-medium">{docInfo.name}</p>
                    </div>
                    {docInfo.source && (
                        <div>
                            <p className="text-sm text-muted-foreground">来源</p>
                            <p className="font-medium">{docInfo.source}</p>
                        </div>
                    )}
                    {docInfo.pageCount && (
                        <div>
                            <p className="text-sm text-muted-foreground">页数</p>
                            <p className="font-medium">{docInfo.pageCount} 页</p>
                        </div>
                    )}
                    {printIntent?.printType && (
                        <div>
                            <p className="text-sm text-muted-foreground">印刷方式</p>
                            <p className="font-medium capitalize">{printIntent.printType}</p>
                        </div>
                    )}
                </div>

                <Separator />

                {/* 颜色统计 */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">颜色验证率</span>
                        <span className="text-sm text-muted-foreground">{verificationRate}%</span>
                    </div>
                    <Progress value={verificationRate} className="h-2" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-2xl font-bold">{colorStats.total}</p>
                            <p className="text-xs text-muted-foreground">总颜色</p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                            <p className="text-2xl font-bold text-emerald-600">{colorStats.verified}</p>
                            <p className="text-xs text-muted-foreground">已验证</p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">{colorStats.unmapped}</p>
                            <p className="text-xs text-muted-foreground">未映射</p>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                            <p className="text-2xl font-bold text-amber-600">{colorStats.withRisks}</p>
                            <p className="text-xs text-muted-foreground">有风险</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// =============================================================================
// 风险区块
// =============================================================================

export function RisksSection({ risks, isPaid = true }: { risks: RiskItem[]; isPaid?: boolean }) {
    const [expanded, setExpanded] = useState<string | null>(null);

    if (risks.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" />
                        风险识别
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>未发现明显印刷风险，可放心生产</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" />
                    风险识别
                    <Badge variant="destructive" className="ml-2">
                        {risks.length} 项
                    </Badge>
                </CardTitle>
                <CardDescription>检测到以下潜在印刷风险，建议关注</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {risks.map((risk, index) => {
                    const config = SEVERITY_CONFIG[risk.severity];
                    const Icon = config.icon;
                    const isExpanded = expanded === `risk-${index}`;

                    return (
                        <div key={index} className={cn('border rounded-lg overflow-hidden', config.className)}>
                            <div
                                className="flex items-center gap-3 p-4 cursor-pointer"
                                onClick={() => setExpanded(isExpanded ? null : `risk-${index}`)}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{RISK_TAG_NAMES[risk.type]}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {config.label}
                                        </Badge>
                                    </div>
                                    <p className="text-sm opacity-80 mt-1">
                                        影响 {risk.affectedColors.length} 个颜色
                                    </p>
                                </div>
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>

                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-3 border-t border-current/10">
                                    <div className="pt-3">
                                        <p className="text-sm font-medium mb-1">风险说明</p>
                                        <p className="text-sm opacity-80">{risk.description}</p>
                                    </div>

                                    {isPaid ? (
                                        <div>
                                            <p className="text-sm font-medium mb-1">缓解建议</p>
                                            <p className="text-sm opacity-80">{risk.mitigation}</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm opacity-60">
                                            <Lock className="w-4 h-4" />
                                            <span>缓解建议为付费内容</span>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm font-medium mb-1">受影响颜色</p>
                                        <div className="flex flex-wrap gap-1">
                                            {risk.affectedColors.map((color, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {color}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

// =============================================================================
// 推荐区块
// =============================================================================

export function RecommendationsSection({
    recommendations,
    isPaid = true,
}: {
    recommendations: PaperRecommendationItem[];
    isPaid?: boolean;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    纸张推荐
                </CardTitle>
                <CardDescription>基于颜色验证数据和工程特点，推荐以下纸张</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {recommendations.map((rec, index) => {
                    const levelConfig = RECOMMENDATION_LEVEL_CONFIG[rec.recommendationLevel];
                    const isTop = index === 0;

                    return (
                        <div
                            key={rec.paperType}
                            className={cn(
                                'border rounded-lg p-4 space-y-4',
                                isTop && 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10'
                            )}
                        >
                            {/* 头部 */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold',
                                            isTop
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-muted text-muted-foreground'
                                        )}
                                    >
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{PAPER_TYPE_NAMES[rec.paperType]}</h4>
                                        <div className="flex items-center gap-1 mt-1">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={cn(
                                                        'w-4 h-4',
                                                        i < levelConfig.stars
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-muted-foreground/30'
                                                    )}
                                                />
                                            ))}
                                            <span className={cn('text-sm ml-1', levelConfig.className)}>
                                                {levelConfig.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold">{rec.totalScore}</div>
                                    <div className="text-xs text-muted-foreground">综合得分</div>
                                </div>
                            </div>

                            {/* 四维得分 */}
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { key: 'fidelity', label: '还原度', value: rec.dimensionScores.fidelity },
                                    { key: 'risk', label: '风险性', value: rec.dimensionScores.risk },
                                    { key: 'cost', label: '成本性', value: rec.dimensionScores.cost },
                                    { key: 'suitability', label: '适用性', value: rec.dimensionScores.suitability },
                                ].map((dim) => (
                                    <div key={dim.key} className="text-center">
                                        <div className="text-lg font-semibold">{dim.value}</div>
                                        <div className="text-xs text-muted-foreground">{dim.label}</div>
                                        <Progress value={dim.value} className="h-1 mt-1" />
                                    </div>
                                ))}
                            </div>

                            {/* 推荐理由 */}
                            {rec.reasons.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                                        推荐理由
                                    </p>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {rec.reasons.map((reason, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                <span>{reason}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 注意事项 */}
                            {rec.cautions.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                                        注意事项
                                    </p>
                                    {isPaid ? (
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            {rec.cautions.map((caution, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                    <span>{caution}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Lock className="w-4 h-4" />
                                            <span>详细注意事项为付费内容</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 证据支撑 */}
                            {isPaid && rec.evidence.paperProfileCount > 0 && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                                    <span>数据支撑：{rec.evidence.paperProfileCount} 条验证记录</span>
                                    {rec.evidence.batchIds.length > 0 && (
                                        <span>{rec.evidence.batchIds.length} 个批次</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

// =============================================================================
// 避坑区块
// =============================================================================

export function AvoidSection({ avoidList }: { avoidList: AvoidItem[] }) {
    if (avoidList.length === 0) {
        return null;
    }

    return (
        <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    避坑提醒
                </CardTitle>
                <CardDescription>以下纸张不建议用于本工程</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {avoidList.map((item, index) => (
                    <div
                        key={index}
                        className={cn(
                            'p-4 rounded-lg border',
                            item.severity === 'critical'
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200'
                                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200'
                        )}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle
                                className={cn(
                                    'w-5 h-5',
                                    item.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                                )}
                            />
                            <span className="font-medium">{PAPER_TYPE_NAMES[item.paperType]}</span>
                            <Badge variant={item.severity === 'critical' ? 'destructive' : 'secondary'}>
                                {item.severity === 'critical' ? '严重' : '警告'}
                            </Badge>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                            {item.reasons.map((reason, i) => (
                                <li key={i}>• {reason}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

// =============================================================================
// 颜色列表区块
// =============================================================================

export function ColorListSection({
    colors,
    isPaid = true,
}: {
    colors: MappedColorItem[];
    isPaid?: boolean;
}) {
    const [showAll, setShowAll] = useState(false);
    const displayColors = showAll ? colors : colors.slice(0, 5);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    颜色清单
                    <Badge variant="outline" className="ml-2">
                        {colors.length} 个
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {displayColors.map((color, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                        >
                            {/* 颜色预览 */}
                            <div
                                className="w-8 h-8 rounded-md border shadow-inner"
                                style={getColorStyle(color)}
                            />

                            {/* 颜色信息 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">
                                        {color.original.name || color.original.colorId || `颜色 #${index + 1}`}
                                    </span>
                                    {color.matchedColorId && (
                                        <Link
                                            href={`/color/${color.matchedColorId}`}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                            target="_blank"
                                        >
                                            {color.matchedColorId}
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                                {color.original.lab && (
                                    <p className="text-xs text-muted-foreground">
                                        Lab({color.original.lab.L.toFixed(1)}, {color.original.lab.a.toFixed(1)},{' '}
                                        {color.original.lab.b.toFixed(1)})
                                        {color.deltaE !== undefined && (
                                            <span className="ml-2">ΔE={color.deltaE.toFixed(2)}</span>
                                        )}
                                    </p>
                                )}
                            </div>

                            {/* 状态标识 */}
                            <div>
                                {color.status === 'verified' && (
                                    <Badge className="bg-emerald-500">已验证</Badge>
                                )}
                                {color.status === 'partial_match' && (
                                    <Badge variant="secondary">待确认</Badge>
                                )}
                                {color.status === 'unmapped' && (
                                    <Badge variant="destructive">未映射</Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {colors.length > 5 && (
                    <Button
                        variant="ghost"
                        className="w-full mt-4"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? (
                            <>
                                <ChevronUp className="w-4 h-4 mr-2" />
                                收起
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                显示全部 {colors.length} 个颜色
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// =============================================================================
// 辅助函数
// =============================================================================

function getColorStyle(color: MappedColorItem): React.CSSProperties {
    if (color.original.rgb) {
        const { r, g, b } = color.original.rgb;
        return { backgroundColor: `rgb(${r}, ${g}, ${b})` };
    }
    if (color.original.lab) {
        // Lab 转 RGB 简化版
        const { L, a, b } = color.original.lab;
        const y = (L + 16) / 116;
        const x = a / 500 + y;
        const z = y - b / 200;

        const xr = Math.pow(x, 3) > 0.008856 ? Math.pow(x, 3) : (x - 16 / 116) / 7.787;
        const yr = Math.pow(y, 3) > 0.008856 ? Math.pow(y, 3) : (y - 16 / 116) / 7.787;
        const zr = Math.pow(z, 3) > 0.008856 ? Math.pow(z, 3) : (z - 16 / 116) / 7.787;

        const X = xr * 0.95047;
        const Y = yr * 1.0;
        const Z = zr * 1.08883;

        let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
        let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
        let bl = X * 0.0557 + Y * -0.204 + Z * 1.057;

        r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
        bl = bl > 0.0031308 ? 1.055 * Math.pow(bl, 1 / 2.4) - 0.055 : 12.92 * bl;

        const clamp = (v: number) => Math.round(Math.max(0, Math.min(255, v * 255)));
        return { backgroundColor: `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(bl)})` };
    }
    return { backgroundColor: '#808080' };
}
