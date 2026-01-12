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

import React, { useState } from 'react';
import { ChevronDown, Star, ThumbsUp, AlertTriangle, Ban, Palette, Copy, Check, SplitSquareHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ColorSwatch, labToRgb } from '../color-swatch';

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
                <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-black/70" />
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
                        const hasDetails = profile.glossiness !== undefined || !!profile.scanImageUrl;
                        
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
        <div className="pb-5 pt-4 border-t border-black/10">
            {/* 推荐理由或注意事项 */}
            {(whitelistReason || profile.cautionNote) && (
                <p className="text-sm text-black/60 mb-4">
                    {whitelistReason || profile.cautionNote}
                </p>
            )}

            {/* 两列布局 */}
            <div className="grid grid-cols-2 gap-6">
                {/* 左列：色块（列内全宽）+ 对比按钮 */}
                <div className="relative">
                    <ColorSwatch 
                        labL={profile.labL} 
                        labA={profile.labA} 
                        labB={profile.labB} 
                        className="!w-full !h-20 !rounded-xl !shadow-none hover:!scale-100"
                    />
                    {/* 对比按钮 */}
                    <ColorCompareDialog
                        trueSource={trueSource}
                        profile={profile}
                    />
                </div>

                {/* 右列：材质参数 */}
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
            </div>

            {/* 底部栏：Lab 值 + 验证批次 */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5">
                {/* Lab 数值 + 复制按钮 */}
                <LabValuesCopyable labL={profile.labL} labA={profile.labA} labB={profile.labB} />
                
                {/* 验证批次 */}
                {profile.batchNo && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-black/40">验证批次</span>
                        <code className="text-xs px-1.5 py-0.5 rounded font-mono bg-black/5 text-black/70">
                            {profile.batchNo}
                        </code>
                    </div>
                )}
            </div>

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

/**
 * Lab 数值带复制按钮
 */
function LabValuesCopyable({ labL, labA, labB }: { labL: number; labA: number; labB: number }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = `L*${labL.toFixed(1)} a*${labA.toFixed(1)} b*${labB.toFixed(1)}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-3">
            <div className="flex gap-4 text-sm font-mono text-black/70">
                <div><span className="text-black/40">L* </span>{labL.toFixed(1)}</div>
                <div><span className="text-black/40">a* </span>{labA.toFixed(1)}</div>
                <div><span className="text-black/40">b* </span>{labB.toFixed(1)}</div>
            </div>
            <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-black/5 transition-colors text-black/40 hover:text-black/60"
                title="复制 Lab 值"
            >
                {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                    <Copy className="h-3.5 w-3.5" />
                )}
            </button>
        </div>
    );
}

/**
 * 色彩对比弹窗（可拖动滑块对比）
 */
function ColorCompareDialog({
    trueSource,
    profile,
}: {
    trueSource: { labL: number; labA: number; labB: number };
    profile: FullPaperProfile;
}) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percent);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percent);
    };

    const trueRgb = labToRgb(trueSource.labL, trueSource.labA, trueSource.labB);
    const profileRgb = labToRgb(profile.labL, profile.labA, profile.labB);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button 
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-black/60 hover:text-black transition-colors"
                    title="对比真源色"
                >
                    <SplitSquareHorizontal className="h-4 w-4" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>色彩对比 · {profile.paperTypeLabel || profile.paperType}</DialogTitle>
                </DialogHeader>
                
                {/* 可拖动对比区域 */}
                <div 
                    ref={containerRef}
                    className="relative w-full h-64 rounded-xl overflow-hidden cursor-ew-resize select-none"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                >
                    {/* 纸型模拟色（底层，全宽） */}
                    <div 
                        className="absolute inset-0"
                        style={{ backgroundColor: `rgb(${profileRgb.r}, ${profileRgb.g}, ${profileRgb.b})` }}
                    />
                    
                    {/* 真源色（上层，宽度由滑块控制） */}
                    <div 
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                    >
                        <div 
                            className="h-full"
                            style={{ 
                                backgroundColor: `rgb(${trueRgb.r}, ${trueRgb.g}, ${trueRgb.b})`,
                                width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100vw'
                            }}
                        />
                    </div>

                    {/* 滑块手柄 */}
                    <div 
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleMouseDown}
                    >
                        {/* 手柄圆点 */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                            <div className="flex gap-0.5">
                                <div className="w-0.5 h-4 bg-black/30 rounded-full" />
                                <div className="w-0.5 h-4 bg-black/30 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* 标签 */}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/50 text-white text-xs font-medium">
                        真源色
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/50 text-white text-xs font-medium">
                        {profile.paperTypeLabel || profile.paperType}
                    </div>
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between pt-2 text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">真源色</p>
                        <p className="font-mono text-xs">
                            L*{trueSource.labL.toFixed(1)} a*{trueSource.labA.toFixed(1)} b*{trueSource.labB.toFixed(1)}
                        </p>
                    </div>
                    {profile.deltaE !== null && (
                        <div className="text-center">
                            <p className="text-2xl font-bold">ΔE {profile.deltaE.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">色差值</p>
                        </div>
                    )}
                    <div className="space-y-1 text-right">
                        <p className="text-muted-foreground">{profile.paperTypeLabel || profile.paperType}</p>
                        <p className="font-mono text-xs">
                            L*{profile.labL.toFixed(1)} a*{profile.labA.toFixed(1)} b*{profile.labB.toFixed(1)}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
