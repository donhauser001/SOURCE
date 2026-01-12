'use client';

/**
 * 安全设置页面
 * 
 * 显示账户等级、登录历史等安全相关信息
 */

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
    Shield, 
    CheckCircle2, 
    User,
    Sparkles,
    AlertTriangle,
    ArrowRight,
    Mail,
    Clock,
    Smartphone,
    Globe,
    LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { trpc } from '@/lib/trpc';

const tierConfig: Record<string, { 
    label: string; 
    description: string;
    color: string; 
    bgColor: string;
    icon: typeof CheckCircle2;
    features: string[];
}> = {
    FREE: { 
        label: '免费用户', 
        description: '基础功能访问',
        color: 'text-gray-600', 
        bgColor: 'bg-gray-100',
        icon: User,
        features: [
            '浏览公开色彩库',
            '查看基础色彩信息',
            '创建 1 个 API 密钥',
        ],
    },
    VERIFIED: { 
        label: '已验证', 
        description: '已通过激活码验证',
        color: 'text-emerald-700', 
        bgColor: 'bg-emerald-100',
        icon: CheckCircle2,
        features: [
            '查看完整色彩数据',
            '访问 Lab 值和配方',
            '创建多个 API 密钥',
            '使用分析工具',
        ],
    },
    PAID: { 
        label: '付费用户', 
        description: '完整功能访问',
        color: 'text-amber-700', 
        bgColor: 'bg-amber-100',
        icon: Sparkles,
        features: [
            '所有已验证功能',
            '优先技术支持',
            '高级数据导出',
            '批量操作权限',
        ],
    },
};

export default function SecurityPage() {
    const { data: session } = useSession();
    const { data: user } = trpc.user.me.useQuery();

    const tier = session?.user?.tier || 'FREE';
    const tierInfo = tierConfig[tier] || tierConfig.FREE;
    const TierIcon = tierInfo.icon;

    const handleLogoutAllDevices = async () => {
        // 退出所有设备（重新登录）
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">安全设置</h1>
                <p className="text-gray-500 mt-1">管理你的账户安全和权限</p>
            </div>

            {/* 账户等级卡片 */}
            <div className="bg-white rounded-3xl border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        账户等级
                    </h3>
                </div>
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className={`h-16 w-16 rounded-2xl ${tierInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <TierIcon className={`h-8 w-8 ${tierInfo.color}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-xl font-bold text-gray-900">{tierInfo.label}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierInfo.bgColor} ${tierInfo.color}`}>
                                    {tier}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm">{tierInfo.description}</p>
                        </div>
                        {tier === 'FREE' && (
                            <Button asChild className="rounded-xl bg-gray-900 hover:bg-gray-800">
                                <Link href="/activate">
                                    升级账户
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                    </div>

                    {/* 功能列表 */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">当前等级权限</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {tierInfo.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 登录方式 */}
            <div className="bg-white rounded-3xl border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        登录方式
                    </h3>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">邮箱魔法链接</p>
                            <p className="text-sm text-gray-500">{session?.user?.email}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                            已启用
                        </span>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                        你的账户使用邮箱魔法链接登录，每次登录都会向你的邮箱发送一个一次性登录链接，无需记住密码。
                    </p>
                </div>
            </div>

            {/* 登录活动 */}
            <div className="bg-white rounded-3xl border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        账户活动
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    {/* 最近登录 */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="h-10 w-10 rounded-xl bg-gray-200 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">当前会话</p>
                            <p className="text-sm text-gray-500">
                                登录时间: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
                            </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                            活跃中
                        </span>
                    </div>

                    {/* 安全提示 */}
                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-900">安全提示</p>
                            <p className="text-sm text-amber-700 mt-1">
                                如果你在公共设备上登录，建议使用完毕后退出登录以保护账户安全。
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 危险操作 */}
            <div className="bg-white rounded-3xl border border-red-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-red-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-red-500">
                        危险操作
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <LogOut className="h-5 w-5 text-red-600" />
                            <div>
                                <p className="font-medium text-gray-900">退出所有设备</p>
                                <p className="text-sm text-gray-500">退出当前会话并需要重新登录</p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            onClick={handleLogoutAllDevices}
                        >
                            退出登录
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
