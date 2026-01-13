'use client';

/**
 * 智能导航组件
 * 
 * 设计原则：前沿、先锋、极简
 * - 默认：透明顶部导航栏
 * - 向上滚动：收缩为左侧浮动菜单按钮
 * - 点击展开完整导航
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Settings, ChevronRight, Plus, Palette, BookOpen, FileText, X, Home, Handshake, Search, LifeBuoy, FlaskConical } from 'lucide-react';
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
import { useSession, signIn } from 'next-auth/react';

const navItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/colors', label: '色彩库', icon: Palette },
    { href: '/color-books', label: '色彩簿', icon: BookOpen },
    { href: '/collab', label: 'ColLab', icon: FlaskConical },
    { href: '/partners', label: '共建', icon: Handshake },
    { href: '/analyze', label: '分析', icon: Search },
    { href: '/docs', label: '支持', icon: LifeBuoy },
];

const publishMenuItems = [
    { type: 'work', label: '发表作品', icon: Palette, href: '/collab/create?type=work' },
    { type: 'tutorial', label: '发布教程', icon: BookOpen, href: '/collab/create?type=tutorial' },
    { type: 'article', label: '发表文章', icon: FileText, href: '/collab/create?type=article' },
];

// 滚动阈值
const SCROLL_THRESHOLD = 100; // 滚动超过这个值才触发收缩
const SCROLL_UP_DISTANCE = 50; // 向上滚动这个距离触发收缩

export function SiteHeader({ isDark = false }: { isDark?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const userRole = (session?.user as { role?: string })?.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'OPERATOR';

    // 状态
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const lastScrollY = useRef(0);

    // 滚动监听
    useEffect(() => {
        // 初始化时检查滚动位置
        lastScrollY.current = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // 在页面顶部区域，始终显示顶部导航
            if (currentScrollY < SCROLL_THRESHOLD) {
                setIsCollapsed(false);
                setIsMenuOpen(false);
                lastScrollY.current = currentScrollY;
                return;
            }

            // 向下滚动（远离顶部）- 收缩为浮动按钮
            if (currentScrollY > lastScrollY.current + 10) {
                setIsCollapsed(true);
            }
            // 向上滚动（接近顶部）- 恢复顶部导航
            else if (currentScrollY < lastScrollY.current - 10) {
                setIsCollapsed(false);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 处理发表菜单点击
    const handlePublishClick = useCallback((href: string) => {
        if (!session) {
            signIn(undefined, { callbackUrl: href });
        } else {
            router.push(href as Route);
        }
        setIsMenuOpen(false);
    }, [session, router]);

    // 处理导航点击
    const handleNavClick = useCallback(() => {
        setIsMenuOpen(false);
    }, []);

    return (
        <>
            {/* 顶部导航栏 - 默认状态 */}
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
                    isCollapsed ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0"
                )}
            >
                <div className="w-full px-6 lg:px-12 py-4">
                    <div className="flex items-center justify-between h-10">
                        {/* 左侧：Logo + 导航 */}
                        <div className="flex items-center gap-1">
                            <Link
                                href="/"
                                className={cn(
                                    "text-lg font-bold tracking-[0.15em] uppercase transition-colors",
                                    isDark ? "text-white hover:text-white/80" : "text-foreground/90 hover:text-foreground"
                                )}
                            >
                                SOURCE
                            </Link>
                            <span className={cn(
                                "ml-2 mr-6 px-2 py-0.5 text-[10px] font-medium rounded-full border",
                                isDark
                                    ? "text-white/60 border-white/20 bg-white/5"
                                    : "text-foreground/50 border-foreground/15 bg-foreground/5"
                            )}>
                                v0.6.0 | 测试版
                            </span>

                            <span className={cn(
                                "hidden md:block w-px h-5 mr-6",
                                isDark ? "bg-white/20" : "bg-foreground/10"
                            )} />

                            <nav className="hidden md:flex items-center gap-2">
                                {navItems.slice(1).map((item) => (
                                    <Link
                                        key={item.href}
                                        // @ts-expect-error - Next.js 15 strict route types
                                        href={item.href}
                                        className={cn(
                                            'text-base font-medium transition-all duration-200 px-4 py-2 rounded-full',
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "hidden md:flex items-center px-4 h-8 rounded-full transition-all text-sm font-medium",
                                            isDark
                                                ? "bg-transparent text-white border-white/30 hover:bg-white/10 data-[state=open]:bg-white/20"
                                                : "bg-transparent text-foreground border-foreground hover:bg-foreground/5 data-[state=open]:bg-foreground/10"
                                        )}
                                    >
                                        发表
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-40 bg-background/95 backdrop-blur-xl border-foreground/10 rounded-xl"
                                >
                                    {publishMenuItems.map((item) => (
                                        <DropdownMenuItem
                                            key={item.type}
                                            className="text-sm cursor-pointer"
                                            onClick={() => handlePublishClick(item.href)}
                                        >
                                            <item.icon className="h-4 w-4 mr-2" />
                                            {item.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

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

                            <UserNav isDark={isDark} />

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
                                    <DropdownMenuSeparator className="bg-foreground/5" />
                                    {publishMenuItems.map((item) => (
                                        <DropdownMenuItem
                                            key={item.type}
                                            className="text-sm cursor-pointer"
                                            onClick={() => handlePublishClick(item.href)}
                                        >
                                            <item.icon className="h-4 w-4 mr-2" />
                                            {item.label}
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

            {/* 浮动菜单按钮 - 收缩状态 */}
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                    "fixed left-6 top-6 z-50",
                    "w-12 h-12 rounded-full",
                    "bg-foreground text-background",
                    "flex items-center justify-center",
                    "shadow-lg shadow-foreground/20",
                    "transition-all duration-500 ease-out",
                    "hover:scale-110 active:scale-95",
                    isCollapsed && !isMenuOpen
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-full pointer-events-none"
                )}
                aria-label="打开菜单"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* 展开的悬浮菜单卡片 */}
            <div
                className={cn(
                    "fixed inset-0 z-50 transition-all duration-300",
                    isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
                )}
            >
                {/* 背景遮罩 */}
                <div
                    className={cn(
                        "absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
                        isMenuOpen ? "opacity-100" : "opacity-0"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                />

                {/* 悬浮菜单卡片 */}
                <div
                    className={cn(
                        "absolute left-6 top-6 w-72",
                        "bg-background/95 backdrop-blur-xl",
                        "rounded-2xl border shadow-2xl",
                        "transition-all duration-300 ease-out origin-top-left",
                        isMenuOpen
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-95 pointer-events-none"
                    )}
                >
                    {/* 菜单头部 */}
                    <div className="flex items-center justify-between p-5 border-b">
                        <div className="flex items-center">
                            <Link
                                href="/"
                                onClick={handleNavClick}
                                className="text-base font-bold tracking-[0.15em] uppercase"
                            >
                                SOURCE
                            </Link>
                            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-medium rounded-full border text-foreground/50 border-foreground/15 bg-foreground/5">
                                v0.6.0 | 测试版
                            </span>
                        </div>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                            aria-label="关闭菜单"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* 导航链接 */}
                    <nav className="p-3 space-y-0.5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
                            return (
                                <Link
                                    key={item.href}
                                    // @ts-expect-error - Next.js 15 strict route types
                                    href={item.href}
                                    onClick={handleNavClick}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm",
                                        isActive
                                            ? "bg-foreground text-background"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* 分隔线 */}
                    <div className="mx-3 border-t" />

                    {/* 发表操作 */}
                    <div className="p-3 space-y-0.5">
                        <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            创作
                        </p>
                        {publishMenuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.type}
                                    onClick={() => handlePublishClick(item.href)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-all text-left text-sm"
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* 后台入口 */}
                    {isAdmin && (
                        <>
                            <div className="mx-3 border-t" />
                            <div className="p-3">
                                <Link
                                    href="/admin"
                                    onClick={handleNavClick}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-all text-sm"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span className="font-medium">管理后台</span>
                                </Link>
                            </div>
                        </>
                    )}

                    {/* 底部用户信息 */}
                    <div className="p-3 pt-0 border-t mt-1">
                        <div className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-sm text-muted-foreground">
                                {session?.user?.name || '未登录'}
                            </span>
                            <UserNav isDark={false} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
