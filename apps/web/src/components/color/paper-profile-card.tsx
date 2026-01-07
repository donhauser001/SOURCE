'use client';

/**
 * 纸张表现卡片组件
 */

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
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
}

export function PaperProfileCard({ profile }: Props) {
    // 获取推荐状态的图标和颜色
    const getRecommendationInfo = (rec: string) => {
        switch (rec) {
            case 'BEST':
                return {
                    icon: CheckCircle,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50 dark:bg-green-950/30',
                    borderColor: 'border-green-200 dark:border-green-800',
                };
            case 'GOOD':
                return {
                    icon: CheckCircle,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
                    borderColor: 'border-blue-200 dark:border-blue-800',
                };
            case 'CAUTION':
                return {
                    icon: AlertTriangle,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
                    borderColor: 'border-yellow-200 dark:border-yellow-800',
                };
            case 'AVOID':
                return {
                    icon: AlertTriangle,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50 dark:bg-red-950/30',
                    borderColor: 'border-red-200 dark:border-red-800',
                };
            default:
                return {
                    icon: Info,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
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
            <div className={`p-4 rounded-lg border ${recInfo.bgColor} ${recInfo.borderColor}`}>
                <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${recInfo.color}`} />
                    <div className="flex-1">
                        <div className="font-medium">{profile.recommendationLabel}</div>
                        {profile.cautionNote && (
                            <p className="text-sm text-muted-foreground mt-1">{profile.cautionNote}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 左侧：色块对比 */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">
                        在 {profile.paperTypeLabel} 上的表现
                    </h4>
                    <div className="flex items-center gap-4">
                        <ColorSwatch labL={profile.labL} labA={profile.labA} labB={profile.labB} size="md" />
                        <div className="space-y-2">
                            <div className="text-sm">
                                <span className="text-muted-foreground">L* </span>
                                <span className="font-mono">{profile.labL.toFixed(2)}</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-muted-foreground">a* </span>
                                <span className="font-mono">{profile.labA.toFixed(2)}</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-muted-foreground">b* </span>
                                <span className="font-mono">{profile.labB.toFixed(2)}</span>
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
                                <span className="text-sm text-muted-foreground">色差 ΔE</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-medium">{profile.deltaE.toFixed(2)}</span>
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
                            <span className="text-sm text-muted-foreground">色域覆盖率</span>
                            <span className="font-mono font-medium">{profile.gamutCoverage}%</span>
                        </div>
                        <Progress value={profile.gamutCoverage} className="h-2" />
                    </div>

                    {/* 验证批次 */}
                    {profile.batchNo && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">验证批次</span>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{profile.batchNo}</code>
                        </div>
                    )}
                </div>
            </div>

            {/* 高清扫描图（如果有） */}
            {profile.scanImageUrl && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">高清扫描</h4>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
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

