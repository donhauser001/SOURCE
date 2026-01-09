'use client';

/**
 * 新增打样包页面
 * 
 * v0.3.0 - Bridge 阶段
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

// 纸张类型选项
const PAPER_TYPE_OPTIONS = [
    { value: 'PREMIUM_MATTE', label: '高阶映画' },
    { value: 'UNCOATED', label: '纯质纸' },
    { value: 'COATED', label: '铜版纸' },
    { value: 'OFFSET', label: '双胶纸' },
    { value: 'LIGHTWEIGHT', label: '轻型纸' },
];

export default function NewProofingPackPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 表单状态
    const [colorId, setColorId] = useState('');
    const [paperType, setPaperType] = useState('');
    const [price, setPrice] = useState('');
    const [externalUrl, setExternalUrl] = useState('');

    // 获取色彩列表用于选择
    const { data: colors, isLoading: colorsLoading } = trpc.color.list.useQuery({
        limit: 200,
    });

    // 创建 mutation
    const createMutation = trpc.proofingPack.create.useMutation({
        onSuccess: () => {
            router.push('/admin/proofing-packs');
        },
        onError: (err) => {
            setError(err.message);
            setIsSubmitting(false);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!colorId || !paperType || !price) {
            setError('请填写必填字段');
            return;
        }

        const priceInCents = Math.round(parseFloat(price) * 100);
        if (isNaN(priceInCents) || priceInCents < 0) {
            setError('请输入有效的价格');
            return;
        }

        setIsSubmitting(true);

        createMutation.mutate({
            colorId,
            paperType: paperType as 'PREMIUM_MATTE' | 'UNCOATED' | 'COATED' | 'OFFSET' | 'LIGHTWEIGHT',
            price: priceInCents,
            externalUrl: externalUrl || null,
        });
    };

    return (
        <div className="space-y-6">
            {/* 返回按钮 */}
            <Link href="/admin/proofing-packs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                返回列表
            </Link>

            {/* 表单 */}
            <Card>
                <CardHeader>
                    <CardTitle>打样包信息</CardTitle>
                    <CardDescription>一个色彩 + 一种纸张 = 一个打样包 SKU</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 错误提示 */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* 色彩选择 */}
                        <div className="space-y-2">
                            <Label htmlFor="colorId">色彩 *</Label>
                            <Select value={colorId} onValueChange={setColorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={colorsLoading ? '加载中...' : '选择色彩'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {colors?.items.map((color) => (
                                        <SelectItem key={color.id} value={color.id}>
                                            {color.colorId} - {color.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 纸张类型 */}
                        <div className="space-y-2">
                            <Label htmlFor="paperType">纸张类型 *</Label>
                            <Select value={paperType} onValueChange={setPaperType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择纸张类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAPER_TYPE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 价格 */}
                        <div className="space-y-2">
                            <Label htmlFor="price">价格（元）*</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="如 29.90"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">参考价格，真实交易在外部平台完成</p>
                        </div>

                        {/* 外链 */}
                        <div className="space-y-2">
                            <Label htmlFor="externalUrl">购买链接</Label>
                            <Input
                                id="externalUrl"
                                type="url"
                                placeholder="https://item.taobao.com/..."
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">淘宝/其他平台的商品链接</p>
                        </div>

                        {/* 提交按钮 */}
                        <div className="flex gap-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                创建打样包
                            </Button>
                            <Link href="/admin/proofing-packs">
                                <Button type="button" variant="outline">
                                    取消
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

