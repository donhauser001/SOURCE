'use client';

/**
 * 色彩数据导入页面
 * 
 * 支持 CSV 和 JSON 格式导入
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, 
    FileSpreadsheet, 
    FileJson, 
    CheckCircle2, 
    Download,
    Loader2
} from 'lucide-react';
import { CsvUploader } from '../_components/csv-uploader';
import { JsonUploader } from '../_components/json-uploader';
import { ImportPreview } from '../_components/import-preview';
import { ValidationErrors } from '../_components/validation-errors';
import { trpc } from '@/lib/trpc';

// 导入状态
type ImportStatus = 'idle' | 'validating' | 'previewing' | 'importing' | 'success' | 'error';

// 验证错误类型
interface ValidationError {
    row: number;
    field: string;
    message: string;
    value?: unknown;
}

// 色彩状态类型
type ColorStatusType = 'ACTIVE' | 'VERIFIED' | 'EXPERIMENTAL' | 'DEPRECATED' | 'DRAFT';
type AuditStatusType = 'VERIFIED' | 'PENDING';

// 色彩数据记录
interface ColorRecord {
    colorId: string;
    name: string;
    slug?: string;
    labL: number;
    labA: number;
    labB: number;
    status?: ColorStatusType;
    auditStatus?: AuditStatusType;
    measurementDevice?: string;
    measurementStandard?: string;
    measuredAt?: string;
    version?: string;
}

// CSV 字段映射模板
const CSV_TEMPLATE_FIELDS = [
    'colorId',
    'name',
    'slug',
    'labL',
    'labA',
    'labB',
    'status',
    'auditStatus',
    'measurementDevice',
    'measurementStandard',
    'measuredAt',
    'version',
];

export default function ImportColorsPage() {
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [data, setData] = useState<ColorRecord[]>([]);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [importResult, setImportResult] = useState<{
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);

    // tRPC mutation
    const importMutation = trpc.color.adminImport.useMutation();

    // 处理 CSV 数据
    const handleCsvData = useCallback((records: Record<string, unknown>[]) => {
        setStatus('validating');
        const validatedData: ColorRecord[] = [];
        const validationErrors: ValidationError[] = [];

        records.forEach((record, index) => {
            const rowNum = index + 2; // +2 因为 CSV 第一行是头部，从 1 开始计数

            // 必填字段检查
            if (!record.colorId) {
                validationErrors.push({
                    row: rowNum,
                    field: 'colorId',
                    message: 'colorId 是必填字段',
                });
            }
            if (!record.name) {
                validationErrors.push({
                    row: rowNum,
                    field: 'name',
                    message: 'name 是必填字段',
                });
            }
            if (record.labL === undefined || record.labL === '') {
                validationErrors.push({
                    row: rowNum,
                    field: 'labL',
                    message: 'labL 是必填字段',
                });
            }
            if (record.labA === undefined || record.labA === '') {
                validationErrors.push({
                    row: rowNum,
                    field: 'labA',
                    message: 'labA 是必填字段',
                });
            }
            if (record.labB === undefined || record.labB === '') {
                validationErrors.push({
                    row: rowNum,
                    field: 'labB',
                    message: 'labB 是必填字段',
                });
            }

            // 数值范围检查
            const labL = parseFloat(String(record.labL));
            const labA = parseFloat(String(record.labA));
            const labB = parseFloat(String(record.labB));

            if (!isNaN(labL) && (labL < 0 || labL > 100)) {
                validationErrors.push({
                    row: rowNum,
                    field: 'labL',
                    message: 'labL 必须在 0-100 之间',
                    value: labL,
                });
            }
            if (!isNaN(labA) && (labA < -128 || labA > 127)) {
                validationErrors.push({
                    row: rowNum,
                    field: 'labA',
                    message: 'labA 必须在 -128 到 127 之间',
                    value: labA,
                });
            }
            if (!isNaN(labB) && (labB < -128 || labB > 127)) {
                validationErrors.push({
                    row: rowNum,
                    field: 'labB',
                    message: 'labB 必须在 -128 到 127 之间',
                    value: labB,
                });
            }

            // 如果没有致命错误，添加到数据
            if (record.colorId && record.name && !isNaN(labL) && !isNaN(labA) && !isNaN(labB)) {
                const statusValue = record.status ? String(record.status).toUpperCase() : 'EXPERIMENTAL';
                const auditStatusValue = record.auditStatus ? String(record.auditStatus).toUpperCase() : 'PENDING';
                
                validatedData.push({
                    colorId: String(record.colorId),
                    name: String(record.name),
                    slug: record.slug ? String(record.slug) : undefined,
                    labL,
                    labA,
                    labB,
                    status: statusValue as ColorStatusType,
                    auditStatus: auditStatusValue as AuditStatusType,
                    measurementDevice: record.measurementDevice ? String(record.measurementDevice) : undefined,
                    measurementStandard: record.measurementStandard ? String(record.measurementStandard) : undefined,
                    measuredAt: record.measuredAt ? String(record.measuredAt) : undefined,
                    version: record.version ? String(record.version) : '1.0',
                });
            }
        });

        setData(validatedData);
        setErrors(validationErrors);
        setStatus(validationErrors.length > 0 ? 'error' : 'previewing');
    }, []);

    // 处理 JSON 数据
    const handleJsonData = useCallback((records: unknown[]) => {
        // 复用 CSV 数据处理逻辑
        handleCsvData(records as Record<string, unknown>[]);
    }, [handleCsvData]);

    // 执行导入（使用 tRPC mutation）
    const handleImport = async () => {
        if (data.length === 0) return;

        setStatus('importing');
        try {
            const result = await importMutation.mutateAsync({ colors: data });
            
            setImportResult({
                success: result.success,
                failed: result.failed,
                errors: result.errors,
            });
            setStatus('success');
        } catch (error) {
            setImportResult({
                success: 0,
                failed: data.length,
                errors: [error instanceof Error ? error.message : '导入失败'],
            });
            setStatus('error');
        }
    };

    // 重置状态
    const handleReset = () => {
        setStatus('idle');
        setData([]);
        setErrors([]);
        setImportResult(null);
    };

    // 下载 CSV 模板
    const downloadTemplate = () => {
        const header = CSV_TEMPLATE_FIELDS.join(',');
        const example = [
            'CN-Song-04',
            '烟雨青',
            'yanyu-qing',
            '65.2',
            '-8.5',
            '12.3',
            'EXPERIMENTAL',
            'PENDING',
            'X-Rite i1Pro 2',
            'D50/2°',
            '2026-01-08',
            '1.0',
        ].join(',');
        const csv = `${header}\n${example}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'colors-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* 返回按钮 */}
            <div className="flex items-center">
                <Link href="/admin/import">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
            </div>

            {/* 状态提示 */}
            {status === 'success' && importResult && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="flex items-center gap-4 pt-6">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="font-medium text-green-800">导入完成</p>
                            <p className="text-sm text-green-700">
                                成功导入 {importResult.success} 条记录
                                {importResult.failed > 0 && `，${importResult.failed} 条失败`}
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleReset} className="ml-auto">
                            继续导入
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* 主要内容 */}
            {status !== 'success' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>上传数据文件</CardTitle>
                                <CardDescription>
                                    选择 CSV 或 JSON 格式的数据文件进行导入
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                                <Download className="h-4 w-4" />
                                下载模板
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="csv" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="csv" className="gap-2">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    CSV 格式
                                </TabsTrigger>
                                <TabsTrigger value="json" className="gap-2">
                                    <FileJson className="h-4 w-4" />
                                    JSON 格式
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="csv">
                                <CsvUploader 
                                    onDataParsed={handleCsvData}
                                    disabled={status === 'importing'}
                                />
                            </TabsContent>

                            <TabsContent value="json">
                                <JsonUploader 
                                    onDataParsed={handleJsonData}
                                    disabled={status === 'importing'}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {/* 验证错误 */}
            {errors.length > 0 && (
                <ValidationErrors errors={errors} onDismiss={() => setErrors([])} />
            )}

            {/* 数据预览 */}
            {(status === 'previewing' || status === 'importing') && data.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CardTitle>数据预览</CardTitle>
                                <Badge variant="secondary">{data.length} 条记录</Badge>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleReset} disabled={status === 'importing'}>
                                    取消
                                </Button>
                                <Button onClick={handleImport} disabled={status === 'importing'} className="gap-2">
                                    {status === 'importing' && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {status === 'importing' ? '导入中...' : '确认导入'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ImportPreview 
                            data={data} 
                            columns={['colorId', 'name', 'labL', 'labA', 'labB', 'status']}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

