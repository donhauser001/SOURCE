'use client';

/**
 * 验证错误显示组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';

interface ValidationError {
    row: number;
    field: string;
    message: string;
    value?: unknown;
}

interface Props {
    errors: ValidationError[];
    onDismiss?: () => void;
    maxDisplay?: number;
}

// 字段名中文映射
const FIELD_LABELS: Record<string, string> = {
    colorId: '色号',
    name: '名称',
    slug: '别名',
    labL: 'L*',
    labA: 'a*',
    labB: 'b*',
    status: '状态',
    auditStatus: '审计状态',
    paperType: '纸张类型',
    recommendation: '推荐等级',
    glossiness: '光泽度',
    inkAbsorption: '吸墨率',
    gamutCoverage: '色域覆盖',
    deltaE: 'ΔE',
};

export function ValidationErrors({ errors, onDismiss, maxDisplay = 10 }: Props) {
    const displayErrors = errors.slice(0, maxDisplay);
    const moreCount = errors.length - maxDisplay;

    return (
        <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <CardTitle className="text-base text-destructive">
                            数据验证错误 ({errors.length})
                        </CardTitle>
                    </div>
                    {onDismiss && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDismiss}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {displayErrors.map((error, index) => (
                        <div 
                            key={index} 
                            className="flex items-start gap-3 p-2 rounded bg-background/80 text-sm"
                        >
                            <span className="shrink-0 px-2 py-0.5 rounded bg-destructive/10 text-destructive text-xs font-medium">
                                行 {error.row}
                            </span>
                            <div className="flex-1">
                                <span className="font-medium">
                                    {FIELD_LABELS[error.field] || error.field}
                                </span>
                                <span className="text-muted-foreground mx-1">-</span>
                                <span>{error.message}</span>
                                {error.value !== undefined && (
                                    <span className="text-muted-foreground ml-1">
                                        (当前值: {String(error.value)})
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {moreCount > 0 && (
                        <p className="text-sm text-muted-foreground pt-2">
                            还有 {moreCount} 个错误未显示...
                        </p>
                    )}
                </div>
                
                <p className="text-sm text-muted-foreground mt-4">
                    请修正以上错误后重新上传文件
                </p>
            </CardContent>
        </Card>
    );
}

