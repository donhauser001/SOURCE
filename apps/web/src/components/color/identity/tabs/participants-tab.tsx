'use client';

import { Users, Building2, User, Globe, ShieldCheck, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useViewMode } from '../view-mode-context';
import type { Participation } from '../types';

interface ParticipantsTabProps {
    participations: Participation[];
}

export function ParticipantsTab({ participations }: ParticipantsTabProps) {
    const { isDark } = useViewMode();

    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none",
        isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
    );

    if (participations.length === 0) {
        return (
            <Card className={cardStyle}>
                <CardContent className="py-12 text-center opacity-50">
                    <Users className="h-12 w-12 mx-auto mb-4" />
                    <p>暂无参与者记录</p>
                    <p className="text-sm mt-2">参与者信息将在合作确认后发布</p>
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
            <Card className={cardStyle}>
                <CardHeader>
                    <CardTitle className={cn(
                        "flex items-center gap-2",
                        isDark ? "text-white" : "text-black"
                    )}>
                        <Users className="h-5 w-5" />
                        参与者
                    </CardTitle>
                    <CardDescription className={isDark ? "text-white/40" : "text-black/40"}>参与此颜色验证、配方开发、数据审计的合作者</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        {sortedRoles.map((role) => (
                            <RoleGroup key={role} role={role} participants={groupedByRole[role]} isDark={isDark} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// 角色分组
function RoleGroup({ role, participants, isDark }: { role: string; participants: Participation[]; isDark: boolean }) {
    return (
        <div>
            <div className={cn(
                "flex items-center gap-2 mb-3 font-medium",
                getRoleColor(role, isDark)
            )}>
                {getRoleIcon(role)}
                {participants[0]?.roleInColorLabel || role}
                <Badge variant="outline" className={cn(
                    "ml-auto text-xs",
                    isDark ? "border-white/10 text-white/50" : "border-black/10 text-black/50"
                )}>
                    {participants.length}
                </Badge>
            </div>
            <div className="space-y-2">
                {participants.map((p) => (
                    <ParticipantItem key={p.id} participant={p} isDark={isDark} />
                ))}
            </div>
        </div>
    );
}

// 参与者条目
function ParticipantItem({ participant: p, isDark }: { participant: Participation; isDark: boolean }) {
    return (
        <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
        )}>
            {getEntityIcon(p)}
            <div className="flex-1 min-w-0">
                <div className={cn("font-medium truncate", isDark ? "text-white/90" : "text-black/90")}>{getEntityName(p)}</div>
                {getEntitySubtitle(p) && (
                    <div className={cn("text-xs truncate", isDark ? "text-white/40" : "text-black/40")}>{getEntitySubtitle(p)}</div>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary" className={cn(
                        "text-[10px]",
                        isDark ? "bg-white/10 text-white/70" : "bg-black/5 text-black/70"
                    )}>
                        {p.scopeLabel}
                    </Badge>
                    {p.note && (
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="outline" className={cn(
                                    "text-[10px]",
                                    isDark ? "border-white/10 text-white/50" : "border-black/10 text-black/50"
                                )}>
                                    <Info className="h-2.5 w-2.5 mr-0.5" />
                                    备注
                                </Badge>
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
                        className={cn(
                            "text-xs hover:underline inline-flex items-center gap-1 mt-1",
                            isDark ? "text-cyan-400" : "text-cyan-600"
                        )}
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
function getRoleIcon(role: string) {
    switch (role) {
        case 'PRINTER':
        case 'PAPER_SUPPLIER':
        case 'INK_SUPPLIER':
            return <Building2 className="h-4 w-4" />;
        case 'AUDITOR':
            return <ShieldCheck className="h-4 w-4" />;
        case 'CO_BUILDER':
        case 'TESTER':
        case 'RESEARCHER':
            return <User className="h-4 w-4" />;
        default:
            return <Users className="h-4 w-4" />;
    }
}

function getRoleColor(role: string, isDark: boolean) {
    if (isDark) {
        switch (role) {
            case 'PRINTER': return 'text-blue-400';
            case 'PAPER_SUPPLIER': return 'text-amber-400';
            case 'INK_SUPPLIER': return 'text-purple-400';
            case 'AUDITOR': return 'text-green-400';
            case 'CO_BUILDER': return 'text-cyan-400';
            case 'TESTER': return 'text-orange-400';
            case 'RESEARCHER': return 'text-indigo-400';
            default: return 'text-white/50';
        }
    } else {
        switch (role) {
            case 'PRINTER': return 'text-blue-600';
            case 'PAPER_SUPPLIER': return 'text-amber-600';
            case 'INK_SUPPLIER': return 'text-purple-600';
            case 'AUDITOR': return 'text-green-600';
            case 'CO_BUILDER': return 'text-cyan-600';
            case 'TESTER': return 'text-orange-600';
            case 'RESEARCHER': return 'text-indigo-600';
            default: return 'text-black/50';
        }
    }
}

function getEntityIcon(p: Participation) {
    switch (p.entityType) {
        case 'PARTNER':
            return <Building2 className="h-4 w-4 text-muted-foreground" />;
        case 'USER':
            return <User className="h-4 w-4 text-muted-foreground" />;
        case 'EXTERNAL':
            return <Globe className="h-4 w-4 text-muted-foreground" />;
        default:
            return <Users className="h-4 w-4 text-muted-foreground" />;
    }
}

function getEntityName(p: Participation) {
    return p.partnerShortName || p.partnerName || p.userName || p.externalEntityName || '未知';
}

function getEntitySubtitle(p: Participation) {
    return p.partnerId || p.userEmail || null;
}
