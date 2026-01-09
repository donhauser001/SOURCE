/**
 * 材料管理初始数据种子脚本
 * 
 * 初始化纸型选项和油墨选项
 */

import { PrismaClient, PaperCategory, InkType } from '@prisma/client';

const prisma = new PrismaClient();

// 初始纸型数据（与原 PaperType 枚举对应）
const paperTypes = [
  {
    code: 'PREMIUM_MATTE',
    name: '高阶映画',
    description: '高品质哑光艺术纸，适合高端画册、艺术品复制',
    category: PaperCategory.UNCOATED,
    gramWeightMin: 100,
    gramWeightMax: 200,
    surfaceFinish: '哑面',
    suitableFor: ['艺术画册', '摄影集', '高端画册'],
    order: 0,
  },
  {
    code: 'UNCOATED',
    name: '纯质纸',
    description: '非涂布纸，表面粗糙，吸墨性强',
    category: PaperCategory.UNCOATED,
    gramWeightMin: 80,
    gramWeightMax: 120,
    surfaceFinish: '自然',
    suitableFor: ['书籍内页', '文学书', '散文集'],
    order: 1,
  },
  {
    code: 'COATED',
    name: '铜版纸',
    description: '涂布纸，表面光滑，色彩还原度高',
    category: PaperCategory.COATED,
    gramWeightMin: 105,
    gramWeightMax: 300,
    surfaceFinish: '光面/哑面',
    suitableFor: ['杂志', '宣传册', '产品目录'],
    order: 2,
  },
  {
    code: 'OFFSET',
    name: '双胶纸',
    description: '胶版纸，性价比高，适合大批量印刷',
    category: PaperCategory.UNCOATED,
    gramWeightMin: 70,
    gramWeightMax: 120,
    surfaceFinish: '自然',
    suitableFor: ['教材', '办公用纸', '一般书籍'],
    order: 3,
  },
  {
    code: 'LIGHTWEIGHT',
    name: '轻型纸',
    description: '轻便护眼纸，适合长时间阅读',
    category: PaperCategory.UNCOATED,
    gramWeightMin: 52,
    gramWeightMax: 80,
    surfaceFinish: '自然',
    suitableFor: ['小说', '轻量书籍', '文库本'],
    order: 4,
  },
];

// 示例油墨数据
const inks = [
  {
    code: 'PANTONE-BLACK-C',
    name: '潘通黑 C',
    brand: 'Pantone',
    colorSeries: '黑色系',
    colorCode: 'Black C',
    inkType: InkType.BASE,
    order: 0,
  },
  {
    code: 'PANTONE-PROCESS-CYAN',
    name: '潘通青色',
    brand: 'Pantone',
    colorSeries: '四色',
    colorCode: 'Process Cyan',
    inkType: InkType.BASE,
    order: 1,
  },
  {
    code: 'PANTONE-PROCESS-MAGENTA',
    name: '潘通品红',
    brand: 'Pantone',
    colorSeries: '四色',
    colorCode: 'Process Magenta',
    inkType: InkType.BASE,
    order: 2,
  },
  {
    code: 'PANTONE-PROCESS-YELLOW',
    name: '潘通黄色',
    brand: 'Pantone',
    colorSeries: '四色',
    colorCode: 'Process Yellow',
    inkType: InkType.BASE,
    order: 3,
  },
  {
    code: 'TRANSPARENT-WHITE',
    name: '透明冲淡剂',
    brand: '通用',
    colorSeries: '辅料',
    colorCode: 'TW',
    inkType: InkType.EXTENDER,
    order: 100,
  },
];

async function main() {
  console.log('开始初始化材料数据...');

  // 插入纸型数据
  console.log('\n插入纸型数据...');
  for (const pt of paperTypes) {
    const existing = await prisma.paperTypeOption.findUnique({
      where: { code: pt.code },
    });
    
    if (existing) {
      console.log(`  - 纸型 ${pt.code} 已存在，跳过`);
    } else {
      await prisma.paperTypeOption.create({
        data: pt,
      });
      console.log(`  + 创建纸型: ${pt.name} (${pt.code})`);
    }
  }

  // 插入油墨数据
  console.log('\n插入油墨数据...');
  for (const ink of inks) {
    const existing = await prisma.inkOption.findUnique({
      where: { code: ink.code },
    });
    
    if (existing) {
      console.log(`  - 油墨 ${ink.code} 已存在，跳过`);
    } else {
      await prisma.inkOption.create({
        data: ink,
      });
      console.log(`  + 创建油墨: ${ink.name} (${ink.code})`);
    }
  }

  console.log('\n材料数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
