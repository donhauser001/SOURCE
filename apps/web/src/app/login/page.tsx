'use client';

/**
 * 登录页面
 * 
 * 使用邮箱密码登录
 */

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import {
    ArrowLeft,
    Loader2,
    Sparkles,
    ArrowRight,
    Eye,
    EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function LoginPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // 已登录用户根据角色跳转
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const callbackUrl = searchParams.get('callbackUrl');
            const role = session.user.role;
            const isAdmin = role === 'ADMIN' || role === 'OPERATOR';

            if (callbackUrl) {
                window.location.href = callbackUrl;
            } else {
                window.location.href = isAdmin ? '/admin' : '/';
            }
        }
    }, [status, session, router, searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
                callbackUrl: searchParams.get('callbackUrl') || '/',
            });

            if (result?.error) {
                setError('邮箱或密码错误');
            } else if (result?.ok) {
                router.refresh();
            }
        } catch {
            setError('登录失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 加载中
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-gray-200" />
                    <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-gray-900 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* 左侧装饰区 - 桌面端显示 */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden">
                {/* 装饰图案 */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white blur-3xl" />
                    <div className="absolute bottom-40 right-20 h-96 w-96 rounded-full bg-white blur-3xl" />
                </div>

                {/* 内容 */}
                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center">
                                <span className="text-2xl font-black text-gray-900">S</span>
                            </div>
                            <span className="text-2xl font-bold text-white">SOURCE</span>
                        </Link>
                    </div>

                    <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                        印刷色彩管理<br />
                        从这里开始
                    </h2>
                    <p className="text-lg text-gray-400 mb-8 max-w-md">
                        SOURCE 是专业的印刷色彩身份证平台，帮助设计师和印刷从业者精准管理专色
                    </p>

                    {/* 特性列表 */}
                    <div className="space-y-4">
                        {[
                            '精准的 Lab 色值数据',
                            '全面的纸张适配信息',
                            '专业的油墨配方支持',
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-gray-300">
                                <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                                    <Sparkles className="h-3 w-3 text-white" />
                                </div>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右侧登录区 */}
            <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
                <div className="w-full max-w-md">
                    {/* 移动端 Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center">
                                <span className="text-xl font-black text-white">S</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">SOURCE</span>
                        </Link>
                    </div>

                    {/* 登录卡片 */}
                    <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-sm">
                        {/* 标题 */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                欢迎使用 SOURCE
                            </h1>
                            <p className="text-gray-500">
                                输入邮箱和密码登录
                            </p>
                        </div>

                        {/* 错误提示 */}
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl mb-6 flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs">!</span>
                                </div>
                                {error}
                            </div>
                        )}

                        {/* 登录表单 */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="邮箱"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="h-12 rounded-xl border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                                />
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="密码"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="h-12 rounded-xl border-gray-200 focus:border-gray-900 focus:ring-gray-900 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        登录中...
                                    </>
                                ) : (
                                    <>
                                        登录
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* 返回链接 */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            返回首页
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-gray-200" />
                    <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-gray-900 animate-spin" />
                </div>
            </div>
        }>
            <LoginPageInner />
        </Suspense>
    );
}
