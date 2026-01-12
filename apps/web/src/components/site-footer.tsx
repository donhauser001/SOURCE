'use client';

/**
 * 网站底部栏
 * 
 * 包含：导航链接、版权信息、社交链接
 * 在 admin、login、register 等页面自动隐藏
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Twitter, Mail } from 'lucide-react';

// 不显示 Footer 的路径前缀
const hiddenPaths = ['/admin', '/login', '/register', '/forgot-password', '/activate'];

const footerNavItems = [
    {
        title: '产品',
        links: [
            { href: '/colors', label: '色彩库' },
            { href: '/color-books', label: '色彩簿' },
            { href: '/collab', label: 'ColLab' },
            { href: '/analyze', label: '色彩分析' },
        ],
    },
    {
        title: '资源',
        links: [
            { href: '/docs', label: '帮助文档' },
            { href: '/docs/api', label: 'API 文档' },
            { href: '/docs/cli', label: 'CLI 工具' },
        ],
    },
    {
        title: '社区',
        links: [
            { href: '/partners', label: '共建伙伴' },
            { href: '/collab/works', label: '作品展示' },
            { href: '/collab/tutorials', label: '教程' },
        ],
    },
    {
        title: '关于',
        links: [
            { href: '/about', label: '关于我们' },
            { href: '/privacy', label: '隐私政策' },
            { href: '/terms', label: '服务条款' },
        ],
    },
];

const socialLinks = [
    { href: 'https://github.com', label: 'GitHub', icon: Github },
    { href: 'https://twitter.com', label: 'Twitter', icon: Twitter },
    { href: 'mailto:contact@source.color', label: '邮箱', icon: Mail },
];

export function SiteFooter() {
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();

    // 检查是否应该隐藏 Footer
    const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));
    if (shouldHide) {
        return null;
    }

    return (
        <footer className="border-t bg-muted/30">
            <div className="max-w-[1600px] mx-auto px-6">
                {/* 主要内容区 */}
                <div className="py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {/* 品牌区 */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-4">
                        <Link
                            href="/"
                            className="text-lg font-bold tracking-[0.15em] uppercase"
                        >
                            SOURCE
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            专业色彩管理平台，为设计师和印刷行业提供精准的色彩解决方案。
                        </p>
                        {/* 社交链接 */}
                        <div className="flex items-center gap-3 pt-2">
                            {socialLinks.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                                        aria-label={item.label}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* 导航链接 */}
                    {footerNavItems.map((section) => (
                        <div key={section.title} className="space-y-4">
                            <h3 className="text-sm font-semibold">{section.title}</h3>
                            <ul className="space-y-2.5">
                                {section.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            // @ts-expect-error - Next.js 15 strict route types
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* 底部版权栏 */}
                <div className="py-6 border-t flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {currentYear} SOURCE. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            隐私政策
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            服务条款
                        </Link>
                        <Link href="/sitemap" className="hover:text-foreground transition-colors">
                            网站地图
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
