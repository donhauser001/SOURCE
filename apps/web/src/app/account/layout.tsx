'use client';

/**
 * 个人中心布局
 * 
 * 包含侧边导航和内容区域
 */

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
    User, 
    Shield, 
    Key, 
    Loader2,
    LayoutDashboard,
    ArrowLeft,
    LogOut,
    ChevronRight,
    Palette,
    ImageIcon
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const navigation = [
    {
        name: '概览',
        href: '/account',
        icon: LayoutDashboard,
    },
    {
        name: '色彩资产',
        href: '/account/assets',
        icon: Palette,
    },
    {
        name: '我的作品',
        href: '/account/works',
        icon: ImageIcon,
    },
    {
        name: '个人资料',
        href: '/account/profile',
        icon: User,
    },
    {
        name: '安全设置',
        href: '/account/security',
        icon: Shield,
    },
    {
        name: 'API 密钥',
        href: '/account/api-keys',
        icon: Key,
    },
];

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    // 未登录重定向
    if (status === 'unauthenticated') {
        router.push('/login?callbackUrl=/account');
        return null;
    }

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

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 顶部导航栏 */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* 左侧 Logo 和返回 */}
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span className="hidden sm:inline">返回首页</span>
                            </Link>
                            <div className="h-6 w-px bg-gray-200" />
                            <Link href="/" className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center">
                                    <span className="text-lg font-black text-white">S</span>
                                </div>
                                <span className="font-bold text-gray-900 hidden sm:block">SOURCE</span>
                            </Link>
                        </div>

                        {/* 右侧用户信息 */}
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">
                                    {session?.user?.name || '用户'}
                                </p>
                                <p className="text-xs text-gray-500">{session?.user?.email}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center">
                                {session?.user?.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img 
                                        src={session.user.image} 
                                        alt="" 
                                        className="h-10 w-10 rounded-full" 
                                    />
                                ) : (
                                    <span className="text-white font-medium">
                                        {(session?.user?.name || session?.user?.email)?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* 侧边导航 */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-3xl border border-black/10 p-2 sticky top-24">
                            <nav className="space-y-1">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                                                isActive
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        >
                                            <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                            <span className="font-medium">{item.name}</span>
                                            {!isActive && (
                                                <ChevronRight className="h-4 w-4 ml-auto text-gray-300 group-hover:text-gray-400" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* 退出登录 */}
                            <div className="border-t border-gray-100 mt-4 pt-4">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    <LogOut className="h-5 w-5 text-gray-400" />
                                    <span className="font-medium">退出登录</span>
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* 主内容区 */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
