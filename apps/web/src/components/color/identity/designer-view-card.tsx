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
import { AlertTriangle, ExternalLink, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useViewMode } from './view-mode-context';
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
    const { isDark } = useViewMode();
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

    // 分离白名单和黑名单
    const whitelistRecommendations = paperRecommendations.filter(r => r.recommendationType === 'WHITELIST');
    const blacklistRecommendations = paperRecommendations.filter(r => r.recommendationType === 'BLACKLIST');

    // 创建纸张名称到推荐理由的映射
    const whitelistReasonMap = new Map(
        whitelistRecommendations.map(r => [r.paperName, r.reason])
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
        isDark
            ? "bg-white/[0.03] border-white/[0.08]"
            : "bg-black/[0.02] border-black/[0.05]",
        className
    );

    return (
        <Card className={cardStyle}>
            <CardContent className="p-8 space-y-8">
                {/* 标题区 */}
                <div className="flex items-baseline justify-between">
                    <h3 className={cn(
                        "text-sm font-bold uppercase tracking-[0.15em]",
                        isDark ? "text-white/70" : "text-black/70"
                    )}>
                        色彩表现速览
                    </h3>
                </div>

                {/* 核心结论 */}
                {bestPaper && (
                    <div className="space-y-3">
                        <p className={cn(
                            "text-2xl font-light leading-relaxed",
                            isDark ? "text-white" : "text-black"
                        )}>
                            <span className="font-medium">{colorName}</span>
                            <span className={isDark ? "text-white/60" : "text-black/60"}> 推荐使用 </span>
                            <span className="font-medium">
                                {bestPaper.paperTypeLabel || PAPER_TYPE_LABELS[bestPaper.paperType]}
                            </span>
                        </p>
                        <p className={cn(
                            "text-base",
                            isDark ? "text-white/60" : "text-black/60"
                        )}>
                            {bestPaper.deltaE !== null ? getQualityStatement(bestPaper.deltaE, tolerance) : '色差数据缺失'}
                        </p>
                    </div>
                )}

                {/* 分隔线 */}
                <div className={cn(
                    "h-px",
                    isDark ? "bg-white/10" : "bg-black/10"
                )} />

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
                                isDark={isDark}
                                whitelistReason={whitelistReason}
                                proofingPack={proofingPack}
                                isExpanded={isExpanded}
                                hasDetails={hasDetails}
                                onToggle={() => toggleExpanded(profile.paperType)}
                            />
                        );
                    })}
                </div>

                {/* 打样包说明 */}
                {proofingPacks.length > 0 && (
                    <p className={cn(
                        "text-xs",
                        isDark ? "text-white/40" : "text-black/40"
                    )}>
                        购买单色打样包，体验该颜色真实印刷效果
                    </p>
                )}

                {/* 黑名单警示 - 简洁单色设计 */}
                {blacklistRecommendations.length > 0 && (
                    <>
                        <div className={cn(
                            "h-px",
                            isDark ? "bg-white/10" : "bg-black/10"
                        )} />
                        <div className="space-y-3">
                            <div className={cn(
                                "flex items-center gap-2 text-sm",
                                isDark ? "text-white/50" : "text-black/50"
                            )}>
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>不建议使用</span>
                            </div>
                            <div className="space-y-2">
                                {blacklistRecommendations.map((rec) => (
                                    <div
                                        key={rec.id}
                                        className={cn(
                                            "py-3 px-4 rounded-xl -mx-4",
                                            isDark 
                                                ? "bg-white/[0.03]" 
                                                : "bg-black/[0.02]"
                                        )}
                                    >
                                        <div className={cn(
                                            "text-base",
                                            isDark ? "text-white/70" : "text-black/70"
                                        )}>
                                            {rec.paperName}
                                        </div>
                                        <p className={cn(
                                            "text-sm mt-1",
                                            isDark ? "text-white/40" : "text-black/50"
                                        )}>
                                            {rec.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* 底部说明 */}
                <p className={cn(
                    "text-xs leading-relaxed",
                    isDark ? "text-white/50" : "text-black/50"
                )}>
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
    isDark,
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
    isDark: boolean;
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
            isExpanded
                ? (isDark ? "bg-white/[0.05]" : "bg-black/[0.03]")
                : (isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]")
        )}>
            {/* 主行 - 可点击展开 */}
            <div 
                className={cn(
                    "flex items-center gap-4 py-4",
                    hasDetails && "cursor-pointer"
                )}
                onClick={hasDetails ? onToggle : undefined}
            >
                {/* 纸张名称 */}
                <div className="flex-1 flex items-center gap-3">
                    <span className={cn(
                        "text-lg",
                        isFirst
                            ? (isDark ? "text-white font-medium" : "text-black font-medium")
                            : (isDark ? "text-white/80" : "text-black/80")
                    )}>
                        {paperName}
                    </span>
                    {isFirst && (
                        <span className={cn(
                            "text-xs uppercase tracking-wider px-2.5 py-1 rounded-full",
                            isDark
                                ? "bg-white/10 text-white/70"
                                : "bg-black/5 text-black/70"
                        )}>
                            推荐
                        </span>
                    )}
                </div>

                {/* 质量指示器 + 购买链接 + 展开箭头 */}
                <div className="flex items-center gap-4">
                    <QualityIndicator quality={quality} isDark={isDark} />
                    <span className={cn(
                        "text-sm font-mono text-right tabular-nums",
                        isDark ? "text-white/60" : "text-black/60"
                    )}>
                        {profile.deltaE !== null ? `ΔE ${profile.deltaE.toFixed(1)}` : 'N/A'}
                    </span>
                    {/* 购买链接 */}
                    {proofingPack?.externalUrl && (
                        <a
                            href={proofingPack.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors",
                                isDark
                                    ? "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                                    : "bg-black/5 text-black/60 hover:bg-black/10 hover:text-black"
                            )}
                        >
                            ¥{(proofingPack.price / 100).toFixed(0)}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                    {/* 展开箭头 */}
                    {hasDetails && (
                        <ChevronDown className={cn(
                            "h-4 w-4 transition-transform",
                            isDark ? "text-white/40" : "text-black/40",
                            isExpanded && "rotate-180"
                        )} />
                    )}
                </div>
            </div>

            {/* 人工标注的推荐理由 */}
            {whitelistReason && !isExpanded && (
                <p className={cn(
                    "text-sm pb-3 pl-0.5",
                    isDark ? "text-white/40" : "text-black/50"
                )}>
                    {whitelistReason}
                </p>
            )}

            {/* 注意事项 */}
            {profile.cautionNote && !whitelistReason && !isExpanded && (
                <p className={cn(
                    "text-sm pb-3 pl-0.5",
                    isDark ? "text-white/40" : "text-black/50"
                )}>
                    {profile.cautionNote}
                </p>
            )}

            {/* 展开的详情面板 */}
            {isExpanded && hasDetails && (
                <PaperDetails 
                    profile={profile} 
                    trueSource={trueSource}
                    isDark={isDark} 
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
    isDark,
    whitelistReason,
}: {
    profile: FullPaperProfile;
    trueSource: { labL: number; labA: number; labB: number };
    isDark: boolean;
    whitelistReason?: string;
}) {
    return (
        <div className={cn(
            "pb-5 pt-2 space-y-5 border-t",
            isDark ? "border-white/10" : "border-black/10"
        )}>
            {/* 推荐理由或注意事项 */}
            {(whitelistReason || profile.cautionNote) && (
                <p className={cn(
                    "text-sm",
                    isDark ? "text-white/50" : "text-black/60"
                )}>
                    {whitelistReason || profile.cautionNote}
                </p>
            )}

            {/* 色块对比 + Lab 值 */}
            <div className="flex items-start gap-6">
                {/* 真源色块 */}
                <div className="space-y-2">
                    <span className={cn("text-xs", isDark ? "text-white/40" : "text-black/40")}>
                        真源
                    </span>
                    <ColorSwatch labL={trueSource.labL} labA={trueSource.labA} labB={trueSource.labB} size="sm" />
                </div>
                {/* 当前纸张色块 */}
                <div className="space-y-2">
                    <span className={cn("text-xs", isDark ? "text-white/40" : "text-black/40")}>
                        {profile.paperTypeLabel || profile.paperType}
                    </span>
                    <ColorSwatch labL={profile.labL} labA={profile.labA} labB={profile.labB} size="sm" />
                </div>
                {/* Lab 数值 */}
                <div className={cn(
                    "flex-1 grid grid-cols-3 gap-4 text-sm font-mono",
                    isDark ? "text-white/70" : "text-black/70"
                )}>
                    <div>
                        <span className={isDark ? "text-white/40" : "text-black/40"}>L* </span>
                        {profile.labL.toFixed(1)}
                    </div>
                    <div>
                        <span className={isDark ? "text-white/40" : "text-black/40"}>a* </span>
                        {profile.labA.toFixed(1)}
                    </div>
                    <div>
                        <span className={isDark ? "text-white/40" : "text-black/40"}>b* </span>
                        {profile.labB.toFixed(1)}
                    </div>
                </div>
            </div>

            {/* 材质参数 - 简化横条 */}
            {(profile.glossiness !== undefined || profile.inkAbsorption !== undefined || profile.gamutCoverage !== undefined) && (
                <div className="space-y-3">
                    {profile.glossiness !== undefined && (
                        <MaterialBar label="光泽度" value={profile.glossiness} isDark={isDark} />
                    )}
                    {profile.inkAbsorption !== undefined && (
                        <MaterialBar label="吸墨率" value={profile.inkAbsorption} isDark={isDark} />
                    )}
                    {profile.gamutCoverage !== undefined && (
                        <MaterialBar label="色域覆盖" value={profile.gamutCoverage} isDark={isDark} />
                    )}
                </div>
            )}

            {/* 验证批次 */}
            {profile.batchNo && (
                <div className={cn(
                    "flex items-center gap-2 text-sm",
                    isDark ? "text-white/50" : "text-black/50"
                )}>
                    <span>验证批次</span>
                    <code className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-mono",
                        isDark ? "bg-white/10" : "bg-black/5"
                    )}>
                        {profile.batchNo}
                    </code>
                </div>
            )}

            {/* 高清扫描图 */}
            {profile.scanImageUrl && (
                <div className="space-y-2">
                    <span className={cn("text-xs", isDark ? "text-white/40" : "text-black/40")}>
                        高清扫描
                    </span>
                    <div className={cn(
                        "relative aspect-[3/1] rounded-lg overflow-hidden",
                        isDark ? "bg-white/5" : "bg-black/5"
                    )}>
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
function MaterialBar({ label, value, isDark }: { label: string; value: number; isDark: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <span className={cn(
                "text-xs w-16 shrink-0",
                isDark ? "text-white/40" : "text-black/40"
            )}>
                {label}
            </span>
            <div className={cn(
                "flex-1 h-1.5 rounded-full overflow-hidden",
                isDark ? "bg-white/10" : "bg-black/10"
            )}>
                <div 
                    className={cn(
                        "h-full rounded-full transition-all",
                        isDark ? "bg-white/50" : "bg-black/40"
                    )}
                    style={{ width: `${value}%` }}
                />
            </div>
            <span className={cn(
                "text-xs font-mono w-10 text-right tabular-nums",
                isDark ? "text-white/60" : "text-black/60"
            )}>
                {value}%
            </span>
        </div>
    );
}

/**
 * 质量指示器 - 5个圆点
 */
function QualityIndicator({ quality, isDark }: { quality: number; isDark: boolean }) {
    return (
        <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((level) => (
                <div
                    key={level}
                    className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        level <= quality
                            ? (isDark ? "bg-white/80" : "bg-black/70")
                            : (isDark ? "bg-white/20" : "bg-black/15")
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
