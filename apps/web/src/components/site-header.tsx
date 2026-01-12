'use client';

/**
 * 极简工具条导航
 * 
 * 设计原则：前沿、先锋、极简
 * - 透明背景，不干扰内容
 * - 紧凑高度，小工具条形态
 * - 悬浮状态，轻盈存在感
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Settings, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from 'next-auth/react';

const navItems = [
    { href: '/colors', label: '色彩库' },
    { href: '/color-books', label: '色彩簿' },
    { href: '/works', label: '社区' },
    { href: '/partners', label: '共建' },
    { href: '/analyze', label: '分析' },
    { href: '/docs', label: '支持' },
];

export function SiteHeader({ isDark = false }: { isDark?: boolean }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = (session?.user as { role?: string })?.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'OPERATOR';

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            {/* 全宽工具条 */}
            <div className="w-full px-6 lg:px-12 py-3">
                <div className="flex items-center justify-between h-8">
                    {/* 左侧：Logo + 导航 */}
                    <div className="flex items-center gap-1">
                        {/* Logo - 极简文字 */}
                        <Link
                            href="/"
                            className={cn(
                                "text-base font-bold tracking-[0.15em] uppercase transition-colors mr-6",
                                isDark ? "text-white hover:text-white/80" : "text-foreground/90 hover:text-foreground"
                            )}
                        >
                            SOURCE
                        </Link>

                        {/* 分隔线 */}
                        <span className={cn(
                            "hidden md:block w-px h-4 mr-4",
                            isDark ? "bg-white/20" : "bg-foreground/10"
                        )} />

                        {/* 桌面端导航 - 紧凑间距 */}
                        <nav className="hidden md:flex items-center">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    // @ts-expect-error - Next.js 15 strict route types
                                    href={item.href}
                                    className={cn(
                                        'text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-sm',
                                        pathname === item.href || pathname.startsWith(item.href + '/')
                                            ? isDark ? 'text-white bg-white/20' : 'text-foreground bg-foreground/5'
                                            : isDark ? 'text-white/50 hover:text-white/80 hover:bg-white/10' : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5'
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* 右侧：操作区 */}
                    <div className="flex items-center gap-1">
                        {/* 后台入口 */}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className={cn(
                                    "hidden md:flex items-center justify-center w-8 h-8 rounded-sm transition-all",
                                    isDark ? "text-white/40 hover:text-white/70 hover:bg-white/10" : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
                                )}
                                title="管理后台"
                            >
                                <Settings className="h-4 w-4" />
                            </Link>
                        )}

                        {/* 用户菜单 */}
                        <UserNav isDark={isDark} />

                        {/* 移动端菜单 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="md:hidden">
                                <button className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-sm transition-all",
                                    isDark ? "text-white/50 hover:text-white/80 hover:bg-white/10" : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5"
                                )}>
                                    <Menu className="h-5 w-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-background/95 backdrop-blur-xl border-foreground/10">
                                {navItems.map((item) => (
                                    <DropdownMenuItem key={item.href} asChild className="text-sm">
                                        {/* @ts-expect-error - Next.js 15 strict route types */}
                                        <Link href={item.href} className="flex items-center justify-between">
                                            {item.label}
                                            <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                                {isAdmin && (
                                    <>
                                        <DropdownMenuSeparator className="bg-foreground/5" />
                                        <DropdownMenuItem asChild className="text-sm">
                                            <Link href="/admin" className="flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                后台
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
}
