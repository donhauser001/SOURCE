'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Sparkles, Palette, BookOpen, FileText, Eye, ThumbsUp } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { trpc } from '@/lib/trpc';
import { labToRgb } from '@/lib/color';

// 内容类型图标
const typeIcons = {
    WORK: Palette,
    TUTORIAL: BookOpen,
    ARTICLE: FileText,
};

export default function HomePage() {
    // 获取首页推荐内容
    const { data: homepageData } = trpc.content.publicList.useQuery({
        featuredLevel: 2, // HOMEPAGE = 首页推荐
        limit: 6,
    });

    const homepageItems = homepageData?.items || [];

    return (
        <div className="min-h-screen bg-background">
            <SiteHeader />

            {/* Hero - 极简全屏 */}
            <main className="relative">
                {/* 背景纹理 */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:24px_24px]" />

                <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
                    {/* 主标题区 */}
                    <div className="text-center space-y-8 max-w-3xl">
                        {/* 标签 */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-foreground/10 bg-foreground/[0.02]">
                            <Sparkles className="h-3 w-3 text-foreground/40" />
                            <span className="text-[11px] tracking-wide text-foreground/50">
                                实体印刷色彩实操体系
                            </span>
                        </div>

                        {/* 主标题 */}
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight text-foreground/90">
                            不被定义的色彩
                        </h1>

                        {/* 副标题 */}
                        <p className="text-lg sm:text-xl text-foreground/40 font-light max-w-xl mx-auto leading-relaxed">
                            一个基于现实验证的色彩体系
                            <br />
                            <span className="text-foreground/25">连接数字设计与实体印刷</span>
                        </p>

                        {/* CTA */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link
                                href="/colors"
                                className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-medium transition-all hover:opacity-90"
                            >
                                探索色彩
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                            <Link
                                href="/docs"
                                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm text-foreground/50 hover:text-foreground/70 transition-colors"
                            >
                                了解更多
                            </Link>
                        </div>
                    </div>

                    {/* 滚动提示 */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
                        <div className="w-px h-12 bg-gradient-to-b from-transparent via-foreground/10 to-foreground/20" />
                    </div>
                </section>

                {/* 首页推荐 */}
                {homepageItems.length > 0 && (
                    <section className="relative py-24 px-4 border-t border-foreground/5">
                        <div className="max-w-6xl mx-auto">
                            {/* 标题 */}
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="h-5 w-5 text-amber-500" />
                                    <h2 className="text-2xl font-light text-foreground/80">精选推荐</h2>
                                </div>
                                <Link
                                    href="/collab"
                                    className="group inline-flex items-center gap-1.5 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
                                >
                                    探索更多
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>

                            {/* 内容网格 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {homepageItems.map((item) => {
                                    const Icon = typeIcons[item.contentType as keyof typeof typeIcons];
                                    const colors = item.colors?.slice(0, 4) || [];

                                    return (
                                        <Link
                                            key={item.id}
                                            href={`/collab/${item.id}` as Route}
                                            className="group block"
                                        >
                                            <article className="relative overflow-hidden rounded-2xl border border-foreground/5 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all duration-300">
                                                {/* 封面图 */}
                                                <div className="aspect-[16/10] overflow-hidden bg-foreground/5">
                                                    {item.coverImageUrl ? (
                                                        <img
                                                            src={item.coverImageUrl}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Icon className="h-12 w-12 text-foreground/10" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 内容 */}
                                                <div className="p-5">
                                                    {/* 类型标签 */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/5 text-[10px] text-foreground/50">
                                                            <Icon className="h-3 w-3" />
                                                            {item.contentTypeLabel}
                                                        </span>
                                                    </div>

                                                    {/* 标题 */}
                                                    <h3 className="text-base font-medium text-foreground/80 line-clamp-2 group-hover:text-foreground transition-colors">
                                                        {item.title}
                                                    </h3>

                                                    {/* 摘要 */}
                                                    {item.summary && (
                                                        <p className="mt-2 text-sm text-foreground/40 line-clamp-2">
                                                            {item.summary}
                                                        </p>
                                                    )}

                                                    {/* 底部信息 */}
                                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-foreground/5">
                                                        {/* 作者 */}
                                                        <div className="flex items-center gap-2">
                                                            {item.author.image ? (
                                                                <img
                                                                    src={item.author.image}
                                                                    alt={item.author.name || ''}
                                                                    className="h-6 w-6 rounded-full"
                                                                />
                                                            ) : (
                                                                <div className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-medium text-foreground/40">
                                                                    {(item.author.name || '?')[0].toUpperCase()}
                                                                </div>
                                                            )}
                                                            <span className="text-xs text-foreground/40">
                                                                {item.author.name || '匿名'}
                                                            </span>
                                                        </div>

                                                        {/* 关联色彩 */}
                                                        {colors.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                {colors.map(({ color }) => {
                                                                    const rgb = labToRgb(color.labL, color.labA, color.labB);
                                                                    return (
                                                                        <div
                                                                            key={color.id}
                                                                            className="h-4 w-4 rounded-full border border-foreground/10"
                                                                            style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
                                                                            title={color.name}
                                                                        />
                                                                    );
                                                                })}
                                                                {(item.colors?.length || 0) > 4 && (
                                                                    <span className="text-[10px] text-foreground/30 ml-0.5">
                                                                        +{(item.colors?.length || 0) - 4}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* 特性区 - 极简卡片 */}
                <section className="relative py-32 px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-1">
                            {[
                                {
                                    num: '01',
                                    title: '色彩身份证',
                                    desc: '每个色号拥有专属页面，真源 Lab 数据、纸张表现、油墨配方。',
                                },
                                {
                                    num: '02',
                                    title: '系统接口',
                                    desc: 'AI 与脚本可调用的结构化命令，审计日志完整可追溯。',
                                },
                                {
                                    num: '03',
                                    title: '工程分析',
                                    desc: '上传工程文件，解析用色、识别风险、推荐材料。',
                                },
                            ].map((item) => (
                                <div
                                    key={item.num}
                                    className="group p-8 border-l border-foreground/5 hover:bg-foreground/[0.02] transition-colors"
                                >
                                    <span className="text-[10px] font-mono text-foreground/20 tracking-widest">
                                        {item.num}
                                    </span>
                                    <h3 className="mt-4 text-lg font-medium text-foreground/80">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-foreground/40 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 数据区 */}
                <section className="relative py-24 px-4 border-t border-foreground/5">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { value: '3+', label: '验证色彩' },
                                { value: '7+', label: '合作伙伴' },
                                { value: '5', label: '纸张类型' },
                                { value: '∞', label: '可能性' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className="text-3xl sm:text-4xl font-light text-foreground/70">
                                        {stat.value}
                                    </div>
                                    <div className="mt-1 text-[11px] text-foreground/30 tracking-wide">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer - 极简 */}
            <footer className="py-8 px-4 border-t border-foreground/5">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-[11px] text-foreground/30 tracking-wide">
                        SOURCE v0.2.2
                    </span>
                    <div className="flex items-center gap-6">
                        <Link
                            href="/docs"
                            className="text-[11px] text-foreground/30 hover:text-foreground/50 transition-colors"
                        >
                            文档
                        </Link>
                        <Link
                            href="/partners"
                            className="text-[11px] text-foreground/30 hover:text-foreground/50 transition-colors"
                        >
                            合作者
                        </Link>
                        <a
                            href="https://github.com/donhauser001/SOURCE"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-foreground/30 hover:text-foreground/50 transition-colors"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
