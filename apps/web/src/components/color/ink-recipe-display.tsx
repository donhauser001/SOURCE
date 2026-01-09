'use client';

/**
 * 油墨配方展示组件
 */

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Props {
    recipe: Record<string, number>;
    isDark?: boolean;
}

// 油墨颜色映射（用于视觉区分）
const inkColors: Record<string, string> = {
    冲淡剂: 'bg-slate-200',
    射光蓝: 'bg-blue-500',
    荧光红: 'bg-pink-500',
    荧光黄: 'bg-yellow-400',
    黑: 'bg-black',
    白: 'bg-white border border-gray-200',
    青: 'bg-cyan-500',
    品红: 'bg-fuchsia-500',
    黄: 'bg-yellow-500',
};

export function InkRecipeDisplay({ recipe, isDark = false }: Props) {
    const entries = Object.entries(recipe).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
        return (
            <p className={cn("text-sm text-center py-4", isDark ? "text-white/40" : "text-black/40")}>
                暂无配方数据
            </p>
        );
    }

    // 计算总量
    const total = entries.reduce((sum, [, value]) => sum + value, 0);

    return (
        <div className="space-y-4">
            {/* 配方条形图 */}
            <div className={cn(
                "h-8 w-full rounded-lg overflow-hidden flex border",
                isDark ? "border-white/10" : "border-black/5"
            )}>
                {entries.map(([name, value], index) => {
                    const percentage = (value / total) * 100;
                    const bgColor = inkColors[name] || 'bg-gray-400';
                    return (
                        <div
                            key={name}
                            className={`${bgColor} transition-all`}
                            style={{ width: `${percentage}%` }}
                            title={`${name}: ${value}%`}
                        />
                    );
                })}
            </div>

            {/* 配方明细 */}
            <div className="space-y-3">
                {entries.map(([name, value]) => (
                    <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        "w-3 h-3 rounded-full",
                                        inkColors[name] || 'bg-gray-400',
                                        name === '白' && !isDark && "border border-gray-200"
                                    )}
                                />
                                <span className={isDark ? "text-white/90" : "text-black/90"}>{name}</span>
                            </div>
                            <span className={cn("font-mono font-medium", isDark ? "text-white/90" : "text-black/90")}>{value}%</span>
                        </div>
                        <Progress value={value} className="h-1.5" />
                    </div>
                ))}
            </div>

            {/* 总计 */}
            <div className={cn(
                "pt-3 border-t flex justify-between text-sm",
                isDark ? "border-white/10" : "border-black/10"
            )}>
                <span className={isDark ? "text-white/40" : "text-black/40"}>总计</span>
                <span className={cn("font-mono font-medium", isDark ? "text-white/90" : "text-black/90")}>{total}%</span>
            </div>
        </div>
    );
}

