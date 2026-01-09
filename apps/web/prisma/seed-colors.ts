/**
 * 补充 20 条中国传统色彩数据
 */

import {
    PrismaClient,
    ColorStatus,
    AuditStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// 20 个中国传统色彩数据
const traditionalColors = [
    {
        colorId: 'CN-Qing-01',
        name: '靛青',
        slug: 'dian-qing',
        labL: 28.5,
        labA: -8.2,
        labB: -32.1,
        trueSourceNote: '取自蓝草染料的深邃之色，古代文人墨客的至爱',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-He-01',
        name: '藕荷',
        slug: 'ou-he',
        labL: 72.3,
        labA: 18.5,
        labB: -12.4,
        trueSourceNote: '如荷花初绽之色，淡雅而清新',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Dai-01',
        name: '黛色',
        slug: 'dai-se',
        labL: 32.1,
        labA: -2.3,
        labB: -8.5,
        trueSourceNote: '古代女子画眉之色，深邃而神秘',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Yan-01',
        name: '胭脂',
        slug: 'yan-zhi',
        labL: 48.6,
        labA: 52.8,
        labB: 18.3,
        trueSourceNote: '取自胭脂虫的艳丽之色，古代女子妆容必备',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Hu-01',
        name: '琥珀',
        slug: 'hu-po',
        labL: 58.2,
        labA: 28.5,
        labB: 56.8,
        trueSourceNote: '如琥珀凝固的时光之色，温暖而深沉',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Song-01',
        name: '松花',
        slug: 'song-hua',
        labL: 78.5,
        labA: -18.2,
        labB: 32.6,
        trueSourceNote: '春日松花粉的清新之色',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Jiang-01',
        name: '绛紫',
        slug: 'jiang-zi',
        labL: 35.8,
        labA: 38.5,
        labB: -22.3,
        trueSourceNote: '古代帝王的尊贵之色，庄严而高贵',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Qiu-01',
        name: '秋香',
        slug: 'qiu-xiang',
        labL: 68.3,
        labA: -12.5,
        labB: 42.8,
        trueSourceNote: '秋日香樟叶的成熟之色',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Yue-01',
        name: '月白',
        slug: 'yue-bai',
        labL: 88.2,
        labA: -2.5,
        labB: -8.3,
        trueSourceNote: '月光映照下的清冷之色',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Piao-01',
        name: '缥碧',
        slug: 'piao-bi',
        labL: 62.5,
        labA: -22.8,
        labB: -12.5,
        trueSourceNote: '如青山远黛的空灵之色',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Ya-01',
        name: '鸦青',
        slug: 'ya-qing',
        labL: 25.3,
        labA: -5.8,
        labB: -18.2,
        trueSourceNote: '乌鸦羽毛的深沉之色，古典而沉稳',
        status: ColorStatus.EXPERIMENTAL,
        auditStatus: AuditStatus.PENDING,
    },
    {
        colorId: 'CN-Tuo-01',
        name: '酡红',
        slug: 'tuo-hong',
        labL: 55.8,
        labA: 45.2,
        labB: 22.5,
        trueSourceNote: '如醉酒后双颊的绯红之色',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Mo-01',
        name: '水墨',
        slug: 'shui-mo',
        labL: 42.5,
        labA: -1.2,
        labB: -2.8,
        trueSourceNote: '中国水墨画的经典之色',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Shi-01',
        name: '石青',
        slug: 'shi-qing',
        labL: 52.3,
        labA: -15.8,
        labB: -28.5,
        trueSourceNote: '取自青金石的矿物之色，古代壁画常用',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Teng-01',
        name: '藤黄',
        slug: 'teng-huang',
        labL: 82.5,
        labA: 5.8,
        labB: 78.2,
        trueSourceNote: '取自藤黄树脂的明亮之色，国画颜料之一',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Tan-01',
        name: '檀香',
        slug: 'tan-xiang',
        labL: 48.5,
        labA: 18.2,
        labB: 28.5,
        trueSourceNote: '如檀木的温润之色，古雅而沉稳',
        status: ColorStatus.EXPERIMENTAL,
        auditStatus: AuditStatus.PENDING,
    },
    {
        colorId: 'CN-Shuang-01',
        name: '霜色',
        slug: 'shuang-se',
        labL: 92.5,
        labA: -0.5,
        labB: 2.8,
        trueSourceNote: '晨霜的清冷纯净之色',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-Zhe-01',
        name: '赭石',
        slug: 'zhe-shi',
        labL: 45.2,
        labA: 28.5,
        labB: 32.8,
        trueSourceNote: '大地赤褐之色，国画山水常用',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
    {
        colorId: 'CN-E-01',
        name: '鹅黄',
        slug: 'e-huang',
        labL: 88.5,
        labA: -2.8,
        labB: 38.5,
        trueSourceNote: '如雏鹅绒毛的娇嫩之色',
        status: ColorStatus.EXPERIMENTAL,
        auditStatus: AuditStatus.PENDING,
    },
    {
        colorId: 'CN-Tian-01',
        name: '天青',
        slug: 'tian-qing',
        labL: 68.5,
        labA: -8.5,
        labB: -18.2,
        trueSourceNote: '雨过天晴云破处的清澈之色，汝窑釉色典范',
        status: ColorStatus.ACTIVE,
        auditStatus: AuditStatus.VERIFIED,
    },
];

async function main() {
    console.log('🎨 开始添加 20 条中国传统色彩数据...\n');

    // 获取第一个 batch 用于关联
    const batch = await prisma.batch.findFirst({
        where: { batchNo: 'BATCH-2026-001' },
    });

    let created = 0;
    let skipped = 0;

    for (const color of traditionalColors) {
        const existing = await prisma.color.findUnique({
            where: { colorId: color.colorId },
        });

        if (existing) {
            console.log(`⏭️  跳过已存在: ${color.colorId} ${color.name}`);
            skipped++;
            continue;
        }

        await prisma.color.create({
            data: {
                ...color,
                deltaETolerance: 2.0,
                measurementDevice: 'X-Rite i1Pro 3',
                measurementStandard: 'D50/2°',
                measurementCondition: '标准实验室环境，温度 23±2°C，湿度 50±5%',
                measuredAt: new Date(),
                version: '1.0',
                auditors: color.auditStatus === AuditStatus.VERIFIED
                    ? ['SOURCE 色彩实验室']
                    : [],
                lastVerifiedAt: color.auditStatus === AuditStatus.VERIFIED
                    ? new Date()
                    : null,
                lastAuditAt: color.auditStatus === AuditStatus.VERIFIED
                    ? new Date()
                    : null,
                batchId: batch?.id,
            },
        });

        console.log(`✅ 创建: ${color.colorId} ${color.name}`);
        created++;
    }

    console.log(`\n🎉 完成！创建 ${created} 个，跳过 ${skipped} 个`);
}

main()
    .catch((e) => {
        console.error('❌ 执行失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

