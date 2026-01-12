'use client';

/**
 * 合作者颜色网格组件 - 带分页
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MinimalColorCard } from '@/components/color/minimal-color-card';

interface ColorData {
    id: string;
    colorId: string;
    name: string;
    labL: number;
    labA: number;
    labB: number;
}

interface PartnerColorGridProps {
    colors: ColorData[];
    pageSize?: number;
}

export function PartnerColorGrid({ colors, pageSize = 24 }: PartnerColorGridProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(colors.length / pageSize);

    const paginatedColors = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return colors.slice(start, end);
    }, [colors, currentPage, pageSize]);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    if (colors.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                暂无参与记录
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {/* 颜色网格 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {paginatedColors.map((color) => (
                    <MinimalColorCard
                        key={color.id}
                        color={color}
                    />
                ))}
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-10 w-10 p-0 rounded-full border-gray-200 disabled:opacity-40"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-1">
                        <Button
                            variant={currentPage === 1 ? "default" : "ghost"}
                            size="sm"
                            onClick={() => goToPage(1)}
                            className={`h-10 w-10 p-0 rounded-full ${currentPage === 1 ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}`}
                        >
                            1
                        </Button>

                        {currentPage > 3 && totalPages > 5 && (
                            <span className="px-2 text-gray-400">···</span>
                        )}

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                if (page === 1 || page === totalPages) return false;
                                if (totalPages <= 5) return true;
                                return Math.abs(page - currentPage) <= 1;
                            })
                            .map(page => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => goToPage(page)}
                                    className={`h-10 w-10 p-0 rounded-full ${currentPage === page ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}`}
                                >
                                    {page}
                                </Button>
                            ))
                        }

                        {currentPage < totalPages - 2 && totalPages > 5 && (
                            <span className="px-2 text-gray-400">···</span>
                        )}

                        {totalPages > 1 && (
                            <Button
                                variant={currentPage === totalPages ? "default" : "ghost"}
                                size="sm"
                                onClick={() => goToPage(totalPages)}
                                className={`h-10 w-10 p-0 rounded-full ${currentPage === totalPages ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}`}
                            >
                                {totalPages}
                            </Button>
                        )}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-10 w-10 p-0 rounded-full border-gray-200 disabled:opacity-40"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
    );
}
