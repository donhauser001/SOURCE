'use client';

import { useState } from 'react';
import { Info, ShieldCheck, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PaperProfileCard } from '../../paper-profile-card';
import { MaterialRadar } from '../../material-radar';
import { InkRecipeDisplay } from '../../ink-recipe-display';
import { LabSpectrumCard } from '../../lab-spectrum-card';
import { DesignerViewCard } from '../designer-view-card';
import { ViewModeToggle } from '../view-mode-toggle';
import { useViewMode } from '../view-mode-context';
import { getRecommendationVariant, getAuditStatusVariant } from '../utils';
import type { ColorData } from '../types';

interface OverviewTabProps {
    color: ColorData;
}

export function OverviewTab({ color }: OverviewTabProps) {
    const { isExpert, isDark } = useViewMode();
    const [selectedPaper, setSelectedPaper] = useState<string | null>(
        color.paperProfiles[0]?.paperType || null
    );

    const selectedProfile = color.paperProfiles.find((p) => p.paperType === selectedPaper);

    // 为 LabSpectrumCard 准备纸张数据
    const paperProfilesForSpectrum = color.paperProfiles.map((p) => ({
        paperType: p.paperType,
        paperTypeLabel: p.paperTypeLabel,
        labL: p.labL,
        labA: p.labA,
        labB: p.labB,
        deltaE: p.deltaE,
        recommendation: p.recommendation,
        recommendationLabel: p.recommendationLabel,
        cautionNote: p.cautionNote,
    }));

    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none",
        isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：纸张表现 */}
            <div className="lg:col-span-2 space-y-6">
                {/* 根据模式显示不同的卡片 */}
                <div className="relative">
                    {/* 模式切换按钮 - 手机端在上方，桌面端右上角覆盖 */}
                    <div className="flex justify-end mb-3 sm:mb-0 sm:absolute sm:top-4 sm:right-4 sm:z-10">
                        <ViewModeToggle isDark={isDark} />
                    </div>

                    {isExpert ? (
                        /* 专家模式：Lab 光谱分析卡片 */
                        <LabSpectrumCard
                            trueSource={{
                                labL: color.trueSource.labL,
                                labA: color.trueSource.labA,
                                labB: color.trueSource.labB,
                            }}
                            paperProfiles={paperProfilesForSpectrum}
                            deltaETolerance={color.trueSource.deltaETolerance}
                        />
                    ) : (
                        /* 设计师模式：简化视图卡片（整合纸张推荐 + 打样包） */
                        <DesignerViewCard
                            colorName={color.name}
                            trueSource={{
                                labL: color.trueSource.labL,
                                labA: color.trueSource.labA,
                                labB: color.trueSource.labB,
                                deltaETolerance: color.trueSource.deltaETolerance,
                            }}
                            paperProfiles={paperProfilesForSpectrum}
                            paperRecommendations={color.paperRecommendations}
                            proofingPacks={color.proofingPacks}
                        />
                    )}
                </div>

                {/* 纸张选择标签 */}
                <PaperPerformanceCard
                    paperProfiles={color.paperProfiles}
                    selectedPaper={selectedPaper}
                    onSelectPaper={setSelectedPaper}
                    isDark={isDark}
                />

                {/* 材质雷达图 */}
                {selectedProfile && (
                    <Card className={cardStyle}>
                        <CardHeader className="pb-3">
                            <CardTitle className={cn(
                                "text-lg",
                                isDark ? "text-white" : "text-black"
                            )}>材质表现雷达图</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MaterialRadar
                                glossiness={selectedProfile.glossiness}
                                inkAbsorption={selectedProfile.inkAbsorption}
                                gamutCoverage={selectedProfile.gamutCoverage}
                                paperType={selectedProfile.paperTypeLabel}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* 右侧：生产技术区 */}
            <div className="space-y-6">
                <TrueSourceCard trueSource={color.trueSource} batch={color.batch} isDark={isDark} />
                {Object.keys(color.inkRecipe).length > 0 && (
                    <InkRecipeCard inkRecipe={color.inkRecipe} isDark={isDark} />
                )}
                <AuditCard audit={color.audit} lastVerifiedAt={color.lastVerifiedAt} isDark={isDark} />
                {color.proofingPacks.length > 0 && (
                    <ProofingPacksCard proofingPacks={color.proofingPacks} isDark={isDark} />
                )}
            </div>
        </div>
    );
}

// 纸张表现卡片
function PaperPerformanceCard({
    paperProfiles,
    selectedPaper,
    onSelectPaper,
    isDark,
}: {
    paperProfiles: ColorData['paperProfiles'];
    selectedPaper: string | null;
    onSelectPaper: (paper: string) => void;
    isDark: boolean;
}) {
    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none",
        isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
    );

    return (
        <Card className={cardStyle}>
            <CardHeader className="pb-3">
                <CardTitle className={cn(
                    "text-lg flex items-center gap-2",
                    isDark ? "text-white" : "text-black"
                )}>
                    实操表现区
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className={cn("h-4 w-4", isDark ? "text-white/40" : "text-black/40")} />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            基于「开放差异」原则，展示该颜色在不同介质上的真实状态
                        </TooltipContent>
                    </Tooltip>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {paperProfiles.length > 0 ? (
                    <Tabs value={selectedPaper || undefined} onValueChange={onSelectPaper}>
                        <TabsList className={cn(
                            "mb-4 flex-wrap h-auto gap-1 border-0",
                            isDark ? "bg-white/10" : "bg-black/5"
                        )}>
                            {paperProfiles.map((profile) => (
                                <TabsTrigger
                                    key={profile.paperType}
                                    value={profile.paperType}
                                    className={cn(
                                        "gap-2 transition-all",
                                        isDark
                                            ? "text-white/50 data-[state=active]:bg-white/20 data-[state=active]:text-white"
                                            : "text-black/50 data-[state=active]:bg-black/10 data-[state=active]:text-black"
                                    )}
                                >
                                    {profile.paperTypeLabel}
                                    <Badge
                                        variant={getRecommendationVariant(profile.recommendation) as 'success' | 'info' | 'warning' | 'destructive' | 'secondary'}
                                        className="text-[10px] px-1.5 py-0"
                                    >
                                        {profile.recommendationLabel}
                                    </Badge>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {paperProfiles.map((profile) => (
                            <TabsContent key={profile.paperType} value={profile.paperType}>
                                <PaperProfileCard profile={profile} isDark={isDark} />
                            </TabsContent>
                        ))}
                    </Tabs>
                ) : (
                    <p className={isDark ? "text-white/40 text-center py-8" : "text-black/40 text-center py-8"}>暂无纸张表现数据</p>
                )}
            </CardContent>
        </Card>
    );
}

// 真源数据卡片
function TrueSourceCard({
    trueSource,
    batch,
    isDark,
}: {
    trueSource: ColorData['trueSource'];
    batch: ColorData['batch'];
    isDark: boolean;
}) {
    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none",
        isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
    );

    return (
        <Card className={cardStyle}>
            <CardHeader className="pb-3">
                <CardTitle className={cn(
                    "text-lg flex items-center gap-2",
                    isDark ? "text-white" : "text-black"
                )}>
                    真源数据
                    <Badge variant="outline" className={cn(
                        "text-[10px]",
                        isDark ? "border-white/20 text-white/70" : "border-black/20 text-black/70"
                    )}>真源</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className={isDark ? "text-white/50" : "text-black/50"}>测量设备</span>
                    <span className={isDark ? "text-white/90" : "text-black/90"}>{trueSource.measurementDevice}</span>
                </div>
                <div className="flex justify-between">
                    <span className={isDark ? "text-white/50" : "text-black/50"}>测量标准</span>
                    <span className={isDark ? "text-white/90" : "text-black/90"}>{trueSource.measurementStandard}</span>
                </div>
                {trueSource.measurementCondition && (
                    <div className="flex justify-between">
                        <span className={isDark ? "text-white/50" : "text-black/50"}>测量条件</span>
                        <span className={cn("text-right max-w-[60%]", isDark ? "text-white/90" : "text-black/90")}>{trueSource.measurementCondition}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className={isDark ? "text-white/50" : "text-black/50"}>测量时间</span>
                    <span className={isDark ? "text-white/90" : "text-black/90"} suppressHydrationWarning>
                        {new Date(trueSource.measuredAt).toLocaleDateString('zh-CN')}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className={isDark ? "text-white/50" : "text-black/50"}>生产容差</span>
                    <span className={isDark ? "text-white/90" : "text-black/90"}>ΔE ≤ {trueSource.deltaETolerance.toFixed(1)}</span>
                </div>
                {batch && (
                    <div className="flex justify-between">
                        <span className={isDark ? "text-white/50" : "text-black/50"}>验证批次</span>
                        <code className={cn(
                            "text-xs px-1.5 py-0.5 rounded font-mono",
                            isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
                        )}>{batch.batchNo}</code>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// 油墨配方卡片
function InkRecipeCard({ inkRecipe, isDark }: { inkRecipe: Record<string, number>; isDark: boolean }) {
    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none",
        isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
    );

    return (
        <Card className={cardStyle}>
            <CardHeader className="pb-3">
                <CardTitle className={cn(
                    "text-lg flex items-center gap-2",
                    isDark ? "text-white" : "text-black"
                )}>
                    油墨配方
                    <Badge variant="outline" className={cn(
                        "text-[10px]",
                        isDark ? "border-white/20 text-white/70" : "border-black/20 text-black/70"
                    )}>油墨配方</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <InkRecipeDisplay recipe={inkRecipe} isDark={isDark} />
            </CardContent>
        </Card>
    );
}

// 审计卡片
function AuditCard({
    audit,
    lastVerifiedAt,
    isDark,
}: {
    audit: ColorData['audit'];
    lastVerifiedAt: string | null;
    isDark: boolean;
}) {
    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none",
        isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
    );

    return (
        <Card className={cardStyle}>
            <CardHeader className="pb-3">
                <CardTitle className={cn(
                    "text-lg flex items-center gap-2",
                    isDark ? "text-white" : "text-black"
                )}>
                    <ShieldCheck className={cn("h-4 w-4", isDark ? "text-green-400" : "text-green-600")} />
                    审计与溯源
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className={isDark ? "text-white/50" : "text-black/50"}>审计状态</span>
                    <Badge variant={getAuditStatusVariant(audit.auditStatus) as 'success' | 'warning'}>
                        {audit.auditStatusLabel}
                    </Badge>
                </div>
                {audit.auditors.length > 0 && (
                    <div className="flex justify-between">
                        <span className={isDark ? "text-white/50" : "text-black/50"}>审计人</span>
                        <span className={cn("text-right max-w-[60%]", isDark ? "text-white/90" : "text-black/90")}>{audit.auditors.join('、')}</span>
                    </div>
                )}
                {audit.lastAuditAt && (
                    <div className="flex justify-between">
                        <span className={isDark ? "text-white/50" : "text-black/50"}>审计时间</span>
                        <span className={isDark ? "text-white/90" : "text-black/90"} suppressHydrationWarning>
                            {new Date(audit.lastAuditAt).toLocaleDateString('zh-CN')}
                        </span>
                    </div>
                )}
                {lastVerifiedAt && (
                    <div className="flex justify-between">
                        <span className={isDark ? "text-white/50" : "text-black/50"}>最近验证</span>
                        <span className={isDark ? "text-white/90" : "text-black/90"} suppressHydrationWarning>
                            {new Date(lastVerifiedAt).toLocaleDateString('zh-CN')}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// 打样包卡片
function ProofingPacksCard({ proofingPacks, isDark }: { proofingPacks: ColorData['proofingPacks']; isDark: boolean }) {
    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none overflow-hidden",
        isDark ? "bg-cyan-900/20 text-white border-cyan-800/20" : "bg-cyan-50 text-cyan-900 border-cyan-100"
    );

    return (
        <Card className={cardStyle}>
            <CardHeader className="pb-3">
                <CardTitle className={cn(
                    "text-lg",
                    isDark ? "text-white" : "text-cyan-900"
                )}>单色打样包</CardTitle>
                <p className={cn(
                    "text-xs",
                    isDark ? "text-white/40" : "text-cyan-700/60"
                )}>不确定效果？花 10 块钱买张卡片看看</p>
            </CardHeader>
            <CardContent className="space-y-3">
                {proofingPacks.map((pack) => (
                    <div key={pack.id} className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        isDark ? "bg-white/5 border-white/5" : "bg-white border-cyan-100/50"
                    )}>
                        <div>
                            <div className="font-medium">{pack.paperTypeLabel}</div>
                            <div className={cn(
                                "text-sm",
                                isDark ? "text-cyan-400" : "text-cyan-600"
                            )}>¥{(pack.price / 100).toFixed(0)}</div>
                        </div>
                        {pack.externalUrl && (
                            <Button size="sm" className={cn(
                                isDark ? "bg-cyan-600 hover:bg-cyan-500 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white"
                            )} asChild>
                                <a href={pack.externalUrl} target="_blank" rel="noopener noreferrer" className="gap-1">
                                    购买
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
