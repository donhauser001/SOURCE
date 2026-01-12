'use client';

/**
 * 找回密码页面
 * 
 * 由于系统使用邮箱魔法链接（无密码登录），
 * 此页面实际上是"重新发送登录链接"
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Mail,
    KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('nodemailer', {
                email,
                redirect: false,
                callbackUrl: '/',
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

    // 发送成功
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
                            登录链接已发送
                        </h1>
                        <p className="text-center text-gray-500 mb-6">
                            请检查你的邮箱
                        </p>

                        {/* 邮箱显示 */}
                        <div className="bg-gray-100 rounded-2xl p-4 mb-6">
                            <p className="text-center font-mono text-gray-900 break-all">
                                {email}
                            </p>
                        </div>

                        {/* 提示 */}
                        <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <KeyRound className="h-3 w-3 text-blue-600" />
                                </div>
                                <div className="text-sm text-blue-700">
                                    <p className="font-medium">小提示</p>
                                    <p className="text-blue-600 mt-1">
                                        SOURCE 使用无密码登录，点击邮件中的链接即可直接登录，无需记住密码
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 分隔线 */}
                        <div className="border-t border-gray-100 my-6" />

                        {/* 返回登录 */}
                        <Link
                            href="/login"
                            className="flex items-center justify-center w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors"
                        >
                            返回登录
                        </Link>
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center">
                            <span className="text-xl font-black text-white">S</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">SOURCE</span>
                    </Link>
                </div>

                {/* 找回密码卡片 */}
                <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-sm">
                    {/* 图标 */}
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <KeyRound className="h-8 w-8 text-gray-600" />
                        </div>
                    </div>

                    {/* 标题 */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            忘记了吗？
                        </h1>
                        <p className="text-gray-500">
                            没关系，输入邮箱获取新的登录链接
                        </p>
                    </div>

                    {/* 说明 */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                        <p className="text-sm text-gray-600 text-center">
                            SOURCE 使用无密码登录，每次登录都会发送新链接到你的邮箱
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
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                    发送登录链接
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

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

                    {/* 登录链接 */}
                    <Link
                        href="/login"
                        className="flex items-center justify-center w-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        返回登录
                    </Link>
                </div>

                {/* 返回首页 */}
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
