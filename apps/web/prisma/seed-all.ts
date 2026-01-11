/**
 * 主数据种子脚本 - 按顺序执行所有 seed 脚本
 * 
 * 执行顺序：
 * 1. seed.ts - 基础数据（用户、合作者、批次、纸张字典）
 * 2. seed-materials.ts - 纸型和油墨选项
 * 3. seed-base-extended.ts - 扩展基础数据
 * 4. seed-colors-extended.ts - 扩展色彩数据
 * 5. seed-relations.ts - 生成关联数据
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

async function runSeedScript(scriptName: string) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 执行: ${scriptName}`);
    console.log('='.repeat(60));
    
    const scriptPath = path.join(__dirname, scriptName);
    
    try {
        execSync(`npx tsx ${scriptPath}`, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..'),
        });
        console.log(`✅ ${scriptName} 完成`);
    } catch (error) {
        console.error(`❌ ${scriptName} 失败:`, error);
        throw error;
    }
}

async function main() {
    console.log('🌱 SOURCE 数据播种开始');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();

    // 按顺序执行所有 seed 脚本
    const scripts = [
        'seed.ts',                  // 基础数据
        'seed-materials.ts',        // 材料数据
        'seed-base-extended.ts',    // 扩展基础数据
        'seed-colors-extended.ts',  // 扩展色彩数据
        'seed-relations.ts',        // 关联数据
    ];

    for (const script of scripts) {
        await runSeedScript(script);
    }

    // 打印最终统计
    const totalColors = await prisma.color.count();
    const totalPaperProfiles = await prisma.paperProfile.count();
    const totalRecipes = await prisma.recipe.count();
    const totalProofingPacks = await prisma.proofingPack.count();
    const totalParticipations = await prisma.colorParticipation.count();
    const totalPartners = await prisma.partner.count();
    const totalInks = await prisma.inkOption.count();
    const totalBatches = await prisma.batch.count();
    const totalColorBooks = await prisma.colorBook.count();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 所有数据播种完成！');
    console.log('='.repeat(60));
    console.log('\n📊 最终数据统计:');
    console.log(`   🎨 色彩:       ${totalColors} 条`);
    console.log(`   📄 纸张表现:   ${totalPaperProfiles} 条`);
    console.log(`   🧪 配方:       ${totalRecipes} 条`);
    console.log(`   📦 打样包:     ${totalProofingPacks} 条`);
    console.log(`   🤝 参与者:     ${totalParticipations} 条`);
    console.log(`   🏭 合作者:     ${totalPartners} 个`);
    console.log(`   🖌️ 油墨:       ${totalInks} 种`);
    console.log(`   📋 批次:       ${totalBatches} 个`);
    console.log(`   📚 色彩簿:     ${totalColorBooks} 本`);
    console.log(`\n⏱️ 总耗时: ${duration} 秒`);
    console.log('='.repeat(60));
}

main()
    .catch((e) => {
        console.error('❌ 播种失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
