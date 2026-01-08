'use client';

/**
 * 批量生成激活码页面
 * 
 * v0.4.0 - Access 阶段
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Key, Loader2, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function GenerateActivationCodesPage() {
    const router = useRouter();
    const [count, setCount] = useState('10');
    const [batchLabel, setBatchLabel] = useState('');
    const [expiresInDays, setExpiresInDays] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [generatedCodes, setGeneratedCodes] = useState<string[] | null>(null);
    const [copied, setCopied] = useState(false);

    const generateMutation = trpc.activationCode.generate.useMutation({
        onSuccess: (data) => {
            setGeneratedCodes(data.codes);
            setError(null);
        },
        onError: (err) => {
            setError(err.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const countNum = parseInt(count);
        if (isNaN(countNum) || countNum < 1 || countNum > 1000) {
            setError('数量必须在 1-1000 之间');
            return;
        }

        if (!batchLabel.trim()) {
            setError('请输入批次标签');
            return;
        }

        generateMutation.mutate({
            count: countNum,
            batchLabel: batchLabel.trim(),
            expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        });
    };

    const handleCopy = async () => {
        if (!generatedCodes) return;
        
        await navigator.clipboard.writeText(generatedCodes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!generatedCodes) return;

        const content = generatedCodes.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activation-codes-${batchLabel}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 显示生成结果
    if (generatedCodes) {
        return (
            <div className="space-y-6">
                <Link 
                    href="/admin/activation-codes" 
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回列表
                </Link>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <Check className="h-5 w-5" />
                            生成成功
                        </CardTitle>
                        <CardDescription>
                            已生成 {generatedCodes.length} 个激活码，批次：{batchLabel}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* 操作按钮 */}
                        <div className="flex gap-2">
                            <Button onClick={handleCopy} variant="outline" className="gap-2">
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        已复制
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        复制全部
                                    </>
                                )}
                            </Button>
                            <Button onClick={handleDownload} variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                下载 TXT
                            </Button>
                        </div>

                        {/* 激活码列表 */}
                        <div className="border rounded-lg p-4 bg-muted/30 max-h-[400px] overflow-y-auto">
                            <div className="font-mono text-sm space-y-1">
                                {generatedCodes.map((code, index) => (
                                    <div key={code} className="flex items-center gap-2">
                                        <span className="text-muted-foreground w-8">{index + 1}.</span>
                                        <span>{code}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 继续生成 */}
                        <div className="flex gap-2 pt-4">
                            <Button onClick={() => setGeneratedCodes(null)} variant="outline">
                                继续生成
                            </Button>
                            <Link href="/admin/activation-codes">
                                <Button>返回管理</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link 
                href="/admin/activation-codes" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                返回列表
            </Link>

            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Key className="h-6 w-6" />
                    生成激活码
                </h1>
                <p className="text-muted-foreground mt-1">批量生成实体书激活码</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>生成设置</CardTitle>
                    <CardDescription>设置批次信息和数量</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 错误提示 */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* 批次标签 */}
                        <div className="space-y-2">
                            <Label htmlFor="batchLabel">批次标签 *</Label>
                            <Input
                                id="batchLabel"
                                placeholder="如：首印-2026-01"
                                value={batchLabel}
                                onChange={(e) => setBatchLabel(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                用于标识这批激活码的来源，如书籍版次、活动名称等
                            </p>
                        </div>

                        {/* 数量 */}
                        <div className="space-y-2">
                            <Label htmlFor="count">生成数量 *</Label>
                            <Input
                                id="count"
                                type="number"
                                min="1"
                                max="1000"
                                placeholder="10"
                                value={count}
                                onChange={(e) => setCount(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                单次最多生成 1000 个
                            </p>
                        </div>

                        {/* 过期天数 */}
                        <div className="space-y-2">
                            <Label htmlFor="expiresInDays">有效期（天）</Label>
                            <Input
                                id="expiresInDays"
                                type="number"
                                min="1"
                                max="365"
                                placeholder="留空表示永不过期"
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                留空表示激活码永久有效
                            </p>
                        </div>

                        {/* 提交按钮 */}
                        <div className="flex gap-4">
                            <Button type="submit" disabled={generateMutation.isPending}>
                                {generateMutation.isPending && (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                )}
                                生成激活码
                            </Button>
                            <Link href="/admin/activation-codes">
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

