/**
 * 根据 Lab 值自动计算并更新色系
 * 
 * 色系判断基于色相角 (Hue angle) 和明度/饱和度：
 * - 色相角 = atan2(b, a) * 180 / π
 * - 彩度 C = sqrt(a² + b²)
 * - 中性色：C < 10 时为黑白灰
 */

import { PrismaClient, ColorFamily } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 根据 Lab 值计算色系
 */
function calculateColorFamily(labL: number, labA: number, labB: number): ColorFamily {
    // 计算彩度 (Chroma)
    const chroma = Math.sqrt(labA * labA + labB * labB);
    
    // 低彩度 = 中性色（黑白灰）
    if (chroma < 10) {
        return 'NEUTRAL';
    }
    
    // 计算色相角 (Hue angle)，范围 0-360
    let hue = Math.atan2(labB, labA) * (180 / Math.PI);
    if (hue < 0) hue += 360;
    
    // 棕色判断：色相在红-橙-黄范围，但明度较低且彩度中等
    if (labL < 55 && chroma < 50 && (hue >= 0 && hue < 70 || hue >= 330)) {
        return 'BROWN';
    }
    
    // 粉色判断：色相在红-品红范围，但明度较高且彩度中低
    if (labL > 60 && chroma < 45 && (hue >= 320 || hue < 20) && labA > 10) {
        return 'PINK';
    }
    
    // 按色相角分类
    if (hue >= 0 && hue < 25) {
        return 'RED';
    } else if (hue >= 25 && hue < 55) {
        return 'ORANGE';
    } else if (hue >= 55 && hue < 95) {
        return 'YELLOW';
    } else if (hue >= 95 && hue < 165) {
        return 'GREEN';
    } else if (hue >= 165 && hue < 200) {
        return 'CYAN';
    } else if (hue >= 200 && hue < 270) {
        return 'BLUE';
    } else if (hue >= 270 && hue < 330) {
        return 'PURPLE';
    } else {
        // 330-360 为红色
        return 'RED';
    }
}

async function main() {
    console.log('🎨 开始更新色系...\n');
    
    const colors = await prisma.color.findMany({
        select: {
            id: true,
            colorId: true,
            name: true,
            labL: true,
            labA: true,
            labB: true,
            colorFamily: true,
        },
    });
    
    console.log(`找到 ${colors.length} 个颜色\n`);
    
    const stats: Record<ColorFamily, number> = {
        RED: 0,
        ORANGE: 0,
        YELLOW: 0,
        GREEN: 0,
        CYAN: 0,
        BLUE: 0,
        PURPLE: 0,
        PINK: 0,
        BROWN: 0,
        NEUTRAL: 0,
    };
    
    for (const color of colors) {
        const family = calculateColorFamily(color.labL, color.labA, color.labB);
        stats[family]++;
        
        await prisma.color.update({
            where: { id: color.id },
            data: { colorFamily: family },
        });
        
        console.log(`  ${color.colorId} ${color.name}: ${family}`);
    }
    
    console.log('\n📊 色系统计:');
    Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .forEach(([family, count]) => {
            if (count > 0) {
                console.log(`  ${family}: ${count}`);
            }
        });
    
    console.log('\n✅ 色系更新完成!');
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
