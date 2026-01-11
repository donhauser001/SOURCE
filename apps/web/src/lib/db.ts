import { PrismaClient } from '@prisma/client';
import { unstable_cache } from 'next/cache';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// =============================================================================
// 缓存配置
// =============================================================================

const CACHE_TAGS = {
    colors: 'colors',
    colorBooks: 'color-books',
    paperTypes: 'paper-types',
    inks: 'inks',
    recipes: 'recipes',
} as const;

const CACHE_REVALIDATE = {
    short: 60,      // 1 分钟
    medium: 300,    // 5 分钟
    long: 3600,     // 1 小时
} as const;

// =============================================================================
// 缓存查询函数
// =============================================================================

/**
 * 获取单个色彩（缓存版本）
 */
export const getCachedColor = unstable_cache(
    async (colorId: string) => {
        return prisma.color.findUnique({
            where: { colorId },
            include: {
                batch: {
                    select: {
                        batchNo: true,
                        type: true,
                        instrumentModel: true,
                        calibratedAt: true,
                        createdBy: true,
                    },
                },
            },
        });
    },
    ['color-by-id'],
    { revalidate: CACHE_REVALIDATE.medium, tags: [CACHE_TAGS.colors] }
);

/**
 * 获取色彩的纸张档案（缓存版本）
 */
export const getCachedPaperProfiles = unstable_cache(
    async (colorId: string) => {
        const color = await prisma.color.findUnique({
            where: { colorId },
            select: { id: true },
        });
        if (!color) return [];

        return prisma.paperProfile.findMany({
            where: { colorId: color.id },
            orderBy: [{ recommendation: 'asc' }, { paperType: { order: 'asc' } }],
            include: {
                batch: { select: { batchNo: true } },
                paperType: true,
            },
        });
    },
    ['paper-profiles-by-color'],
    { revalidate: CACHE_REVALIDATE.medium, tags: [CACHE_TAGS.colors] }
);

/**
 * 获取色彩的配方（缓存版本）
 */
export const getCachedRecipes = unstable_cache(
    async (colorId: string) => {
        const color = await prisma.color.findUnique({
            where: { colorId },
            select: { id: true },
        });
        if (!color) return [];

        return prisma.recipe.findMany({
            where: { colorId: color.id },
            include: {
                ingredients: {
                    orderBy: { order: 'asc' },
                    include: {
                        ink: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                                inkType: true,
                            },
                        },
                    },
                },
                fitMatrixEntries: {
                    include: { paper: true },
                },
                testReports: {
                    include: {
                        partner: {
                            select: { id: true, partnerId: true, name: true },
                        },
                    },
                },
            },
        });
    },
    ['recipes-by-color'],
    { revalidate: CACHE_REVALIDATE.medium, tags: [CACHE_TAGS.colors, CACHE_TAGS.recipes] }
);

/**
 * 获取色彩的参与者（缓存版本）
 */
export const getCachedParticipations = unstable_cache(
    async (colorId: string) => {
        const color = await prisma.color.findUnique({
            where: { colorId },
            select: { id: true },
        });
        if (!color) return [];

        return prisma.colorParticipation.findMany({
            where: { colorId: color.id, status: 'ACTIVE' },
            include: {
                partner: true,
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { roleInColor: 'asc' },
        });
    },
    ['participations-by-color'],
    { revalidate: CACHE_REVALIDATE.medium, tags: [CACHE_TAGS.colors] }
);

/**
 * 获取色彩列表（缓存版本，用于首页/列表页）
 */
export const getCachedColorList = unstable_cache(
    async (limit?: number) => {
        return prisma.color.findMany({
            take: limit,
            orderBy: { colorId: 'asc' },
            select: {
                id: true,
                colorId: true,
                name: true,
                slug: true,
                labL: true,
                labA: true,
                labB: true,
                status: true,
                auditStatus: true,
                version: true,
                lastVerifiedAt: true,
                _count: {
                    select: {
                        paperProfiles: true,
                        recipes: true,
                        participations: true,
                    },
                },
            },
        });
    },
    ['color-list'],
    { revalidate: CACHE_REVALIDATE.short, tags: [CACHE_TAGS.colors] }
);

/**
 * 获取色彩簿列表（缓存版本）
 */
export const getCachedColorBooks = unstable_cache(
    async () => {
        return prisma.colorBook.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { name: 'asc' },
            include: {
                category: true,
                _count: { select: { entries: true } },
            },
        });
    },
    ['color-books'],
    { revalidate: CACHE_REVALIDATE.long, tags: [CACHE_TAGS.colorBooks] }
);

/**
 * 获取纸型选项（缓存版本）
 */
export const getCachedPaperTypes = unstable_cache(
    async () => {
        return prisma.paperTypeOption.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
    },
    ['paper-types'],
    { revalidate: CACHE_REVALIDATE.long, tags: [CACHE_TAGS.paperTypes] }
);

/**
 * 获取油墨选项（缓存版本）
 */
export const getCachedInks = unstable_cache(
    async () => {
        return prisma.inkOption.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                code: true,
                name: true,
                brand: true,
                inkType: true,
                colorSeries: true,
            },
        });
    },
    ['inks'],
    { revalidate: CACHE_REVALIDATE.long, tags: [CACHE_TAGS.inks] }
);