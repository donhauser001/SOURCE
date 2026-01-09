'use client';

/**
 * 视图模式切换组件
 * 
 * 设计师模式 ↔ 专家模式
 */

import { Palette, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewMode, type ViewMode } from './view-mode-context';

interface ViewModeToggleProps {
    isDark?: boolean;
    className?: string;
}

export function ViewModeToggle({ isDark = false, className }: ViewModeToggleProps) {
    const { mode, setMode } = useViewMode();

    const modes: { value: ViewMode; label: string; icon: typeof Palette }[] = [
        { value: 'designer', label: '设计师', icon: Palette },
        { value: 'expert', label: '专家', icon: FlaskConical },
    ];

    const isDesignerMode = mode === 'designer';

    return (
        <div
            className={cn(
                'inline-flex p-1 rounded-full transition-colors duration-300',
                isDesignerMode 
                    ? 'bg-black/5 border border-black/10'
                    : 'bg-white/10 border border-white/20',
                className
            )}
        >
            {modes.map(({ value, label, icon: Icon }) => (
                <button
                    key={value}
                    onClick={() => setMode(value)}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 sm:px-4 rounded-full transition-all duration-300 text-sm font-medium outline-none focus:outline-none focus-visible:ring-0',
                        mode === value
                            ? isDesignerMode
                                ? 'bg-black text-white'
                                : 'bg-white/20 text-white'
                            : isDesignerMode
                                ? 'text-black/50 hover:text-black/70'
                                : 'text-white/50 hover:text-white/80'
                    )}
                >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}模式</span>
                </button>
            ))}
        </div>
    );
}
