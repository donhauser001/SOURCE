/**
 * 为用户添加色彩簿测试数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userEmail = 'admin@source.ink';

    // 查找用户
    const user = await prisma.user.findUnique({
        where: { email: userEmail },
    });

    if (!user) {
        console.log(`用户 ${userEmail} 不存在`);
        return;
    }

    console.log(`找到用户: ${user.id} (${user.email})`);

    // 获取或创建分类
    let category = await prisma.colorBookCategoryOption.findFirst({
        where: { name: '用户收藏' },
    });

    if (!category) {
        category = await prisma.colorBookCategoryOption.create({
            data: {
                name: '用户收藏',
                order: 999,
                isDefault: true,
            },
        });
        console.log('创建分类: 用户收藏');
    }

    // 获取一些颜色用于添加到色彩簿
    const colors = await prisma.color.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: { id: true, colorId: true, name: true },
    });

    console.log(`找到 ${colors.length} 个颜色`);

    // 创建测试色彩簿
    const colorBooksData = [
        {
            name: '我的收藏',
            description: '收藏的喜欢的颜色',
            isPublic: false,
            colorCount: 5,
        },
        {
            name: '品牌色库',
            description: '公司品牌用色合集',
            isPublic: false,
            colorCount: 8,
        },
        {
            name: '印刷常用色',
            description: '日常印刷工作常用的颜色',
            isPublic: true,
            colorCount: 10,
        },
        {
            name: '2026春夏流行色',
            description: '预测的2026年春夏流行色彩',
            isPublic: true,
            colorCount: 6,
        },
        {
            name: '测试色板',
            description: '用于测试打样的颜色',
            isPublic: false,
            colorCount: 4,
        },
    ];

    let colorIndex = 0;

    for (const bookData of colorBooksData) {
        const timestamp = Date.now().toString(36) + Math.random().toString(36).substring(2, 4);
        const bookId = `U-${user.id.substring(0, 4)}-${timestamp}`.toUpperCase();
        const slug = `user-${user.id.substring(0, 8)}-${timestamp}`;

        // 检查是否已存在同名色彩簿
        const existing = await prisma.colorBook.findFirst({
            where: {
                ownerId: user.id,
                name: bookData.name,
            },
        });

        if (existing) {
            console.log(`色彩簿 "${bookData.name}" 已存在，跳过`);
            continue;
        }

        // 创建色彩簿
        const colorBook = await prisma.colorBook.create({
            data: {
                bookId,
                name: bookData.name,
                slug,
                description: bookData.description,
                ownerId: user.id,
                isPublic: bookData.isPublic,
                categoryId: category.id,
                status: 'ACTIVE',
                colorSystem: 'SOURCE',
            },
        });

        console.log(`创建色彩簿: ${colorBook.name} (${colorBook.bookId})`);

        // 添加颜色到色彩簿
        const colorsToAdd = colors.slice(colorIndex, colorIndex + bookData.colorCount);
        colorIndex = (colorIndex + bookData.colorCount) % colors.length;

        for (let i = 0; i < colorsToAdd.length; i++) {
            const color = colorsToAdd[i];
            try {
                await prisma.colorBookEntry.create({
                    data: {
                        colorBookId: colorBook.id,
                        colorId: color.id,
                        order: i + 1,
                    },
                });
            } catch {
                // 忽略重复
            }
        }

        // 更新色彩簿的 totalColors
        const count = await prisma.colorBookEntry.count({
            where: { colorBookId: colorBook.id },
        });
        await prisma.colorBook.update({
            where: { id: colorBook.id },
            data: { totalColors: count },
        });

        console.log(`  - 添加了 ${count} 个颜色`);
    }

    console.log('\n完成！');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
