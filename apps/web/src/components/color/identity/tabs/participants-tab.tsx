'use client';

import { Users, Building2, User, Globe, ShieldCheck, ExternalLink, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Participation } from '../types';

interface ParticipantsTabProps {
    participations: Participation[];
}

export function ParticipantsTab({ participations }: ParticipantsTabProps) {
    if (participations.length === 0) {
        return (
            <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
                <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-black/30" />
                    <p className="text-black/50">暂无参与者记录</p>
                    <p className="text-sm mt-2 text-black/30">参与者信息将在合作确认后发布</p>
                </CardContent>
            </Card>
        );
    }

    // 按角色分组参与者
    const groupedByRole = participations.reduce((acc, p) => {
        const role = p.roleInColor;
        if (!acc[role]) acc[role] = [];
        acc[role].push(p);
        return acc;
    }, {} as Record<string, Participation[]>);

    const roleOrder = ['PRINTER', 'PAPER_SUPPLIER', 'INK_SUPPLIER', 'AUDITOR', 'CO_BUILDER', 'TESTER', 'RESEARCHER'];
    const sortedRoles = Object.keys(groupedByRole).sort(
        (a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b)
    );

    return (
        <div className="space-y-6">
            <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
                <CardContent className="p-6 space-y-5">
                    {/* 标题区 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-black/70" />
                            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/70">
                                参与者
                            </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-black/5 text-black/50">
                            {participations.length} 位参与者
                        </span>
                    </div>
                    <p className="text-xs text-black/40">参与此颜色验证、配方开发、数据审计的合作者</p>

                    {/* 角色分组 */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {sortedRoles.map((role) => (
                            <RoleGroup key={role} role={role} participants={groupedByRole[role]} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// 角色分组
function RoleGroup({ role, participants }: { role: string; participants: Participation[] }) {
    const getRoleStyle = (role: string) => {
        switch (role) {
            case 'PRINTER': return { color: 'text-blue-600', bg: 'bg-blue-50' };
            case 'PAPER_SUPPLIER': return { color: 'text-amber-600', bg: 'bg-amber-50' };
            case 'INK_SUPPLIER': return { color: 'text-purple-600', bg: 'bg-purple-50' };
            case 'AUDITOR': return { color: 'text-emerald-600', bg: 'bg-emerald-50' };
            case 'CO_BUILDER': return { color: 'text-cyan-600', bg: 'bg-cyan-50' };
            case 'TESTER': return { color: 'text-orange-600', bg: 'bg-orange-50' };
            case 'RESEARCHER': return { color: 'text-indigo-600', bg: 'bg-indigo-50' };
            default: return { color: 'text-black/50', bg: 'bg-black/5' };
        }
    };

    const style = getRoleStyle(role);

    return (
        <div className="space-y-3">
            {/* 角色标题 */}
            <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${style.bg}`}>
                    {getRoleIcon(role, style.color)}
                </div>
                <span className={`text-sm font-medium ${style.color}`}>
                    {participants[0]?.roleInColorLabel || role}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-black/5 text-black/40">
                    {participants.length}
                </span>
            </div>

            {/* 参与者列表 */}
            <div className="space-y-2">
                {participants.map((p) => (
                    <ParticipantItem key={p.id} participant={p} />
                ))}
            </div>
        </div>
    );
}

// 参与者条目
function ParticipantItem({ participant: p }: { participant: Participation }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/5">
            {/* 实体图标 */}
            <div className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
                {getEntityIcon(p)}
            </div>

            {/* 信息区 */}
            <div className="flex-1 min-w-0">
                <div className="font-medium text-black/90 truncate">{getEntityName(p)}</div>
                {getEntitySubtitle(p) && (
                    <div className="text-xs text-black/40 truncate">{getEntitySubtitle(p)}</div>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-black/60">
                        {p.scopeLabel}
                    </span>
                    {p.note && (
                        <Tooltip>
                            <TooltipTrigger>
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-black/10 text-black/40 inline-flex items-center gap-0.5">
                                    <Info className="h-2.5 w-2.5" />
                                    备注
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">{p.note}</TooltipContent>
                        </Tooltip>
                    )}
                </div>
                {p.evidenceUrl && (
                    <a
                        href={p.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-black/50 hover:text-black inline-flex items-center gap-1 mt-1.5 transition-colors"
                    >
                        查看证据
                        <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                )}
            </div>
        </div>
    );
}

// 工具函数
function getRoleIcon(role: string, colorClass: string) {
    const className = `h-3.5 w-3.5 ${colorClass}`;
    switch (role) {
        case 'PRINTER':
        case 'PAPER_SUPPLIER':
        case 'INK_SUPPLIER':
            return <Building2 className={className} />;
        case 'AUDITOR':
            return <ShieldCheck className={className} />;
        case 'CO_BUILDER':
        case 'TESTER':
        case 'RESEARCHER':
            return <User className={className} />;
        default:
            return <Users className={className} />;
    }
}

function getEntityIcon(p: Participation) {
    const className = "h-4 w-4 text-black/40";
    switch (p.entityType) {
        case 'PARTNER':
            return <Building2 className={className} />;
        case 'USER':
            return <User className={className} />;
        case 'EXTERNAL':
            return <Globe className={className} />;
        default:
            return <Users className={className} />;
    }
}

function getEntityName(p: Participation) {
    return p.partnerShortName || p.partnerName || p.userName || p.externalEntityName || '未知';
}

function getEntitySubtitle(p: Participation) {
    return p.partnerId || p.userEmail || null;
}
