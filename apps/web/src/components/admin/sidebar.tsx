'use client';

/**
 * 后台管理侧边栏
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Palette,
    Users,
    Building2,
    FileText,
    Settings,
    ChevronLeft,
    Upload,
    Package,
    TrendingUp,
    Key,
    ClipboardCheck,
    KeyRound,
    ScrollText,
    BookOpen,
    Layers,
    Droplets,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
    {
        title: '仪表盘',
        href: '/admin',
        icon: LayoutDashboard,
    },
    {
        title: '色彩管理',
        href: '/admin/colors',
        icon: Palette,
    },
    {
        title: '色彩簿管理',
        href: '/admin/color-books',
        icon: BookOpen,
    },
    {
        title: '合作者管理',
        href: '/admin/partners',
        icon: Building2,
    },
    {
        title: '纸型管理',
        href: '/admin/paper-types',
        icon: Layers,
    },
    {
        title: '油墨管理',
        href: '/admin/inks',
        icon: Droplets,
    },
    {
        title: '打样包管理',
        href: '/admin/proofing-packs',
        icon: Package,
    },
    {
        title: '购买意图',
        href: '/admin/buy-intents',
        icon: TrendingUp,
    },
    {
        title: '激活码管理',
        href: '/admin/activation-codes',
        icon: Key,
    },
    {
        title: '审计注记',
        href: '/admin/audit-notes',
        icon: ClipboardCheck,
    },
    {
        title: '用户管理',
        href: '/admin/users',
        icon: Users,
    },
    {
        title: 'API 密钥',
        href: '/admin/api-keys',
        icon: KeyRound,
    },
    {
        title: '操作审计日志',
        href: '/admin/audit-logs',
        icon: ScrollText,
    },
    {
        title: '批次管理',
        href: '/admin/batches',
        icon: FileText,
    },
    {
        title: '数据导入',
        href: '/admin/import',
        icon: Upload,
    },
    {
        title: '系统设置',
        href: '/admin/settings',
        icon: Settings,
    },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 min-h-screen border-r bg-card">
            {/* 头部 */}
            <div className="h-16 flex items-center justify-between px-4 border-b">
                <Link href="/admin" className="font-bold text-lg">
                    SOURCE 后台
                </Link>
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            {/* 导航 */}
            <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/admin' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            // @ts-expect-error - Next.js 15 strict route types
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

