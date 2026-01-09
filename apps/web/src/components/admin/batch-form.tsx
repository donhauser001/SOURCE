'use client';

/**
 * 批次表单组件
 * 用于创建和编辑批次
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import {
    BatchTypeLabels,
    CreateBatchInput,
    UpdateBatchInput,
} from '@/lib/validations/batch';

type BatchType = 'MEASURE' | 'SCAN' | 'PRINT' | 'AUDIT';

interface BatchFormData {
    batchNo: string;
    type: BatchType;
    partnerId: string;
    instrumentModel: string;
    calibratedAt: string;
    notes: string;
    createdBy: string;
}

interface Props {
    initialData?: Partial<BatchFormData> & { id?: string };
    mode: 'create' | 'edit';
}

export function BatchForm({ initialData, mode }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<BatchFormData>({
        batchNo: initialData?.batchNo || '',
        type: initialData?.type || 'MEASURE',
        partnerId: initialData?.partnerId || '',
        instrumentModel: initialData?.instrumentModel || '',
        calibratedAt: initialData?.calibratedAt || '',
        notes: initialData?.notes || '',
        createdBy: initialData?.createdBy || '',
    });

    // 获取下一个批次编号
    const { data: nextBatchNo, isLoading: isLoadingNextBatchNo } = trpc.batch.nextBatchNo.useQuery(
        undefined,
        {
            enabled: mode === 'create' && !formData.batchNo,
        }
    );

    // 获取合作者列表
    const { data: partnersData } = trpc.partner.list.useQuery({
        limit: 100,
    });

    // 自动填充批次编号
    useEffect(() => {
        if (mode === 'create' && nextBatchNo && !formData.batchNo) {
            setFormData((prev) => ({ ...prev, batchNo: nextBatchNo }));
        }
    }, [nextBatchNo, mode, formData.batchNo]);

    const createMutation = trpc.batch.create.useMutation({
        onSuccess: () => {
            router.push('/admin/batches');
            router.refresh();
        },
        onError: (error) => {
            setError(error.message);
            setIsSubmitting(false);
        },
    });

    const updateMutation = trpc.batch.update.useMutation({
        onSuccess: () => {
            router.push('/admin/batches');
            router.refresh();
        },
        onError: (error) => {
            setError(error.message);
            setIsSubmitting(false);
        },
    });

    const handleChange = (
        field: keyof BatchFormData,
        value: string
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (mode === 'create') {
                const input: CreateBatchInput = {
                    batchNo: formData.batchNo,
                    type: formData.type,
                    partnerId: formData.partnerId || undefined,
                    instrumentModel: formData.instrumentModel || undefined,
                    calibratedAt: formData.calibratedAt ? new Date(formData.calibratedAt) : undefined,
                    notes: formData.notes || undefined,
                    createdBy: formData.createdBy,
                };
                await createMutation.mutateAsync(input);
            } else {
                const input: UpdateBatchInput = {
                    id: initialData?.id!,
                    partnerId: formData.partnerId || null,
                    instrumentModel: formData.instrumentModel || null,
                    calibratedAt: formData.calibratedAt ? new Date(formData.calibratedAt) : null,
                    notes: formData.notes || null,
                };
                await updateMutation.mutateAsync(input);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegenerateBatchNo = () => {
        if (nextBatchNo) {
            setFormData((prev) => ({ ...prev, batchNo: nextBatchNo }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" asChild>
                    <Link href="/admin/batches">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        返回列表
                    </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            保存中...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            保存
                        </>
                    )}
                </Button>
            </div>

            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>批次的基本档案信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="batchNo">
                                批次编号 <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="batchNo"
                                    value={formData.batchNo}
                                    onChange={(e) => handleChange('batchNo', e.target.value.toUpperCase())}
                                    placeholder="BATCH-2026-001"
                                    disabled={mode === 'edit' || isLoadingNextBatchNo}
                                    required
                                />
                                {mode === 'create' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleRegenerateBatchNo}
                                        disabled={isLoadingNextBatchNo}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                格式：BATCH-YYYY-NNN
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">
                                批次类型 <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => handleChange('type', value)}
                                disabled={mode === 'edit'}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(BatchTypeLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="partnerId">关联合作者</Label>
                            <Select
                                value={formData.partnerId}
                                onValueChange={(value) => handleChange('partnerId', value)}
                            >
                                <SelectTrigger id="partnerId">
                                    <SelectValue placeholder="选择合作者（可选）" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">无</SelectItem>
                                    {partnersData?.items.map((partner) => (
                                        <SelectItem key={partner.id} value={partner.id}>
                                            {partner.shortName || partner.name} ({partner.partnerId})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="createdBy">
                                创建人 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="createdBy"
                                value={formData.createdBy}
                                onChange={(e) => handleChange('createdBy', e.target.value)}
                                placeholder="张三"
                                disabled={mode === 'edit'}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="instrumentModel">仪器型号</Label>
                            <Input
                                id="instrumentModel"
                                value={formData.instrumentModel}
                                onChange={(e) => handleChange('instrumentModel', e.target.value)}
                                placeholder="X-Rite i1Pro 2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="calibratedAt">校准时间</Label>
                            <Input
                                id="calibratedAt"
                                type="date"
                                value={formData.calibratedAt}
                                onChange={(e) => handleChange('calibratedAt', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">备注</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="批次备注信息..."
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                    <Link href="/admin/batches">取消</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            保存中...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            {mode === 'create' ? '创建' : '保存'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
