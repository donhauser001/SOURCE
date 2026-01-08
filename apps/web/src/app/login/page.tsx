'use client';

/**
 * 登录页面
 * 
 * 根据用户角色自动跳转：
 * - 管理员 (ADMIN/OPERATOR) → /admin
 * - 普通用户 → /
 */

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Palette, ArrowLeft, Mail, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDevLoading, setIsDevLoading] = useState(false);
    const [isAdminDevLoading, setIsAdminDevLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // 已登录用户根据角色跳转
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const callbackUrl = searchParams.get('callbackUrl');
            const role = session.user.role;
            const isAdmin = role === 'ADMIN' || role === 'OPERATOR';

            if (callbackUrl) {
                // 有明确的回调 URL，直接跳转
                window.location.href = callbackUrl;
            } else {
                // 根据角色跳转
                window.location.href = isAdmin ? '/admin' : '/';
            }
        }
    }, [status, session, router, searchParams]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('email', {
                email,
                redirect: false,
                callbackUrl: searchParams.get('callbackUrl') || '/',
            });

            if (result?.error) {
                setError('登录失败，请稍后重试');
            } else {
                setSuccess(true);
            }
        } catch {
            setError('登录失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 开发环境：普通用户登录
    const handleDevLogin = async () => {
        setIsDevLoading(true);
        setError('');

        try {
            await signIn('dev-credentials', {
                email: email || 'user@source.ink',
                redirect: false,
            });
            // signIn 完成后 useEffect 会处理跳转
            router.refresh();
        } catch {
            setError('登录失败');
        } finally {
            setIsDevLoading(false);
        }
    };

    // 开发环境：管理员登录
    const handleAdminDevLogin = async () => {
        setIsAdminDevLoading(true);
        setError('');

        try {
            await signIn('dev-credentials', {
                email: 'admin@source.ink',
                redirect: false,
            });
            // signIn 完成后 useEffect 会处理跳转
            router.refresh();
        } catch {
            setError('登录失败');
        } finally {
            setIsAdminDevLoading(false);
        }
    };

    // 加载中
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // 邮件发送成功
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <div className="w-full max-w-md p-8">
                    <div className="bg-background rounded-lg border p-8 shadow-sm text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">检查你的邮箱</h1>
                        <p className="text-muted-foreground mb-4">
                            我们已向 <span className="font-medium text-foreground">{email}</span> 发送了登录链接
                        </p>
                        <p className="text-sm text-muted-foreground">点击邮件中的链接即可登录</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
            <div className="w-full max-w-md p-8">
                <div className="bg-background rounded-lg border p-8 shadow-sm">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6">
                            <Palette className="h-8 w-8" />
                            <span className="text-xl font-bold">SOURCE</span>
                        </Link>
                        <h1 className="text-2xl font-bold">欢迎回来</h1>
                        <p className="text-muted-foreground mt-1">登录以访问完整功能</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    {/* Email Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">邮箱地址</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    发送中...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    发送登录链接
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Dev Login (only in development) */}
                    {process.env.NODE_ENV === 'development' && (
                        <>
                            <div className="relative my-6">
                                <Separator />
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                                    开发环境
                                </span>
                            </div>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleDevLogin}
                                    disabled={isDevLoading || isAdminDevLoading}
                                >
                                    {isDevLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            登录中...
                                        </>
                                    ) : (
                                        '普通用户登录'
                                    )}
                                </Button>
                                <Button
                                    variant="default"
                                    className="w-full"
                                    onClick={handleAdminDevLogin}
                                    disabled={isDevLoading || isAdminDevLoading}
                                >
                                    {isAdminDevLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            登录中...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="mr-2 h-4 w-4" />
                                            管理员登录
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                管理员账号需先在数据库中设置 role = ADMIN
                            </p>
                        </>
                    )}

                    {/* Back Link */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            返回首页
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                    登录即表示你同意我们的服务条款和隐私政策
                </p>
            </div>
        </div>
    );
}
