'use client';

/**
 * 个人中心概览页
 * 
 * 显示用户账户概况、快捷操作和最近活动
 */

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    User,
    Shield,
    Key,
    Palette,
    Clock,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    BookOpen,
    Activity
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

const tierConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    FREE: { label: '免费用户', color: 'bg-gray-100 text-gray-600', icon: User },
    VERIFIED: { label: '已验证', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    PAID: { label: '付费用户', color: 'bg-amber-100 text-amber-700', icon: Sparkles },
};

const roleConfig: Record<string, string> = {
    USER: '普通用户',
    PARTNER: '合作伙伴',
    AUDITOR: '审计员',
    ADMIN: '管理员',
};

export default function AccountPage() {
    const { data: session } = useSession();
    const { data: user } = trpc.user.me.useQuery();
    const { data: apiKeys } = trpc.apikey.list.useQuery();

    const tier = session?.user?.tier || 'FREE';
    const role = session?.user?.role || 'USER';
    const tierInfo = tierConfig[tier] || tierConfig.FREE;
    const TierIcon = tierInfo.icon;

    const activeApiKeys = apiKeys?.filter(key => !key.revokedAt).length || 0;

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
                <p className="text-gray-500 mt-1">管理你的账户信息和设置</p>
            </div>

            {/* 欢迎卡片 */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur">
                            {session?.user?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={session.user.image}
                                    alt=""
                                    className="h-16 w-16 rounded-2xl"
                                />
                            ) : (
                                <span className="text-2xl font-bold">
                                    {(session?.user?.name || session?.user?.email)?.[0]?.toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                你好，{session?.user?.name || '用户'}
                            </h2>
                            <p className="text-gray-300 text-sm mt-1">{session?.user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${tierInfo.color}`}>
                            <TierIcon className="h-4 w-4 inline mr-1" />
                            {tierInfo.label}
                        </span>
                        {role !== 'USER' && (
                            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white">
                                {roleConfig[role]}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 色彩资产 */}
                <Link
                    href="/account/assets"
                    className="bg-white rounded-2xl border border-black/10 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                    <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Palette className="h-5 w-5 text-purple-600" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">色彩资产</p>
                    <p className="text-sm text-gray-500">购买意向 · 分析报告</p>
                </Link>

                {/* API 密钥 */}
                <Link
                    href="/account/api-keys"
                    className="bg-white rounded-2xl border border-black/10 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                    <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Key className="h-5 w-5 text-blue-600" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">{activeApiKeys}</p>
                    <p className="text-sm text-gray-500">有效 API 密钥</p>
                </Link>

                {/* 账户状态 */}
                <Link
                    href="/account/security"
                    className="bg-white rounded-2xl border border-black/10 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                    <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-emerald-600" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">{tierInfo.label}</p>
                    <p className="text-sm text-gray-500">账户等级</p>
                </Link>

                {/* 注册时间 */}
                <div className="bg-white rounded-2xl border border-black/10 p-5">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' }) : '-'}
                    </p>
                    <p className="text-sm text-gray-500">注册时间</p>
                </div>
            </div>

            {/* 快捷操作 */}
            <div className="bg-white rounded-3xl border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">快捷操作</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    <Link
                        href="/account/assets"
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Palette className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">色彩资产</p>
                            <p className="text-sm text-gray-500">查看购买意向和分析报告</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-300" />
                    </Link>

                    <Link
                        href="/account/profile"
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">编辑个人资料</p>
                            <p className="text-sm text-gray-500">更新你的名称和头像</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-300" />
                    </Link>

                    <Link
                        href="/account/api-keys"
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Key className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">管理 API 密钥</p>
                            <p className="text-sm text-gray-500">创建和管理你的 API 访问密钥</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-300" />
                    </Link>

                    {tier === 'FREE' && (
                        <Link
                            href="/activate"
                            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">激活账户</p>
                                <p className="text-sm text-gray-500">使用激活码解锁完整功能</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-300" />
                        </Link>
                    )}

                    <Link
                        href="/docs/api"
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">API 文档</p>
                            <p className="text-sm text-gray-500">了解如何使用 SOURCE API</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-300" />
                    </Link>
                </div>
            </div>

            {/* 账户提示 */}
            {tier === 'FREE' && (
                <div className="bg-amber-50 rounded-3xl border border-amber-200 p-6">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-amber-900">升级你的账户</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                你当前是免费用户，部分功能受限。激活账户后可获得完整的色彩数据访问权限。
                            </p>
                            <Link
                                href="/activate"
                                className="inline-flex items-center mt-3 text-sm font-medium text-amber-700 hover:text-amber-900"
                            >
                                立即激活
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
