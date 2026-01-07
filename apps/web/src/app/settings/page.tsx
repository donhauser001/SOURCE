'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, User, Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

const tierLabels: Record<string, { label: string; description: string }> = {
    FREE: { label: '免费用户', description: '基础功能访问' },
    VERIFIED: { label: '已验证', description: '已通过激活码验证' },
    PAID: { label: '付费用户', description: '完整功能访问' },
    ADMIN: { label: '管理员', description: '系统管理权限' },
};

export default function SettingsPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const updateProfile = trpc.user.updateProfile.useMutation({
        onSuccess: async () => {
            setSuccess(true);
            await update();
            setTimeout(() => setSuccess(false), 3000);
        },
    });

    // 未登录重定向
    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            await updateProfile.mutateAsync({ name: name.trim() });
        } finally {
            setIsLoading(false);
        }
    };

    const tierInfo = tierLabels[session?.user.tier || 'FREE'];

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="max-w-2xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        返回首页
                    </Link>
                    <h1 className="text-2xl font-bold">账户设置</h1>
                    <p className="text-muted-foreground">管理你的账户信息和偏好设置</p>
                </div>

                <div className="space-y-6">
                    {/* Profile Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                个人资料
                            </CardTitle>
                            <CardDescription>更新你的个人信息</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">邮箱</Label>
                                    <Input id="email" type="email" value={session?.user.email || ''} disabled />
                                    <p className="text-xs text-muted-foreground">邮箱地址不可更改</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">显示名称</Label>
                                    <Input
                                        id="name"
                                        placeholder={session?.user.name || '输入你的名称'}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button type="submit" disabled={isLoading || !name.trim()}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                保存中...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                保存更改
                                            </>
                                        )}
                                    </Button>
                                    {success && <span className="text-sm text-green-600">已保存</span>}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Account Status Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                账户状态
                            </CardTitle>
                            <CardDescription>查看你的账户权限等级</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-medium">{tierInfo.label}</p>
                                    <p className="text-sm text-muted-foreground">{tierInfo.description}</p>
                                </div>
                                {session?.user.tier === 'FREE' && (
                                    <Button variant="outline" size="sm" asChild>
                                        {/* @ts-expect-error - Next.js 15 strict route types */}
                                        <Link href="/activate">激活账户</Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* API Keys Card (Placeholder) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                API 密钥
                            </CardTitle>
                            <CardDescription>管理你的 API 访问密钥</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">API 密钥管理功能即将推出</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

