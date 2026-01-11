/**
 * 材料管理数据迁移脚本
 * 
 * 迁移步骤：
 * 1. 创建 PaperTypeOption 和 InkOption 表（通过 raw SQL）
 * 2. 插入初始纸型数据
 * 3. 从现有 RecipeIngredient 提取油墨数据并插入
 * 4. 添加外键列并更新数据
 * 5. 删除旧列
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 纸型映射：旧枚举值 -> 新数据
const paperTypeMapping: Record<string, {
  name: string;
  description: string;
  category: string;
  gramWeightMin: number;
  gramWeightMax: number;
  surfaceFinish: string;
  suitableFor: string[];
}> = {
  'PREMIUM_MATTE': {
    name: '高阶映画',
    description: '高品质哑光艺术纸，适合高端画册、艺术品复制',
    category: 'UNCOATED',
    gramWeightMin: 100,
    gramWeightMax: 200,
    surfaceFinish: '哑面',
    suitableFor: ['艺术画册', '摄影集', '高端画册'],
  },
  'UNCOATED': {
    name: '纯质纸',
    description: '非涂布纸，表面粗糙，吸墨性强',
    category: 'UNCOATED',
    gramWeightMin: 80,
    gramWeightMax: 120,
    surfaceFinish: '自然',
    suitableFor: ['书籍内页', '文学书', '散文集'],
  },
  'COATED': {
    name: '铜版纸',
    description: '涂布纸，表面光滑，色彩还原度高',
    category: 'COATED',
    gramWeightMin: 105,
    gramWeightMax: 300,
    surfaceFinish: '光面/哑面',
    suitableFor: ['杂志', '宣传册', '产品目录'],
  },
  'OFFSET': {
    name: '双胶纸',
    description: '胶版纸，性价比高，适合大批量印刷',
    category: 'UNCOATED',
    gramWeightMin: 70,
    gramWeightMax: 120,
    surfaceFinish: '自然',
    suitableFor: ['教材', '办公用纸', '一般书籍'],
  },
  'LIGHTWEIGHT': {
    name: '轻型纸',
    description: '轻便护眼纸，适合长时间阅读',
    category: 'UNCOATED',
    gramWeightMin: 52,
    gramWeightMax: 80,
    surfaceFinish: '自然',
    suitableFor: ['小说', '轻量书籍', '文库本'],
  },
};

async function main() {
  console.log('=== 开始材料数据迁移 ===\n');

  // Step 1: 创建 PaperTypeOption 表
  console.log('Step 1: 创建 PaperTypeOption 表...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PaperTypeOption" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "category" "PaperCategory" NOT NULL,
      "gramWeightMin" INTEGER,
      "gramWeightMax" INTEGER,
      "surfaceFinish" TEXT,
      "suitableFor" JSONB,
      "order" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PaperTypeOption_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "PaperTypeOption_code_key" ON "PaperTypeOption"("code");
  `);
  console.log('  ✓ PaperTypeOption 表已创建\n');

  // Step 2: 插入纸型初始数据
  console.log('Step 2: 插入纸型数据...');
  let order = 0;
  for (const [code, data] of Object.entries(paperTypeMapping)) {
    const id = `pt_${code.toLowerCase()}`;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "PaperTypeOption" ("id", "code", "name", "description", "category", "gramWeightMin", "gramWeightMax", "surfaceFinish", "suitableFor", "order", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5::"PaperCategory", $6, $7, $8, $9::jsonb, $10, true, NOW(), NOW())
        ON CONFLICT ("code") DO NOTHING
      `, id, code, data.name, data.description, data.category, data.gramWeightMin, data.gramWeightMax, data.surfaceFinish, JSON.stringify(data.suitableFor), order);
      console.log(`  + ${code}: ${data.name}`);
    } catch (e) {
      console.log(`  - ${code}: 已存在或跳过`);
    }
    order++;
  }
  console.log('');

  // Step 3: 创建 InkOption 表
  console.log('Step 3: 创建 InkOption 表...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InkOption" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "brand" TEXT,
      "colorSeries" TEXT,
      "colorCode" TEXT,
      "inkType" "InkType" NOT NULL,
      "viscosity" DOUBLE PRECISION,
      "dryingTime" INTEGER,
      "colorStrength" DOUBLE PRECISION,
      "lightfastness" INTEGER,
      "priceMin" INTEGER,
      "priceMax" INTEGER,
      "order" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "InkOption_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "InkOption_code_key" ON "InkOption"("code");
  `);
  console.log('  ✓ InkOption 表已创建\n');

  // Step 4: 从 RecipeIngredient 提取油墨数据
  console.log('Step 4: 从 RecipeIngredient 提取油墨数据...');
  const existingIngredients = await prisma.$queryRawUnsafe<Array<{ inkName: string; inkType: string }>>(`
    SELECT DISTINCT "inkName", "inkType" FROM "RecipeIngredient"
  `);

  let inkOrder = 0;
  const inkCodeMap: Record<string, string> = {}; // inkName -> id

  for (const ing of existingIngredients) {
    const code = ing.inkName.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-');
    const id = `ink_${code.toLowerCase().slice(0, 20)}_${inkOrder}`;

    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "InkOption" ("id", "code", "name", "inkType", "order", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4::"InkType", $5, true, NOW(), NOW())
        ON CONFLICT ("code") DO NOTHING
      `, id, code, ing.inkName, ing.inkType, inkOrder);

      inkCodeMap[ing.inkName] = id;
      console.log(`  + ${code}: ${ing.inkName} (${ing.inkType})`);
    } catch (e) {
      // 如果 code 冲突，尝试获取已存在的 id
      const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
        SELECT "id" FROM "InkOption" WHERE "code" = $1
      `, code);
      if (existing.length > 0) {
        inkCodeMap[ing.inkName] = existing[0].id;
        console.log(`  - ${code}: 已存在`);
      }
    }
    inkOrder++;
  }
  console.log('');

  // Step 5: 添加 paperTypeId 列到 PaperProfile
  console.log('Step 5: 迁移 PaperProfile 数据...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PaperProfile" ADD COLUMN IF NOT EXISTS "paperTypeId" TEXT;
    `);

    // 更新外键值
    for (const code of Object.keys(paperTypeMapping)) {
      const id = `pt_${code.toLowerCase()}`;
      await prisma.$executeRawUnsafe(`
        UPDATE "PaperProfile" SET "paperTypeId" = $1 WHERE "paperType" = $2::"PaperType"
      `, id, code);
    }
    console.log('  ✓ PaperProfile.paperTypeId 已更新\n');
  } catch (e) {
    console.log('  ! PaperProfile 迁移跳过或出错:', (e as Error).message, '\n');
  }

  // Step 6: 添加 paperTypeId 列到 ProofingPack
  console.log('Step 6: 迁移 ProofingPack 数据...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ProofingPack" ADD COLUMN IF NOT EXISTS "paperTypeId" TEXT;
    `);

    // 更新外键值
    for (const code of Object.keys(paperTypeMapping)) {
      const id = `pt_${code.toLowerCase()}`;
      await prisma.$executeRawUnsafe(`
        UPDATE "ProofingPack" SET "paperTypeId" = $1 WHERE "paperType" = $2::"PaperType"
      `, id, code);
    }
    console.log('  ✓ ProofingPack.paperTypeId 已更新\n');
  } catch (e) {
    console.log('  ! ProofingPack 迁移跳过或出错:', (e as Error).message, '\n');
  }

  // Step 7: 添加 inkId 列到 RecipeIngredient
  console.log('Step 7: 迁移 RecipeIngredient 数据...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "RecipeIngredient" ADD COLUMN IF NOT EXISTS "inkId" TEXT;
    `);

    // 更新外键值
    for (const [inkName, inkId] of Object.entries(inkCodeMap)) {
      await prisma.$executeRawUnsafe(`
        UPDATE "RecipeIngredient" SET "inkId" = $1 WHERE "inkName" = $2
      `, inkId, inkName);
    }
    console.log('  ✓ RecipeIngredient.inkId 已更新\n');
  } catch (e) {
    console.log('  ! RecipeIngredient 迁移跳过或出错:', (e as Error).message, '\n');
  }

  console.log('=== 数据迁移完成 ===');
  console.log('\n下一步: 运行 prisma db push 来应用 schema 变更');
  console.log('注意: 旧的枚举列将在 schema 同步后被移除');
}

main()
  .catch((e) => {
    console.error('迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
