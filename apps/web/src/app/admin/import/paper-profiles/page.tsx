'use client';

/**
 * 纸张数据导入页面
 * 
 * 支持 CSV 和 JSON 格式导入 PaperProfile 数据
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

// 导入状态
type ImportStatus = 'idle' | 'validating' | 'previewing' | 'importing' | 'success' | 'error';

// 验证错误类型
interface ValidationError {
    row: number;
    field: string;
    message: string;
    value?: unknown;
}

// 纸张数据记录
interface PaperProfileRecord {
    colorId: string;
    paperType: string;
    labL: number;
    labA: number;
    labB: number;
    deltaE?: number;
    glossiness: number;
    inkAbsorption: number;
    gamutCoverage: number;
    recommendation: string;
    cautionNote?: string;
}

// 有效的纸张类型
const VALID_PAPER_TYPES = ['PREMIUM_MATTE', 'UNCOATED', 'COATED', 'OFFSET', 'LIGHTWEIGHT'];
const VALID_RECOMMENDATIONS = ['BEST', 'GOOD', 'CAUTION', 'AVOID'];

// CSV 字段模板
const CSV_TEMPLATE_FIELDS = [
    'colorId',
    'paperType',
    'labL',
    'labA',
    'labB',
    'deltaE',
    'glossiness',
    'inkAbsorption',
    'gamutCoverage',
    'recommendation',
    'cautionNote',
];

export default function ImportPaperProfilesPage() {
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [data, setData] = useState<PaperProfileRecord[]>([]);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [importResult, setImportResult] = useState<{
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);

    // 处理 CSV 数据
    const handleCsvData = useCallback((records: Record<string, unknown>[]) => {
        setStatus('validating');
        const validatedData: PaperProfileRecord[] = [];
        const validationErrors: ValidationError[] = [];

        records.forEach((record, index) => {
            const rowNum = index + 2;

            // 必填字段检查
            if (!record.colorId) {
                validationErrors.push({
                    row: rowNum,
                    field: 'colorId',
                    message: 'colorId 是必填字段',
                });
            }
            if (!record.paperType) {
                validationErrors.push({
                    row: rowNum,
                    field: 'paperType',
                    message: 'paperType 是必填字段',
                });
            } else if (!VALID_PAPER_TYPES.includes(String(record.paperType))) {
                validationErrors.push({
                    row: rowNum,
                    field: 'paperType',
                    message: `无效的纸张类型，可选: ${VALID_PAPER_TYPES.join(', ')}`,
                    value: record.paperType,
                });
            }
            if (!record.recommendation) {
                validationErrors.push({
                    row: rowNum,
                    field: 'recommendation',
                    message: 'recommendation 是必填字段',
                });
            } else if (!VALID_RECOMMENDATIONS.includes(String(record.recommendation))) {
                validationErrors.push({
                    row: rowNum,
                    field: 'recommendation',
                    message: `无效的推荐等级，可选: ${VALID_RECOMMENDATIONS.join(', ')}`,
                    value: record.recommendation,
                });
            }

            // 数值字段解析
            const labL = parseFloat(String(record.labL));
            const labA = parseFloat(String(record.labA));
            const labB = parseFloat(String(record.labB));
            const deltaE = record.deltaE ? parseFloat(String(record.deltaE)) : undefined;
            const glossiness = parseFloat(String(record.glossiness));
            const inkAbsorption = parseFloat(String(record.inkAbsorption));
            const gamutCoverage = parseFloat(String(record.gamutCoverage));

            // 数值范围检查
            if (isNaN(labL) || labL < 0 || labL > 100) {
                validationErrors.push({
                    row: rowNum,
                    field: 'labL',
                    message: 'labL 必须是 0-100 之间的数字',
                    value: record.labL,
                });
            }
            if (isNaN(labA) || labA < -128 || labA > 127) {
                validationErrors.push({
                    row: rowNum,
                    field: 'labA',
                    message: 'labA 必须是 -128 到 127 之间的数字',
                    value: record.labA,
                });
            }
            if (isNaN(labB) || labB < -128 || labB > 127) {
                validationErrors.push({
                    row: rowNum,
                    field: 'labB',
                    message: 'labB 必须是 -128 到 127 之间的数字',
                    value: record.labB,
                });
            }
            if (isNaN(glossiness) || glossiness < 0 || glossiness > 100) {
                validationErrors.push({
                    row: rowNum,
                    field: 'glossiness',
                    message: 'glossiness 必须是 0-100 之间的数字',
                    value: record.glossiness,
                });
            }
            if (isNaN(inkAbsorption) || inkAbsorption < 0 || inkAbsorption > 100) {
                validationErrors.push({
                    row: rowNum,
                    field: 'inkAbsorption',
                    message: 'inkAbsorption 必须是 0-100 之间的数字',
                    value: record.inkAbsorption,
                });
            }
            if (isNaN(gamutCoverage) || gamutCoverage < 0 || gamutCoverage > 100) {
                validationErrors.push({
                    row: rowNum,
                    field: 'gamutCoverage',
                    message: 'gamutCoverage 必须是 0-100 之间的数字',
                    value: record.gamutCoverage,
                });
            }

            // 如果没有致命错误，添加到数据
            const hasError = validationErrors.some(e => e.row === rowNum);
            if (!hasError) {
                validatedData.push({
                    colorId: String(record.colorId),
                    paperType: String(record.paperType),
                    labL,
                    labA,
                    labB,
                    deltaE,
                    glossiness,
                    inkAbsorption,
                    gamutCoverage,
                    recommendation: String(record.recommendation),
                    cautionNote: record.cautionNote ? String(record.cautionNote) : undefined,
                });
            }
        });

        setData(validatedData);
        setErrors(validationErrors);
        setStatus(validationErrors.length > 0 ? 'error' : 'previewing');
    }, []);

    // 处理 JSON 数据
    const handleJsonData = useCallback((records: unknown[]) => {
        handleCsvData(records as Record<string, unknown>[]);
    }, [handleCsvData]);

    // 执行导入
    const handleImport = async () => {
        if (data.length === 0) return;

        setStatus('importing');
        try {
            const response = await fetch('/api/admin/import/paper-profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paperProfiles: data }),
            });

            const result = await response.json();

            if (response.ok) {
                setImportResult({
                    success: result.success || data.length,
                    failed: result.failed || 0,
                    errors: result.errors || [],
                });
                setStatus('success');
            } else {
                setImportResult({
                    success: 0,
                    failed: data.length,
                    errors: [result.error?.message || '导入失败'],
                });
                setStatus('error');
            }
        } catch (error) {
            setImportResult({
                success: 0,
                failed: data.length,
                errors: [error instanceof Error ? error.message : '网络错误'],
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
            'PREMIUM_MATTE',
            '63.8',
            '-7.2',
            '10.5',
            '2.1',
            '15',
            '72',
            '88',
            'BEST',
            '高阶映画纸上表现极佳',
        ].join(',');
        const csv = `${header}\n${example}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'paper-profiles-template.csv';
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
                                    选择 CSV 或 JSON 格式的纸张数据文件进行导入
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
                            columns={['colorId', 'paperType', 'labL', 'labA', 'labB', 'recommendation']}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

