/**
 * 文档页面
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Book, Terminal, Palette, FileJson, ExternalLink, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
    title: '文档 | SOURCE',
    description: 'SOURCE 色彩体系文档，包含 API 参考、CLI 命令、数据格式说明。',
};

const docs = [
    {
        icon: Palette,
        title: '色彩身份证',
        description: '了解色彩身份证的数据结构、真源定义、纸张表现模型',
        href: '/docs/color-identity',
        status: 'available',
    },
    {
        icon: Terminal,
        title: 'CLI 命令参考',
        description: 'SOURCE CLI 完整命令列表，支持 AI/脚本调用',
        href: '/docs/cli',
        status: 'available',
    },
    {
        icon: FileJson,
        title: 'SourcePack 格式',
        description: '工程色彩包 (.sourcepack.json) 的 JSON Schema 规范',
        href: '/docs/sourcepack',
        status: 'coming',
    },
    {
        icon: Book,
        title: 'API 参考',
        description: 'REST API 端点、认证、速率限制、错误码说明',
        href: '/docs/api',
        status: 'available',
    },
];

export default function DocsPage() {
    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    {/* 头部 */}
                    <header className="mb-12 text-center">
                        <h1 className="text-3xl font-bold tracking-tight mb-3">文档</h1>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            SOURCE 色彩体系的技术文档，包含数据模型、API 参考、CLI 命令说明。
                        </p>
                    </header>

                    {/* 文档列表 */}
                    <div className="grid md:grid-cols-2 gap-4 mb-12">
                        {docs.map((doc) => {
                            const Icon = doc.icon;
                            const isAvailable = doc.status === 'available';

                            return (
                                <Card
                                    key={doc.href}
                                    className={`group transition-all ${isAvailable ? 'hover:shadow-lg hover:-translate-y-1' : 'opacity-60'}`}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-primary" />
                                            </div>
                                            {!isAvailable && (
                                                <span className="text-xs text-muted-foreground">即将推出</span>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                                        <CardDescription>{doc.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {isAvailable ? (
                                            <Link
                                                // @ts-expect-error - Next.js 15 strict route types
                                                href={doc.href}
                                                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                查看文档
                                                <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">敬请期待</span>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* 快速链接 */}
                    <div className="border-t pt-8">
                        <h2 className="text-lg font-semibold mb-4">快速链接</h2>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/api/v1/tools" className="gap-2">
                                    <FileJson className="w-4 h-4" />
                                    工具注册表 (JSON)
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <a
                                    href="https://github.com/donhauser001/SOURCE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    GitHub
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

