/**
 * 首页数据 Router
 * 
 * 提供首页所需的聚合数据：
 * - 统计数据
 * - 精选色彩
 * - 色彩簿推荐
 * - 共建者列表
 */

import { createTRPCRouter, publicProcedure } from '../trpc';

export const homeRouter = createTRPCRouter({
    /**
     * 获取首页统计数据
     */
    stats: publicProcedure.query(async ({ ctx }) => {
        const [
            verifiedColors,
            totalColors,
            colorBooks,
            partners,
            contents,
        ] = await Promise.all([
            // 已验证色彩数
            ctx.prisma.color.count({
                where: { auditStatus: 'VERIFIED' },
            }),
            // 总色彩数
            ctx.prisma.color.count(),
            // 色彩簿数
            ctx.prisma.colorBook.count({
                where: { status: 'ACTIVE' },
            }),
            // 共建者数
            ctx.prisma.partner.count({
                where: { status: 'ACTIVE' },
            }),
            // ColLab 内容数
            ctx.prisma.content.count({
                where: { status: 'PUBLISHED' },
            }),
        ]);

        return {
            verifiedColors,
            totalColors,
            colorBooks,
            partners,
            contents,
            cliCommands: 15, // CLI 命令数（静态值）
        };
    }),

    /**
     * 获取精选色彩（已验证的色彩）
     */
    featuredColors: publicProcedure.query(async ({ ctx }) => {
        const colors = await ctx.prisma.color.findMany({
            where: {
                auditStatus: 'VERIFIED',
                status: 'ACTIVE',
            },
            take: 12,
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
        });

        return colors;
    }),

    /**
     * 获取推荐色彩簿
     */
    featuredColorBooks: publicProcedure.query(async ({ ctx }) => {
        const colorBooks = await ctx.prisma.colorBook.findMany({
            where: {
                status: 'ACTIVE',
                isPublic: true,
            },
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
                category: {
                    select: { name: true },
                },
            },
        });

        return colorBooks;
    }),

    /**
     * 获取共建者列表
     */
    partners: publicProcedure.query(async ({ ctx }) => {
        const partners = await ctx.prisma.partner.findMany({
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
        });

        // 按类型统计
        const stats = {
            printers: partners.filter(p => p.types.includes('PRINTER')).length,
            paperVendors: partners.filter(p => p.types.includes('PAPER_VENDOR')).length,
            inkVendors: partners.filter(p => p.types.includes('INK_VENDOR')).length,
            labs: partners.filter(p => p.types.includes('LAB')).length,
            consultants: partners.filter(p => p.types.includes('CONSULTANT')).length,
        };

        return { partners, stats };
    }),

    /**
     * 获取 ColLab 精选内容
     */
    featuredContents: publicProcedure.query(async ({ ctx }) => {
        const contents = await ctx.prisma.content.findMany({
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
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
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
        });

        // 添加内容类型标签
        const typeLabels: Record<string, string> = {
            WORK: '作品',
            TUTORIAL: '教程',
            ARTICLE: '文章',
        };

        return contents.map(content => ({
            ...content,
            contentTypeLabel: typeLabels[content.contentType] || content.contentType,
        }));
    }),
});
