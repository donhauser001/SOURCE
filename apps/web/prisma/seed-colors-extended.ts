/**
 * 扩展中国传统色彩数据 - 100+ 条
 * 
 * 基于《中国传统色》色谱，覆盖全色域
 * Lab 值基于真实色彩学范围
 */

import {
    PrismaClient,
    ColorStatus,
    AuditStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// 中国传统色彩数据 - 按色系分类
const traditionalColors = [
    // ========== 红色系 (20种) ==========
    { colorId: 'CN-Chi-01', name: '赤', slug: 'chi', labL: 45.2, labA: 58.5, labB: 38.2, note: '纯正的中国红，喜庆之色' },
    { colorId: 'CN-Zhu-01', name: '朱', slug: 'zhu', labL: 48.5, labA: 62.3, labB: 45.6, note: '朱砂之色，庙宇宫殿常用' },
    { colorId: 'CN-Dan-01', name: '丹', slug: 'dan', labL: 52.3, labA: 55.8, labB: 42.1, note: '丹霞之色，热烈明快' },
    { colorId: 'CN-Tong-01', name: '彤', slug: 'tong', labL: 55.8, labA: 52.3, labB: 38.5, note: '红彤彤，明亮的红色' },
    { colorId: 'CN-Fei-01', name: '绯', slug: 'fei', labL: 58.2, labA: 45.6, labB: 22.3, note: '绯红，如晚霞之色' },
    { colorId: 'CN-Hong-01', name: '红', slug: 'hong', labL: 50.5, labA: 60.2, labB: 40.8, note: '正红，中国红的代表' },
    { colorId: 'CN-Yin-01', name: '殷', slug: 'yin', labL: 35.8, labA: 42.5, labB: 28.3, note: '殷红，深沉的红色' },
    { colorId: 'CN-Xing-01', name: '猩', slug: 'xing', labL: 38.5, labA: 48.2, labB: 32.5, note: '猩红，浓烈艳丽' },
    { colorId: 'CN-Zao-01', name: '枣', slug: 'zao', labL: 32.5, labA: 35.8, labB: 18.2, note: '枣红，成熟稳重' },
    { colorId: 'CN-Jiu-01', name: '酒', slug: 'jiu', labL: 28.5, labA: 32.1, labB: 15.8, note: '酒红，深沉醇厚' },
    { colorId: 'CN-Mei-01', name: '玫', slug: 'mei', labL: 48.2, labA: 55.3, labB: -8.5, note: '玫红，娇艳欲滴' },
    { colorId: 'CN-Tao-01', name: '桃', slug: 'tao', labL: 68.5, labA: 38.2, labB: 12.5, note: '桃红，春日气息' },
    { colorId: 'CN-Hai-01', name: '海棠', slug: 'hai-tang', labL: 62.3, labA: 42.5, labB: 18.2, note: '海棠红，温婉柔美' },
    { colorId: 'CN-Ying-01', name: '樱', slug: 'ying', labL: 72.5, labA: 32.1, labB: 8.5, note: '樱花粉，清新淡雅' },
    { colorId: 'CN-Rou-01', name: '肉', slug: 'rou', labL: 78.2, labA: 18.5, labB: 15.2, note: '肉色，自然肤色' },
    { colorId: 'CN-Fen-01', name: '粉', slug: 'fen', labL: 82.5, labA: 15.2, labB: 5.8, note: '粉色，娇嫩可人' },
    { colorId: 'CN-Xia-01', name: '霞', slug: 'xia', labL: 75.8, labA: 28.5, labB: 12.3, note: '霞色，朝霞晚霞之色' },
    { colorId: 'CN-Zhu-02', name: '茱萸', slug: 'zhu-yu', labL: 45.8, labA: 52.3, labB: 35.2, note: '茱萸红，重阳佳节之色' },
    { colorId: 'CN-Shi-02', name: '柿', slug: 'shi', labL: 55.2, labA: 48.5, labB: 52.3, note: '柿红，丰收喜悦' },
    { colorId: 'CN-Liu-01', name: '榴', slug: 'liu', labL: 48.5, labA: 55.8, labB: 38.2, note: '石榴红，多子多福' },

    // ========== 橙黄色系 (15种) ==========
    { colorId: 'CN-Ju-01', name: '橘', slug: 'ju', labL: 68.5, labA: 38.2, labB: 65.8, note: '橘色，明亮温暖' },
    { colorId: 'CN-Xing-02', name: '杏', slug: 'xing-huang', labL: 75.2, labA: 18.5, labB: 58.3, note: '杏黄，如成熟杏子' },
    { colorId: 'CN-Ming-01', name: '明黄', slug: 'ming-huang', labL: 88.5, labA: 2.5, labB: 85.2, note: '明黄，帝王之色' },
    { colorId: 'CN-Jin-01', name: '金', slug: 'jin', labL: 78.2, labA: 12.5, labB: 72.3, note: '金色，富贵荣华' },
    { colorId: 'CN-Jiang-02', name: '姜', slug: 'jiang', labL: 62.5, labA: 22.3, labB: 48.5, note: '姜黄，温润药色' },
    { colorId: 'CN-Tu-01', name: '土', slug: 'tu', labL: 55.8, labA: 18.2, labB: 35.6, note: '土黄，大地之色' },
    { colorId: 'CN-Luo-01', name: '络', slug: 'luo', labL: 72.3, labA: 8.5, labB: 62.5, note: '络黄，丝绸之色' },
    { colorId: 'CN-Qiu-02', name: '秋葵', slug: 'qiu-kui', labL: 68.2, labA: 15.8, labB: 55.2, note: '秋葵黄，秋日暖阳' },
    { colorId: 'CN-Liu-02', name: '柳', slug: 'liu-huang', labL: 82.5, labA: -5.8, labB: 45.2, note: '柳黄，春柳嫩芽' },
    { colorId: 'CN-Ning-01', name: '柠檬', slug: 'ning-meng', labL: 92.5, labA: -8.2, labB: 78.5, note: '柠檬黄，清新明快' },
    { colorId: 'CN-Xuan-01', name: '玄黄', slug: 'xuan-huang', labL: 45.2, labA: 15.8, labB: 38.5, note: '玄黄，天地之色' },
    { colorId: 'CN-Mi-01', name: '蜜', slug: 'mi', labL: 75.8, labA: 5.2, labB: 52.3, note: '蜜色，甜蜜温馨' },
    { colorId: 'CN-La-01', name: '蜡', slug: 'la', labL: 85.2, labA: 2.8, labB: 42.5, note: '蜡黄，古朴典雅' },
    { colorId: 'CN-Chi-02', name: '赭黄', slug: 'zhe-huang', labL: 58.5, labA: 25.2, labB: 48.3, note: '赭黄，泥土芬芳' },
    { colorId: 'CN-Huang-01', name: '皇', slug: 'huang', labL: 82.3, labA: 8.5, labB: 78.2, note: '皇黄，九五之尊' },

    // ========== 绿色系 (18种) ==========
    { colorId: 'CN-Cui-01', name: '翠', slug: 'cui', labL: 52.3, labA: -45.8, labB: 25.2, note: '翠绿，翡翠之色' },
    { colorId: 'CN-Bi-01', name: '碧', slug: 'bi', labL: 58.5, labA: -38.2, labB: 15.8, note: '碧色，碧玉之青' },
    { colorId: 'CN-Qing-02', name: '青', slug: 'qing', labL: 48.2, labA: -25.5, labB: -18.3, note: '青色，介于蓝绿之间' },
    { colorId: 'CN-Lu-01', name: '绿', slug: 'lv', labL: 55.8, labA: -52.3, labB: 32.5, note: '正绿，生机盎然' },
    { colorId: 'CN-Cao-01', name: '草', slug: 'cao', labL: 62.5, labA: -38.5, labB: 42.8, note: '草绿，春草萌发' },
    { colorId: 'CN-Zhu-03', name: '竹', slug: 'zhu-lv', labL: 45.8, labA: -28.2, labB: 18.5, note: '竹绿，君子之色' },
    { colorId: 'CN-Song-02', name: '松', slug: 'song-lv', labL: 38.5, labA: -22.5, labB: 12.3, note: '松绿，苍劲挺拔' },
    { colorId: 'CN-Cha-01', name: '茶', slug: 'cha', labL: 52.3, labA: -18.5, labB: 22.8, note: '茶绿，清幽雅致' },
    { colorId: 'CN-Dong-01', name: '冬青', slug: 'dong-qing', labL: 35.2, labA: -25.8, labB: 8.5, note: '冬青绿，四季常青' },
    { colorId: 'CN-Kong-01', name: '孔雀', slug: 'kong-que', labL: 42.8, labA: -35.2, labB: -12.5, note: '孔雀绿，华丽富贵' },
    { colorId: 'CN-Ying-02', name: '鹦鹉', slug: 'ying-wu', labL: 58.2, labA: -48.5, labB: 28.3, note: '鹦鹉绿，鲜艳活泼' },
    { colorId: 'CN-Wa-01', name: '蛙', slug: 'wa', labL: 48.5, labA: -32.5, labB: 35.8, note: '蛙绿，田园之色' },
    { colorId: 'CN-Qiu-03', name: '秋绿', slug: 'qiu-lv', labL: 55.2, labA: -22.8, labB: 28.5, note: '秋绿，成熟稳重' },
    { colorId: 'CN-Nen-01', name: '嫩绿', slug: 'nen-lv', labL: 78.5, labA: -32.3, labB: 45.2, note: '嫩绿，新芽之色' },
    { colorId: 'CN-Mo-02', name: '墨绿', slug: 'mo-lv', labL: 28.5, labA: -18.2, labB: 8.5, note: '墨绿，深沉稳重' },
    { colorId: 'CN-Qing-03', name: '青葱', slug: 'qing-cong', labL: 62.8, labA: -35.5, labB: 32.3, note: '青葱，生机勃勃' },
    { colorId: 'CN-Ye-01', name: '叶', slug: 'ye', labL: 42.5, labA: -28.5, labB: 22.8, note: '叶绿，自然本色' },
    { colorId: 'CN-Yu-01', name: '玉', slug: 'yu', labL: 72.3, labA: -15.8, labB: 8.5, note: '玉绿，温润如玉' },

    // ========== 蓝色系 (15种) ==========
    { colorId: 'CN-Lan-01', name: '蓝', slug: 'lan', labL: 42.5, labA: -5.8, labB: -45.2, note: '正蓝，晴空万里' },
    { colorId: 'CN-Hai-02', name: '海', slug: 'hai', labL: 35.8, labA: -8.2, labB: -38.5, note: '海蓝，深邃辽阔' },
    { colorId: 'CN-Tian-02', name: '天蓝', slug: 'tian-lan', labL: 72.5, labA: -12.3, labB: -28.5, note: '天蓝，万里无云' },
    { colorId: 'CN-Qun-01', name: '群青', slug: 'qun-qing', labL: 28.5, labA: 15.8, labB: -55.2, note: '群青，颜料本色' },
    { colorId: 'CN-Bao-01', name: '宝蓝', slug: 'bao-lan', labL: 32.3, labA: 8.5, labB: -48.5, note: '宝蓝，珍贵华美' },
    { colorId: 'CN-Zan-01', name: '藏蓝', slug: 'zang-lan', labL: 22.5, labA: 2.8, labB: -32.3, note: '藏蓝，深沉内敛' },
    { colorId: 'CN-Ya-02', name: '鸦蓝', slug: 'ya-lan', labL: 28.2, labA: -2.5, labB: -25.8, note: '鸦蓝，神秘深邃' },
    { colorId: 'CN-Qing-04', name: '青蓝', slug: 'qing-lan', labL: 45.8, labA: -18.5, labB: -32.5, note: '青蓝，介于青蓝之间' },
    { colorId: 'CN-Fen-02', name: '粉蓝', slug: 'fen-lan', labL: 78.5, labA: -8.2, labB: -18.5, note: '粉蓝，清新柔和' },
    { colorId: 'CN-Bing-01', name: '冰', slug: 'bing', labL: 85.2, labA: -5.5, labB: -12.3, note: '冰蓝，清冷晶莹' },
    { colorId: 'CN-Wei-01', name: '蔚', slug: 'wei', labL: 52.3, labA: -15.2, labB: -35.8, note: '蔚蓝，天高云淡' },
    { colorId: 'CN-Liang-01', name: '亮蓝', slug: 'liang-lan', labL: 62.5, labA: -8.5, labB: -42.3, note: '亮蓝，明亮通透' },
    { colorId: 'CN-Ye-02', name: '夜', slug: 'ye', labL: 18.5, labA: 2.3, labB: -22.8, note: '夜蓝，深夜星空' },
    { colorId: 'CN-Yan-02', name: '烟蓝', slug: 'yan-lan', labL: 58.2, labA: -5.8, labB: -22.5, note: '烟蓝，朦胧淡雅' },
    { colorId: 'CN-Hu-02', name: '湖', slug: 'hu', labL: 55.8, labA: -22.3, labB: -28.5, note: '湖蓝，静谧深邃' },

    // ========== 紫色系 (12种) ==========
    { colorId: 'CN-Zi-01', name: '紫', slug: 'zi', labL: 38.5, labA: 42.3, labB: -38.2, note: '正紫，高贵典雅' },
    { colorId: 'CN-Qie-01', name: '茄', slug: 'qie', labL: 32.5, labA: 35.8, labB: -28.5, note: '茄紫，深沉神秘' },
    { colorId: 'CN-Pu-01', name: '葡', slug: 'pu', labL: 28.2, labA: 32.5, labB: -22.3, note: '葡萄紫，醇厚饱满' },
    { colorId: 'CN-Lan-02', name: '兰', slug: 'lan-zi', labL: 45.8, labA: 28.5, labB: -45.2, note: '兰紫，优雅浪漫' },
    { colorId: 'CN-Zi-02', name: '紫藤', slug: 'zi-teng', labL: 58.2, labA: 25.3, labB: -32.5, note: '紫藤色，春日花语' },
    { colorId: 'CN-Xun-01', name: '熏', slug: 'xun', labL: 48.5, labA: 18.2, labB: -15.8, note: '熏紫，烟熏朦胧' },
    { colorId: 'CN-Dan-02', name: '丁香', slug: 'ding-xiang', labL: 68.5, labA: 22.3, labB: -18.5, note: '丁香紫，淡雅芬芳' },
    { colorId: 'CN-Qian-01', name: '浅紫', slug: 'qian-zi', labL: 75.2, labA: 18.5, labB: -15.2, note: '浅紫，温柔淡雅' },
    { colorId: 'CN-Jiang-03', name: '酱紫', slug: 'jiang-zi-2', labL: 25.8, labA: 28.3, labB: -18.5, note: '酱紫，沉稳内敛' },
    { colorId: 'CN-Mo-03', name: '墨紫', slug: 'mo-zi', labL: 18.5, labA: 22.3, labB: -25.8, note: '墨紫，深邃神秘' },
    { colorId: 'CN-Mei-02', name: '玫紫', slug: 'mei-zi', labL: 42.3, labA: 52.5, labB: -32.8, note: '玫紫，艳丽夺目' },
    { colorId: 'CN-Xue-01', name: '雪青', slug: 'xue-qing', labL: 82.5, labA: 8.5, labB: -12.3, note: '雪青，冰清玉洁' },

    // ========== 褐棕色系 (10种) ==========
    { colorId: 'CN-He-02', name: '褐', slug: 'he', labL: 42.5, labA: 18.2, labB: 28.5, note: '褐色，大地本色' },
    { colorId: 'CN-Zong-01', name: '棕', slug: 'zong', labL: 38.5, labA: 22.3, labB: 32.8, note: '棕色，树木之色' },
    { colorId: 'CN-Ka-01', name: '咖', slug: 'ka', labL: 32.5, labA: 18.5, labB: 22.3, note: '咖啡色，醇厚温暖' },
    { colorId: 'CN-Li-01', name: '栗', slug: 'li', labL: 28.5, labA: 22.8, labB: 18.5, note: '栗色，秋实之色' },
    { colorId: 'CN-Qian-02', name: '浅棕', slug: 'qian-zong', labL: 58.2, labA: 15.3, labB: 28.5, note: '浅棕，温和自然' },
    { colorId: 'CN-Shen-01', name: '深棕', slug: 'shen-zong', labL: 22.5, labA: 12.8, labB: 15.2, note: '深棕，沉稳厚重' },
    { colorId: 'CN-Tuo-02', name: '驼', slug: 'tuo', labL: 55.8, labA: 12.3, labB: 32.5, note: '驼色，沙漠之色' },
    { colorId: 'CN-Ma-01', name: '麻', slug: 'ma', labL: 62.5, labA: 8.5, labB: 22.3, note: '麻色，质朴天然' },
    { colorId: 'CN-Mu-01', name: '木', slug: 'mu', labL: 48.5, labA: 15.8, labB: 25.2, note: '木色，原木质感' },
    { colorId: 'CN-Pi-01', name: '皮', slug: 'pi', labL: 52.3, labA: 18.2, labB: 28.5, note: '皮革色，复古经典' },

    // ========== 黑灰白色系 (10种) ==========
    { colorId: 'CN-Hei-01', name: '玄', slug: 'xuan', labL: 12.5, labA: 0.5, labB: -2.3, note: '玄色，天地初始之色' },
    { colorId: 'CN-Mo-04', name: '墨', slug: 'mo', labL: 18.2, labA: -0.8, labB: -1.5, note: '墨色，文房四宝' },
    { colorId: 'CN-Tan-02', name: '炭', slug: 'tan', labL: 25.5, labA: 0.2, labB: 0.8, note: '炭色，炉火之余' },
    { colorId: 'CN-Tie-01', name: '铁', slug: 'tie', labL: 35.8, labA: -1.2, labB: -2.5, note: '铁灰，坚韧刚强' },
    { colorId: 'CN-Yin-02', name: '银', slug: 'yin', labL: 75.2, labA: -0.5, labB: -1.8, note: '银色，清冷高贵' },
    { colorId: 'CN-Hui-01', name: '灰', slug: 'hui', labL: 58.5, labA: -0.2, labB: 0.5, note: '灰色，中庸之道' },
    { colorId: 'CN-Qian-03', name: '浅灰', slug: 'qian-hui', labL: 78.2, labA: -0.3, labB: 0.8, note: '浅灰，淡然自若' },
    { colorId: 'CN-Bai-01', name: '素', slug: 'su', labL: 95.2, labA: 0.2, labB: 0.5, note: '素白，纯净无暇' },
    { colorId: 'CN-Xue-02', name: '雪', slug: 'xue', labL: 98.5, labA: -0.5, labB: -0.8, note: '雪白，冰清玉洁' },
    { colorId: 'CN-Ya-03', name: '牙', slug: 'ya', labL: 92.3, labA: 0.8, labB: 5.2, note: '象牙白，温润典雅' },
];

async function main() {
    console.log('🎨 开始添加扩展中国传统色彩数据...\n');
    console.log(`📊 计划添加 ${traditionalColors.length} 种色彩\n`);

    // 获取第一个 batch 用于关联
    const batch = await prisma.batch.findFirst({
        where: { batchNo: 'BATCH-2026-001' },
    });

    if (!batch) {
        console.log('⚠️ 未找到批次数据，请先运行主 seed 脚本');
        return;
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    // 按色系分组显示
    const colorGroups = {
        '红色系': traditionalColors.slice(0, 20),
        '橙黄色系': traditionalColors.slice(20, 35),
        '绿色系': traditionalColors.slice(35, 53),
        '蓝色系': traditionalColors.slice(53, 68),
        '紫色系': traditionalColors.slice(68, 80),
        '褐棕色系': traditionalColors.slice(80, 90),
        '黑灰白色系': traditionalColors.slice(90),
    };

    for (const [groupName, colors] of Object.entries(colorGroups)) {
        console.log(`\n📁 ${groupName}:`);

        for (const color of colors) {
            try {
                const existing = await prisma.color.findUnique({
                    where: { colorId: color.colorId },
                });

                if (existing) {
                    console.log(`  ⏭️  跳过: ${color.colorId} ${color.name}`);
                    skipped++;
                    continue;
                }

                // 随机分配状态（70% ACTIVE/VERIFIED，20% EXPERIMENTAL，10% DRAFT）
                const rand = Math.random();
                let status: ColorStatus;
                let auditStatus: AuditStatus;

                if (rand < 0.7) {
                    status = ColorStatus.ACTIVE;
                    auditStatus = AuditStatus.VERIFIED;
                } else if (rand < 0.9) {
                    status = ColorStatus.EXPERIMENTAL;
                    auditStatus = AuditStatus.PENDING;
                } else {
                    status = ColorStatus.DRAFT;
                    auditStatus = AuditStatus.PENDING;
                }

                await prisma.color.create({
                    data: {
                        colorId: color.colorId,
                        name: color.name,
                        slug: color.slug,
                        labL: color.labL,
                        labA: color.labA,
                        labB: color.labB,
                        deltaETolerance: 2.0,
                        measurementDevice: 'X-Rite i1Pro 3',
                        measurementStandard: 'D50/2°',
                        measurementCondition: '标准实验室环境，温度 23±2°C，湿度 50±5%',
                        measuredAt: new Date(),
                        trueSourceNote: color.note,
                        version: '1.0',
                        status,
                        auditStatus,
                        auditors: auditStatus === AuditStatus.VERIFIED
                            ? ['SOURCE 色彩实验室']
                            : [],
                        lastVerifiedAt: auditStatus === AuditStatus.VERIFIED
                            ? new Date()
                            : null,
                        lastAuditAt: auditStatus === AuditStatus.VERIFIED
                            ? new Date()
                            : null,
                        batchId: batch.id,
                    },
                });

                const statusEmoji = status === ColorStatus.ACTIVE ? '✅' : status === ColorStatus.EXPERIMENTAL ? '🧪' : '📝';
                console.log(`  ${statusEmoji} 创建: ${color.colorId} ${color.name}`);
                created++;
            } catch (error) {
                console.log(`  ❌ 错误: ${color.colorId} - ${error}`);
                errors++;
            }
        }
    }

    // 统计
    const totalColors = await prisma.color.count();

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 扩展色彩数据添加完成！`);
    console.log(`   ✅ 新建: ${created} 个`);
    console.log(`   ⏭️  跳过: ${skipped} 个`);
    console.log(`   ❌ 错误: ${errors} 个`);
    console.log(`   📊 数据库总色彩数: ${totalColors} 个`);
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
