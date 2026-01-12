'use client';

/**
 * 登录/注册页面
 * 
 * 使用邮箱魔法链接登录，新用户首次登录自动注册
 * 
 * 设计风格：
 * - 全圆角卡片
 * - 简约黑白配色
 * - 微妙动画效果
 */

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Mail,
    Loader2,
    Shield,
    Sparkles,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
                window.location.href = callbackUrl;
            } else {
                window.location.href = isAdmin ? '/admin' : '/';
            }
        }
    }, [status, session, router, searchParams]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('nodemailer', {
                email,
                redirect: false,
                callbackUrl: searchParams.get('callbackUrl') || '/',
            });

            if (result?.error) {
                setError('发送失败，请检查邮箱格式或稍后重试');
            } else {
                setSuccess(true);
            }
        } catch {
            setError('发送失败，请稍后重试');
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-gray-200" />
                    <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-gray-900 animate-spin" />
                </div>
            </div>
        );
    }

    // 邮件发送成功
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md">
                    {/* 成功卡片 */}
                    <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-sm">
                        {/* 动画图标 */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                                </div>
                                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce">
                                    <Mail className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                            查收邮件
                        </h1>
                        <p className="text-center text-gray-500 mb-6">
                            登录链接已发送至
                        </p>

                        {/* 邮箱显示 */}
                        <div className="bg-gray-100 rounded-2xl p-4 mb-6">
                            <p className="text-center font-mono text-gray-900 break-all">
                                {email}
                            </p>
                        </div>

                        {/* 提示 */}
                        <div className="space-y-3 text-sm text-gray-500">
                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-medium text-gray-600">1</span>
                                </div>
                                <p>点击邮件中的链接即可登录</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-medium text-gray-600">2</span>
                                </div>
                                <p>链接有效期 24 小时</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-medium text-gray-600">3</span>
                                </div>
                                <p>如未收到，请检查垃圾邮件</p>
                            </div>
                        </div>

                        {/* 分隔线 */}
                        <div className="border-t border-gray-100 my-6" />

                        {/* 重新发送 */}
                        <button
                            onClick={() => setSuccess(false)}
                            className="w-full text-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            没收到？使用其他邮箱
                        </button>
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
                                输入邮箱，获取登录链接
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

                        {/* 邮箱表单 */}
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="h-12 rounded-xl border-gray-200 focus:border-gray-900 focus:ring-gray-900 text-center text-lg"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        发送中...
                                    </>
                                ) : (
                                    <>
                                        继续
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* 说明文字 */}
                        <p className="text-center text-xs text-gray-400 mt-4">
                            新用户首次登录将自动创建账户
                        </p>

                        {/* 分隔线 */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs text-gray-400">
                                    或者
                                </span>
                            </div>
                        </div>

                        {/* 注册和找回密码链接 */}
                        <div className="flex items-center justify-center gap-4 text-sm">
                            <Link
                                href="/register"
                                className="text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                创建账户
                            </Link>
                            <span className="text-gray-200">|</span>
                            <Link
                                href="/forgot-password"
                                className="text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                忘记密码？
                            </Link>
                        </div>

                        {/* 开发环境快捷登录 */}
                        {process.env.NODE_ENV === 'development' && (
                            <>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-3 text-xs text-gray-400">
                                            开发环境快捷登录
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-xl border-gray-200 hover:bg-gray-50"
                                        onClick={handleDevLogin}
                                        disabled={isDevLoading || isAdminDevLoading}
                                    >
                                        {isDevLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            '普通用户'
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-xl border-gray-200 hover:bg-gray-900 hover:text-white"
                                        onClick={handleAdminDevLogin}
                                        disabled={isDevLoading || isAdminDevLoading}
                                    >
                                        {isAdminDevLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Shield className="mr-1.5 h-4 w-4" />
                                                管理员
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
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

                    {/* 条款 */}
                    <p className="text-center text-xs text-gray-400 mt-4">
                        登录即表示同意{' '}
                        <Link href="/docs" className="underline hover:text-gray-600">
                            服务条款
                        </Link>
                        {' '}和{' '}
                        <Link href="/docs" className="underline hover:text-gray-600">
                            隐私政策
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
