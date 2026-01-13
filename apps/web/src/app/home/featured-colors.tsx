'use client';

/**
 * 首页精选色彩组件
 * 
 * 使用 StandardColorCard，5 列 3 行网格布局
 */

import { StandardColorCard } from '@/components/color/standard-color-card';

interface ColorData {
    id: string;
    colorId: string;
    name: string;
    labL: number;
    labA: number;
    labB: number;
    status: string;
    auditStatus: string;
    colorFamily: string | null;
}

interface FeaturedColorsProps {
    colors: ColorData[];
}

export function FeaturedColors({ colors }: FeaturedColorsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {colors.slice(0, 15).map((color) => (
                <StandardColorCard 
                    key={color.id} 
                    color={{
                        id: color.id,
                        colorId: color.colorId,
                        name: color.name,
                        labL: color.labL,
                        labA: color.labA,
                        labB: color.labB,
                        status: color.status,
                        auditStatus: color.auditStatus,
                    }}
                    showGradient={true}
                    showVerifiedBadge={true}
                    showRecipeCount={false}
                />
            ))}
        </div>
    );
}
