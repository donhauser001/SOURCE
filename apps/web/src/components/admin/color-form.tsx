'use client';

/**
 * 色彩表单组件
 * 用于创建和编辑色彩
 */

import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ColorStatusLabels, AuditStatusLabels } from '@/lib/validations/color';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ColorFormData {
    colorId: string;
    name: string;
    slug: string;
    labL: number;
    labA: number;
    labB: number;
    deltaETolerance: number;
    measurementDevice: string;
    measurementStandard: string;
    measurementCondition: string;
    trueSourceNote: string;
    status: string;
    auditStatus: string;
    auditors: string[];
    auditNotes: string;
    version: string;
}

interface Props {
    initialData?: Partial<ColorFormData> & { id?: string };
    mode: 'create' | 'edit';
}

export function ColorForm({ initialData, mode }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<ColorFormData>({
        colorId: initialData?.colorId || '',
        name: initialData?.name || '',
        slug: initialData?.slug || '',
        labL: initialData?.labL || 50,
        labA: initialData?.labA || 0,
        labB: initialData?.labB || 0,
        deltaETolerance: initialData?.deltaETolerance || 2.0,
        measurementDevice: initialData?.measurementDevice || '',
        measurementStandard: initialData?.measurementStandard || 'D50/2°',
        measurementCondition: initialData?.measurementCondition || '',
        trueSourceNote: initialData?.trueSourceNote || '',
        status: initialData?.status || 'EXPERIMENTAL',
        auditStatus: initialData?.auditStatus || 'UNDER_REVIEW',
        auditors: initialData?.auditors || [],
        auditNotes: initialData?.auditNotes || '',
        version: initialData?.version || '1.0',
    });

    const handleChange = (field: keyof ColorFormData, value: string | number | string[]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const generateSlug = () => {
        const slug = formData.colorId
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        handleChange('slug', slug);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const url = mode === 'create'
                ? '/api/admin/colors'
                : `/api/admin/colors/${initialData?.id}`;

            const method = mode === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    measuredAt: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || '保存失败');
            }

            router.push('/admin/colors');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* 基本信息 */}
            <Card>
                <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>色彩的唯一标识和名称</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="colorId">色彩编号 *</Label>
                            <Input
                                id="colorId"
                                value={formData.colorId}
                                onChange={(e) => handleChange('colorId', e.target.value)}
                                placeholder="CN-Song-04"
                                disabled={mode === 'edit'}
                                required
                            />
                            <p className="text-xs text-muted-foreground">格式：XX-Name-00</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">名称 *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="烟雨青"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="slug">URL 标识 *</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={generateSlug}>
                                自动生成
                            </Button>
                        </div>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => handleChange('slug', e.target.value)}
                            placeholder="cn-song-04"
                            required
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 真源数据 */}
            <Card>
                <CardHeader>
                    <CardTitle>真源数据</CardTitle>
                    <CardDescription>基于分光测色仪测量的绝对 Lab 值</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="labL">L* 值 *</Label>
                            <Input
                                id="labL"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.labL}
                                onChange={(e) => handleChange('labL', parseFloat(e.target.value))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="labA">a* 值 *</Label>
                            <Input
                                id="labA"
                                type="number"
                                step="0.01"
                                min="-128"
                                max="127"
                                value={formData.labA}
                                onChange={(e) => handleChange('labA', parseFloat(e.target.value))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="labB">b* 值 *</Label>
                            <Input
                                id="labB"
                                type="number"
                                step="0.01"
                                min="-128"
                                max="127"
                                value={formData.labB}
                                onChange={(e) => handleChange('labB', parseFloat(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deltaETolerance">ΔE 容差</Label>
                        <Input
                            id="deltaETolerance"
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={formData.deltaETolerance}
                            onChange={(e) => handleChange('deltaETolerance', parseFloat(e.target.value))}
                        />
                    </div>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="measurementDevice">测量设备 *</Label>
                            <Input
                                id="measurementDevice"
                                value={formData.measurementDevice}
                                onChange={(e) => handleChange('measurementDevice', e.target.value)}
                                placeholder="X-Rite i1Pro 2"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="measurementStandard">测量标准 *</Label>
                            <Input
                                id="measurementStandard"
                                value={formData.measurementStandard}
                                onChange={(e) => handleChange('measurementStandard', e.target.value)}
                                placeholder="D50/2°"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="measurementCondition">测量条件</Label>
                        <Input
                            id="measurementCondition"
                            value={formData.measurementCondition}
                            onChange={(e) => handleChange('measurementCondition', e.target.value)}
                            placeholder="M1 模式，白色背衬"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="trueSourceNote">真源说明</Label>
                        <Textarea
                            id="trueSourceNote"
                            value={formData.trueSourceNote}
                            onChange={(e) => handleChange('trueSourceNote', e.target.value)}
                            placeholder="关于真源数据的补充说明"
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 状态与审计 */}
            <Card>
                <CardHeader>
                    <CardTitle>状态与审计</CardTitle>
                    <CardDescription>色彩的发布状态和审计信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="status">状态</Label>
                            <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ColorStatusLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="auditStatus">审计状态</Label>
                            <Select value={formData.auditStatus} onValueChange={(v) => handleChange('auditStatus', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(AuditStatusLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="version">版本</Label>
                            <Input
                                id="version"
                                value={formData.version}
                                onChange={(e) => handleChange('version', e.target.value)}
                                placeholder="1.0"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="auditNotes">审计说明</Label>
                        <Textarea
                            id="auditNotes"
                            value={formData.auditNotes}
                            onChange={(e) => handleChange('auditNotes', e.target.value)}
                            placeholder="审计相关说明"
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
                <Button type="button" variant="outline" asChild>
                    <Link href="/admin/colors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        返回列表
                    </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    {mode === 'create' ? '创建色彩' : '保存修改'}
                </Button>
            </div>
        </form>
    );
}

