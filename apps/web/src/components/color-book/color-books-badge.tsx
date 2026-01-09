'use client';

/**
 * 色彩所属色彩簿标签组件
 * 用于色彩详情页显示该色彩所属的色彩簿
 */

import Link from 'next/link';
import { Book } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ColorBookInfo } from '@/components/color/identity/types';

interface ColorBooksBadgeProps {
    colorBooks: ColorBookInfo[];
    isDark?: boolean;
    className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    CLASSIC: '经典系列',
    SEASONAL: '季节系列',
    THEMED: '主题系列',
    REGIONAL: '地域系列',
    CUSTOM: '定制系列',
};

export function ColorBooksBadge({ colorBooks, isDark = false, className }: ColorBooksBadgeProps) {
    if (!colorBooks || colorBooks.length === 0) {
        return null;
    }

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {colorBooks.map((book) => (
                <Link
                    key={book.id}
                    href={`/color-book/${book.slug}`}
                    className="group"
                >
                    <Badge
                        variant="outline"
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 transition-all",
                            isDark
                                ? "border-white/30 text-white/80 hover:bg-white/10 hover:border-white/50"
                                : "border-black/20 text-black/70 hover:bg-black/5 hover:border-black/40"
                        )}
                    >
                        <Book className="w-3.5 h-3.5" />
                        <span className="font-medium">{book.name}</span>
                        {book.pageNumber && (
                            <span className={cn(
                                "text-xs",
                                isDark ? "text-white/50" : "text-black/50"
                            )}>
                                #{book.pageNumber}
                            </span>
                        )}
                    </Badge>
                </Link>
            ))}
        </div>
    );
}
