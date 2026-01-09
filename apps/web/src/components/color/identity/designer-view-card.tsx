'use client';

/**
 * 设计师模式 - 色彩表现速览卡片
 * 
 * 简洁、克制、专业的设计语言
 * - 单色系视觉，与页面背景融为一体
 * - 用排版和间距区分层级
 * - 信息密度适中，一眼抓住重点
 * - 整合人工标注的推荐/排除理由
 * - 点击展开材质详情
 */

import { useState } from 'react';
import { ChevronDown, Star, ThumbsUp, AlertTriangle, Ban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ColorSwatch } from '../color-swatch';

// 纸张类型中文标签
const PAPER_TYPE_LABELS: Record<string, string> = {
    COATED: '铜版纸',
    UNCOATED: '胶版纸',
    MATTE: '哑粉纸',
    ART: '高阶映画',
    NEWSPRINT: '新闻纸',
    LIGHTWEIGHT: '轻型纸',
    PURE: '纯质纸',
};

// 推荐等级配置（标签 + 图标）
const RECOMMENDATION_CONFIG: Record<string, { label: string; icon: typeof Star }> = {
    BEST: { label: '最佳拍档', icon: Star },
    GOOD: { label: '表现良好', icon: ThumbsUp },
    CAUTION: { label: '建议慎用', icon: AlertTriangle },
    AVOID: { label: '不推荐', icon: Ban },
};

// 推荐等级标签（保持兼容）
const RECOMMENDATION_LABELS: Record<string, string> = {
    BEST: '最佳拍档',
    GOOD: '表现良好',
    CAUTION: '建议慎用',
    AVOID: '不推荐',
};

interface PaperProfile {
    paperType: string;
    paperTypeLabel?: string;
    labL: number;
    labA: number;
    labB: number;
    deltaE: number | null;
    recommendation?: string;
    recommendationLabel?: string;
    cautionNote?: string | null;
}

/** 完整纸张数据（包含材质参数） */
interface FullPaperProfile extends PaperProfile {
    id?: string;
    glossiness?: number;
    inkAbsorption?: number;
    gamutCoverage?: number;
    scanImageUrl?: string | null;
    batchNo?: string | null;
}

interface PaperRecommendation {
    id: string;
    paperId: string;
    paperName: string;
    paperCategory: string;
    recommendationType: 'WHITELIST' | 'BLACKLIST';
    reason: string;
}

interface ProofingPack {
    id: string;
    paperType: string;
    paperTypeLabel: string;
    price: number;
    externalUrl: string | null;
}

interface DesignerViewCardProps {
    trueSource: {
        labL: number;
        labA: number;
        labB: number;
        deltaETolerance: number;
    };
    /** 纸张数据（支持简化版和完整版） */
    paperProfiles: FullPaperProfile[];
    colorName: string;
    className?: string;
    /** 人工标注的纸张推荐（白名单/黑名单） */
    paperRecommendations?: PaperRecommendation[];
    /** 单色打样包 */
    proofingPacks?: ProofingPack[];
}

export function DesignerViewCard({
    trueSource,
    paperProfiles,
    colorName,
    className,
    paperRecommendations = [],
    proofingPacks = [],
}: DesignerViewCardProps) {
    const [expandedPaper, setExpandedPaper] = useState<string | null>(null);

    // 按还原度排序（ΔE 越小越好，null 值排最后）
    const sortedProfiles = [...paperProfiles].sort((a, b) => {
        if (a.deltaE === null && b.deltaE === null) return 0;
        if (a.deltaE === null) return 1;
        if (b.deltaE === null) return -1;
        return a.deltaE - b.deltaE;
    });
    const bestPaper = sortedProfiles[0];
    const tolerance = trueSource.deltaETolerance;

    // 创建纸张名称到推荐理由的映射（白名单）
    const whitelistReasonMap = new Map(
        paperRecommendations
            .filter(r => r.recommendationType === 'WHITELIST')
            .map(r => [r.paperName, r.reason])
    );

    // 创建纸张类型到打样包的映射
    const proofingPackMap = new Map(
        proofingPacks.map(p => [p.paperType, p])
    );

    // 切换展开状态
    const toggleExpanded = (paperType: string) => {
        setExpandedPaper(prev => prev === paperType ? null : paperType);
    };

    const cardStyle = cn(
        "backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl",
        "bg-white border-black/10",
        className
    );

    return (
        <Card className={cardStyle}>
            <CardContent className="p-8 space-y-8">
                {/* 标题区 */}
                <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/70">
                        色彩表现速览
                    </h3>
                </div>

                {/* 核心结论 */}
                {bestPaper && (
                    <div className="space-y-3">
                        <p className="text-2xl font-light leading-relaxed text-black">
                            <span className="font-medium">{colorName}</span>
                            <span className="text-black/60"> 推荐使用 </span>
                            <span className="font-medium">
                                {bestPaper.paperTypeLabel || PAPER_TYPE_LABELS[bestPaper.paperType]}
                            </span>
                        </p>
                        <p className="text-base text-black/60">
                            {bestPaper.deltaE !== null ? getQualityStatement(bestPaper.deltaE, tolerance) : '色差数据缺失'}
                        </p>
                    </div>
                )}

                {/* 分隔线 */}
                <div className="h-px bg-black/10" />

                {/* 纸张列表 */}
                <div className="space-y-1">
                    {sortedProfiles.map((profile, index) => {
                        const paperName = profile.paperTypeLabel || PAPER_TYPE_LABELS[profile.paperType] || profile.paperType;
                        const whitelistReason = whitelistReasonMap.get(paperName);
                        const proofingPack = proofingPackMap.get(profile.paperType);
                        const isExpanded = expandedPaper === profile.paperType;
                        const hasDetails = profile.glossiness !== undefined || profile.scanImageUrl;
                        
                        return (
                            <PaperRow
                                key={profile.paperType}
                                profile={profile}
                                trueSource={trueSource}
                                tolerance={tolerance}
                                isFirst={index === 0}
                                whitelistReason={whitelistReason}
                                proofingPack={proofingPack}
                                isExpanded={isExpanded}
                                hasDetails={hasDetails}
                                onToggle={() => toggleExpanded(profile.paperType)}
                            />
                        );
                    })}
                </div>


                {/* 底部说明 */}
                <p className="text-xs leading-relaxed text-black/50">
                    评级基于色差值 ΔE，生产容差标准为 {tolerance.toFixed(1)}。数值越低，色彩还原越准确。
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * 单行纸张信息（可展开详情）
 */
function PaperRow({
    profile,
    trueSource,
    tolerance,
    isFirst,
    whitelistReason,
    proofingPack,
    isExpanded,
    hasDetails,
    onToggle,
}: {
    profile: FullPaperProfile;
    trueSource: { labL: number; labA: number; labB: number };
    tolerance: number;
    isFirst: boolean;
    whitelistReason?: string;
    proofingPack?: ProofingPack;
    isExpanded: boolean;
    hasDetails: boolean;
    onToggle: () => void;
}) {
    const paperName = profile.paperTypeLabel || PAPER_TYPE_LABELS[profile.paperType] || profile.paperType;
    const quality = profile.deltaE !== null ? getQualityLevel(profile.deltaE, tolerance) : 0;

    return (
        <div className={cn(
            "transition-colors rounded-xl px-4 -mx-4",
            isExpanded ? "bg-black/[0.03]" : "hover:bg-black/[0.02]"
        )}>
            {/* 主行 - 可点击展开 */}
            <div 
                className={cn(
                    "flex items-center gap-4 py-4",
                    hasDetails && "cursor-pointer"
                )}
                onClick={hasDetails ? onToggle : undefined}
            >
                {/* 纸张名称 + 推荐标签 */}
                <div className="flex-1 flex items-center gap-3">
                    <span className="text-lg text-black font-medium">
                        {paperName}
                    </span>
                    {/* 推荐等级标签 */}
                    {profile.recommendation && (() => {
                        const config = RECOMMENDATION_CONFIG[profile.recommendation];
                        const Icon = config?.icon;
                        const label = profile.recommendationLabel || config?.label || profile.recommendation;
                        return (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-black/5 text-black/50">
                                {Icon && <Icon className="w-3 h-3" />}
                                {label}
                            </span>
                        );
                    })()}
                </div>

                {/* 质量指示器 + 展开箭头 */}
                <div className="flex items-center gap-4">
                    <QualityIndicator quality={quality} />
                    <span className="text-sm font-mono text-right tabular-nums text-black/60">
                        {profile.deltaE !== null ? `ΔE ${profile.deltaE.toFixed(1)}` : 'N/A'}
                    </span>
                    {/* 展开箭头 */}
                    {hasDetails && (
                        <ChevronDown className={cn(
                            "h-4 w-4 transition-transform text-black/40",
                            isExpanded && "rotate-180"
                        )} />
                    )}
                </div>
            </div>

            {/* 人工标注的推荐理由 */}
            {whitelistReason && !isExpanded && (
                <p className="text-sm pb-3 pl-0.5 text-black/50">
                    {whitelistReason}
                </p>
            )}

            {/* 注意事项 */}
            {profile.cautionNote && !whitelistReason && !isExpanded && (
                <p className="text-sm pb-3 pl-0.5 text-black/50">
                    {profile.cautionNote}
                </p>
            )}

            {/* 展开的详情面板 */}
            {isExpanded && hasDetails && (
                <PaperDetails 
                    profile={profile} 
                    trueSource={trueSource}
                    whitelistReason={whitelistReason}
                />
            )}
        </div>
    );
}

/**
 * 纸张详情面板
 */
function PaperDetails({
    profile,
    trueSource,
    whitelistReason,
}: {
    profile: FullPaperProfile;
    trueSource: { labL: number; labA: number; labB: number };
    whitelistReason?: string;
}) {
    return (
        <div className="pb-5 pt-2 space-y-5 border-t border-black/10">
            {/* 推荐理由或注意事项 */}
            {(whitelistReason || profile.cautionNote) && (
                <p className="text-sm text-black/60">
                    {whitelistReason || profile.cautionNote}
                </p>
            )}

            {/* 色块对比 + Lab 值 */}
            <div className="flex items-start gap-6">
                {/* 真源色块 */}
                <div className="space-y-2">
                    <span className="text-xs text-black/40">
                        真源
                    </span>
                    <ColorSwatch labL={trueSource.labL} labA={trueSource.labA} labB={trueSource.labB} size="sm" />
                </div>
                {/* 当前纸张色块 */}
                <div className="space-y-2">
                    <span className="text-xs text-black/40">
                        {profile.paperTypeLabel || profile.paperType}
                    </span>
                    <ColorSwatch labL={profile.labL} labA={profile.labA} labB={profile.labB} size="sm" />
                </div>
                {/* Lab 数值 */}
                <div className="flex-1 grid grid-cols-3 gap-4 text-sm font-mono text-black/70">
                    <div>
                        <span className="text-black/40">L* </span>
                        {profile.labL.toFixed(1)}
                    </div>
                    <div>
                        <span className="text-black/40">a* </span>
                        {profile.labA.toFixed(1)}
                    </div>
                    <div>
                        <span className="text-black/40">b* </span>
                        {profile.labB.toFixed(1)}
                    </div>
                </div>
            </div>

            {/* 材质参数 - 简化横条 */}
            {(profile.glossiness !== undefined || profile.inkAbsorption !== undefined || profile.gamutCoverage !== undefined) && (
                <div className="space-y-3">
                    {profile.glossiness !== undefined && (
                        <MaterialBar label="光泽度" value={profile.glossiness} />
                    )}
                    {profile.inkAbsorption !== undefined && (
                        <MaterialBar label="吸墨率" value={profile.inkAbsorption} />
                    )}
                    {profile.gamutCoverage !== undefined && (
                        <MaterialBar label="色域覆盖" value={profile.gamutCoverage} />
                    )}
                </div>
            )}

            {/* 验证批次 */}
            {profile.batchNo && (
                <div className="flex items-center gap-2 text-sm text-black/50">
                    <span>验证批次</span>
                    <code className="text-xs px-1.5 py-0.5 rounded font-mono bg-black/5">
                        {profile.batchNo}
                    </code>
                </div>
            )}

            {/* 高清扫描图 */}
            {profile.scanImageUrl && (
                <div className="space-y-2">
                    <span className="text-xs text-black/40">
                        高清扫描
                    </span>
                    <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-black/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={profile.scanImageUrl}
                            alt={`${profile.paperTypeLabel || profile.paperType} 扫描图`}
                            className="object-cover w-full h-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * 材质参数横条
 */
function MaterialBar({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs w-16 shrink-0 text-black/40">
                {label}
            </span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-black/10">
                <div 
                    className="h-full rounded-full transition-all bg-black/40"
                    style={{ width: `${value}%` }}
                />
            </div>
            <span className="text-xs font-mono w-10 text-right tabular-nums text-black/60">
                {value}%
            </span>
        </div>
    );
}

/**
 * 质量指示器 - 5个圆点
 */
function QualityIndicator({ quality }: { quality: number }) {
    return (
        <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((level) => (
                <div
                    key={level}
                    className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        level <= quality ? "bg-black/70" : "bg-black/15"
                    )}
                />
            ))}
        </div>
    );
}

// 辅助函数：计算质量等级 (1-5)
function getQualityLevel(deltaE: number, tolerance: number): number {
    if (deltaE <= tolerance * 0.5) return 5;
    if (deltaE <= tolerance) return 4;
    if (deltaE <= tolerance * 1.5) return 3;
    if (deltaE <= tolerance * 2.5) return 2;
    return 1;
}

// 辅助函数：生成质量陈述
function getQualityStatement(deltaE: number, tolerance: number): string {
    if (deltaE <= tolerance * 0.5) {
        return '色差极低，肉眼几乎无法察觉';
    } else if (deltaE <= tolerance) {
        return '色差在专业容差内，适合量产';
    } else if (deltaE <= tolerance * 1.5) {
        return '存在轻微色差，建议打样确认';
    } else {
        return '色差较大，请谨慎选择';
    }
}
