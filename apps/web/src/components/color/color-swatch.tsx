'use client';

/**
 * 色块预览组件
 *
 * 将 Lab 值转换为 RGB 进行显示
 */

import { cn } from '@/lib/utils';

interface Props {
    labL: number;
    labA: number;
    labB: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Lab 转 RGB（简化版）
 * 注意：这只是近似转换，真实印刷效果需以实体打样为准
 */
export function labToRgb(L: number, a: number, b: number): { r: number; g: number; b: number } {
    // Lab to XYZ
    let y = (L + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    const fn = (t: number) => {
        return t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787;
    };

    // D65 白点
    x = 95.047 * fn(x);
    y = 100.0 * fn(y);
    z = 108.883 * fn(z);

    // XYZ to RGB (sRGB)
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let bVal = x * 0.0557 + y * -0.204 + z * 1.057;

    // 线性 RGB 到 sRGB
    const gammaCorrect = (c: number) => {
        c = c / 100;
        return c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
    };

    r = Math.round(Math.max(0, Math.min(255, gammaCorrect(r) * 255)));
    g = Math.round(Math.max(0, Math.min(255, gammaCorrect(g) * 255)));
    bVal = Math.round(Math.max(0, Math.min(255, gammaCorrect(bVal) * 255)));

    return { r, g, b: bVal };
}

export function ColorSwatch({ labL, labA, labB, size = 'md', className }: Props) {
    const rgb = labToRgb(labL, labA, labB);
    const bgColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

    // 判断是否需要浅色边框（当颜色较浅时）
    const needsBorder = labL > 80;

    const sizeClasses = {
        sm: 'w-12 h-12 rounded-lg',
        md: 'w-20 h-20 rounded-xl',
        lg: 'w-32 h-32 rounded-2xl',
    };

    return (
        <div
            className={cn(
                sizeClasses[size],
                'shadow-lg transition-transform hover:scale-105',
                needsBorder && 'ring-1 ring-black/10',
                className
            )}
            style={{ backgroundColor: bgColor }}
            title={`Lab: L*${labL.toFixed(1)} a*${labA.toFixed(1)} b*${labB.toFixed(1)}\nRGB: ${rgb.r}, ${rgb.g}, ${rgb.b}`}
        />
    );
}

