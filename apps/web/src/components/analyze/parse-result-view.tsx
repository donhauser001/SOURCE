'use client';

/**
 * SourcePack 解析结果展示组件
 *
 * 显示：
 * - 摘要统计
 * - 文档信息
 * - 颜色映射列表
 */

import { useState } from 'react';
import Link from 'next/link';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    FileText,
    Palette,
    Printer,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { MappedColorItem } from '@/lib/analyze/parser';
import type { DocInfo, PrintIntent, ColorRiskTag } from '@/lib/validations/sourcepack';
import { ColorMappingStatus } from '@/lib/analyze/parser';

// =============================================================================
// 类型定义
// =============================================================================

interface ParseResultData {
    docInfo: DocInfo;
    printIntent?: PrintIntent;
    colors: MappedColorItem[];
    summary: {
        totalColors: number;
        verifiedCount: number;
        partialMatchCount: number;
        unmappedCount: number;
        riskColorsCount: number;
    };
}

interface ParseResultViewProps {
    data: ParseResultData;
    onReset?: () => void;
}

// =============================================================================
// 辅助函数
// =============================================================================

const printTypeLabels: Record<string, string> = {
    offset: '胶印',
    digital: '数码印刷',
    screen: '丝网印刷',
    flexo: '柔印',
    gravure: '凹印',
    other: '其他',
};

const specialProcessLabels: Record<string, string> = {
    varnish: '光油',
    lamination: '覆膜',
    embossing: '压凹凸',
    foil: '烫金',
    die_cut: '模切',
    uv: 'UV',
    spot_uv: '局部 UV',
    other: '其他',
};

const riskTagLabels: Record<ColorRiskTag, string> = {
    large_area: '大色块',
    gradient: '渐变',
    overprint: '叠印',
    fine_line: '细线条',
    small_text: '小字',
    bleed: '出血区',
    critical: '关键色',
};

const statusConfig = {
    [ColorMappingStatus.VERIFIED]: {
        icon: CheckCircle2,
        label: '已验证',
        className: 'text-emerald-600 dark:text-emerald-400',
        badgeVariant: 'default' as const,
    },
    [ColorMappingStatus.PARTIAL_MATCH]: {
        icon: AlertTriangle,
        label: '待确认',
        className: 'text-amber-600 dark:text-amber-400',
        badgeVariant: 'secondary' as const,
    },
    [ColorMappingStatus.UNMAPPED]: {
        icon: XCircle,
        label: '未映射',
        className: 'text-red-600 dark:text-red-400',
        badgeVariant: 'destructive' as const,
    },
};

// =============================================================================
// 子组件
// =============================================================================

function SummaryCards({ summary }: { summary: ParseResultData['summary'] }) {
    const items = [
        {
            label: '总颜色数',
            value: summary.totalColors,
            icon: Palette,
            className: 'text-foreground',
        },
        {
            label: '已验证',
            value: summary.verifiedCount,
            icon: CheckCircle2,
            className: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: '待确认',
            value: summary.partialMatchCount,
            icon: AlertTriangle,
            className: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: '未映射',
            value: summary.unmappedCount,
            icon: XCircle,
            className: 'text-red-600 dark:text-red-400',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item) => (
                <Card key={item.label}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                                <p className={cn('text-2xl font-bold', item.className)}>{item.value}</p>
                            </div>
                            <item.icon className={cn('w-8 h-8 opacity-20', item.className)} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function DocInfoCard({ docInfo, printIntent }: { docInfo: DocInfo; printIntent?: PrintIntent }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    文档信息
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    {/* 文档名称 */}
                    <div>
                        <p className="text-sm text-muted-foreground">文档名称</p>
                        <p className="font-medium">{docInfo.name}</p>
                    </div>

                    {/* 来源 */}
                    {docInfo.source && (
                        <div>
                            <p className="text-sm text-muted-foreground">来源</p>
                            <p className="font-medium">
                                {docInfo.source}
                                {docInfo.sourceVersion && (
                                    <span className="text-muted-foreground ml-1">v{docInfo.sourceVersion}</span>
                                )}
                            </p>
                        </div>
                    )}

                    {/* 尺寸 */}
                    {docInfo.documentSize && (
                        <div>
                            <p className="text-sm text-muted-foreground">尺寸</p>
                            <p className="font-medium">
                                {docInfo.documentSize.width} × {docInfo.documentSize.height} {docInfo.documentSize.unit}
                            </p>
                        </div>
                    )}

                    {/* 页数 */}
                    {docInfo.pageCount && (
                        <div>
                            <p className="text-sm text-muted-foreground">页数</p>
                            <p className="font-medium">{docInfo.pageCount} 页</p>
                        </div>
                    )}
                </div>

                {/* 印刷意图 */}
                {printIntent && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Printer className="w-4 h-4" />
                                印刷意图
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">印刷类型</p>
                                    <p className="font-medium">{printTypeLabels[printIntent.printType]}</p>
                                </div>
                                {printIntent.quantity && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">印刷数量</p>
                                        <p className="font-medium">{printIntent.quantity.toLocaleString()} 份</p>
                                    </div>
                                )}
                                {printIntent.preferredPaper && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">纸张偏好</p>
                                        <p className="font-medium">{printIntent.preferredPaper}</p>
                                    </div>
                                )}
                                {printIntent.specialProcesses && printIntent.specialProcesses.length > 0 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">特殊工艺</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {printIntent.specialProcesses.map((process) => (
                                                <Badge key={process} variant="outline" className="text-xs">
                                                    {specialProcessLabels[process]}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {printIntent.notes && (
                                <p className="text-sm text-muted-foreground italic">备注：{printIntent.notes}</p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function ColorListItem({ color, index }: { color: MappedColorItem; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const config = statusConfig[color.status];
    const StatusIcon = config.icon;

    // 生成颜色预览样式
    const getColorStyle = () => {
        if (color.original.rgb) {
            const { r, g, b } = color.original.rgb;
            return { backgroundColor: `rgb(${r}, ${g}, ${b})` };
        }
        if (color.original.lab) {
            // Lab 转 RGB 简化版（不精确，仅用于预览）
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
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* 主行 */}
            <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                {/* 序号 */}
                <span className="text-sm text-muted-foreground w-6 text-center">{index + 1}</span>

                {/* 颜色预览 */}
                <div className="w-10 h-10 rounded-lg shadow-inner border" style={getColorStyle()} />

                {/* 颜色信息 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                            {color.original.name || color.original.colorId || `颜色 #${index + 1}`}
                        </p>
                        {color.original.colorId && (
                            <Badge variant="outline" className="text-xs">
                                {color.original.colorId}
                            </Badge>
                        )}
                    </div>
                    {color.original.lab && (
                        <p className="text-xs text-muted-foreground">
                            Lab({color.original.lab.L.toFixed(1)}, {color.original.lab.a.toFixed(1)},{' '}
                            {color.original.lab.b.toFixed(1)})
                        </p>
                    )}
                </div>

                {/* 风险标签 */}
                {color.original.riskTags && color.original.riskTags.length > 0 && (
                    <div className="hidden md:flex gap-1">
                        {color.original.riskTags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs text-amber-600">
                                {riskTagLabels[tag]}
                            </Badge>
                        ))}
                        {color.original.riskTags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                                +{color.original.riskTags.length - 2}
                            </Badge>
                        )}
                    </div>
                )}

                {/* 映射状态 */}
                <div className="flex items-center gap-2">
                    <StatusIcon className={cn('w-5 h-5', config.className)} />
                    <span className={cn('text-sm font-medium hidden sm:inline', config.className)}>{config.label}</span>
                </div>

                {/* 展开按钮 */}
                <Button variant="ghost" size="icon" className="shrink-0">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
            </div>

            {/* 展开详情 */}
            {expanded && (
                <div className="px-4 pb-4 pt-0 space-y-3 bg-muted/10 border-t">
                    {/* 映射说明 */}
                    {color.mappingNote && (
                        <div className="flex items-start gap-2 text-sm">
                            <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">{color.mappingNote}</span>
                        </div>
                    )}

                    {/* 匹配到的颜色 */}
                    {color.matchedColorId && (
                        <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-sm">
                                匹配到 SOURCE 颜色：
                                <Link
                                    href={`/color/${color.matchedColorId}`}
                                    className="font-medium text-primary hover:underline ml-1"
                                    target="_blank"
                                >
                                    {color.matchedColorName} ({color.matchedColorId})
                                    <ExternalLink className="w-3 h-3 inline ml-1" />
                                </Link>
                            </span>
                            {color.deltaE !== undefined && (
                                <Badge variant="outline" className="ml-auto text-xs">
                                    ΔE={color.deltaE.toFixed(2)}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* 颜色详情 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {color.original.lab && (
                            <div>
                                <p className="text-muted-foreground text-xs">Lab</p>
                                <p className="font-mono">
                                    {color.original.lab.L.toFixed(1)}, {color.original.lab.a.toFixed(1)},{' '}
                                    {color.original.lab.b.toFixed(1)}
                                </p>
                            </div>
                        )}
                        {color.original.rgb && (
                            <div>
                                <p className="text-muted-foreground text-xs">RGB</p>
                                <p className="font-mono">
                                    {color.original.rgb.r}, {color.original.rgb.g}, {color.original.rgb.b}
                                </p>
                            </div>
                        )}
                        {color.original.cmyk && (
                            <div>
                                <p className="text-muted-foreground text-xs">CMYK</p>
                                <p className="font-mono">
                                    {color.original.cmyk.c}, {color.original.cmyk.m}, {color.original.cmyk.y},{' '}
                                    {color.original.cmyk.k}
                                </p>
                            </div>
                        )}
                        {color.original.occurrenceCount && (
                            <div>
                                <p className="text-muted-foreground text-xs">出现次数</p>
                                <p>{color.original.occurrenceCount} 次</p>
                            </div>
                        )}
                        {color.original.coveragePercent !== undefined && (
                            <div>
                                <p className="text-muted-foreground text-xs">覆盖面积</p>
                                <p>{color.original.coveragePercent.toFixed(1)}%</p>
                            </div>
                        )}
                    </div>

                    {/* 风险标签详情 */}
                    {color.original.riskTags && color.original.riskTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {color.original.riskTags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-amber-600">
                                    {riskTagLabels[tag]}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* 未映射警告 */}
                    {color.status === ColorMappingStatus.UNMAPPED && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                            <p className="text-sm text-red-600 dark:text-red-400">
                                ⚠️ 未验证颜色，建议先映射或打样验证后再使用
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// 主组件
// =============================================================================

export function ParseResultView({ data, onReset }: ParseResultViewProps) {
    const [filter, setFilter] = useState<'all' | ColorMappingStatus>('all');

    const filteredColors = filter === 'all' ? data.colors : data.colors.filter((c) => c.status === filter);

    return (
        <div className="space-y-6">
            {/* 摘要统计 */}
            <SummaryCards summary={data.summary} />

            {/* 文档信息 */}
            <DocInfoCard docInfo={data.docInfo} printIntent={data.printIntent} />

            {/* 颜色列表 */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Palette className="w-5 h-5" />
                                颜色映射结果
                            </CardTitle>
                            <CardDescription>
                                共 {data.summary.totalColors} 个颜色，
                                {data.summary.unmappedCount > 0 && (
                                    <span className="text-red-600 dark:text-red-400">
                                        {data.summary.unmappedCount} 个未映射
                                    </span>
                                )}
                            </CardDescription>
                        </div>

                        {/* 筛选器 */}
                        <div className="flex gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={filter === 'all' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilter('all')}
                                        >
                                            全部
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>显示所有颜色</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={filter === ColorMappingStatus.VERIFIED ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilter(ColorMappingStatus.VERIFIED)}
                                            className="gap-1"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            已验证
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>显示已验证颜色</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={filter === ColorMappingStatus.PARTIAL_MATCH ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilter(ColorMappingStatus.PARTIAL_MATCH)}
                                            className="gap-1"
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            待确认
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>显示待确认颜色</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={filter === ColorMappingStatus.UNMAPPED ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilter(ColorMappingStatus.UNMAPPED)}
                                            className="gap-1"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            未映射
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>显示未映射颜色</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredColors.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">没有符合筛选条件的颜色</p>
                        ) : (
                            filteredColors.map((color, index) => (
                                <ColorListItem key={`${color.original.colorId || index}-${index}`} color={color} index={index} />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={onReset}>
                    重新上传
                </Button>
                <Button disabled>继续分析（即将推出）</Button>
            </div>
        </div>
    );
}
