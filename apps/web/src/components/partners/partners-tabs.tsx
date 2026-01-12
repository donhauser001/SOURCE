'use client';

/**
 * 合作者列表客户端组件
 * 
 * 遵循 SOURCE 列表页面视觉交互规范
 * - 全圆角工具栏
 * - 搜索框展开/收缩动画
 * - Popover 多选筛选器（类型、地区）
 * - 视图切换（卡片/列表）
 * - 分页功能
 */

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
    Search, X, ChevronDown, ChevronLeft, ChevronRight, 
    LayoutGrid, List, Check,
    Building2, MapPin, Globe, Award, Printer, FileText, Droplets, FlaskConical, Users 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';

// =============================================================================
// 类型定义
// =============================================================================

type ViewMode = 'cards' | 'list';

interface PartnerWithCount {
    id: string;
    partnerId: string;
    name: string;
    shortName: string | null;
    types: string[];
    description: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
    region: string | null;
    certifications: string[];
    establishedYear: number | null;
    _count: {
        colorParticipations: number;
    };
}

interface Stats {
    total: number;
    printers: number;
    paperVendors: number;
    inkVendors: number;
    labs: number;
    consultants: number;
}

interface PartnersTabsProps {
    partners: PartnerWithCount[];
    stats: Stats;
}

// =============================================================================
// 常量
// =============================================================================

const PARTNER_TYPE_LABELS: Record<string, string> = {
    PRINTER: '印厂',
    PAPER_VENDOR: '纸商',
    INK_VENDOR: '油墨商',
    LAB: '实验室',
    CONSULTANT: '顾问',
};

const PARTNER_TYPE_ICONS: Record<string, typeof Building2> = {
    PRINTER: Printer,
    PAPER_VENDOR: FileText,
    INK_VENDOR: Droplets,
    LAB: FlaskConical,
    CONSULTANT: Users,
};

const PARTNER_TYPE_COLORS: Record<string, string> = {
    PRINTER: '#3B82F6',
    PAPER_VENDOR: '#F59E0B',
    INK_VENDOR: '#8B5CF6',
    LAB: '#22C55E',
    CONSULTANT: '#06B6D4',
};

// =============================================================================
// 主组件
// =============================================================================

export function PartnersTabs({ partners, stats }: PartnersTabsProps) {
    // 状态
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [search, setSearch] = useState('');
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [regionFilters, setRegionFilters] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    // 根据视图模式设置每页数量
    const pageSize = useMemo(() => {
        return viewMode === 'cards' ? 12 : 15;
    }, [viewMode]);

    // 从 localStorage 恢复视图模式
    useEffect(() => {
        const saved = localStorage.getItem('partners-view-mode');
        if (saved && ['cards', 'list'].includes(saved)) {
            setViewMode(saved as ViewMode);
        }
    }, []);

    // 保存视图模式到 localStorage
    useEffect(() => {
        localStorage.setItem('partners-view-mode', viewMode);
    }, [viewMode]);

    // 获取唯一的类型和地区
    const uniqueTypes = useMemo(() => {
        const types = new Set<string>();
        partners.forEach(p => p.types.forEach(t => types.add(t)));
        return Array.from(types);
    }, [partners]);

    const uniqueRegions = useMemo(() => {
        const regions = new Set<string>();
        partners.forEach(p => {
            if (p.region) regions.add(p.region);
        });
        return Array.from(regions).sort();
    }, [partners]);

    // 筛选合作者
    const filteredPartners = useMemo(() => {
        let result = partners;

        // 搜索筛选
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                p => p.name.toLowerCase().includes(q) ||
                    (p.shortName && p.shortName.toLowerCase().includes(q)) ||
                    p.partnerId.toLowerCase().includes(q)
            );
        }

        // 类型筛选
        if (typeFilters.length > 0) {
            result = result.filter(p => 
                typeFilters.some(t => p.types.includes(t))
            );
        }

        // 地区筛选
        if (regionFilters.length > 0) {
            result = result.filter(p => p.region && regionFilters.includes(p.region));
        }

        return result;
    }, [partners, search, typeFilters, regionFilters]);

    // 分页计算
    const totalPages = Math.ceil(filteredPartners.length / pageSize);

    const paginatedPartners = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredPartners.slice(start, end);
    }, [filteredPartners, currentPage, pageSize]);

    // 当筛选条件或视图模式变化时，重置到第一页
    useEffect(() => {
        setCurrentPage(1);
    }, [search, typeFilters, regionFilters, viewMode]);

    // 清除筛选
    const clearFilters = () => {
        setSearch('');
        setTypeFilters([]);
        setRegionFilters([]);
        setCurrentPage(1);
    };

    const hasFilters = search || typeFilters.length > 0 || regionFilters.length > 0;

    // 分页控制
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // 筛选器切换
    const toggleFilter = (
        value: string,
        current: string[],
        setter: (v: string[]) => void
    ) => {
        if (current.includes(value)) {
            setter(current.filter(v => v !== value));
        } else {
            setter([...current, value]);
        }
    };

    return (
        <div className="space-y-6">
            {/* 工具栏 - 全圆角风格 */}
            <div className="flex items-center gap-2 p-2 rounded-full bg-gray-100">
                {/* 搜索框 - 点击展开 */}
                <div
                    className={`
                        relative flex items-center
                        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${searchExpanded ? 'flex-1 min-w-0' : 'w-11 flex-shrink-0'}
                    `}
                >
                    <button
                        type="button"
                        onClick={() => setSearchExpanded(true)}
                        className={`
                            absolute left-0 top-0 h-11 w-11 rounded-full bg-white
                            flex items-center justify-center
                            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                            ${searchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-gray-50'}
                        `}
                    >
                        <Search className="h-5 w-5 text-gray-500" />
                    </button>
                    <div
                        className={`
                            relative w-full
                            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                            ${searchExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                        `}
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="搜索合作者名称..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onBlur={() => {
                                if (!search) setSearchExpanded(false);
                            }}
                            className="w-full pl-12 pr-10 h-11 bg-white border-0 rounded-full text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            autoFocus={searchExpanded}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setSearchExpanded(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* 右侧固定区域 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* 筛选按钮组 */}
                    <div className="flex items-center gap-2">
                        {/* 类型筛选 */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-11 w-24 bg-white border-0 rounded-full text-gray-700 gap-1 px-0 hover:bg-gray-50 justify-center">
                                    <span>类型</span>
                                    {typeFilters.length > 0 && (
                                        <span className="h-5 min-w-5 px-1.5 rounded-full bg-gray-900 text-white text-xs inline-flex items-center justify-center font-medium">
                                            {typeFilters.length}
                                        </span>
                                    )}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2 rounded-2xl" align="start">
                                <div className="space-y-1">
                                    {uniqueTypes.map(type => {
                                        const Icon = PARTNER_TYPE_ICONS[type] || Building2;
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => toggleFilter(type, typeFilters, setTypeFilters)}
                                                className={`
                                                    w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm
                                                    transition-colors duration-150
                                                    ${typeFilters.includes(type)
                                                        ? 'bg-gray-900 text-white'
                                                        : 'hover:bg-gray-100 text-gray-700'}
                                                `}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4" style={{ 
                                                        color: typeFilters.includes(type) ? 'white' : PARTNER_TYPE_COLORS[type] 
                                                    }} />
                                                    {PARTNER_TYPE_LABELS[type] || type}
                                                </span>
                                                {typeFilters.includes(type) && (
                                                    <Check className="h-4 w-4 flex-shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* 地区筛选 */}
                        {uniqueRegions.length > 0 && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-11 w-24 bg-white border-0 rounded-full text-gray-700 gap-1 px-0 hover:bg-gray-50 justify-center">
                                        <span>地区</span>
                                        {regionFilters.length > 0 && (
                                            <span className="h-5 min-w-5 px-1.5 rounded-full bg-gray-900 text-white text-xs inline-flex items-center justify-center font-medium">
                                                {regionFilters.length}
                                            </span>
                                        )}
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2 rounded-2xl" align="start">
                                    <div className="space-y-1 max-h-64 overflow-y-auto">
                                        {uniqueRegions.map(region => (
                                            <button
                                                key={region}
                                                type="button"
                                                onClick={() => toggleFilter(region, regionFilters, setRegionFilters)}
                                                className={`
                                                    w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm
                                                    transition-colors duration-150
                                                    ${regionFilters.includes(region)
                                                        ? 'bg-gray-900 text-white'
                                                        : 'hover:bg-gray-100 text-gray-700'}
                                                `}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    {region}
                                                </span>
                                                {regionFilters.includes(region) && (
                                                    <Check className="h-4 w-4 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}

                        {/* 清除筛选 */}
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-11 w-11 rounded-full text-gray-500 hover:text-gray-700 hover:bg-white p-0"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    {/* 分隔线 */}
                    <div className="h-8 w-px bg-gray-300" />

                    {/* 视图切换 */}
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(v) => v && setViewMode(v as ViewMode)}
                        className="bg-white rounded-full p-1"
                    >
                        <ToggleGroupItem
                            value="cards"
                            aria-label="卡片视图"
                            className="h-9 w-9 rounded-full data-[state=on]:bg-gray-900 data-[state=on]:text-white"
                        >
                            <LayoutGrid className="h-5 w-5" />
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="list"
                            aria-label="列表视图"
                            className="h-9 w-9 rounded-full data-[state=on]:bg-gray-900 data-[state=on]:text-white"
                        >
                            <List className="h-5 w-5" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            {/* 合作者列表 */}
            {filteredPartners.length > 0 ? (
                <>
                    {/* 卡片视图 */}
                    {viewMode === 'cards' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {paginatedPartners.map((partner) => (
                                <PartnerCard key={partner.id} partner={partner} />
                            ))}
                        </div>
                    )}

                    {/* 列表视图 - 表格样式 */}
                    {viewMode === 'list' && (
                        <div className="border border-gray-200 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">类型</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">地区</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">资质</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">参与</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {paginatedPartners.map((partner) => (
                                        <PartnerTableRow key={partner.id} partner={partner} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 分页控件 */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-8">
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
                </>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">没有找到匹配的合作者</p>
                    {hasFilters && (
                        <Button variant="outline" onClick={clearFilters} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                            清除筛选条件
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// 合作者卡片组件
// =============================================================================

function PartnerCard({ partner }: { partner: PartnerWithCount }) {
    // 获取主类型颜色
    const mainType = partner.types[0];
    const mainColor = PARTNER_TYPE_COLORS[mainType] || '#6B7280';
    
    return (
        <Link href={`/partners/${partner.partnerId}`} className="group block">
            <div 
                className="relative overflow-hidden rounded-3xl p-6 h-full flex flex-col bg-white border border-gray-200 transition-all duration-300 ease-out group-hover:border-gray-300 group-hover:shadow-sm"
            >
                {/* 头部：名称 + 类型图标 */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                            {partner.name}
                        </h3>
                        {partner.shortName && (
                            <p className="text-sm text-gray-500 truncate">{partner.shortName}</p>
                        )}
                    </div>
                    <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                        style={{ backgroundColor: `${mainColor}15` }}
                    >
                        {(() => {
                            const TypeIcon = PARTNER_TYPE_ICONS[mainType] || Building2;
                            return <TypeIcon className="h-5 w-5" style={{ color: mainColor }} />;
                        })()}
                    </div>
                </div>

                {/* 类型标签 */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {partner.types.map((type) => (
                        <span
                            key={type}
                            className="inline-flex items-center px-2 py-0.5 text-[10px] border rounded-full border-gray-400 text-gray-500"
                        >
                            {PARTNER_TYPE_LABELS[type] || type}
                        </span>
                    ))}
                </div>

                {/* 描述 */}
                {partner.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                        {partner.description}
                    </p>
                )}

                {/* 元数据 */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-auto">
                    {partner.region && (
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {partner.region}
                        </span>
                    )}
                    {partner.certifications.length > 0 && (
                        <span className="flex items-center gap-1">
                            <Award className="h-3.5 w-3.5" />
                            {partner.certifications.length} 项资质
                        </span>
                    )}
                    {partner._count.colorParticipations > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-900 text-white text-[10px] font-medium">
                            参与 {partner._count.colorParticipations} 色
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

// =============================================================================
// 合作者表格行组件
// =============================================================================

function PartnerTableRow({ partner }: { partner: PartnerWithCount }) {
    return (
        <tr className="group hover:bg-gray-50 transition-colors duration-150">
            {/* 名称 */}
            <td className="px-4 py-3">
                <Link href={`/partners/${partner.partnerId}`} className="block">
                    <div className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                        {partner.name}
                    </div>
                    {partner.shortName && (
                        <div className="text-xs text-gray-500">{partner.shortName}</div>
                    )}
                </Link>
            </td>
            
            {/* 类型 */}
            <td className="px-4 py-3 hidden sm:table-cell">
                <div className="flex flex-wrap gap-1">
                    {partner.types.map((type) => (
                        <span
                            key={type}
                            className="inline-flex items-center px-2 py-0.5 text-[10px] border rounded-full border-gray-400 text-gray-500"
                        >
                            {PARTNER_TYPE_LABELS[type] || type}
                        </span>
                    ))}
                </div>
            </td>
            
            {/* 地区 */}
            <td className="px-4 py-3 hidden md:table-cell">
                <span className="text-sm text-gray-600">
                    {partner.region || '-'}
                </span>
            </td>
            
            {/* 资质 */}
            <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-sm text-gray-600">
                    {partner.certifications.length > 0 ? `${partner.certifications.length} 项` : '-'}
                </span>
            </td>
            
            {/* 参与颜色 */}
            <td className="px-4 py-3 text-right">
                {partner._count.colorParticipations > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                        {partner._count.colorParticipations} 色
                    </span>
                ) : (
                    <span className="text-sm text-gray-400">-</span>
                )}
            </td>
        </tr>
    );
}
