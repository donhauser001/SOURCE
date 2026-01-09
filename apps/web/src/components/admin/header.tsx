'use client';

/**
 * 后台管理顶部栏
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserNav } from '@/components/user-nav';

// 路径到标题的映射
const pathTitles: Record<string, string> = {
    '/admin': '仪表盘',
    '/admin/colors': '色彩管理',
    '/admin/colors/new': '添加色彩',
    '/admin/color-books': '色彩簿管理',
    '/admin/color-books/new': '新建色彩簿',
    '/admin/partners': '合作者管理',
    '/admin/partners/new': '添加合作者',
    '/admin/paper-types': '纸型管理',
    '/admin/paper-types/new': '新增纸型',
    '/admin/inks': '油墨管理',
    '/admin/inks/new': '新增油墨',
    '/admin/proofing-packs': '打样包管理',
    '/admin/proofing-packs/new': '新增打样包',
    '/admin/buy-intents': '购买意图',
    '/admin/activation-codes': '激活码管理',
    '/admin/activation-codes/generate': '生成激活码',
    '/admin/audit-notes': '审计注记',
    '/admin/users': '用户管理',
    '/admin/api-keys': 'API 密钥',
    '/admin/audit-logs': '操作审计日志',
    '/admin/batches': '批次管理',
    '/admin/batches/new': '创建批次',
    '/admin/import': '数据导入',
    '/admin/import/colors': '色彩数据导入',
    '/admin/import/paper-profiles': '纸张数据导入',
    '/admin/settings': '系统设置',
};

export function AdminHeader() {
    const pathname = usePathname();

    // 获取当前页面标题
    const getPageTitle = () => {
        // 精确匹配
        if (pathTitles[pathname]) {
            return pathTitles[pathname];
        }
        
        // 动态路由匹配 - 处理编辑页面等
        if (pathname.match(/^\/admin\/colors\/[^/]+\/edit$/)) {
            return '编辑色彩';
        }
        if (pathname.match(/^\/admin\/color-books\/[^/]+$/)) {
            return '编辑色彩簿';
        }
        if (pathname.match(/^\/admin\/partners\/[^/]+\/edit$/)) {
            return '编辑合作者';
        }
        if (pathname.match(/^\/admin\/paper-types\/[^/]+\/edit$/)) {
            return '编辑纸型';
        }
        if (pathname.match(/^\/admin\/inks\/[^/]+\/edit$/)) {
            return '编辑油墨';
        }
        if (pathname.match(/^\/admin\/batches\/[^/]+\/edit$/)) {
            return '编辑批次';
        }
        if (pathname.match(/^\/admin\/batches\/[^/]+$/)) {
            return '批次详情';
        }
        if (pathname.match(/^\/admin\/proofing-packs\/[^/]+\/edit$/)) {
            return '编辑打样包';
        }
        
        // 前缀匹配
        for (const [path, title] of Object.entries(pathTitles)) {
            if (path !== '/admin' && pathname.startsWith(path)) {
                return title;
            }
        }
        return '后台管理';
    };

    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
            {/* 左侧：页面标题 */}
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
            </div>

            {/* 右侧：操作区 */}
            <div className="flex items-center gap-3">
                {/* 搜索框 */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索..."
                        className="w-64 pl-9 h-9"
                    />
                </div>

                {/* 通知 */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                </Button>

                {/* 返回前台 */}
                <Button variant="outline" size="sm" asChild>
                    <Link href="/" target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        前台
                    </Link>
                </Button>

                {/* 用户菜单 */}
                <UserNav />
            </div>
        </header>
    );
}
