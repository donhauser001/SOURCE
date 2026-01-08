'use client';

/**
 * 激活码输入页面
 * 
 * v0.4.0 - Access 阶段
 * 
 * 用于实体书激活码验证
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Key, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function ActivatePage() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // 激活状态查询
    const { data: myStatus, isLoading: statusLoading } = trpc.activationCode.myStatus.useQuery(
        undefined,
        { retry: false }
    );

    // 激活 mutation
    const activateMutation = trpc.activationCode.activate.useMutation({
        onSuccess: () => {
            setSuccess(true);
            setError(null);
        },
        onError: (err) => {
            setError(err.message);
        },
    });

    // 格式化输入（自动添加分隔符）
    const handleInputChange = (value: string) => {
        // 移除非字母数字字符，转大写
        const cleaned = value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
        
        // 如果以 SOURCE- 开头，保留格式
        if (cleaned.startsWith('SOURCE-')) {
            setCode(cleaned);
            return;
        }
        
        // 如果输入的是纯字符，自动格式化为 SOURCE-XXXX-XXXX-XXXX
        const chars = cleaned.replace(/-/g, '');
        if (chars.length <= 12) {
            const segments = [];
            for (let i = 0; i < chars.length; i += 4) {
                segments.push(chars.substring(i, Math.min(i + 4, chars.length)));
            }
            if (segments.length > 0) {
                setCode('SOURCE-' + segments.join('-'));
            } else {
                setCode('');
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 验证格式
        if (!/^SOURCE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
            setError('激活码格式错误，应为 SOURCE-XXXX-XXXX-XXXX');
            return;
        }

        activateMutation.mutate({ code });
    };

    // 已经是验证用户
    if (!statusLoading && myStatus?.isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">账户已激活</CardTitle>
                        <CardDescription>
                            您的账户已经是{myStatus.tier === 'PAID' ? '付费' : '已验证'}用户
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {myStatus.usedCode && (
                            <div className="p-4 rounded-lg bg-muted/50 text-sm">
                                <div className="text-muted-foreground">激活码</div>
                                <div className="font-mono">{myStatus.usedCode.code}</div>
                                {myStatus.usedCode.batchLabel && (
                                    <div className="text-muted-foreground mt-1">
                                        批次: {myStatus.usedCode.batchLabel}
                                    </div>
                                )}
                                {myStatus.usedCode.usedAt && (
                                    <div className="text-muted-foreground">
                                        激活时间: {new Date(myStatus.usedCode.usedAt).toLocaleDateString('zh-CN')}
                                    </div>
                                )}
                            </div>
                        )}
                        <Link href="/colors" className="block">
                            <Button className="w-full">
                                <Sparkles className="h-4 w-4 mr-2" />
                                探索色彩库
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 激活成功
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-bounce">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">激活成功！</CardTitle>
                        <CardDescription>
                            您的账户已升级为已验证用户，解锁更多功能
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                            <h4 className="font-medium text-green-800 mb-2">已解锁功能</h4>
                            <ul className="text-sm text-green-700 space-y-1">
                                <li>• 查看完整油墨配方</li>
                                <li>• 下载打样色卡</li>
                                <li>• 获取专业纸张推荐</li>
                                <li>• 工程色彩分析</li>
                            </ul>
                        </div>
                        <Link href="/colors" className="block">
                            <Button className="w-full">
                                <Sparkles className="h-4 w-4 mr-2" />
                                开始探索
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-100">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                        <Key className="h-8 w-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl">激活您的账户</CardTitle>
                    <CardDescription>
                        输入实体书中的激活码，解锁完整功能
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 错误提示 */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                                <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* 激活码输入 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">激活码</label>
                            <Input
                                type="text"
                                placeholder="SOURCE-XXXX-XXXX-XXXX"
                                value={code}
                                onChange={(e) => handleInputChange(e.target.value)}
                                className="font-mono text-center text-lg tracking-wider"
                                maxLength={23}
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                激活码位于书籍内页或包装内
                            </p>
                        </div>

                        {/* 提交按钮 */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={activateMutation.isPending || code.length < 20}
                        >
                            {activateMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    验证中...
                                </>
                            ) : (
                                '激活'
                            )}
                        </Button>

                        {/* 帮助链接 */}
                        <div className="text-center text-sm text-muted-foreground">
                            还没有激活码？
                            <Link href="/docs" className="text-primary hover:underline ml-1">
                                了解如何获取
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

