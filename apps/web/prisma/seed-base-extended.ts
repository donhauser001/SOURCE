/**
 * 扩展基础数据 - 共建者、油墨、批次、色彩簿
 */

import {
    PrismaClient,
    PartnerType,
    PartnerStatus,
    BatchType,
    InkType,
    PaperCategory,
    ColorBookStatus,
    ColorSystem,
} from '@prisma/client';

const prisma = new PrismaClient();

// ========== 扩展共建者数据 ==========
const partners = [
    // 印厂
    {
        partnerId: 'PRINTER-GZ-001',
        name: '广州南方印务有限公司',
        shortName: '南方印务',
        types: [PartnerType.PRINTER],
        description: '华南地区大型综合印刷企业，专注于包装印刷和书刊印刷',
        region: '广东',
        certifications: ['ISO 9001:2015', 'FSC 认证', 'G7 认证', 'PSO 认证'],
        establishedYear: 1992,
        status: PartnerStatus.ACTIVE,
    },
    {
        partnerId: 'PRINTER-CD-001',
        name: '成都天府印刷集团',
        shortName: '天府印刷',
        types: [PartnerType.PRINTER],
        description: '西南地区领先印刷企业，擅长精品画册和文化产品',
        region: '四川',
        certifications: ['ISO 9001:2015', 'ISO 14001'],
        establishedYear: 2001,
        status: PartnerStatus.ACTIVE,
    },
    {
        partnerId: 'PRINTER-NJ-001',
        name: '南京凤凰印务有限公司',
        shortName: '凤凰印务',
        types: [PartnerType.PRINTER],
        description: '江苏省重点印刷企业，出版物印刷专家',
        region: '江苏',
        certifications: ['ISO 9001:2015', 'CTP 认证'],
        establishedYear: 1988,
        status: PartnerStatus.ACTIVE,
    },
    {
        partnerId: 'PRINTER-HZ-001',
        name: '杭州西湖印刷股份',
        shortName: '西湖印刷',
        types: [PartnerType.PRINTER],
        description: '浙江省艺术印刷领军企业',
        region: '浙江',
        certifications: ['ISO 9001:2015', 'G7 认证'],
        establishedYear: 1995,
        status: PartnerStatus.ACTIVE,
    },
    // 纸商
    {
        partnerId: 'PAPER-VENDOR-003',
        name: '亚太森博纸业有限公司',
        shortName: '亚太森博',
        types: [PartnerType.PAPER_VENDOR],
        description: '世界500强企业在华造纸子公司，高品质文化用纸',
        region: '山东',
        certifications: ['ISO 9001:2015', 'ISO 14001', 'FSC 认证', 'PEFC 认证'],
        establishedYear: 2005,
        status: PartnerStatus.ACTIVE,
    },
    {
        partnerId: 'PAPER-VENDOR-004',
        name: '华泰纸业股份有限公司',
        shortName: '华泰纸业',
        types: [PartnerType.PAPER_VENDOR],
        description: '中国新闻纸龙头企业，文化用纸主要供应商',
        region: '山东',
        certifications: ['ISO 9001:2015', 'FSC 认证'],
        establishedYear: 1976,
        status: PartnerStatus.ACTIVE,
    },
    {
        partnerId: 'PAPER-VENDOR-005',
        name: '博汇纸业股份有限公司',
        shortName: '博汇纸业',
        types: [PartnerType.PAPER_VENDOR],
        description: '白卡纸、铜版纸专业生产商',
        region: '山东',
        certifications: ['ISO 9001:2015', 'ISO 14001'],
        establishedYear: 1996,
        status: PartnerStatus.ACTIVE,
    },
    // 油墨商
    {
        partnerId: 'INK-VENDOR-003',
        name: '上海DIC油墨有限公司',
        shortName: 'DIC油墨',
        types: [PartnerType.INK_VENDOR],
        description: '日本DIC株式会社在华子公司，高端印刷油墨供应商',
        region: '上海',
        certifications: ['ISO 9001:2015', 'ISO 14001', 'SONY GP 认证'],
        establishedYear: 1993,
        status: PartnerStatus.ACTIVE,
    },
    {
        partnerId: 'INK-VENDOR-004',
        name: '杭华油墨化学有限公司',
        shortName: '杭华油墨',
        types: [PartnerType.INK_VENDOR],
        description: '国内知名环保油墨制造商',
        region: '浙江',
        certifications: ['ISO 9001:2015', '中国环境标志认证'],
        establishedYear: 1989,
        status: PartnerStatus.ACTIVE,
    },
    // 实验室/检测机构
    {
        partnerId: 'LAB-002',
        name: '上海出版印刷高等专科学校检测中心',
        shortName: '上海印专',
        types: [PartnerType.LAB],
        description: '印刷行业专业检测机构',
        region: '上海',
        certifications: ['CNAS 认证'],
        establishedYear: 1953,
        status: PartnerStatus.ACTIVE,
    },
    {
        partnerId: 'LAB-003',
        name: '深圳市计量质量检测研究院',
        shortName: '深圳计质院',
        types: [PartnerType.LAB, PartnerType.CONSULTANT],
        description: '华南地区权威检测机构',
        region: '广东',
        certifications: ['CNAS 认证', 'CMA 认证'],
        establishedYear: 1985,
        status: PartnerStatus.ACTIVE,
    },
];

// ========== 扩展油墨数据 ==========
const inks = [
    // 基础色系
    { code: 'PANTONE-WARM-RED', name: '暖红', brand: 'Pantone', colorSeries: '红色系', inkType: InkType.BASE, order: 10 },
    { code: 'PANTONE-RUBINE-RED', name: '宝石红', brand: 'Pantone', colorSeries: '红色系', inkType: InkType.BASE, order: 11 },
    { code: 'PANTONE-RHODAMINE-RED', name: '玫红', brand: 'Pantone', colorSeries: '红色系', inkType: InkType.BASE, order: 12 },
    { code: 'DIC-116', name: 'DIC 红 116', brand: 'DIC', colorSeries: '红色系', inkType: InkType.SPOT, order: 13 },
    { code: 'DIC-159', name: 'DIC 红 159', brand: 'DIC', colorSeries: '红色系', inkType: InkType.SPOT, order: 14 },

    { code: 'PANTONE-ORANGE-021', name: '橙色 021', brand: 'Pantone', colorSeries: '橙色系', inkType: InkType.BASE, order: 20 },
    { code: 'DIC-122', name: 'DIC 橙 122', brand: 'DIC', colorSeries: '橙色系', inkType: InkType.SPOT, order: 21 },

    { code: 'PANTONE-YELLOW', name: '黄', brand: 'Pantone', colorSeries: '黄色系', inkType: InkType.BASE, order: 30 },
    { code: 'PANTONE-BRIGHT-YELLOW', name: '亮黄', brand: 'Pantone', colorSeries: '黄色系', inkType: InkType.BASE, order: 31 },
    { code: 'DIC-109', name: 'DIC 黄 109', brand: 'DIC', colorSeries: '黄色系', inkType: InkType.SPOT, order: 32 },

    { code: 'PANTONE-GREEN', name: '绿', brand: 'Pantone', colorSeries: '绿色系', inkType: InkType.BASE, order: 40 },
    { code: 'PANTONE-BRIGHT-GREEN', name: '亮绿', brand: 'Pantone', colorSeries: '绿色系', inkType: InkType.BASE, order: 41 },
    { code: 'DIC-635', name: 'DIC 绿 635', brand: 'DIC', colorSeries: '绿色系', inkType: InkType.SPOT, order: 42 },

    { code: 'PANTONE-REFLEX-BLUE', name: '反射蓝', brand: 'Pantone', colorSeries: '蓝色系', inkType: InkType.BASE, order: 50 },
    { code: 'PANTONE-PROCESS-BLUE', name: '过程蓝', brand: 'Pantone', colorSeries: '蓝色系', inkType: InkType.BASE, order: 51 },
    { code: 'DIC-178', name: 'DIC 蓝 178', brand: 'DIC', colorSeries: '蓝色系', inkType: InkType.SPOT, order: 52 },

    { code: 'PANTONE-PURPLE', name: '紫', brand: 'Pantone', colorSeries: '紫色系', inkType: InkType.BASE, order: 60 },
    { code: 'PANTONE-VIOLET', name: '紫罗兰', brand: 'Pantone', colorSeries: '紫色系', inkType: InkType.BASE, order: 61 },
    { code: 'DIC-200', name: 'DIC 紫 200', brand: 'DIC', colorSeries: '紫色系', inkType: InkType.SPOT, order: 62 },

    { code: 'PANTONE-BROWN', name: '棕', brand: 'Pantone', colorSeries: '棕色系', inkType: InkType.BASE, order: 70 },
    { code: 'DIC-274', name: 'DIC 棕 274', brand: 'DIC', colorSeries: '棕色系', inkType: InkType.SPOT, order: 71 },

    // 冲淡剂和辅料
    { code: 'OPAQUE-WHITE', name: '不透明白', brand: '通用', colorSeries: '辅料', inkType: InkType.EXTENDER, order: 101 },
    { code: 'MIXING-WHITE', name: '调墨白', brand: '通用', colorSeries: '辅料', inkType: InkType.EXTENDER, order: 102 },
    { code: 'REDUCER-MEDIUM', name: '中性冲淡剂', brand: '通用', colorSeries: '辅料', inkType: InkType.EXTENDER, order: 103 },
    { code: 'REDUCER-SOFT', name: '柔性冲淡剂', brand: '通用', colorSeries: '辅料', inkType: InkType.EXTENDER, order: 104 },
];

// ========== 扩展批次数据 ==========
const batches = [
    {
        batchNo: 'BATCH-2026-004',
        type: BatchType.MEASURE,
        instrumentModel: 'Datacolor 800',
        notes: '第四批色彩测量，新增绿色系',
        createdBy: 'system',
    },
    {
        batchNo: 'BATCH-2026-005',
        type: BatchType.PRINT,
        instrumentModel: 'Komori Lithrone G40',
        notes: '配方验证印刷批次 - 红色系',
        createdBy: 'system',
    },
    {
        batchNo: 'BATCH-2026-006',
        type: BatchType.SCAN,
        instrumentModel: 'Epson V850 Pro',
        notes: '高清扫描批次 - 蓝色系',
        createdBy: 'system',
    },
    {
        batchNo: 'BATCH-2026-007',
        type: BatchType.AUDIT,
        instrumentModel: 'X-Rite eXact',
        notes: '季度审计复核',
        createdBy: 'system',
    },
    {
        batchNo: 'BATCH-2026-008',
        type: BatchType.MEASURE,
        instrumentModel: 'X-Rite i1Pro 3',
        notes: '紫色系及褐色系测量',
        createdBy: 'system',
    },
    {
        batchNo: 'BATCH-2026-009',
        type: BatchType.PRINT,
        instrumentModel: 'Heidelberg Speedmaster CX 104',
        notes: '大批量验证印刷',
        createdBy: 'system',
    },
    {
        batchNo: 'BATCH-2026-010',
        type: BatchType.MEASURE,
        instrumentModel: 'X-Rite i1Pro 3',
        notes: '黑白灰色系测量',
        createdBy: 'system',
    },
];

// ========== 色彩簿分类数据 ==========
const colorBookCategories = [
    { name: '中国传统色', order: 0, isDefault: true },
    { name: '自然色系', order: 1, isDefault: false },
    { name: '品牌色彩', order: 2, isDefault: false },
    { name: '季节主题', order: 3, isDefault: false },
    { name: '艺术复刻', order: 4, isDefault: false },
];

// ========== 色彩簿数据 ==========
const colorBooks = [
    {
        bookId: 'BOOK-CN-TRAD-001',
        name: '中国传统色·宫廷篇',
        slug: 'chinese-traditional-palace',
        description: '收录明清宫廷常用的 50 种经典色彩，包括龙袍黄、宫墙红等皇家御用色',
        shortDesc: '明清宫廷御用色彩精选',
        colorSystem: ColorSystem.SOURCE,
        publisher: 'SOURCE 色彩研究院',
        publishedYear: 2026,
        status: ColorBookStatus.ACTIVE,
        tags: ['宫廷', '传统', '华贵'],
    },
    {
        bookId: 'BOOK-CN-TRAD-002',
        name: '中国传统色·文人篇',
        slug: 'chinese-traditional-literati',
        description: '文人墨客偏爱的淡雅色调，包括水墨、青竹、素雅等意境色彩',
        shortDesc: '文人雅士钟爱的淡雅之色',
        colorSystem: ColorSystem.SOURCE,
        publisher: 'SOURCE 色彩研究院',
        publishedYear: 2026,
        status: ColorBookStatus.ACTIVE,
        tags: ['文人', '淡雅', '意境'],
    },
    {
        bookId: 'BOOK-NATURE-001',
        name: '自然色系·四季',
        slug: 'nature-seasons',
        description: '从春花烂漫到冬雪皑皑，收录大自然四季变换中的代表性色彩',
        shortDesc: '四季自然色彩全收录',
        colorSystem: ColorSystem.SOURCE,
        publisher: 'SOURCE 色彩研究院',
        publishedYear: 2026,
        status: ColorBookStatus.ACTIVE,
        tags: ['自然', '四季', '生态'],
    },
    {
        bookId: 'BOOK-ART-001',
        name: '敦煌壁画色彩',
        slug: 'dunhuang-murals',
        description: '复刻敦煌莫高窟壁画中的经典色彩，再现千年艺术瑰宝',
        shortDesc: '千年敦煌艺术色彩',
        colorSystem: ColorSystem.SOURCE,
        publisher: 'SOURCE 色彩研究院',
        publishedYear: 2026,
        status: ColorBookStatus.DRAFT,
        tags: ['敦煌', '壁画', '艺术'],
    },
];

async function main() {
    console.log('🏭 开始扩展基础数据...\n');

    // 1. 创建共建者
    console.log('📋 创建共建者数据...');
    let partnersCreated = 0;
    for (const partner of partners) {
        const existing = await prisma.partner.findUnique({
            where: { partnerId: partner.partnerId },
        });
        if (existing) {
            console.log(`  ⏭️  跳过: ${partner.partnerId}`);
            continue;
        }
        await prisma.partner.create({
            data: {
                ...partner,
                verifiedAt: partner.status === PartnerStatus.ACTIVE ? new Date() : null,
            },
        });
        console.log(`  ✅ 创建: ${partner.shortName}`);
        partnersCreated++;
    }

    // 2. 创建油墨
    console.log('\n🎨 创建油墨数据...');
    let inksCreated = 0;
    for (const ink of inks) {
        const existing = await prisma.inkOption.findUnique({
            where: { code: ink.code },
        });
        if (existing) {
            console.log(`  ⏭️  跳过: ${ink.code}`);
            continue;
        }
        await prisma.inkOption.create({
            data: ink,
        });
        console.log(`  ✅ 创建: ${ink.name}`);
        inksCreated++;
    }

    // 3. 创建批次
    console.log('\n📦 创建批次数据...');
    let batchesCreated = 0;
    // 获取印厂用于关联
    const printer = await prisma.partner.findFirst({
        where: { types: { has: PartnerType.PRINTER } },
    });
    const lab = await prisma.partner.findFirst({
        where: { types: { has: PartnerType.LAB } },
    });

    for (const batch of batches) {
        const existing = await prisma.batch.findUnique({
            where: { batchNo: batch.batchNo },
        });
        if (existing) {
            console.log(`  ⏭️  跳过: ${batch.batchNo}`);
            continue;
        }
        await prisma.batch.create({
            data: {
                ...batch,
                partnerId: batch.type === BatchType.PRINT ? printer?.id : lab?.id,
                calibratedAt: batch.type === BatchType.MEASURE ? new Date() : null,
            },
        });
        console.log(`  ✅ 创建: ${batch.batchNo}`);
        batchesCreated++;
    }

    // 4. 创建色彩簿分类
    console.log('\n📚 创建色彩簿分类...');
    let categoriesCreated = 0;
    const createdCategories: Record<string, string> = {};
    for (const category of colorBookCategories) {
        const existing = await prisma.colorBookCategoryOption.findUnique({
            where: { name: category.name },
        });
        if (existing) {
            createdCategories[category.name] = existing.id;
            console.log(`  ⏭️  跳过: ${category.name}`);
            continue;
        }
        const created = await prisma.colorBookCategoryOption.create({
            data: category,
        });
        createdCategories[category.name] = created.id;
        console.log(`  ✅ 创建: ${category.name}`);
        categoriesCreated++;
    }

    // 5. 创建色彩簿
    console.log('\n📖 创建色彩簿...');
    let booksCreated = 0;
    for (const book of colorBooks) {
        const existing = await prisma.colorBook.findUnique({
            where: { bookId: book.bookId },
        });
        if (existing) {
            console.log(`  ⏭️  跳过: ${book.bookId}`);
            continue;
        }

        // 根据名称匹配分类
        let categoryId = createdCategories['中国传统色'];
        if (book.bookId.includes('NATURE')) {
            categoryId = createdCategories['自然色系'];
        } else if (book.bookId.includes('ART')) {
            categoryId = createdCategories['艺术复刻'];
        }

        await prisma.colorBook.create({
            data: {
                ...book,
                categoryId,
            },
        });
        console.log(`  ✅ 创建: ${book.name}`);
        booksCreated++;
    }

    // 统计
    const totalPartners = await prisma.partner.count();
    const totalInks = await prisma.inkOption.count();
    const totalBatches = await prisma.batch.count();
    const totalBooks = await prisma.colorBook.count();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 基础数据扩展完成！');
    console.log(`   共建者: +${partnersCreated} (总计 ${totalPartners})`);
    console.log(`   油墨:   +${inksCreated} (总计 ${totalInks})`);
    console.log(`   批次:   +${batchesCreated} (总计 ${totalBatches})`);
    console.log(`   色彩簿: +${booksCreated} (总计 ${totalBooks})`);
    console.log('='.repeat(50));
}

main()
    .catch((e) => {
        console.error('❌ 执行失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
