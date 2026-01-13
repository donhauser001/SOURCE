'use client';

/**
 * 首页共建者展示组件
 * 
 * 设计特点：
 * - 分类型展示，每种角色有独特的视觉标识
 * - 卡片悬停效果展示详情
 * - 底部 CTA 引导加入
 */

import Link from 'next/link';
import { ArrowRight, Building2, FileStack, Droplets, Microscope, UserCheck, ExternalLink, Sparkles } from 'lucide-react';

interface Partner {
    id: string;
    partnerId: string;
    name: string;
    shortName: string | null;
    types: string[];
    logoUrl: string | null;
    websiteUrl: string | null;
}

interface PartnerStats {
    printers: number;
    paperVendors: number;
    inkVendors: number;
    labs: number;
    consultants: number;
}

interface PartnersSectionProps {
    partners: Partner[];
    stats: PartnerStats;
}

// 合作伙伴类型配置
const partnerTypeConfig = {
    PRINTER: {
        icon: Building2,
        label: '印刷工厂',
        color: 'from-blue-500/20 to-blue-600/5',
        borderColor: 'border-blue-500/20',
        iconColor: 'text-blue-500',
        desc: '印刷验证与批量生产',
    },
    PAPER_VENDOR: {
        icon: FileStack,
        label: '纸张供应商',
        color: 'from-amber-500/20 to-amber-600/5',
        borderColor: 'border-amber-500/20',
        iconColor: 'text-amber-500',
        desc: '提供纸张材料参数',
    },
    INK_VENDOR: {
        icon: Droplets,
        label: '油墨供应商',
        color: 'from-purple-500/20 to-purple-600/5',
        borderColor: 'border-purple-500/20',
        iconColor: 'text-purple-500',
        desc: '提供油墨配方数据',
    },
    LAB: {
        icon: Microscope,
        label: '色彩实验室',
        color: 'from-emerald-500/20 to-emerald-600/5',
        borderColor: 'border-emerald-500/20',
        iconColor: 'text-emerald-500',
        desc: '精准测量与校准',
    },
    CONSULTANT: {
        icon: UserCheck,
        label: '顾问专家',
        color: 'from-rose-500/20 to-rose-600/5',
        borderColor: 'border-rose-500/20',
        iconColor: 'text-rose-500',
        desc: '审核与专业指导',
    },
} as const;

type PartnerType = keyof typeof partnerTypeConfig;

export function PartnersSection({ partners, stats }: PartnersSectionProps) {
    // 按类型分组
    const getPartnersByType = (type: PartnerType) => {
        return partners.filter(p => p.types.includes(type));
    };

    const totalPartners = stats.printers + stats.paperVendors + stats.inkVendors + stats.labs + stats.consultants;

    return (
        <div className="space-y-12">
            {/* 标题区 */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                    <h3 className="text-2xl lg:text-3xl font-light text-foreground/80 leading-tight">
                        由行业专业力量
                        <br />
                        <span className="text-foreground/50">共同建设与验证</span>
                    </h3>
                </div>
                <div className="text-foreground/40 text-sm leading-relaxed">
                    SOURCE 的每一个色彩数据都经过实际印刷验证。印厂提供生产参数，
                    纸商提供材料数据，油墨商提供配方信息，实验室进行精准测量，
                    顾问团队把关审核。
                </div>
            </div>

            {/* 类型统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(partnerTypeConfig).map(([type, config]) => {
                    const typeKey = type as PartnerType;
                    const count = type === 'PRINTER' ? stats.printers
                        : type === 'PAPER_VENDOR' ? stats.paperVendors
                        : type === 'INK_VENDOR' ? stats.inkVendors
                        : type === 'LAB' ? stats.labs
                        : stats.consultants;
                    
                    const typePartners = getPartnersByType(typeKey);
                    const Icon = config.icon;

                    return (
                        <div
                            key={type}
                            className={`group relative p-5 rounded-2xl border ${config.borderColor} bg-gradient-to-br ${config.color} hover:scale-[1.02] transition-all cursor-default`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <Icon className={`h-5 w-5 ${config.iconColor}`} />
                                <span className="text-2xl font-semibold text-foreground/70 tabular-nums">
                                    {count}
                                </span>
                            </div>
                            <div className="text-sm font-medium text-foreground/70 mb-1">
                                {config.label}
                            </div>
                            <div className="text-[11px] text-foreground/40">
                                {config.desc}
                            </div>

                            {/* 悬停展示具体合作伙伴 */}
                            {typePartners.length > 0 && (
                                <div className="absolute inset-0 rounded-2xl bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all p-4 flex flex-col justify-center">
                                    <div className="text-xs text-foreground/50 mb-2">{config.label}</div>
                                    <div className="space-y-1.5">
                                        {typePartners.slice(0, 4).map((partner) => (
                                            <Link
                                                key={partner.id}
                                                href={`/partners/${partner.id}`}
                                                className="block text-sm text-foreground/70 hover:text-foreground truncate"
                                            >
                                                {partner.shortName || partner.name}
                                            </Link>
                                        ))}
                                        {typePartners.length > 4 && (
                                            <span className="text-xs text-foreground/30">
                                                +{typePartners.length - 4} 更多
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Logo 墙 */}
            {partners.length > 0 && (
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background pointer-events-none z-10" />
                    <div className="flex items-center gap-8 overflow-hidden py-4">
                        <div className="flex items-center gap-8 animate-[scroll_30s_linear_infinite]">
                            {[...partners, ...partners].map((partner, index) => (
                                <Link
                                    key={`${partner.id}-${index}`}
                                    href={`/partners/${partner.id}`}
                                    className="group flex items-center justify-center flex-shrink-0 w-28 h-14 rounded-xl border border-foreground/5 bg-foreground/[0.02] hover:border-foreground/10 hover:bg-foreground/[0.04] transition-all"
                                    title={partner.name}
                                >
                                    {partner.logoUrl ? (
                                        <img
                                            src={partner.logoUrl}
                                            alt={partner.name}
                                            className="max-w-[80%] max-h-[60%] object-contain opacity-40 group-hover:opacity-70 transition-opacity"
                                        />
                                    ) : (
                                        <span className="text-xs font-medium text-foreground/30 group-hover:text-foreground/50 transition-colors text-center px-2 truncate">
                                            {partner.shortName || partner.name}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CTA 区域 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-foreground/40" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-foreground/70">
                            成为 SOURCE 共建者
                        </div>
                        <div className="text-xs text-foreground/40">
                            参与色彩数据验证，获得官方认证标识
                        </div>
                    </div>
                </div>
                <Link
                    href="/partners"
                    className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-foreground/20 text-sm text-foreground/70 hover:bg-foreground/5 transition-all"
                >
                    了解更多
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>
        </div>
    );
}
