'use client';

import { ShieldCheck, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InkRecipeDisplay } from '../../ink-recipe-display';
import { LabSpectrumCard } from '../../lab-spectrum-card';
import { DesignerViewCard } from '../designer-view-card';
import { ViewModeToggle } from '../view-mode-toggle';
import { useViewMode } from '../view-mode-context';
import type { ColorData } from '../types';

interface OverviewTabProps {
    color: ColorData;
}

export function OverviewTab({ color }: OverviewTabProps) {
    const { isExpert, isDark } = useViewMode();

    // 为 LabSpectrumCard 准备简化纸张数据
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

    // 为设计师卡片准备完整纸张数据（包含材质参数）
    const paperProfilesForDesigner = color.paperProfiles.map((p) => ({
        id: p.id,
        paperType: p.paperType,
        paperTypeLabel: p.paperTypeLabel,
        labL: p.labL,
        labA: p.labA,
        labB: p.labB,
        deltaE: p.deltaE,
        recommendation: p.recommendation,
        recommendationLabel: p.recommendationLabel,
        cautionNote: p.cautionNote,
        glossiness: p.glossiness,
        inkAbsorption: p.inkAbsorption,
        gamutCoverage: p.gamutCoverage,
        scanImageUrl: p.scanImageUrl,
        batchNo: p.batchNo,
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：纸张表现 */}
            <div className="lg:col-span-2 space-y-6">
                {/* 根据模式显示不同的卡片 */}
                <div className="relative">
                    {/* 模式切换按钮 - 卡片内右上角 */}
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
                        /* 设计师模式：整合纸张推荐 + 材质详情 + 打样包 */
                        <DesignerViewCard
                            colorName={color.name}
                            trueSource={{
                                labL: color.trueSource.labL,
                                labA: color.trueSource.labA,
                                labB: color.trueSource.labB,
                                deltaETolerance: color.trueSource.deltaETolerance,
                            }}
                            paperProfiles={paperProfilesForDesigner}
                            paperRecommendations={color.paperRecommendations}
                            proofingPacks={color.proofingPacks}
                        />
                    )}
                </div>
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

// 真源数据卡片
function TrueSourceCard({
    trueSource,
    batch,
}: {
    trueSource: ColorData['trueSource'];
    batch: ColorData['batch'];
    isDark: boolean;
}) {
    return (
        <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
            <CardContent className="p-6 space-y-5">
                {/* 标题区 */}
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/70">
                        真源数据
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-black/5 text-black/50">
                        真源
                    </span>
                </div>

                {/* 数据列表 */}
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-black/50">测量设备</span>
                        <span className="text-black/90">{trueSource.measurementDevice}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-black/50">测量标准</span>
                        <span className="text-black/90">{trueSource.measurementStandard}</span>
                    </div>
                    {trueSource.measurementCondition && (
                        <div className="flex justify-between">
                            <span className="text-black/50">测量条件</span>
                            <span className="text-right max-w-[60%] text-black/90">{trueSource.measurementCondition}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-black/50">测量时间</span>
                        <span className="text-black/90" suppressHydrationWarning>
                            {new Date(trueSource.measuredAt).toLocaleDateString('zh-CN')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-black/50">生产容差</span>
                        <span className="text-black/90">ΔE ≤ {trueSource.deltaETolerance.toFixed(1)}</span>
                    </div>
                    {batch && (
                        <div className="flex justify-between">
                            <span className="text-black/50">验证批次</span>
                            <code className="text-xs px-1.5 py-0.5 rounded font-mono bg-black/5 text-black">
                                {batch.batchNo}
                            </code>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// 油墨配方卡片
function InkRecipeCard({ inkRecipe }: { inkRecipe: Record<string, number>; isDark: boolean }) {
    return (
        <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
            <CardContent className="p-6 space-y-5">
                {/* 标题区 */}
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/70">
                        油墨配方
                    </h3>
                </div>

                {/* 配方内容 */}
                <InkRecipeDisplay recipe={inkRecipe} isDark={false} />
            </CardContent>
        </Card>
    );
}

// 审计卡片
function AuditCard({
    audit,
    lastVerifiedAt,
}: {
    audit: ColorData['audit'];
    lastVerifiedAt: string | null;
    isDark: boolean;
}) {
    return (
        <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
            <CardContent className="p-6 space-y-5">
                {/* 标题区 */}
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/70">
                        审计与溯源
                    </h3>
                </div>

                {/* 数据列表 */}
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-black/50">审计状态</span>
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-black/5 text-black/50">
                            {audit.auditStatusLabel}
                        </span>
                    </div>
                    {audit.auditors.length > 0 && (
                        <div className="flex justify-between">
                            <span className="text-black/50">审计人</span>
                            <span className="text-right max-w-[60%] text-black/90">{audit.auditors.join('、')}</span>
                        </div>
                    )}
                    {audit.lastAuditAt && (
                        <div className="flex justify-between">
                            <span className="text-black/50">审计时间</span>
                            <span className="text-black/90" suppressHydrationWarning>
                                {new Date(audit.lastAuditAt).toLocaleDateString('zh-CN')}
                            </span>
                        </div>
                    )}
                    {lastVerifiedAt && (
                        <div className="flex justify-between">
                            <span className="text-black/50">最近验证</span>
                            <span className="text-black/90" suppressHydrationWarning>
                                {new Date(lastVerifiedAt).toLocaleDateString('zh-CN')}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// 打样包卡片
function ProofingPacksCard({ proofingPacks }: { proofingPacks: ColorData['proofingPacks']; isDark: boolean }) {
    return (
        <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
            <CardContent className="p-6 space-y-5">
                {/* 标题区 */}
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/70">
                        单色打样包
                    </h3>
                    <p className="text-xs text-black/40 mt-1">
                        不确定效果？花 10 块钱买张卡片看看
                    </p>
                </div>

                {/* 打样包列表 */}
                <div className="space-y-3">
                    {proofingPacks.map((pack) => (
                        <div key={pack.id} className="flex items-center justify-between p-3 rounded-xl border bg-black/[0.02] border-black/5">
                            <div>
                                <div className="font-medium text-black">{pack.paperTypeLabel}</div>
                                <div className="text-sm text-black/60">¥{(pack.price / 100).toFixed(0)}</div>
                            </div>
                            {pack.externalUrl && (
                                <Button size="sm" className="bg-black hover:bg-black/80 text-white" asChild>
                                    <a href={pack.externalUrl} target="_blank" rel="noopener noreferrer" className="gap-1">
                                        购买
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
