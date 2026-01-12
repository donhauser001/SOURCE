'use client';

/**
 * 注册页面
 * 
 * 使用邮箱魔法链接注册，与登录流程一致
 * 新用户首次使用邮箱时自动创建账户
 */

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, 
    ArrowRight,
    Loader2, 
    CheckCircle2,
    Sparkles,
    Users,
    Palette,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // 已登录用户跳转
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const callbackUrl = searchParams.get('callbackUrl');
            window.location.href = callbackUrl || '/';
        }
    }, [status, session, router, searchParams]);

    const handleRegister = async (e: React.FormEvent) => {
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

    // 注册成功
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
                                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <Sparkles className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                            验证邮件已发送
                        </h1>
                        <p className="text-center text-gray-500 mb-6">
                            点击邮件中的链接完成注册
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
                                <p>检查收件箱或垃圾邮件文件夹</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-medium text-gray-600">2</span>
                                </div>
                                <p>点击链接后自动完成注册</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-medium text-gray-600">3</span>
                                </div>
                                <p>链接有效期 24 小时</p>
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
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
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
                        加入 SOURCE<br />
                        探索色彩世界
                    </h2>
                    <p className="text-lg text-gray-400 mb-8 max-w-md">
                        免费注册，即刻获得专业印刷色彩管理工具
                    </p>

                    {/* 特性列表 */}
                    <div className="space-y-4">
                        {[
                            { icon: Palette, text: '浏览完整色彩库' },
                            { icon: FileText, text: '查看详细色彩身份证' },
                            { icon: Users, text: '参与色彩社区讨论' },
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-gray-300">
                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <feature.icon className="h-5 w-5 text-white" />
                                </div>
                                <span>{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右侧注册区 */}
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

                    {/* 注册卡片 */}
                    <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-sm">
                        {/* 标题 */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                创建账户
                            </h1>
                            <p className="text-gray-500">
                                输入邮箱，开始你的色彩之旅
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
                        <form onSubmit={handleRegister} className="space-y-4">
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
                                        免费注册
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* 说明文字 */}
                        <p className="text-center text-xs text-gray-400 mt-4">
                            我们将发送一封验证邮件到你的邮箱
                        </p>

                        {/* 分隔线 */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs text-gray-400">
                                    已有账户？
                                </span>
                            </div>
                        </div>

                        {/* 登录链接 */}
                        <Link
                            href="/login"
                            className="flex items-center justify-center w-full h-11 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            登录
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

                    {/* 条款 */}
                    <p className="text-center text-xs text-gray-400 mt-4">
                        注册即表示同意{' '}
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
