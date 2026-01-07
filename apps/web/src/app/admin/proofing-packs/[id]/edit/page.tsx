'use client';

/**
 * 编辑打样包页面
 * 
 * v0.3.0 - Bridge 阶段
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

// 纸张类型标签
const PAPER_TYPE_LABELS: Record<string, string> = {
    PREMIUM_MATTE: '高阶映画',
    UNCOATED: '纯质纸',
    COATED: '铜版纸',
    OFFSET: '双胶纸',
    LIGHTWEIGHT: '轻型纸',
};

export default function EditProofingPackPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 表单状态
    const [price, setPrice] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [isActive, setIsActive] = useState(true);

    // 获取打样包数据
    const { data: pack, isLoading } = trpc.proofingPack.get.useQuery({ id });

    // 初始化表单
    useEffect(() => {
        if (pack) {
            setPrice((pack.price / 100).toFixed(2));
            setExternalUrl(pack.externalUrl || '');
            setIsActive(pack.isActive);
        }
    }, [pack]);

    // 更新 mutation
    const updateMutation = trpc.proofingPack.update.useMutation({
        onSuccess: () => {
            router.push('/admin/proofing-packs');
        },
        onError: (err) => {
            setError(err.message);
            setIsSubmitting(false);
        },
    });

    // 删除 mutation
    const deleteMutation = trpc.proofingPack.delete.useMutation({
        onSuccess: () => {
            router.push('/admin/proofing-packs');
        },
        onError: (err) => {
            setError(err.message);
            setIsDeleting(false);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const priceInCents = Math.round(parseFloat(price) * 100);
        if (isNaN(priceInCents) || priceInCents < 0) {
            setError('请输入有效的价格');
            return;
        }

        setIsSubmitting(true);

        updateMutation.mutate({
            id,
            price: priceInCents,
            externalUrl: externalUrl || null,
            isActive,
        });
    };

    const handleDelete = () => {
        if (!confirm('确定要删除此打样包吗？如果有购买意图记录，将改为下架处理。')) {
            return;
        }

        setIsDeleting(true);
        deleteMutation.mutate({ id });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!pack) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">打样包不存在</p>
                <Link href="/admin/proofing-packs">
                    <Button variant="outline" className="mt-4">
                        返回列表
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 返回按钮 */}
            <Link href="/admin/proofing-packs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                返回列表
            </Link>

            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        编辑打样包
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {pack.color.colorId} / {PAPER_TYPE_LABELS[pack.paperType] || pack.paperType}
                    </p>
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                        </>
                    )}
                </Button>
            </div>

            {/* 只读信息 */}
            <Card>
                <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>以下信息创建后不可修改</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-muted-foreground">色彩</Label>
                        <div className="font-medium">
                            {pack.color.colorId} - {pack.color.name}
                        </div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">纸张类型</Label>
                        <div className="font-medium">
                            {PAPER_TYPE_LABELS[pack.paperType] || pack.paperType}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 可编辑表单 */}
            <Card>
                <CardHeader>
                    <CardTitle>编辑信息</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 错误提示 */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

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
                        </div>

                        {/* 状态 */}
                        <div className="space-y-2">
                            <Label>状态</Label>
                            <Select
                                value={isActive ? 'active' : 'inactive'}
                                onValueChange={(v) => setIsActive(v === 'active')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">在售</SelectItem>
                                    <SelectItem value="inactive">下架</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 提交按钮 */}
                        <div className="flex gap-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                保存修改
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

