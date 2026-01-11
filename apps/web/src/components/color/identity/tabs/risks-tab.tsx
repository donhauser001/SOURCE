'use client';

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ColorData } from '../types';

interface RisksTabProps {
    risks: ColorData['risks'];
}

export function RisksTab({ risks }: RisksTabProps) {
    if (!risks || risks.length === 0) {
        return (
            <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
                <CardContent className="py-12 text-center">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-black/30" />
                    <p className="text-black/50">暂无风险记录</p>
                    <p className="text-sm mt-2 text-black/30">此颜色在已验证范围内表现稳定</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
                <CardContent className="p-6 space-y-5">
                    {/* 标题区 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/70">
                                风险与限制
                            </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                            {risks.length} 项风险
                        </span>
                    </div>
                    <p className="text-xs text-black/40">使用此颜色时需要注意的风险点和规避建议</p>

                    {/* 风险列表 */}
                    <div className="space-y-4">
                        {risks.map((risk) => (
                            <RiskItem key={risk.id} risk={risk} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// 风险条目
function RiskItem({ risk }: { risk: NonNullable<ColorData['risks']>[number] }) {
    return (
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/50 space-y-3">
            {/* 头部 */}
            <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {risk.riskTypeLabel}
                </span>
                <span className="text-xs text-black/40">
                    影响纸张: {risk.affectedPaperIds.join('、')}
                </span>
            </div>

            {/* 描述 */}
            <p className="text-sm text-amber-900/80">{risk.description}</p>

            {/* 规避建议 */}
            {risk.mitigation && (
                <div className="pt-2 border-t border-amber-200/50 space-y-1">
                    <span className="text-xs font-medium text-black/50">规避建议</span>
                    <p className="text-sm text-black/60">{risk.mitigation}</p>
                </div>
            )}
        </div>
    );
}
