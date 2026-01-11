'use client';

/**
 * 色彩簿色彩列表客户端组件
 * 
 * 支持按色系搜索和筛选
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { labToRgb } from '@/lib/color';

// 色系标签
const COLOR_FAMILY_LABELS: Record<string, string> = {
    RED: '红色系',
    ORANGE: '橙色系',
    YELLOW: '黄色系',
    GREEN: '绿色系',
    CYAN: '青色系',
    BLUE: '蓝色系',
    PURPLE: '紫色系',
    PINK: '粉色系',
    BROWN: '棕色系',
    NEUTRAL: '中性色',
};

const COLOR_FAMILY_COLORS: Record<string, string> = {
    RED: '#DC2626',
    ORANGE: '#EA580C',
    YELLOW: '#CA8A04',
    GREEN: '#16A34A',
    CYAN: '#0891B2',
    BLUE: '#2563EB',
    PURPLE: '#9333EA',
    PINK: '#EC4899',
    BROWN: '#92400E',
    NEUTRAL: '#6B7280',
};

interface ColorEntry {
    id: string;
    sectionName: string | null;
    pageNumber: string | null;
    color: {
        id: string;
        colorId: string;
        name: string;
        slug: string;
        labL: number;
        labA: number;
        labB: number;
        status: string;
        auditStatus: string;
        colorFamily: string | null;
    };
}

interface Props {
    entries: ColorEntry[];
}

export function ColorBookColorList({ entries }: Props) {
    const [search, setSearch] = useState('');
    const [familyFilter, setFamilyFilter] = useState<string>('all');

    // 获取所有唯一的色系
    const uniqueFamilies = useMemo(() => {
        const families = new Set<string>();
        entries.forEach(e => {
            if (e.color.colorFamily) families.add(e.color.colorFamily);
        });
        return Array.from(families);
    }, [entries]);

    // 按章节分组并筛选
    const filteredSections = useMemo(() => {
        let filtered = entries;

        // 搜索筛选
        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(
                e => e.color.colorId.toLowerCase().includes(q) ||
                    e.color.name.toLowerCase().includes(q)
            );
        }

        // 色系筛选
        if (familyFilter !== 'all') {
            filtered = filtered.filter(e => e.color.colorFamily === familyFilter);
        }

        // 按章节分组
        const groups: Map<string, ColorEntry[]> = new Map();
        for (const entry of filtered) {
            const key = entry.sectionName || '';
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(entry);
        }

        return Array.from(groups.entries()).map(([name, entries]) => ({
            name: name || null,
            entries,
        }));
    }, [entries, search, familyFilter]);

    const totalFiltered = filteredSections.reduce((sum, s) => sum + s.entries.length, 0);
    const hasFilters = search || familyFilter !== 'all';

    const clearFilters = () => {
        setSearch('');
        setFamilyFilter('all');
    };

    return (
        <div className="space-y-6">
            {/* 筛选栏 */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-muted/50">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="搜索颜色编号或名称..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={familyFilter} onValueChange={setFamilyFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="全部色系" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部色系</SelectItem>
                        {uniqueFamilies.map(family => (
                            <SelectItem key={family} value={family}>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLOR_FAMILY_COLORS[family] || '#6B7280' }}
                                    />
                                    {COLOR_FAMILY_LABELS[family] || family}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                        <X className="h-4 w-4" />
                        清除
                    </Button>
                )}

                <div className="flex items-center text-sm text-muted-foreground ml-auto">
                    显示 {totalFiltered} / {entries.length} 种色彩
                </div>
            </div>

            {/* 色彩列表 */}
            {filteredSections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    没有找到匹配的颜色
                </div>
            ) : (
                filteredSections.map((section, idx) => (
                    <div key={section.name || idx} className="mb-12">
                        {section.name && (
                            <h2 className="text-xl font-semibold text-foreground mb-6 pb-2 border-b">
                                {section.name}
                            </h2>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {section.entries.map((entry) => (
                                <ColorCard
                                    key={entry.id}
                                    color={entry.color}
                                    pageNumber={entry.pageNumber}
                                />
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

// 色彩卡片组件
function ColorCard({
    color,
    pageNumber,
}: {
    color: {
        id: string;
        colorId: string;
        name: string;
        slug: string;
        labL: number;
        labA: number;
        labB: number;
        colorFamily: string | null;
    };
    pageNumber: string | null;
}) {
    const rgb = labToRgb(color.labL, color.labA, color.labB);
    const bgColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const isLight = color.labL > 60;

    return (
        <Link
            href={`/color/${color.colorId}`}
            className="group block"
        >
            <div
                className="aspect-square rounded-xl shadow-sm transition-all duration-200 group-hover:shadow-lg group-hover:scale-105 relative overflow-hidden"
                style={{ backgroundColor: bgColor }}
            >
                {/* 悬停时显示信息 */}
                <div className={`absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isLight ? 'bg-black/30' : 'bg-white/20'
                }`}>
                    <span className={`text-xs font-medium truncate ${
                        isLight ? 'text-white' : 'text-white'
                    }`}>
                        {color.colorId}
                    </span>
                </div>
                
                {/* 页码标记 */}
                {pageNumber && (
                    <div className={`absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        isLight ? 'bg-black/20 text-black/70' : 'bg-white/20 text-white/70'
                    }`}>
                        {pageNumber}
                    </div>
                )}

                {/* 色系标记 */}
                {color.colorFamily && (
                    <div className={`absolute top-2 left-2 w-2.5 h-2.5 rounded-full ${
                        isLight ? 'ring-1 ring-black/20' : 'ring-1 ring-white/30'
                    }`}
                        style={{ backgroundColor: COLOR_FAMILY_COLORS[color.colorFamily] || '#6B7280' }}
                        title={COLOR_FAMILY_LABELS[color.colorFamily] || color.colorFamily}
                    />
                )}
            </div>
            <div className="mt-2 text-center">
                <p className="text-sm font-medium text-foreground truncate">
                    {color.name}
                </p>
                <p className="text-xs text-muted-foreground">
                    {color.colorId}
                </p>
            </div>
        </Link>
    );
}
