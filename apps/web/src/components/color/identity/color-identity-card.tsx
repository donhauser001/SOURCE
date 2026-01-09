'use client';

/**
 * 色彩身份证卡片组件 v2.0
 * 
 * 全宽沉浸式布局，融合技术感与设计师友好
 * - Hero 区：大色块 + 核心信息
 * - 数据区：深色仪表盘风格
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Hexagon, LayoutGrid, FlaskConical, ShieldCheck, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { labToRgb } from '../color-swatch';
import { ViewModeProvider } from './view-mode-context';
import { OverviewTab, RecipesTab, EvidenceTab, RisksTab, ParticipantsTab } from './tabs';
import type { ColorData } from './types';

interface Props {
    color: ColorData;
}

export function ColorIdentityCard({ color }: Props) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    // 计算当前颜色的 RGB 值
    const colorRgb = labToRgb(color.trueSource.labL, color.trueSource.labA, color.trueSource.labB);
    const bgColor = `rgb(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b})`;
    
    // 使用 WCAG 相对亮度计算，决定使用白色还是黑色文字
    // 相对亮度公式考虑人眼对不同颜色的敏感度差异
    const isDark = shouldUseLightText(colorRgb.r, colorRgb.g, colorRgb.b);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <ViewModeProvider isDark={isDark}>
            <TooltipProvider>
                <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: bgColor }}>
                    {/* ═══════════════════════════════════════════════════════════
                        HERO 区域：全宽色彩展示
                    ═══════════════════════════════════════════════════════════ */}
                    <section
                        className="relative w-full overflow-hidden"
                    >
                        {/* 顶部导航栏 */}
                        <nav className="relative z-20 flex items-center justify-between px-6 lg:px-12 py-4">
                            <Link href="/colors">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "gap-2 transition-all",
                                        isDark ? "text-white/60 hover:text-white hover:bg-white/10" : "text-black/60 hover:text-black hover:bg-black/10"
                                    )}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline font-medium text-xs">返回色彩库</span>
                                </Button>
                            </Link>
                        </nav>

                        {/* Hero 内容 */}
                        <div className="relative z-10 px-6 lg:px-12 pb-24 pt-12 lg:pt-20">
                            <div className="w-full">
                                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
                                    {/* 左侧：色彩标识 */}
                                    <div className="space-y-8">
                                        {/* 色彩编号 */}
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase border",
                                                isDark ? "text-white/40 border-white/20" : "text-black/40 border-black/20"
                                            )}>
                                                色彩编码
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className={cn("text-lg font-mono tracking-tighter", isDark ? "text-white/80" : "text-black/80")}>
                                                    {color.colorId}
                                                </code>
                                                <CopyButton
                                                    text={color.colorId}
                                                    field="colorId"
                                                    isDark={isDark}
                                                    copiedField={copiedField}
                                                    onCopy={copyToClipboard}
                                                />
                                            </div>
                                        </div>

                                        {/* 色彩名称 */}
                                        <h1 className={cn(
                                            "text-6xl lg:text-9xl font-black tracking-tighter leading-none uppercase",
                                            isDark ? "text-white" : "text-black"
                                        )}>
                                            {color.name}
                                        </h1>

                                        {/* 状态标签 */}
                                        <div className="flex flex-wrap gap-3">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border-2",
                                                    isDark ? "border-white/20 text-white/60" : "border-black/20 text-black/60"
                                                )}
                                            >
                                                {color.statusLabel}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border-2",
                                                    isDark ? "border-white/20 text-white/60" : "border-black/20 text-black/60"
                                                )}
                                            >
                                                {color.audit.auditStatusLabel}
                                            </Badge>
                                            {color.version && (
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border-2",
                                                    isDark ? "border-white/20 text-white/60" : "border-black/20 text-black/60"
                                                )}>
                                                    Ver.{color.version}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* 真源说明 */}
                                        {color.trueSource.trueSourceNote && (
                                            <p className={cn(
                                                "text-xl font-medium leading-tight max-w-xl",
                                                isDark ? "text-white/60" : "text-black/60"
                                            )}>
                                                {color.trueSource.trueSourceNote}
                                            </p>
                                        )}
                                    </div>

                                    {/* 右侧：Lab 数据面板 */}
                                    <div className={cn(
                                        "p-10 rounded-[2rem] backdrop-blur-2xl border shadow-2xl",
                                        isDark ? "bg-white/5 border-white/10 shadow-black/20" : "bg-black/5 border-black/5 shadow-black/5"
                                    )}>
                                        <div className="flex items-center justify-between mb-10">
                                            <div className="flex items-center gap-2">
                                                <Hexagon className={cn("h-4 w-4", isDark ? "text-white/30" : "text-black/30")} />
                                                <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", isDark ? "text-white/40" : "text-black/40")}>
                                                    科学数据
                                                </span>
                                            </div>
                                            <CopyButton
                                                text={`L*${color.trueSource.labL.toFixed(2)} a*${color.trueSource.labA.toFixed(2)} b*${color.trueSource.labB.toFixed(2)}`}
                                                field="lab"
                                                isDark={isDark}
                                                copiedField={copiedField}
                                                onCopy={copyToClipboard}
                                            />
                                        </div>

                                        {/* Lab 值大字展示 */}
                                        <div className="grid grid-cols-3 gap-8">
                                            <LabValueDisplay label="L*" value={color.trueSource.labL} desc="明度" isDark={isDark} />
                                            <LabValueDisplay label="a*" value={color.trueSource.labA} desc="红绿轴" isDark={isDark} showSign />
                                            <LabValueDisplay label="b*" value={color.trueSource.labB} desc="黄蓝轴" isDark={isDark} showSign />
                                        </div>

                                        {/* 生产容差 */}
                                        <div className={cn(
                                            "mt-10 pt-8 border-t",
                                            isDark ? "border-white/10" : "border-black/10"
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <span className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-white/30" : "text-black/30")}>生产容差</span>
                                                <span className={cn("font-mono text-base font-bold", isDark ? "text-white/80" : "text-black/80")}>
                                                    ΔE ≤ {color.trueSource.deltaETolerance.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ═══════════════════════════════════════════════════════════
                        数据区域：自适应技术风格
                    ═══════════════════════════════════════════════════════════ */}
                    <section className="relative px-6 lg:px-12 py-12">
                        <div className="relative z-10 w-full">
                            {/* 主导航标签 */}
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className={cn(
                                    "h-auto p-0.5 mb-12 backdrop-blur-2xl border rounded-full w-fit",
                                    isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5"
                                )}>
                                    {[
                                        { value: 'overview', label: '总览', icon: LayoutGrid },
                                        { value: 'recipes', label: '配方', icon: FlaskConical },
                                        { value: 'evidence', label: '验证', icon: ShieldCheck },
                                        { value: 'risks', label: '风险', icon: AlertTriangle },
                                        { value: 'participants', label: '参与者', icon: Users },
                                    ].map((tab) => (
                                        <TabsTrigger
                                            key={tab.value}
                                            value={tab.value}
                                            className={cn(
                                                "px-5 py-1.5 rounded-full transition-all duration-300 text-sm font-medium shadow-none flex items-center gap-1.5",
                                                isDark 
                                                    ? "text-white/50 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-none" 
                                                    : "text-black/50 data-[state=active]:bg-black/10 data-[state=active]:text-black data-[state=active]:shadow-none"
                                            )}
                                        >
                                            <tab.icon className="h-4 w-4" />
                                            {tab.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                <TabsContent value="overview" className="mt-0">
                                    <OverviewTab color={color} />
                                </TabsContent>

                                <TabsContent value="recipes" className="mt-0">
                                    <RecipesTab recipes={color.recipes} fitMatrix={color.fitMatrix} />
                                </TabsContent>

                                <TabsContent value="evidence" className="mt-0">
                                    <EvidenceTab testReports={color.testReports} />
                                </TabsContent>

                                <TabsContent value="risks" className="mt-0">
                                    <RisksTab risks={color.risks} />
                                </TabsContent>

                                <TabsContent value="participants" className="mt-0">
                                    <ParticipantsTab participations={color.participations || []} />
                                </TabsContent>
                            </Tabs>

                            {/* 页面声明 */}
                            <footer className={cn(
                                "mt-16 pt-8 border-t",
                                isDark ? "border-white/10 text-white/40" : "border-black/10 text-black/40"
                            )}>
                                <div className="text-center text-sm space-y-1">
                                    <p>SOURCE 不提供脱离纸张条件的通用配方</p>
                                    <p>推荐配方为默认生产条件下的工程最优解</p>
                                    <p>所有结论均基于实体验证</p>
                                </div>
                            </footer>
                        </div>
                    </section>
                </div>
            </TooltipProvider>
        </ViewModeProvider>
    );
}

/**
 * Lab 值展示组件
 */
function LabValueDisplay({
    label,
    value,
    desc,
    isDark,
    showSign,
}: {
    label: string;
    value: number;
    desc: string;
    isDark: boolean;
    showSign?: boolean;
}) {
    const displayValue = showSign && value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1);

    return (
        <div className="text-center">
            <div className={`text-xs font-mono mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                {label}
            </div>
            <div className={`text-2xl lg:text-3xl font-mono font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {displayValue}
            </div>
            <div className={`text-[10px] mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                {desc}
            </div>
        </div>
    );
}

/**
 * 复制按钮组件
 */
function CopyButton({
    text,
    field,
    isDark,
    copiedField,
    onCopy,
}: {
    text: string;
    field: string;
    isDark: boolean;
    copiedField: string | null;
    onCopy: (text: string, field: string) => void;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-black/50 hover:text-black hover:bg-black/10'}`}
                    onClick={() => onCopy(text, field)}
                >
                    {copiedField === field ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>复制</TooltipContent>
        </Tooltip>
    );
}

/**
 * WCAG 相对亮度计算
 * 基于人眼对 RGB 颜色的敏感度差异，计算感知亮度
 * 
 * 公式：L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * 其中 R, G, B 需要先进行 gamma 校正的逆运算（线性化）
 * 
 * @returns true 如果应该使用浅色（白色）文字
 */
function shouldUseLightText(r: number, g: number, b: number): boolean {
    // 将 0-255 转换为 0-1
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;
    
    // Gamma 校正逆运算（sRGB -> Linear RGB）
    const rLinear = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const gLinear = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const bLinear = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
    
    // 计算相对亮度 (WCAG 2.1 定义)
    // 人眼对绿色最敏感 (0.7152)，对红色次之 (0.2126)，对蓝色最不敏感 (0.0722)
    const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
    
    // 阈值 0.179 对应 WCAG AA 级别 4.5:1 的对比度要求
    // 低于此亮度，白色文字对比度更好；高于此亮度，黑色文字对比度更好
    return luminance < 0.179;
}
