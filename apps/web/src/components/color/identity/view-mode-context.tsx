'use client';

/**
 * 视图模式上下文
 * 
 * 设计师模式：感性、直观、风险预警（人话）
 * 专家模式：理性、精密、Lab 数据图表
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

export type ViewMode = 'designer' | 'expert';

interface ViewModeContextValue {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    isDesigner: boolean;
    isExpert: boolean;
    isDark: boolean;
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function ViewModeProvider({ children, isDark }: { children: ReactNode; isDark: boolean }) {
    const [mode, setMode] = useState<ViewMode>('designer');

    return (
        <ViewModeContext.Provider
            value={{
                mode,
                setMode,
                isDesigner: mode === 'designer',
                isExpert: mode === 'expert',
                isDark,
            }}
        >
            {children}
        </ViewModeContext.Provider>
    );
}

export function useViewMode() {
    const context = useContext(ViewModeContext);
    if (!context) {
        throw new Error('useViewMode must be used within ViewModeProvider');
    }
    return context;
}
