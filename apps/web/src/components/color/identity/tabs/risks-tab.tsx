'use client';

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useViewMode } from '../view-mode-context';
import type { ColorData } from '../types';

interface RisksTabProps {
    risks: ColorData['risks'];
}

export function RisksTab({ risks }: RisksTabProps) {
    const { isDark } = useViewMode();

    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none",
        isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
    );

    if (!risks || risks.length === 0) {
        return (
            <Card className={cardStyle}>
                <CardContent className="py-12 text-center opacity-50">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-4" />
                    <p>暂无风险记录</p>
                    <p className="text-sm mt-2">此颜色在已验证范围内表现稳定</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className={cardStyle}>
                <CardHeader>
                    <CardTitle className={cn(
                        "flex items-center gap-2",
                        isDark ? "text-white" : "text-black"
                    )}>
                        <AlertTriangle className={cn("h-5 w-5", isDark ? "text-orange-400" : "text-orange-600")} />
                        风险与限制
                    </CardTitle>
                    <CardDescription className={isDark ? "text-white/40" : "text-black/40"}>使用此颜色时需要注意的风险点和规避建议</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {risks.map((risk) => (
                            <RiskItem key={risk.id} risk={risk} isDark={isDark} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// 风险条目
function RiskItem({ risk, isDark }: { risk: NonNullable<ColorData['risks']>[number]; isDark: boolean }) {
    return (
        <div className={cn(
            "p-4 border rounded-lg",
            isDark
                ? "border-orange-900/50 bg-orange-950/20 text-white/90"
                : "border-orange-200 bg-orange-50 text-orange-900"
        )}>
            <div className="flex items-center gap-2 mb-2">
                <Badge variant="warning">{risk.riskTypeLabel}</Badge>
                <span className={cn("text-sm", isDark ? "text-white/40" : "text-black/40")}>
                    影响纸张: {risk.affectedPaperIds.join('、')}
                </span>
            </div>
            <p className="text-sm">{risk.description}</p>
            {risk.mitigation && (
                <div className={cn(
                    "mt-2 pt-2 border-t",
                    isDark ? "border-white/10" : "border-black/10"
                )}>
                    <span className="text-sm font-medium">规避建议：</span>
                    <p className={cn("text-sm", isDark ? "text-white/60" : "text-black/60")}>{risk.mitigation}</p>
                </div>
            )}
        </div>
    );
}
