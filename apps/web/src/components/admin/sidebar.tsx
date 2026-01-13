'use client';

/**
 * 后台管理侧边栏
 * 
 * 分组导航设计
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
    FlaskConical,
    FolderTree,
    FileStack,
    Clock,
    HelpCircle,
    Ticket,
    FileQuestion,
    Shield,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: '',
        items: [
            {
                title: '仪表盘',
                href: '/admin',
                icon: LayoutDashboard,
            },
        ],
    },
    {
        label: '色彩数据',
        items: [
            {
                title: '色彩簿',
                href: '/admin/color-books',
                icon: BookOpen,
            },
            {
                title: '色彩管理',
                href: '/admin/colors',
                icon: Palette,
            },
            {
                title: '色彩配方',
                href: '/admin/recipes',
                icon: FlaskConical,
            },
        ],
    },
    {
        label: '材料管理',
        items: [
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
        ],
    },
    {
        label: '内容管理',
        items: [
            {
                title: '内容列表',
                href: '/admin/contents',
                icon: FileStack,
            },
            {
                title: '审核队列',
                href: '/admin/content-review',
                icon: Clock,
            },
            {
                title: '内容分类',
                href: '/admin/content-categories',
                icon: FolderTree,
            },
        ],
    },
    {
        label: '审计管理',
        items: [
            {
                title: '审计注记',
                href: '/admin/audit-notes',
                icon: ClipboardCheck,
            },
            {
                title: '批次管理',
                href: '/admin/batches',
                icon: FileText,
            },
        ],
    },
    {
        label: '销售管理',
        items: [
            {
                title: '打样包',
                href: '/admin/proofing-packs',
                icon: Package,
            },
            {
                title: '购买意图',
                href: '/admin/buy-intents',
                icon: TrendingUp,
            },
        ],
    },
    {
        label: '用户管理',
        items: [
            {
                title: '用户管理',
                href: '/admin/users',
                icon: Users,
            },
            {
                title: '共建者',
                href: '/admin/partners',
                icon: Building2,
            },
            {
                title: '激活码',
                href: '/admin/activation-codes',
                icon: Key,
            },
            {
                title: 'API 密钥',
                href: '/admin/api-keys',
                icon: KeyRound,
            },
        ],
    },
    {
        label: '客服支持',
        items: [
            {
                title: '工单管理',
                href: '/admin/support/tickets',
                icon: Ticket,
            },
            {
                title: '工单分类',
                href: '/admin/support/categories',
                icon: FolderTree,
            },
        ],
    },
    {
        label: '文档管理',
        items: [
            {
                title: '帮助文档',
                href: '/admin/docs/help',
                icon: HelpCircle,
            },
            {
                title: '隐私政策',
                href: '/admin/docs/privacy',
                icon: Shield,
            },
            {
                title: '服务条款',
                href: '/admin/docs/terms',
                icon: FileQuestion,
            },
        ],
    },
    {
        label: '系统',
        items: [
            {
                title: '数据导入',
                href: '/admin/import',
                icon: Upload,
            },
            {
                title: '操作日志',
                href: '/admin/audit-logs',
                icon: ScrollText,
            },
            {
                title: '系统设置',
                href: '/admin/settings',
                icon: Settings,
            },
        ],
    },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 min-h-screen border-r bg-card flex flex-col">
            {/* 头部 */}
            <div className="h-16 flex items-center justify-between px-4 border-b shrink-0">
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
            <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                {navGroups.map((group, groupIdx) => (
                    <div key={group.label || `group-${groupIdx}`}>
                        {/* 分组标题 */}
                        {group.label && (
                            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {group.label}
                            </div>
                        )}
                        {/* 分组项目 */}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
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
                                        <item.icon className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{item.title}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
