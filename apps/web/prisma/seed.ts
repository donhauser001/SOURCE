import {
    PrismaClient,
    PaperType,
    Recommendation,
    BatchType,
    ColorStatus,
    UserTier,
    UserRole,
    AuditStatus,
    PaperCategory,
    RecommendationType,
    RecipeStatus,
    CostLevel,
    InkType,
    FitResult,
    ConclusionLevel,
    RiskType,
    ConfidenceLevel,
    // 新增合作者相关枚举
    PartnerType,
    PartnerStatus,
    ParticipantEntityType,
    ParticipationRole,
    ParticipationScope,
    ParticipationStatus,
    EvidenceType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 开始播种数据...');

    // 1. 创建限流策略
    const standardPolicy = await prisma.rateLimitPolicy.upsert({
        where: { name: '标准' },
        update: {},
        create: {
            name: '标准',
            requestsPerMinute: 60,
            requestsPerDay: 10000,
        },
    });

    const premiumPolicy = await prisma.rateLimitPolicy.upsert({
        where: { name: '高级' },
        update: {},
        create: {
            name: '高级',
            requestsPerMinute: 120,
            requestsPerDay: 50000,
        },
    });

    console.log('✅ 限流策略创建完成');

    // 2. 创建合作者数据（印厂/纸商/油墨商）
    const partners = [
        // 印厂
        {
            partnerId: 'PRINTER-SH-001',
            name: '上海印刷集团有限公司',
            shortName: '上海印刷',
            types: [PartnerType.PRINTER],
            description: '华东地区领先的印刷企业，专注于高品质商业印刷',
            region: '上海',
            certifications: ['ISO 9001:2015', 'FSC 认证', 'G7 认证'],
            establishedYear: 1985,
            status: PartnerStatus.ACTIVE,
            verifiedAt: new Date('2026-01-01T00:00:00Z'),
        },
        {
            partnerId: 'PRINTER-BJ-001',
            name: '北京华联印刷有限公司',
            shortName: '华联印刷',
            types: [PartnerType.PRINTER],
            description: '北京知名印刷企业，擅长精品图书和艺术画册',
            region: '北京',
            certifications: ['ISO 9001:2015', 'ISO 12647-2'],
            establishedYear: 1998,
            status: PartnerStatus.ACTIVE,
            verifiedAt: new Date('2026-01-02T00:00:00Z'),
        },
        // 纸商
        {
            partnerId: 'PAPER-VENDOR-001',
            name: '金东纸业股份有限公司',
            shortName: '金东纸业',
            types: [PartnerType.PAPER_VENDOR],
            description: '中国高端涂布纸领军企业，高阶映画品牌持有者',
            region: '江苏',
            certifications: ['ISO 9001:2015', 'ISO 14001', 'FSC 认证'],
            establishedYear: 2002,
            status: PartnerStatus.ACTIVE,
            verifiedAt: new Date('2026-01-01T00:00:00Z'),
        },
        {
            partnerId: 'PAPER-VENDOR-002',
            name: '太阳纸业股份有限公司',
            shortName: '太阳纸业',
            types: [PartnerType.PAPER_VENDOR],
            description: '国内大型纸业集团，产品线覆盖文化用纸全品类',
            region: '山东',
            certifications: ['ISO 9001:2015', 'FSC 认证'],
            establishedYear: 1982,
            status: PartnerStatus.ACTIVE,
            verifiedAt: new Date('2026-01-03T00:00:00Z'),
        },
        // 油墨商
        {
            partnerId: 'INK-VENDOR-001',
            name: '天津东洋油墨有限公司',
            shortName: '东洋油墨',
            types: [PartnerType.INK_VENDOR],
            description: '日本东洋油墨中国区合资企业，专业油墨制造商',
            region: '天津',
            certifications: ['ISO 9001:2015', 'ISO 14001'],
            establishedYear: 1995,
            status: PartnerStatus.ACTIVE,
            verifiedAt: new Date('2026-01-01T00:00:00Z'),
        },
        {
            partnerId: 'INK-VENDOR-002',
            name: '杭州科华油墨化学有限公司',
            shortName: '科华油墨',
            types: [PartnerType.INK_VENDOR],
            description: '国内领先的环保油墨研发生产企业',
            region: '浙江',
            certifications: ['ISO 9001:2015', '绿色印刷认证'],
            establishedYear: 2005,
            status: PartnerStatus.ACTIVE,
            verifiedAt: new Date('2026-01-02T00:00:00Z'),
        },
        // 实验室/检测机构
        {
            partnerId: 'LAB-001',
            name: '中国印刷科学技术研究院',
            shortName: '印科院',
            types: [PartnerType.LAB, PartnerType.CONSULTANT],
            description: '国家级印刷技术研究机构，色彩管理权威',
            region: '北京',
            certifications: ['CNAS 认证', 'CMA 认证'],
            establishedYear: 1956,
            status: PartnerStatus.ACTIVE,
            verifiedAt: new Date('2026-01-01T00:00:00Z'),
        },
    ];

    const createdPartners: Record<string, any> = {};
    for (const partner of partners) {
        const created = await prisma.partner.upsert({
            where: { partnerId: partner.partnerId },
            update: {},
            create: partner,
        });
        createdPartners[partner.partnerId] = created;
    }

    console.log('✅ 合作者数据创建完成');

    // 3. 创建示例验证批次（关联合作方）
    const batch1 = await prisma.batch.upsert({
        where: { batchNo: 'BATCH-2026-001' },
        update: {},
        create: {
            batchNo: 'BATCH-2026-001',
            type: BatchType.MEASURE,
            instrumentModel: 'X-Rite i1Pro 3',
            calibratedAt: new Date('2026-01-01T09:00:00Z'),
            partnerId: createdPartners['LAB-001']?.id,
            notes: '首批色彩测量，设备已完成年度校准',
            createdBy: 'system',
        },
    });

    const batch2 = await prisma.batch.upsert({
        where: { batchNo: 'BATCH-2026-002' },
        update: {},
        create: {
            batchNo: 'BATCH-2026-002',
            type: BatchType.SCAN,
            instrumentModel: 'Epson V850 Pro',
            notes: '配套高清扫描批次',
            createdBy: 'system',
        },
    });

    const batch3 = await prisma.batch.upsert({
        where: { batchNo: 'BATCH-2026-003' },
        update: {},
        create: {
            batchNo: 'BATCH-2026-003',
            type: BatchType.PRINT,
            instrumentModel: 'Heidelberg Speedmaster',
            partnerId: createdPartners['PRINTER-SH-001']?.id,
            notes: '首批配方验证印刷',
            createdBy: 'system',
        },
    });

    console.log('✅ 验证批次创建完成');

    // 3. 创建纸张数据字典
    const papers = [
        { paperId: 'PAPER-PREMIUM-MATTE', name: '高阶映画', paperCategory: PaperCategory.COATED, gramWeight: 200, manufacturer: '金东纸业' },
        { paperId: 'PAPER-UNCOATED', name: '纯质纸', paperCategory: PaperCategory.UNCOATED, gramWeight: 120, manufacturer: '中冶美利' },
        { paperId: 'PAPER-COATED', name: '铜版纸', paperCategory: PaperCategory.COATED, gramWeight: 157, manufacturer: '太阳纸业' },
        { paperId: 'PAPER-OFFSET', name: '双胶纸', paperCategory: PaperCategory.UNCOATED, gramWeight: 100, manufacturer: '晨鸣纸业' },
        { paperId: 'PAPER-LIGHTWEIGHT', name: '轻型纸', paperCategory: PaperCategory.UNCOATED, gramWeight: 70, manufacturer: '博汇纸业' },
    ];

    for (const paper of papers) {
        await prisma.paper.upsert({
            where: { paperId: paper.paperId },
            update: {},
            create: paper,
        });
    }

    console.log('✅ 纸张数据字典创建完成');

    // 4. 创建示例颜色（烟雨青）- 新规范
    const colorYanyuQing = await prisma.color.upsert({
        where: { colorId: 'CN-Song-04' },
        update: {
            slug: 'yanyu-qing',
            measurementDevice: 'X-Rite i1Pro 3',
            measurementStandard: 'D50/2°',
            measurementCondition: '标准实验室环境，温度 23±2°C，湿度 50±5%',
            trueSourceNote: '基于宋代青瓷典型色彩，取烟雨江南之意',
            version: '1.0',
            auditStatus: AuditStatus.VERIFIED,
            auditors: ['SOURCE 色彩实验室', '中国印刷研究院'],
            lastVerifiedAt: new Date('2026-01-05T10:00:00Z'),
            lastAuditAt: new Date('2026-01-05T10:00:00Z'),
            status: ColorStatus.ACTIVE,
        },
        create: {
            colorId: 'CN-Song-04',
            name: '烟雨青',
            slug: 'yanyu-qing',
            labL: 65.2,
            labA: -12.5,
            labB: -8.3,
            deltaETolerance: 2.0,
            measurementDevice: 'X-Rite i1Pro 3',
            measurementStandard: 'D50/2°',
            measurementCondition: '标准实验室环境，温度 23±2°C，湿度 50±5%',
            measuredAt: new Date('2026-01-01T10:30:00Z'),
            trueSourceNote: '基于宋代青瓷典型色彩，取烟雨江南之意',
            version: '1.0',
            auditStatus: AuditStatus.VERIFIED,
            auditors: ['SOURCE 色彩实验室', '中国印刷研究院'],
            lastVerifiedAt: new Date('2026-01-05T10:00:00Z'),
            lastAuditAt: new Date('2026-01-05T10:00:00Z'),
            batchId: batch1.id,
            status: ColorStatus.ACTIVE,
        },
    });

    // 5. 创建示例颜色（朱砂红）
    const colorZhushaHong = await prisma.color.upsert({
        where: { colorId: 'CN-Tang-01' },
        update: {
            slug: 'zhusha-hong',
            measurementDevice: 'X-Rite i1Pro 3',
            measurementStandard: 'D50/2°',
            version: '1.0',
            auditStatus: AuditStatus.VERIFIED,
            auditors: ['SOURCE 色彩实验室'],
            lastVerifiedAt: new Date('2026-01-05T11:00:00Z'),
            status: ColorStatus.ACTIVE,
        },
        create: {
            colorId: 'CN-Tang-01',
            name: '朱砂红',
            slug: 'zhusha-hong',
            labL: 42.8,
            labA: 56.3,
            labB: 32.1,
            deltaETolerance: 1.5,
            measurementDevice: 'X-Rite i1Pro 3',
            measurementStandard: 'D50/2°',
            measuredAt: new Date('2026-01-02T14:00:00Z'),
            trueSourceNote: '取自唐代宫廷用色，庄重而热烈',
            version: '1.0',
            auditStatus: AuditStatus.VERIFIED,
            auditors: ['SOURCE 色彩实验室'],
            lastVerifiedAt: new Date('2026-01-05T11:00:00Z'),
            batchId: batch1.id,
            status: ColorStatus.ACTIVE,
        },
    });

    // 6. 创建示例颜色（墨竹绿）
    const colorMozhuLv = await prisma.color.upsert({
        where: { colorId: 'CN-Ming-02' },
        update: {
            slug: 'mozhu-lv',
            measurementDevice: 'X-Rite i1Pro 3',
            measurementStandard: 'D50/2°',
            version: '1.0',
            auditStatus: AuditStatus.UNDER_REVIEW,
            auditors: [],
            status: ColorStatus.EXPERIMENTAL,
        },
        create: {
            colorId: 'CN-Ming-02',
            name: '墨竹绿',
            slug: 'mozhu-lv',
            labL: 38.5,
            labA: -28.7,
            labB: 15.2,
            deltaETolerance: 2.0,
            measurementDevice: 'X-Rite i1Pro 3',
            measurementStandard: 'D50/2°',
            measuredAt: new Date('2026-01-03T09:15:00Z'),
            trueSourceNote: '明代文人画常见墨竹用色',
            version: '1.0',
            auditStatus: AuditStatus.UNDER_REVIEW,
            auditors: [],
            batchId: batch1.id,
            status: ColorStatus.EXPERIMENTAL,
        },
    });

    // 批量创建更多中国传统色彩
    const additionalColors = [
        // 青色系列
        { colorId: 'CN-Shi-01', name: '石青', slug: 'shi-qing', labL: 52.3, labA: -15.8, labB: -28.5, note: '取自矿物石青，古典山水画常用' },
        { colorId: 'CN-Yue-01', name: '月白', slug: 'yue-bai', labL: 88.2, labA: -2.5, labB: -8.3, note: '如月光般清冷的白色，带淡淡青调' },
        { colorId: 'CN-Dai-01', name: '黛色', slug: 'dai-se', labL: 32.1, labA: -2.3, labB: -8.5, note: '古代女子画眉之色，青黑幽远' },
        { colorId: 'CN-Tian-01', name: '天青', slug: 'tian-qing', labL: 68.5, labA: -8.5, labB: -18.2, note: '雨过天晴云破处，汝窑天青之色' },
        { colorId: 'CN-Qing-01', name: '靛青', slug: 'dian-qing', labL: 28.5, labA: -8.2, labB: -32.1, note: '蓝草染料本色，深沉而雅致' },
        { colorId: 'CN-Piao-01', name: '缥碧', slug: 'piao-bi', labL: 62.5, labA: -22.8, labB: -12.5, note: '淡青带碧，如水之清澈' },
        // 红色系列
        { colorId: 'CN-Jiang-01', name: '绛紫', slug: 'jiang-zi', labL: 35.8, labA: 38.5, labB: -22.3, note: '深红带紫，庄重华贵' },
        { colorId: 'CN-Yan-01', name: '胭脂', slug: 'yan-zhi', labL: 48.6, labA: 52.8, labB: 18.3, note: '古代面部化妆色，艳而不俗' },
        { colorId: 'CN-Tuo-01', name: '酡红', slug: 'tuo-hong', labL: 55.8, labA: 45.2, labB: 22.5, note: '饮酒微醺时脸上的红晕' },
        // 黄色系列
        { colorId: 'CN-E-01', name: '鹅黄', slug: 'e-huang', labL: 88.5, labA: -2.8, labB: 38.5, note: '如小鹅绒毛般嫩黄' },
        { colorId: 'CN-Teng-01', name: '藤黄', slug: 'teng-huang', labL: 82.5, labA: 5.8, labB: 78.2, note: '取自藤黄树脂的明亮之色，国画颜料之一' },
        { colorId: 'CN-Hu-01', name: '琥珀', slug: 'hu-po', labL: 58.2, labA: 28.5, labB: 56.8, note: '如琥珀般温润透亮的黄褐色' },
        // 绿色系列
        { colorId: 'CN-Song-01', name: '松花', slug: 'song-hua', labL: 78.5, labA: -18.2, labB: 32.6, note: '松树花粉之色，淡雅的黄绿' },
        { colorId: 'CN-Qiu-01', name: '秋香', slug: 'qiu-xiang', labL: 68.3, labA: -12.5, labB: 42.8, note: '深秋桂花香气般的黄绿色' },
        // 紫色系列
        { colorId: 'CN-He-01', name: '藕荷', slug: 'ou-he', labL: 72.3, labA: 18.5, labB: -12.4, note: '荷花的淡紫粉色，清新雅致' },
        // 褐色系列
        { colorId: 'CN-Zhe-01', name: '赭石', slug: 'zhe-shi', labL: 45.2, labA: 28.5, labB: 32.8, note: '矿物颜料赭石色，温暖沉稳' },
        { colorId: 'CN-Tan-01', name: '檀香', slug: 'tan-xiang', labL: 48.5, labA: 18.2, labB: 28.5, note: '檀香木的色泽，温润内敛' },
        // 灰色系列
        { colorId: 'CN-Mo-01', name: '水墨', slug: 'shui-mo', labL: 42.5, labA: -1.2, labB: -2.8, note: '水墨画中的墨色，沉静而富有层次' },
        { colorId: 'CN-Shuang-01', name: '霜色', slug: 'shuang-se', labL: 92.5, labA: -0.5, labB: 2.8, note: '如霜雪般纯净的灰白色' },
        { colorId: 'CN-Ya-01', name: '鸦青', slug: 'ya-qing', labL: 25.3, labA: -5.8, labB: -18.2, note: '乌鸦羽毛的深青色，神秘深邃' },
    ];

    for (const color of additionalColors) {
        await prisma.color.upsert({
            where: { colorId: color.colorId },
            update: {
                slug: color.slug,
                measurementDevice: 'X-Rite i1Pro 3',
                measurementStandard: 'D50/2°',
                version: '1.0',
                auditStatus: AuditStatus.VERIFIED,
                auditors: ['SOURCE 色彩实验室'],
                lastVerifiedAt: new Date('2026-01-06T10:00:00Z'),
                status: ColorStatus.ACTIVE,
            },
            create: {
                colorId: color.colorId,
                name: color.name,
                slug: color.slug,
                labL: color.labL,
                labA: color.labA,
                labB: color.labB,
                deltaETolerance: 2.0,
                measurementDevice: 'X-Rite i1Pro 3',
                measurementStandard: 'D50/2°',
                measuredAt: new Date('2026-01-06T10:00:00Z'),
                trueSourceNote: color.note,
                version: '1.0',
                auditStatus: AuditStatus.VERIFIED,
                auditors: ['SOURCE 色彩实验室'],
                lastVerifiedAt: new Date('2026-01-06T10:00:00Z'),
                batchId: batch1.id,
                status: ColorStatus.ACTIVE,
            },
        });
    }

    console.log(`✅ 示例颜色创建完成（共 ${3 + additionalColors.length} 种）`);

    // 7. 创建纸张表现数据（旧模型，保持兼容）
    const paperProfiles = [
        // 烟雨青的纸张表现
        {
            colorId: colorYanyuQing.id,
            paperType: PaperType.PREMIUM_MATTE,
            labL: 64.8,
            labA: -12.3,
            labB: -8.1,
            deltaE: 0.5,
            glossiness: 25,
            inkAbsorption: 45,
            gamutCoverage: 95,
            recommendation: Recommendation.BEST,
            cautionNote: null,
        },
        {
            colorId: colorYanyuQing.id,
            paperType: PaperType.UNCOATED,
            labL: 63.5,
            labA: -11.8,
            labB: -7.5,
            deltaE: 2.1,
            glossiness: 15,
            inkAbsorption: 65,
            gamutCoverage: 88,
            recommendation: Recommendation.GOOD,
            cautionNote: '饱和度略有降低，但保持文艺气质',
        },
        {
            colorId: colorYanyuQing.id,
            paperType: PaperType.COATED,
            labL: 65.0,
            labA: -12.4,
            labB: -8.2,
            deltaE: 0.3,
            glossiness: 75,
            inkAbsorption: 25,
            gamutCoverage: 98,
            recommendation: Recommendation.GOOD,
            cautionNote: '还原度高，但光泽感可能不符合文艺风格定位',
        },
        {
            colorId: colorYanyuQing.id,
            paperType: PaperType.OFFSET,
            labL: 62.1,
            labA: -10.5,
            labB: -6.8,
            deltaE: 4.2,
            glossiness: 20,
            inkAbsorption: 70,
            gamutCoverage: 75,
            recommendation: Recommendation.CAUTION,
            cautionNote: '明显发灰，饱和度损失较大',
        },
        {
            colorId: colorYanyuQing.id,
            paperType: PaperType.LIGHTWEIGHT,
            labL: 60.5,
            labA: -9.2,
            labB: -5.5,
            deltaE: 6.8,
            glossiness: 10,
            inkAbsorption: 85,
            gamutCoverage: 65,
            recommendation: Recommendation.AVOID,
            cautionNote: '严重发灰，不建议用于需要色彩表现的场景',
        },
        // 朱砂红的纸张表现
        {
            colorId: colorZhushaHong.id,
            paperType: PaperType.COATED,
            labL: 42.5,
            labA: 56.0,
            labB: 31.8,
            deltaE: 0.5,
            glossiness: 80,
            inkAbsorption: 20,
            gamutCoverage: 98,
            recommendation: Recommendation.BEST,
            cautionNote: null,
        },
        {
            colorId: colorZhushaHong.id,
            paperType: PaperType.PREMIUM_MATTE,
            labL: 42.0,
            labA: 54.5,
            labB: 30.5,
            deltaE: 2.3,
            glossiness: 28,
            inkAbsorption: 40,
            gamutCoverage: 92,
            recommendation: Recommendation.GOOD,
            cautionNote: '饱和度略降，呈现更沉稳的质感',
        },
        {
            colorId: colorZhushaHong.id,
            paperType: PaperType.LIGHTWEIGHT,
            labL: 38.2,
            labA: 48.5,
            labB: 25.3,
            deltaE: 9.5,
            glossiness: 8,
            inkAbsorption: 88,
            gamutCoverage: 55,
            recommendation: Recommendation.AVOID,
            cautionNote: '红色严重暗沉，失去活力',
        },
    ];

    for (const profile of paperProfiles) {
        await prisma.paperProfile.upsert({
            where: {
                colorId_paperType: {
                    colorId: profile.colorId,
                    paperType: profile.paperType,
                },
            },
            update: {},
            create: {
                ...profile,
                batchId: batch2.id,
            },
        });
    }

    console.log('✅ 纸张表现数据创建完成');

    // 8. 创建纸张推荐/排除（新模型）
    const paperRecommendations = [
        // 烟雨青推荐纸张（白名单）
        { colorId: colorYanyuQing.id, paperId: 'PAPER-PREMIUM-MATTE', recommendationType: RecommendationType.WHITELIST, reason: '高阶映画能最大程度还原烟雨青的细腻质感，饱和度损失最小' },
        { colorId: colorYanyuQing.id, paperId: 'PAPER-UNCOATED', recommendationType: RecommendationType.WHITELIST, reason: '纯质纸的哑光质感与文艺定位契合，虽有轻微饱和度损失但可接受' },
        // 烟雨青排除纸张（黑名单）
        { colorId: colorYanyuQing.id, paperId: 'PAPER-LIGHTWEIGHT', recommendationType: RecommendationType.BLACKLIST, reason: '轻型纸吸墨过强，会导致严重发灰，ΔE > 5，超出容差范围' },
        // 朱砂红推荐纸张
        { colorId: colorZhushaHong.id, paperId: 'PAPER-COATED', recommendationType: RecommendationType.WHITELIST, reason: '铜版纸的高光泽能最大程度展现朱砂红的鲜艳度' },
        { colorId: colorZhushaHong.id, paperId: 'PAPER-LIGHTWEIGHT', recommendationType: RecommendationType.BLACKLIST, reason: '轻型纸会导致红色严重暗沉，失去视觉冲击力' },
    ];

    for (const rec of paperRecommendations) {
        const paper = await prisma.paper.findUnique({ where: { paperId: rec.paperId } });
        if (paper) {
            await prisma.paperRecommendation.upsert({
                where: {
                    colorId_paperId: {
                        colorId: rec.colorId,
                        paperId: paper.id,
                    },
                },
                update: {},
                create: {
                    colorId: rec.colorId,
                    paperId: paper.id,
                    recommendationType: rec.recommendationType,
                    reason: rec.reason,
                },
            });
        }
    }

    console.log('✅ 纸张推荐数据创建完成');

    // 9. 创建配方（Recipe）
    const recipeYanyuQing = await prisma.recipe.upsert({
        where: { recipeId: 'RECIPE-YANYU-01' },
        update: {},
        create: {
            recipeId: 'RECIPE-YANYU-01',
            name: '烟雨青标准配方',
            colorId: colorYanyuQing.id,
            status: RecipeStatus.VERIFIED,
            costLevel: CostLevel.MEDIUM,
            applicablePapers: ['PAPER-PREMIUM-MATTE', 'PAPER-UNCOATED', 'PAPER-COATED'],
            notes: '适用于大多数涂布和非涂布纸张，轻型纸除外',
        },
    });

    const recipeZhushaHong = await prisma.recipe.upsert({
        where: { recipeId: 'RECIPE-ZHUSHA-01' },
        update: {},
        create: {
            recipeId: 'RECIPE-ZHUSHA-01',
            name: '朱砂红标准配方',
            colorId: colorZhushaHong.id,
            status: RecipeStatus.VERIFIED,
            costLevel: CostLevel.LOW,
            applicablePapers: ['PAPER-COATED', 'PAPER-PREMIUM-MATTE'],
            notes: '推荐用于涂布类纸张，非涂布纸需增加冲淡剂比例',
        },
    });

    console.log('✅ 配方数据创建完成');

    // 10. 创建油墨构成（Recipe Ingredients）
    const ingredientsYanyu = [
        { recipeId: recipeYanyuQing.id, inkName: '冲淡剂', inkType: InkType.EXTENDER, percentage: 70, order: 1 },
        { recipeId: recipeYanyuQing.id, inkName: '射光蓝', inkType: InkType.BASE, percentage: 20, order: 2 },
        { recipeId: recipeYanyuQing.id, inkName: '荧光红', inkType: InkType.BASE, percentage: 10, order: 3 },
    ];

    const ingredientsZhusha = [
        { recipeId: recipeZhushaHong.id, inkName: '原色红', inkType: InkType.BASE, percentage: 65, order: 1 },
        { recipeId: recipeZhushaHong.id, inkName: '黄色', inkType: InkType.BASE, percentage: 25, order: 2 },
        { recipeId: recipeZhushaHong.id, inkName: '冲淡剂', inkType: InkType.EXTENDER, percentage: 10, order: 3 },
    ];

    for (const ing of [...ingredientsYanyu, ...ingredientsZhusha]) {
        await prisma.recipeIngredient.create({
            data: ing,
        });
    }

    console.log('✅ 油墨构成数据创建完成');

    // 11. 创建适配矩阵（FitMatrix）
    const paperPremiumMatte = await prisma.paper.findUnique({ where: { paperId: 'PAPER-PREMIUM-MATTE' } });
    const paperUncoated = await prisma.paper.findUnique({ where: { paperId: 'PAPER-UNCOATED' } });
    const paperCoated = await prisma.paper.findUnique({ where: { paperId: 'PAPER-COATED' } });

    if (paperPremiumMatte && paperUncoated && paperCoated) {
        const fitMatrixEntries = [
            {
                recipeId: recipeYanyuQing.id,
                paperId: paperPremiumMatte.id,
                fitResult: FitResult.RECOMMENDED,
                deltaEResult: 0.5,
                stabilityScore: 5,
                issueTags: [],
                conclusionNote: '最佳组合，色彩还原度高，稳定性好',
                reportIds: ['REPORT-YANYU-001'],
            },
            {
                recipeId: recipeYanyuQing.id,
                paperId: paperUncoated.id,
                fitResult: FitResult.USABLE,
                deltaEResult: 2.1,
                stabilityScore: 4,
                issueTags: ['饱和度轻微损失'],
                conclusionNote: '可用，但需注意饱和度会有轻微降低',
                reportIds: ['REPORT-YANYU-001'],
            },
            {
                recipeId: recipeZhushaHong.id,
                paperId: paperCoated.id,
                fitResult: FitResult.RECOMMENDED,
                deltaEResult: 0.5,
                stabilityScore: 5,
                issueTags: [],
                conclusionNote: '最佳组合，红色鲜艳度最佳',
                reportIds: ['REPORT-ZHUSHA-001'],
            },
        ];

        for (const entry of fitMatrixEntries) {
            await prisma.fitMatrix.upsert({
                where: {
                    recipeId_paperId: {
                        recipeId: entry.recipeId,
                        paperId: entry.paperId,
                    },
                },
                update: {},
                create: entry,
            });
        }
    }

    console.log('✅ 适配矩阵数据创建完成');

    // 12. 创建测试报告
    const testReports = [
        {
            reportId: 'REPORT-YANYU-001',
            recipeId: recipeYanyuQing.id,
            testedPaperIds: ['PAPER-PREMIUM-MATTE', 'PAPER-UNCOATED'],
            printerPartner: '上海印刷集团',
            pressModel: 'Heidelberg Speedmaster XL 106',
            testDate: new Date('2026-01-04T10:00:00Z'),
            measurementDevice: 'X-Rite eXact',
            conclusionLevel: ConclusionLevel.PASS,
            summary: '烟雨青标准配方在高阶映画和纯质纸上均通过验证，ΔE 在容差范围内',
        },
        {
            reportId: 'REPORT-ZHUSHA-001',
            recipeId: recipeZhushaHong.id,
            testedPaperIds: ['PAPER-COATED', 'PAPER-PREMIUM-MATTE'],
            printerPartner: '北京华联印刷',
            pressModel: 'Komori Lithrone G40',
            testDate: new Date('2026-01-05T14:00:00Z'),
            measurementDevice: 'X-Rite eXact',
            conclusionLevel: ConclusionLevel.PASS,
            summary: '朱砂红标准配方验证通过，铜版纸表现最佳',
        },
    ];

    for (const report of testReports) {
        await prisma.recipeTestReport.upsert({
            where: { reportId: report.reportId },
            update: {},
            create: report,
        });
    }

    console.log('✅ 测试报告数据创建完成');

    // 13. 创建风险数据
    const risks = [
        {
            colorId: colorYanyuQing.id,
            riskType: RiskType.GRAYING,
            affectedPaperIds: ['PAPER-LIGHTWEIGHT', 'PAPER-OFFSET'],
            description: '烟雨青在高吸墨率纸张上会出现明显发灰现象',
            mitigation: '避免使用轻型纸和双胶纸，或调整配方增加冲淡剂比例',
        },
        {
            colorId: colorZhushaHong.id,
            riskType: RiskType.COLOR_SHIFT,
            affectedPaperIds: ['PAPER-LIGHTWEIGHT'],
            description: '朱砂红在轻型纸上会严重偏暗',
            mitigation: '仅在涂布类纸张上使用',
        },
    ];

    for (const risk of risks) {
        await prisma.colorRisk.create({
            data: risk,
        });
    }

    console.log('✅ 风险数据创建完成');

    // 14. 创建按纸张推荐配方
    if (paperPremiumMatte && paperCoated) {
        const paperRecipeRecommendations = [
            {
                paperId: paperPremiumMatte.id,
                recipeId: recipeYanyuQing.id,
                reason: '高阶映画与烟雨青标准配方组合经过完整验证，ΔE < 1',
                confidenceLevel: ConfidenceLevel.HIGH,
            },
            {
                paperId: paperCoated.id,
                recipeId: recipeZhushaHong.id,
                reason: '铜版纸与朱砂红标准配方为最佳拍档，色彩鲜艳度最高',
                confidenceLevel: ConfidenceLevel.HIGH,
            },
        ];

        for (const rec of paperRecipeRecommendations) {
            await prisma.paperRecipeRecommendation.upsert({
                where: {
                    paperId_recipeId: {
                        paperId: rec.paperId,
                        recipeId: rec.recipeId,
                    },
                },
                update: {},
                create: rec,
            });
        }
    }

    console.log('✅ 按纸张推荐配方数据创建完成');

    // 15. 创建打样包 SKU
    const proofingPacks = [
        { colorId: colorYanyuQing.id, paperType: PaperType.PREMIUM_MATTE, price: 1000, externalUrl: 'https://item.taobao.com/example-1' },
        { colorId: colorYanyuQing.id, paperType: PaperType.UNCOATED, price: 1000, externalUrl: 'https://item.taobao.com/example-2' },
        { colorId: colorYanyuQing.id, paperType: PaperType.COATED, price: 1000, externalUrl: 'https://item.taobao.com/example-3' },
        { colorId: colorZhushaHong.id, paperType: PaperType.COATED, price: 1000, externalUrl: 'https://item.taobao.com/example-4' },
        { colorId: colorZhushaHong.id, paperType: PaperType.PREMIUM_MATTE, price: 1000, externalUrl: 'https://item.taobao.com/example-5' },
    ];

    for (const pack of proofingPacks) {
        await prisma.proofingPack.upsert({
            where: {
                colorId_paperType: {
                    colorId: pack.colorId,
                    paperType: pack.paperType,
                },
            },
            update: {},
            create: pack,
        });
    }

    console.log('✅ 打样包 SKU 创建完成');

    // 16. 创建示例用户（5 级角色体系）
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@source.ink' },
        update: { role: UserRole.ADMIN },
        create: {
            email: 'admin@source.ink',
            name: 'SOURCE 管理员',
            role: UserRole.ADMIN,
            tier: UserTier.PAID,
        },
    });

    const operatorUser = await prisma.user.upsert({
        where: { email: 'operator@source.ink' },
        update: { role: UserRole.OPERATOR },
        create: {
            email: 'operator@source.ink',
            name: '运营人员',
            role: UserRole.OPERATOR,
            tier: UserTier.PAID,
        },
    });

    const auditorUser = await prisma.user.upsert({
        where: { email: 'auditor@source.ink' },
        update: { role: UserRole.AUDITOR },
        create: {
            email: 'auditor@source.ink',
            name: '审计顾问',
            role: UserRole.AUDITOR,
            tier: UserTier.PAID,
        },
    });

    // 创建合作方用户（关联到印厂）
    const partnerUser = await prisma.user.upsert({
        where: { email: 'partner@shanghai-printing.com' },
        update: { role: UserRole.PARTNER, partnerId: createdPartners['PRINTER-SH-001']?.id },
        create: {
            email: 'partner@shanghai-printing.com',
            name: '上海印刷负责人',
            role: UserRole.PARTNER,
            tier: UserTier.VERIFIED,
            partnerId: createdPartners['PRINTER-SH-001']?.id,
        },
    });

    const normalUser = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: { role: UserRole.USER },
        create: {
            email: 'user@example.com',
            name: '普通用户',
            role: UserRole.USER,
            tier: UserTier.FREE,
        },
    });

    console.log('✅ 用户数据创建完成（5 级角色）');

    // 17. 创建颜色参与关联数据（Color Participation）
    const colorParticipations = [
        // 烟雨青的参与者
        {
            colorId: colorYanyuQing.id,
            entityType: ParticipantEntityType.PARTNER,
            partnerId: createdPartners['PRINTER-SH-001']?.id,
            roleInColor: ParticipationRole.PRINTER,
            scope: ParticipationScope.RECIPE,
            status: ParticipationStatus.ACTIVE,
            evidenceType: EvidenceType.REPORT,
            evidenceId: 'REPORT-YANYU-001',
            note: '负责烟雨青标准配方的首次印刷验证',
            createdBy: 'system',
        },
        {
            colorId: colorYanyuQing.id,
            entityType: ParticipantEntityType.PARTNER,
            partnerId: createdPartners['PAPER-VENDOR-001']?.id,
            roleInColor: ParticipationRole.PAPER_SUPPLIER,
            scope: ParticipationScope.IDENTITY,
            status: ParticipationStatus.ACTIVE,
            note: '提供高阶映画纸张用于色彩测试',
            createdBy: 'system',
        },
        {
            colorId: colorYanyuQing.id,
            entityType: ParticipantEntityType.PARTNER,
            partnerId: createdPartners['INK-VENDOR-001']?.id,
            roleInColor: ParticipationRole.INK_SUPPLIER,
            scope: ParticipationScope.RECIPE,
            status: ParticipationStatus.ACTIVE,
            note: '提供油墨配方建议及原料',
            createdBy: 'system',
        },
        {
            colorId: colorYanyuQing.id,
            entityType: ParticipantEntityType.PARTNER,
            partnerId: createdPartners['LAB-001']?.id,
            roleInColor: ParticipationRole.AUDITOR,
            scope: ParticipationScope.IDENTITY,
            status: ParticipationStatus.ACTIVE,
            evidenceType: EvidenceType.BATCH,
            evidenceId: batch1.id,
            note: '作为审计顾问参与色彩验证',
            createdBy: 'system',
        },
        // 朱砂红的参与者
        {
            colorId: colorZhushaHong.id,
            entityType: ParticipantEntityType.PARTNER,
            partnerId: createdPartners['PRINTER-BJ-001']?.id,
            roleInColor: ParticipationRole.PRINTER,
            scope: ParticipationScope.RECIPE,
            status: ParticipationStatus.ACTIVE,
            evidenceType: EvidenceType.REPORT,
            evidenceId: 'REPORT-ZHUSHA-001',
            note: '负责朱砂红标准配方验证印刷',
            createdBy: 'system',
        },
        {
            colorId: colorZhushaHong.id,
            entityType: ParticipantEntityType.PARTNER,
            partnerId: createdPartners['PAPER-VENDOR-002']?.id,
            roleInColor: ParticipationRole.PAPER_SUPPLIER,
            scope: ParticipationScope.IDENTITY,
            status: ParticipationStatus.ACTIVE,
            note: '提供铜版纸用于色彩测试',
            createdBy: 'system',
        },
        {
            colorId: colorZhushaHong.id,
            entityType: ParticipantEntityType.PARTNER,
            partnerId: createdPartners['INK-VENDOR-002']?.id,
            roleInColor: ParticipationRole.INK_SUPPLIER,
            scope: ParticipationScope.RECIPE,
            status: ParticipationStatus.ACTIVE,
            note: '提供环保油墨方案',
            createdBy: 'system',
        },
        // 个人审计员参与
        {
            colorId: colorYanyuQing.id,
            entityType: ParticipantEntityType.USER,
            userId: auditorUser.id,
            roleInColor: ParticipationRole.AUDITOR,
            scope: ParticipationScope.IDENTITY,
            status: ParticipationStatus.ACTIVE,
            note: '作为个人审计顾问参与审核',
            createdBy: 'system',
        },
    ];

    // 使用 createMany 和 skipDuplicates 避免重复
    await prisma.colorParticipation.createMany({
        data: colorParticipations,
        skipDuplicates: true,
    });

    console.log('✅ 颜色参与关联数据创建完成');

    console.log('\n🎉 种子数据播种完成！');
    console.log('   - 2 个限流策略');
    console.log(`   - ${partners.length} 个合作者（印厂/纸商/油墨商/实验室）`);
    console.log('   - 3 个验证批次');
    console.log('   - 5 种纸张数据');
    console.log('   - 3 个示例颜色（含完整 v1.0 字段）');
    console.log(`   - ${paperProfiles.length} 条纸张表现数据`);
    console.log('   - 纸张推荐/排除数据');
    console.log('   - 2 个配方及油墨构成');
    console.log('   - 适配矩阵数据');
    console.log('   - 2 份测试报告');
    console.log('   - 风险数据');
    console.log(`   - ${proofingPacks.length} 个打样包 SKU`);
    console.log('   - 5 个示例用户（5 级角色）');
    console.log(`   - ${colorParticipations.length} 条颜色参与关联`);
}

main()
    .catch((e) => {
        console.error('❌ 播种失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
