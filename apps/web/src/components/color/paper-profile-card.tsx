'use client';

/**
 * 纸张表现卡片组件
 */

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ColorSwatch } from './color-swatch';

interface PaperProfile {
    id: string;
    paperType: string;
    paperTypeLabel: string;
    labL: number;
    labA: number;
    labB: number;
    deltaE: number | null;
    glossiness: number;
    inkAbsorption: number;
    gamutCoverage: number;
    scanImageUrl: string | null;
    recommendation: string;
    recommendationLabel: string;
    cautionNote: string | null;
    batchNo: string | null;
}

interface Props {
    profile: PaperProfile;
    isDark?: boolean;
}

export function PaperProfileCard({ profile, isDark = false }: Props) {
    // 获取推荐状态的图标和颜色
    const getRecommendationInfo = (rec: string) => {
        switch (rec) {
            case 'BEST':
                return {
                    icon: CheckCircle,
                    color: isDark ? 'text-green-400' : 'text-green-600',
                    bgColor: isDark ? 'bg-green-950/30' : 'bg-green-50',
                    borderColor: isDark ? 'border-green-800/50' : 'border-green-200',
                };
            case 'GOOD':
                return {
                    icon: CheckCircle,
                    color: isDark ? 'text-blue-400' : 'text-blue-600',
                    bgColor: isDark ? 'bg-blue-950/30' : 'bg-blue-50',
                    borderColor: isDark ? 'border-blue-800/50' : 'border-blue-200',
                };
            case 'CAUTION':
                return {
                    icon: AlertTriangle,
                    color: isDark ? 'text-yellow-400' : 'text-yellow-600',
                    bgColor: isDark ? 'bg-yellow-950/30' : 'bg-yellow-50',
                    borderColor: isDark ? 'border-yellow-800/50' : 'border-yellow-200',
                };
            case 'AVOID':
                return {
                    icon: AlertTriangle,
                    color: isDark ? 'text-red-400' : 'text-red-600',
                    bgColor: isDark ? 'bg-red-950/30' : 'bg-red-50',
                    borderColor: isDark ? 'border-red-800/50' : 'border-red-200',
                };
            default:
                return {
                    icon: Info,
                    color: isDark ? 'text-white/40' : 'text-black/40',
                    bgColor: isDark ? 'bg-white/5' : 'bg-gray-50',
                    borderColor: isDark ? 'border-white/10' : 'border-gray-200',
                };
        }
    };

    const recInfo = getRecommendationInfo(profile.recommendation);
    const Icon = recInfo.icon;

    // ΔE 评级
    const getDeltaEBadge = (deltaE: number | null) => {
        if (deltaE === null) return null;
        if (deltaE <= 1) return { label: '极佳', variant: 'success' as const };
        if (deltaE <= 2) return { label: '优秀', variant: 'success' as const };
        if (deltaE <= 3.5) return { label: '良好', variant: 'info' as const };
        if (deltaE <= 5) return { label: '可接受', variant: 'warning' as const };
        return { label: '偏差较大', variant: 'destructive' as const };
    };

    const deltaEBadge = getDeltaEBadge(profile.deltaE);

    return (
        <div className="space-y-6">
            {/* 推荐状态 */}
            <div className={cn("p-4 rounded-lg border", recInfo.bgColor, recInfo.borderColor)}>
                <div className="flex items-start gap-3">
                    <Icon className={cn("h-5 w-5 mt-0.5", recInfo.color)} />
                    <div className="flex-1">
                        <div className={cn("font-medium", isDark ? "text-white" : "text-black")}>{profile.recommendationLabel}</div>
                        {profile.cautionNote && (
                            <p className={cn("text-sm mt-1", isDark ? "text-white/50" : "text-black/50")}>{profile.cautionNote}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 左侧：色块对比 */}
                <div className="space-y-4">
                    <h4 className={cn("text-sm font-medium", isDark ? "text-white/40" : "text-black/40")}>
                        在 {profile.paperTypeLabel} 上的表现
                    </h4>
                    <div className="flex items-center gap-4">
                        <ColorSwatch labL={profile.labL} labA={profile.labA} labB={profile.labB} size="md" />
                        <div className="space-y-2">
                            <div className="text-sm">
                                <span className={isDark ? "text-white/40" : "text-black/40"}>L* </span>
                                <span className={cn("font-mono", isDark ? "text-white" : "text-black")}>{profile.labL.toFixed(2)}</span>
                            </div>
                            <div className="text-sm">
                                <span className={isDark ? "text-white/40" : "text-black/40"}>a* </span>
                                <span className={cn("font-mono", isDark ? "text-white" : "text-black")}>{profile.labA.toFixed(2)}</span>
                            </div>
                            <div className="text-sm">
                                <span className={isDark ? "text-white/40" : "text-black/40"}>b* </span>
                                <span className={cn("font-mono", isDark ? "text-white" : "text-black")}>{profile.labB.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 右侧：数据指标 */}
                <div className="space-y-4">
                    {/* ΔE 色差 */}
                    {profile.deltaE !== null && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className={isDark ? "text-white/40" : "text-black/40"}>色差 ΔE</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn("font-mono font-medium", isDark ? "text-white" : "text-black")}>{profile.deltaE.toFixed(2)}</span>
                                    {deltaEBadge && (
                                        <Badge variant={deltaEBadge.variant} className="text-[10px]">
                                            {deltaEBadge.label}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <Progress
                                value={Math.max(0, 100 - profile.deltaE * 10)}
                                className="h-2"
                            />
                        </div>
                    )}

                    {/* 色域覆盖率 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className={isDark ? "text-white/40" : "text-black/40"}>色域覆盖率</span>
                            <span className={cn("font-mono font-medium", isDark ? "text-white" : "text-black")}>{profile.gamutCoverage}%</span>
                        </div>
                        <Progress value={profile.gamutCoverage} className="h-2" />
                    </div>

                    {/* 验证批次 */}
                    {profile.batchNo && (
                        <div className="flex items-center justify-between text-sm">
                            <span className={isDark ? "text-white/40" : "text-black/40"}>验证批次</span>
                            <code className={cn(
                                "text-xs px-1.5 py-0.5 rounded",
                                isDark ? "bg-white/10 text-white/70" : "bg-black/5 text-black/70"
                            )}>{profile.batchNo}</code>
                        </div>
                    )}
                </div>
            </div>

            {/* 高清扫描图（如果有） */}
            {profile.scanImageUrl && (
                <div className="space-y-2">
                    <h4 className={cn("text-sm font-medium", isDark ? "text-white/40" : "text-black/40")}>高清扫描</h4>
                    <div className={cn(
                        "relative aspect-video rounded-lg overflow-hidden",
                        isDark ? "bg-white/5" : "bg-gray-100"
                    )}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={profile.scanImageUrl}
                            alt={`${profile.paperTypeLabel} 扫描图`}
                            className="object-cover w-full h-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

