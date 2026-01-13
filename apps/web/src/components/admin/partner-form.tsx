'use client';

/**
 * 共建者表单组件
 * 用于创建和编辑共建者
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import {
    PartnerType,
    PartnerStatus,
    PartnerTypeLabels,
    PartnerStatusLabels,
    CreatePartnerInput,
    UpdatePartnerInput,
} from '@/lib/validations/partner';

interface PartnerFormData {
    partnerId: string;
    name: string;
    shortName: string;
    types: PartnerType[];
    description: string;
    logoUrl: string;
    websiteUrl: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    region: string;
    certifications: string[];
    establishedYear: number | null;
    status: PartnerStatus;
}

interface Props {
    initialData?: Partial<PartnerFormData> & { id?: string };
    mode: 'create' | 'edit';
}

export function PartnerForm({ initialData, mode }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [certificationsInput, setCertificationsInput] = useState('');

    const [formData, setFormData] = useState<PartnerFormData>({
        partnerId: initialData?.partnerId || '',
        name: initialData?.name || '',
        shortName: initialData?.shortName || '',
        types: initialData?.types || [],
        description: initialData?.description || '',
        logoUrl: initialData?.logoUrl || '',
        websiteUrl: initialData?.websiteUrl || '',
        contactEmail: initialData?.contactEmail || '',
        contactPhone: initialData?.contactPhone || '',
        address: initialData?.address || '',
        region: initialData?.region || '',
        certifications: initialData?.certifications || [],
        establishedYear: initialData?.establishedYear || null,
        status: initialData?.status || 'PENDING',
    });

    const createMutation = trpc.partner.create.useMutation({
        onSuccess: () => {
            router.push('/admin/partners');
            router.refresh();
        },
        onError: (error) => {
            setError(error.message);
            setIsSubmitting(false);
        },
    });

    const updateMutation = trpc.partner.update.useMutation({
        onSuccess: () => {
            router.push('/admin/partners');
            router.refresh();
        },
        onError: (error) => {
            setError(error.message);
            setIsSubmitting(false);
        },
    });

    const handleChange = (
        field: keyof PartnerFormData,
        value: string | number | null | PartnerType[] | string[] | PartnerStatus
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleTypeToggle = (type: PartnerType) => {
        const newTypes = formData.types.includes(type)
            ? formData.types.filter((t) => t !== type)
            : [...formData.types, type];
        handleChange('types', newTypes);
    };

    const handleAddCertification = () => {
        if (certificationsInput.trim()) {
            const newCerts = [
                ...formData.certifications,
                ...certificationsInput.split(',').map((c) => c.trim()).filter(Boolean),
            ];
            handleChange('certifications', newCerts);
            setCertificationsInput('');
        }
    };

    const handleRemoveCertification = (index: number) => {
        const newCerts = formData.certifications.filter((_, i) => i !== index);
        handleChange('certifications', newCerts);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (mode === 'create') {
                const input: CreatePartnerInput = {
                    partnerId: formData.partnerId,
                    name: formData.name,
                    shortName: formData.shortName || undefined,
                    types: formData.types,
                    description: formData.description || undefined,
                    logoUrl: formData.logoUrl || undefined,
                    websiteUrl: formData.websiteUrl || undefined,
                    contactEmail: formData.contactEmail || undefined,
                    contactPhone: formData.contactPhone || undefined,
                    address: formData.address || undefined,
                    region: formData.region || undefined,
                    certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
                    establishedYear: formData.establishedYear || undefined,
                    status: formData.status,
                };
                await createMutation.mutateAsync(input);
            } else {
                const input: UpdatePartnerInput = {
                    id: initialData?.id!,
                    name: formData.name,
                    shortName: formData.shortName || null,
                    types: formData.types,
                    description: formData.description || null,
                    logoUrl: formData.logoUrl || null,
                    websiteUrl: formData.websiteUrl || null,
                    contactEmail: formData.contactEmail || null,
                    contactPhone: formData.contactPhone || null,
                    address: formData.address || null,
                    region: formData.region || null,
                    certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
                    establishedYear: formData.establishedYear || null,
                    status: formData.status,
                };
                await updateMutation.mutateAsync(input);
            }
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

            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" asChild>
                    <Link href="/admin/partners">
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
                    <CardDescription>共建者的基本档案信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="partnerId">
                                共建者编号 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="partnerId"
                                value={formData.partnerId}
                                onChange={(e) => handleChange('partnerId', e.target.value.toUpperCase())}
                                placeholder="PRINT-001"
                                disabled={mode === 'edit'}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                只能包含大写字母、数字和连字符
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                名称 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="示例印刷有限公司"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="shortName">简称</Label>
                            <Input
                                id="shortName"
                                value={formData.shortName}
                                onChange={(e) => handleChange('shortName', e.target.value)}
                                placeholder="示例印刷"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">状态</Label>
                            <Select value={formData.status} onValueChange={(value) => handleChange('status', value as PartnerStatus)}>
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PartnerStatusLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>
                            共建者类型 <span className="text-destructive">*</span>
                        </Label>
                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries(PartnerTypeLabels).map(([value, label]) => (
                                <div key={value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`type-${value}`}
                                        checked={formData.types.includes(value as PartnerType)}
                                        onCheckedChange={() => handleTypeToggle(value as PartnerType)}
                                    />
                                    <Label htmlFor={`type-${value}`} className="font-normal cursor-pointer">
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {formData.types.length === 0 && (
                            <p className="text-xs text-destructive">至少选择一个共建者类型</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">描述</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="共建者的详细介绍..."
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle>联系信息</CardTitle>
                    <CardDescription>共建者的联系方式和地址</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">联系邮箱</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => handleChange('contactEmail', e.target.value)}
                                placeholder="contact@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">联系电话</Label>
                            <Input
                                id="contactPhone"
                                value={formData.contactPhone}
                                onChange={(e) => handleChange('contactPhone', e.target.value)}
                                placeholder="+86 123-4567-8900"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">地址</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="示例市示例区示例路123号"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="region">地区</Label>
                            <Input
                                id="region"
                                value={formData.region}
                                onChange={(e) => handleChange('region', e.target.value)}
                                placeholder="广东深圳"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="websiteUrl">官网</Label>
                            <Input
                                id="websiteUrl"
                                type="url"
                                value={formData.websiteUrl}
                                onChange={(e) => handleChange('websiteUrl', e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">Logo URL</Label>
                            <Input
                                id="logoUrl"
                                type="url"
                                value={formData.logoUrl}
                                onChange={(e) => handleChange('logoUrl', e.target.value)}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
                <CardHeader>
                    <CardTitle>其他信息</CardTitle>
                    <CardDescription>资质认证和成立年份</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="establishedYear">成立年份</Label>
                        <Input
                            id="establishedYear"
                            type="number"
                            value={formData.establishedYear || ''}
                            onChange={(e) => handleChange('establishedYear', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="2020"
                            min={1800}
                            max={2100}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="certifications">资质认证</Label>
                        <div className="flex gap-2">
                            <Input
                                id="certifications"
                                value={certificationsInput}
                                onChange={(e) => setCertificationsInput(e.target.value)}
                                placeholder="ISO9001, FSC, G7... (逗号分隔)"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCertification();
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddCertification} variant="secondary">
                                添加
                            </Button>
                        </div>
                        {formData.certifications.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.certifications.map((cert, index) => (
                                    <div
                                        key={index}
                                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md flex items-center gap-2"
                                    >
                                        <span className="text-sm">{cert}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCertification(index)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                    <Link href="/admin/partners">取消</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting || formData.types.length === 0}>
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
