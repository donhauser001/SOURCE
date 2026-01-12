import Link from 'next/link';
import { Mail, ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface VerifyPageProps {
    searchParams: Promise<{ error?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
    const params = await searchParams;
    const hasError = params.error;

    // 错误状态
    if (hasError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md">
                    {/* 错误卡片 */}
                    <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-sm">
                        {/* 图标 */}
                        <div className="flex justify-center mb-6">
                            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="h-10 w-10 text-red-600" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                            链接已失效
                        </h1>
                        <p className="text-center text-gray-500 mb-6">
                            登录链接可能已过期或已被使用
                        </p>

                        {/* 提示 */}
                        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                            <div className="flex items-start gap-3 text-sm text-gray-600">
                                <Clock className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <p>登录链接有效期为 24 小时，且只能使用一次</p>
                            </div>
                        </div>

                        {/* 重新登录按钮 */}
                        <Link
                            href="/login"
                            className="flex items-center justify-center w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors"
                        >
                            重新获取登录链接
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

    // 正常等待验证状态
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                {/* 验证卡片 */}
                <div className="bg-white rounded-3xl border border-black/10 p-8 shadow-sm">
                    {/* 动画图标 */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                                <Mail className="h-10 w-10 text-blue-600" />
                            </div>
                            {/* 脉冲动画 */}
                            <div className="absolute inset-0 h-20 w-20 rounded-full bg-blue-100 animate-ping opacity-30" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                        检查你的邮箱
                    </h1>
                    <p className="text-center text-gray-500 mb-6">
                        我们已发送了登录链接
                    </p>

                    {/* 步骤指引 */}
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">邮件已发送</p>
                                <p className="text-sm text-gray-500">检查收件箱或垃圾邮件</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-gray-200">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-gray-500">2</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">点击链接</p>
                                <p className="text-sm text-gray-500">链接有效期 24 小时</p>
                            </div>
                        </div>
                    </div>

                    {/* 分隔线 */}
                    <div className="border-t border-gray-100 my-6" />

                    {/* 返回登录 */}
                    <Link
                        href="/login"
                        className="flex items-center justify-center w-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        使用其他邮箱登录
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
