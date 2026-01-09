'use client';

/**
 * 视图模式切换组件
 * 
 * 设计师模式 ↔ 专家模式
 */

import { Palette, FlaskConical } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useViewMode, type ViewMode } from './view-mode-context';

interface ViewModeToggleProps {
    isDark?: boolean;
    className?: string;
}

export function ViewModeToggle({ isDark = false, className }: ViewModeToggleProps) {
    const { mode, setMode } = useViewMode();

    const modes: { value: ViewMode; label: string; icon: typeof Palette; description: string }[] = [
        {
            value: 'designer',
            label: '设计师',
            icon: Palette,
            description: '直观的风险预警与还原度评分',
        },
        {
            value: 'expert',
            label: '专家',
            icon: FlaskConical,
            description: 'Lab 数据图表与精密分析',
        },
    ];

    return (
        <div
            className={cn(
                'inline-flex p-0.5 rounded-full border backdrop-blur-2xl',
                isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5',
                className
            )}
        >
            {modes.map(({ value, label, icon: Icon, description }) => (
                <Tooltip key={value}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => setMode(value)}
                            className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 rounded-full transition-all duration-300 text-sm font-medium',
                                mode === value
                                    ? isDark
                                        ? 'bg-white/15 text-white'
                                        : 'bg-black/10 text-black'
                                    : isDark
                                        ? 'text-white/50 hover:text-white/70'
                                        : 'text-black/50 hover:text-black/70'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{label}模式</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>{description}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    );
}
