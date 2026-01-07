'use client';

/**
 * 导入数据预览组件
 * 
 * 显示待导入数据的表格预览
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    data: Array<Record<string, unknown> | object>;
    columns: string[];
    pageSize?: number;
}

// 列名中文映射
const COLUMN_LABELS: Record<string, string> = {
    colorId: '色号',
    name: '名称',
    slug: '别名',
    labL: 'L*',
    labA: 'a*',
    labB: 'b*',
    status: '状态',
    auditStatus: '审计状态',
    measurementDevice: '测量设备',
    measurementStandard: '测量标准',
    paperType: '纸张类型',
    deltaE: 'ΔE',
    glossiness: '光泽度',
    inkAbsorption: '吸墨率',
    gamutCoverage: '色域覆盖',
    recommendation: '推荐等级',
    cautionNote: '注意事项',
};

// 状态值中文映射
const STATUS_LABELS: Record<string, string> = {
    ACTIVE: '激活',
    EXPERIMENTAL: '实验中',
    DEPRECATED: '已废弃',
    DRAFT: '草稿',
    VERIFIED: '已验证',
    UNDER_REVIEW: '审核中',
    BEST: '最佳',
    GOOD: '良好',
    CAUTION: '注意',
    AVOID: '避免',
    PREMIUM_MATTE: '高阶映画',
    UNCOATED: '纯质纸',
    COATED: '铜版纸',
    OFFSET: '双胶纸',
    LIGHTWEIGHT: '轻型纸',
};

export function ImportPreview({ data, columns, pageSize = 10 }: Props) {
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(data.length / pageSize);
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, data.length);
    const currentData = data.slice(startIndex, endIndex);

    // 格式化单元格值
    const formatValue = (value: unknown, column: string): string => {
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        
        const strValue = String(value);
        
        // 尝试中文映射
        if (STATUS_LABELS[strValue]) {
            return STATUS_LABELS[strValue];
        }
        
        // 数字格式化
        if (column.startsWith('lab') || column === 'deltaE') {
            const num = parseFloat(strValue);
            if (!isNaN(num)) {
                return num.toFixed(1);
            }
        }
        
        // 百分比字段
        if (['glossiness', 'inkAbsorption', 'gamutCoverage'].includes(column)) {
            const num = parseFloat(strValue);
            if (!isNaN(num)) {
                return `${num.toFixed(0)}%`;
            }
        }
        
        return strValue;
    };

    return (
        <div className="space-y-4">
            {/* 表格 */}
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">
                                    #
                                </th>
                                {columns.map(col => (
                                    <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">
                                        {COLUMN_LABELS[col] || col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {currentData.map((row, index) => (
                                <tr key={index} className="hover:bg-muted/30">
                                    <td className="px-3 py-2 text-muted-foreground">
                                        {startIndex + index + 1}
                                    </td>
                                    {columns.map(col => (
                                        <td key={col} className="px-3 py-2">
                                            {formatValue((row as Record<string, unknown>)[col], col)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 分页控制 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        显示 {startIndex + 1}-{endIndex} 条，共 {data.length} 条
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {page + 1} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

