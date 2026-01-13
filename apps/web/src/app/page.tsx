/**
 * SOURCE 首页
 * 
 * 功能导向型首页，8 个板块：
 * 1. Hero + 快速入口
 * 2. 精选色彩
 * 3. 色彩簿推荐
 * 4. 产品特性
 * 5. 共建者展示
 * 6. ColLab 精选
 * 7. 实时统计
 * 8. Footer
 */

import Link from 'next/link';
import { ArrowRight, Sparkles, Palette, BookOpen, FileText, Search, Users, ShieldCheck, FlaskConical } from 'lucide-react';
import { prisma } from '@/lib/db';
import { SiteHeader } from '@/components/site-header';
import { FeaturedColors } from './home/featured-colors';
import { FeaturedColorBooks } from './home/featured-color-books';
import { PartnersSection } from './home/partners-section';
import { CollabSection } from './home/collab-section';

// 强制动态渲染，确保每次请求都获取最新数据
export const dynamic = 'force-dynamic';

// =============================================================================
// 数据获取
// =============================================================================

async function getHomeData() {
    const [
        stats,
        featuredColors,
        featuredColorBooks,
        partners,
        featuredContents,
    ] = await Promise.all([
        // 统计数据
        Promise.all([
            prisma.color.count({ where: { auditStatus: 'VERIFIED' } }),
            prisma.color.count(),
            prisma.colorBook.count({ where: { status: 'ACTIVE' } }),
            prisma.partner.count({ where: { status: 'ACTIVE' } }),
            prisma.content.count({ where: { status: 'PUBLISHED' } }),
        ]).then(([verifiedColors, totalColors, colorBooks, partners, contents]) => ({
            verifiedColors,
            totalColors,
            colorBooks,
            partners,
            contents,
            cliCommands: 15,
        })),

        // 精选色彩（5列 x 3行 = 15个）
        prisma.color.findMany({
            where: { status: 'ACTIVE' },
            take: 15,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                colorId: true,
                name: true,
                labL: true,
                labA: true,
                labB: true,
                status: true,
                auditStatus: true,
                colorFamily: true,
            },
        }),

        // 色彩簿
        prisma.colorBook.findMany({
            where: { status: 'ACTIVE', isPublic: true },
            take: 4,
            orderBy: { totalColors: 'desc' },
            select: {
                id: true,
                bookId: true,
                name: true,
                slug: true,
                shortDesc: true,
                coverImageUrl: true,
                publishedYear: true,
                totalColors: true,
                category: { select: { name: true } },
            },
        }),

        // 共建者
        prisma.partner.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                partnerId: true,
                name: true,
                shortName: true,
                types: true,
                logoUrl: true,
                websiteUrl: true,
            },
        }),

        // ColLab 精选
        prisma.content.findMany({
            where: {
                status: 'PUBLISHED',
                featuredLevel: { in: ['HOMEPAGE', 'HERO', 'EDITOR_PICK'] },
            },
            take: 6,
            orderBy: { publishedAt: 'desc' },
            select: {
                id: true,
                contentId: true,
                contentType: true,
                title: true,
                summary: true,
                coverImageUrl: true,
                viewCount: true,
                likeCount: true,
                author: {
                    select: { id: true, name: true, image: true },
                },
                colors: {
                    take: 4,
                    select: {
                        color: {
                            select: {
                                id: true,
                                colorId: true,
                                name: true,
                                labL: true,
                                labA: true,
                                labB: true,
                            },
                        },
                    },
                },
            },
        }),
    ]);

    // 共建者统计
    const partnerStats = {
        printers: partners.filter(p => p.types.includes('PRINTER')).length,
        paperVendors: partners.filter(p => p.types.includes('PAPER_VENDOR')).length,
        inkVendors: partners.filter(p => p.types.includes('INK_VENDOR')).length,
        labs: partners.filter(p => p.types.includes('LAB')).length,
        consultants: partners.filter(p => p.types.includes('CONSULTANT')).length,
    };

    return {
        stats,
        featuredColors,
        featuredColorBooks,
        partners,
        partnerStats,
        featuredContents,
    };
}

// =============================================================================
// 页面组件
// =============================================================================

export default async function HomePage() {
    const data = await getHomeData();

    return (
        <div className="min-h-screen bg-background">
            <SiteHeader />

            <main className="relative">
                {/* ============================================================= */}
                {/* 1. Hero 区 - 左右分栏布局 */}
                {/* ============================================================= */}
                <section className="relative pt-20 pb-16 px-6 lg:px-12">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            {/* 左侧：文字内容 */}
                            <div className="space-y-6 lg:pr-8">
                                {/* 标签 */}
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-foreground/10 bg-foreground/[0.02]">
                                    <Sparkles className="h-3 w-3 text-foreground/40" />
                                    <span className="text-[11px] tracking-wide text-foreground/50 uppercase">
                                        实体印刷色彩实操体系
                                    </span>
                                </div>

                                {/* 主标题 */}
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.1]">
                                    不被定义的
                                    <br />
                                    <span className="text-foreground/60">色彩</span>
                                </h1>

                                {/* 副标题 */}
                                <p className="text-lg text-foreground/50 leading-relaxed max-w-md">
                                    基于现实验证的色彩标准系统，连接数字设计与实体印刷，让每一个色彩都可追溯、可复现。
                                </p>

                                {/* CTA 按钮组 */}
                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <Link
                                        href="/colors"
                                        className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium transition-all hover:opacity-90"
                                    >
                                        <Palette className="h-4 w-4" />
                                        探索色彩库
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                    <Link
                                        href="/analyze"
                                        className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-foreground/20 text-foreground/70 text-sm font-medium transition-all hover:bg-foreground/5"
                                    >
                                        <Search className="h-4 w-4" />
                                        工程分析
                                    </Link>
                                </div>

                                {/* 快捷入口 */}
                                <div className="flex items-center gap-6 pt-4 text-sm">
                                    <Link href="/docs" className="text-foreground/40 hover:text-foreground/60 transition-colors flex items-center gap-1.5">
                                        <FileText className="h-4 w-4" />
                                        帮助中心
                                    </Link>
                                    <Link href="/partners" className="text-foreground/40 hover:text-foreground/60 transition-colors flex items-center gap-1.5">
                                        <Users className="h-4 w-4" />
                                        共建者
                                    </Link>
                                </div>
                            </div>

                            {/* 右侧：色彩展示 */}
                            <div className="relative">
                                {/* 装饰背景 */}
                                <div className="absolute -inset-4 bg-gradient-to-br from-foreground/[0.02] to-transparent rounded-3xl" />
                                
                                {/* 色彩卡片网格 */}
                                <div className="relative grid grid-cols-3 gap-3">
                                    {data.featuredColors.slice(0, 6).map((color, index) => {
                                        const labToRgb = (l: number, a: number, b: number) => {
                                            const y = (l + 16) / 116;
                                            const x = a / 500 + y;
                                            const z = y - b / 200;
                                            const x3 = x * x * x, y3 = y * y * y, z3 = z * z * z;
                                            const xn = x3 > 0.008856 ? x3 : (x - 16/116) / 7.787;
                                            const yn = y3 > 0.008856 ? y3 : (y - 16/116) / 7.787;
                                            const zn = z3 > 0.008856 ? z3 : (z - 16/116) / 7.787;
                                            let r = xn * 95.047 * 3.2406 + yn * 100 * -1.5372 + zn * 108.883 * -0.4986;
                                            let g = xn * 95.047 * -0.9689 + yn * 100 * 1.8758 + zn * 108.883 * 0.0415;
                                            let bVal = xn * 95.047 * 0.0557 + yn * 100 * -0.204 + zn * 108.883 * 1.057;
                                            r = r > 0.0031308 ? 1.055 * Math.pow(r/100, 1/2.4) - 0.055 : 12.92 * r / 100;
                                            g = g > 0.0031308 ? 1.055 * Math.pow(g/100, 1/2.4) - 0.055 : 12.92 * g / 100;
                                            bVal = bVal > 0.0031308 ? 1.055 * Math.pow(bVal/100, 1/2.4) - 0.055 : 12.92 * bVal / 100;
                                            return `rgb(${Math.round(Math.min(255, Math.max(0, r * 255)))}, ${Math.round(Math.min(255, Math.max(0, g * 255)))}, ${Math.round(Math.min(255, Math.max(0, bVal * 255)))})`;
                                        };
                                        const bgColor = labToRgb(color.labL, color.labA, color.labB);
                                        const isLight = color.labL > 60;
                                        
                                        return (
                                            <Link
                                                key={color.id}
                                                href={`/color/${color.colorId}`}
                                                className="group aspect-square rounded-2xl p-4 flex flex-col justify-end transition-transform hover:scale-[1.02]"
                                                style={{ backgroundColor: bgColor }}
                                            >
                                                <span className={`text-xs font-medium truncate ${isLight ? 'text-black/70' : 'text-white/80'}`}>
                                                    {color.name}
                                                </span>
                                                <span className={`text-[10px] font-mono ${isLight ? 'text-black/40' : 'text-white/50'}`}>
                                                    {color.colorId}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* 统计信息 */}
                                <div className="mt-6 flex items-center justify-between px-2">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-semibold text-foreground/80 tabular-nums">{data.stats.totalColors}</div>
                                            <div className="text-[10px] text-foreground/40 uppercase tracking-wide">色彩</div>
                                        </div>
                                        <div className="w-px h-8 bg-foreground/10" />
                                        <div className="text-center">
                                            <div className="text-2xl font-semibold text-foreground/80 tabular-nums">{data.stats.colorBooks}</div>
                                            <div className="text-[10px] text-foreground/40 uppercase tracking-wide">色彩簿</div>
                                        </div>
                                        <div className="w-px h-8 bg-foreground/10" />
                                        <div className="text-center">
                                            <div className="text-2xl font-semibold text-foreground/80 tabular-nums">{data.stats.partners}</div>
                                            <div className="text-[10px] text-foreground/40 uppercase tracking-wide">共建者</div>
                                        </div>
                                    </div>
                                    <Link
                                        href="/colors"
                                        className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors flex items-center gap-1"
                                    >
                                        查看全部
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================= */}
                {/* 2. 精选色彩 */}
                {/* ============================================================= */}
                {data.featuredColors.length > 0 && (
                    <section className="py-16 px-4 border-t border-foreground/5">
                        <div className="max-w-[1600px] mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Palette className="h-5 w-5 text-foreground/40" />
                                    <h2 className="text-xl font-medium text-foreground/80">精选色彩</h2>
                                    <span className="text-xs text-foreground/30 bg-foreground/5 px-2 py-0.5 rounded-full">
                                        {data.stats.totalColors} 个
                                    </span>
                                </div>
                                <Link
                                    href="/colors"
                                    className="group inline-flex items-center gap-1.5 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
                                >
                                    查看全部
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>

                            <FeaturedColors colors={data.featuredColors} />
                        </div>
                    </section>
                )}

                {/* ============================================================= */}
                {/* 3. 色彩簿推荐 */}
                {/* ============================================================= */}
                {data.featuredColorBooks.length > 0 && (
                    <section className="py-16 px-4 bg-foreground/[0.02]">
                        <div className="max-w-[1600px] mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-foreground/40" />
                                    <h2 className="text-xl font-medium text-foreground/80">色彩簿</h2>
                                    <span className="text-xs text-foreground/30 bg-foreground/5 px-2 py-0.5 rounded-full">
                                        {data.stats.colorBooks} 本
                                    </span>
                                </div>
                                <Link
                                    href="/color-books"
                                    className="group inline-flex items-center gap-1.5 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
                                >
                                    查看全部
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>

                            <FeaturedColorBooks colorBooks={data.featuredColorBooks} />
                        </div>
                    </section>
                )}

                {/* ============================================================= */}
                {/* 4. 产品特性 */}
                {/* ============================================================= */}
                <section className="py-20 px-4">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-light text-foreground/80 mb-3">为什么选择 SOURCE？</h2>
                            <p className="text-sm text-foreground/40">基于现实验证的色彩标准系统</p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    icon: ShieldCheck,
                                    title: '色彩身份证',
                                    desc: '每个色号拥有专属页面，真源 Lab 数据、纸张表现、油墨配方一应俱全',
                                    href: '/colors',
                                },
                                {
                                    icon: BookOpen,
                                    title: '色彩簿',
                                    desc: '按类别整理的色彩合集，方便快速查找和应用',
                                    href: '/color-books',
                                },
                                {
                                    icon: Search,
                                    title: '工程分析',
                                    desc: '上传工程文件，解析用色、识别风险、智能推荐材料',
                                    href: '/analyze',
                                },
                                {
                                    icon: Users,
                                    title: '共建体系',
                                    desc: '印厂、纸商、油墨商、实验室共同参与，数据可追溯',
                                    href: '/partners',
                                },
                            ].map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className="group p-6 rounded-2xl border border-foreground/5 bg-background hover:bg-foreground/[0.02] hover:border-foreground/10 transition-all"
                                >
                                    <item.icon className="h-8 w-8 text-foreground/30 mb-4 group-hover:text-foreground/50 transition-colors" />
                                    <h3 className="text-base font-medium text-foreground/80 mb-2">{item.title}</h3>
                                    <p className="text-sm text-foreground/40 leading-relaxed">{item.desc}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================================================= */}
                {/* 5. 共建者展示 */}
                {/* ============================================================= */}
                <section className="py-20 px-4 border-t border-foreground/5 bg-gradient-to-b from-foreground/[0.01] to-transparent">
                    <div className="max-w-[1600px] mx-auto">
                        <PartnersSection partners={data.partners} stats={data.partnerStats} />
                    </div>
                </section>

                {/* ============================================================= */}
                {/* 6. ColLab 精选 */}
                {/* ============================================================= */}
                <section className="py-16 px-4 bg-foreground/[0.02]">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <FlaskConical className="h-5 w-5 text-foreground/40" />
                                <h2 className="text-xl font-medium text-foreground/80">ColLab 精选</h2>
                            </div>
                            <Link
                                href="/collab"
                                className="group inline-flex items-center gap-1.5 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
                            >
                                探索更多
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>

                        <CollabSection contents={data.featuredContents} />
                    </div>
                </section>

                {/* ============================================================= */}
                {/* 7. 实时统计 */}
                {/* ============================================================= */}
                <section className="py-20 px-4 border-t border-foreground/5">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { value: data.stats.totalColors, label: '色彩数据', suffix: '' },
                                { value: data.stats.colorBooks, label: '色彩簿', suffix: '' },
                                { value: data.stats.partners, label: '共建者', suffix: '' },
                                { value: data.stats.contents, label: '内容作品', suffix: '' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className="text-3xl sm:text-4xl font-light text-foreground/70 tabular-nums">
                                        {stat.value}{stat.suffix}
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

            {/* ============================================================= */}
            {/* 8. Footer */}
            {/* ============================================================= */}
            <footer className="py-12 px-4 border-t border-foreground/5">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* 左侧：Logo + 版本 */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold tracking-[0.1em] text-foreground/60">SOURCE</span>
                            <span className="text-[11px] text-foreground/30 px-2 py-0.5 rounded-full border border-foreground/10">
                                v0.6.0 测试版
                            </span>
                        </div>

                        {/* 中间：链接 */}
                        <div className="flex items-center gap-6 text-[11px]">
                            <Link href="/colors" className="text-foreground/30 hover:text-foreground/50 transition-colors">
                                色彩库
                            </Link>
                            <Link href="/color-books" className="text-foreground/30 hover:text-foreground/50 transition-colors">
                                色彩簿
                            </Link>
                            <Link href="/analyze" className="text-foreground/30 hover:text-foreground/50 transition-colors">
                                工程分析
                            </Link>
                            <Link href="/partners" className="text-foreground/30 hover:text-foreground/50 transition-colors">
                                共建者
                            </Link>
                            <Link href="/docs" className="text-foreground/30 hover:text-foreground/50 transition-colors">
                                帮助
                            </Link>
                        </div>

                        {/* 右侧：版权 */}
                        <div className="text-[11px] text-foreground/20">
                            © 2026 SOURCE. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
