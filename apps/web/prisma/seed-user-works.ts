/**
 * 用户作品测试数据种子脚本
 * 
 * 为 admin@source.ink 用户添加一些测试作品
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@source.ink';
    
    // 查找用户
    const user = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!user) {
        console.error(`用户 ${adminEmail} 不存在，请先创建该用户。`);
        return;
    }
    console.log(`找到用户: ${user.id} (${user.email})`);

    // 获取用户的色彩簿
    const colorBooks = await prisma.colorBook.findMany({
        where: { ownerId: user.id },
        take: 3,
    });
    console.log(`找到 ${colorBooks.length} 个色彩簿`);

    // 获取一些颜色
    const colors = await prisma.color.findMany({
        take: 30,
        select: { id: true, colorId: true, name: true },
    });
    console.log(`找到 ${colors.length} 个颜色`);

    // 测试作品数据
    const worksData = [
        {
            title: '春日品牌视觉设计',
            description: '为某茶饮品牌设计的春季限定视觉系统，使用了中国传统色彩中的草绿和粉色系，营造清新淡雅的春日氛围。整体设计注重色彩的和谐统一，同时保持品牌的辨识度。',
            imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            externalUrl: 'https://dribbble.com/shots/example1',
            tags: ['品牌设计', '茶饮', '春季限定'],
            isPublic: true,
            colorCount: 4,
        },
        {
            title: '印刷品色彩测试报告',
            description: '针对特种纸张的色彩还原测试，使用 SOURCE 色彩体系进行标准化测量和记录。本报告详细记录了不同油墨配方在艺术纸上的表现效果。',
            imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800',
            tags: ['印刷测试', '色彩还原', '特种纸'],
            isPublic: true,
            colorCount: 6,
        },
        {
            title: '国风包装设计',
            description: '月饼礼盒包装设计，采用传统中国色彩搭配现代简约的版式设计。色彩选用朱红、金黄、墨绿等经典配色，呈现端庄大气的节日氛围。',
            imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800',
            externalUrl: 'https://behance.net/gallery/example',
            tags: ['包装设计', '国风', '月饼礼盒'],
            isPublic: true,
            colorCount: 5,
        },
        {
            title: '企业画册色彩规范',
            description: '为某科技企业设计的画册色彩规范手册，定义了主色、辅助色、点缀色的使用规则，确保品牌在各种印刷物料中的色彩一致性。',
            imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800',
            tags: ['企业画册', '色彩规范', 'VI设计'],
            isPublic: false,
            colorCount: 3,
        },
        {
            title: '艺术海报系列 - 四季',
            description: '以中国传统二十四节气为灵感的艺术海报系列，每幅作品都选用与节气相对应的传统色彩。这是"春分"主题的设计稿。',
            imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800',
            externalUrl: 'https://www.pinterest.com/pin/example',
            tags: ['海报设计', '二十四节气', '艺术'],
            isPublic: true,
            colorCount: 4,
        },
        {
            title: '书籍装帧设计',
            description: '《宋词三百首》精装版书籍装帧设计，封面采用雅致的青灰色调，烫金工艺呈现诗词意境。内页配色延续淡雅风格，注重阅读体验。',
            imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
            tags: ['书籍装帧', '古典文学', '烫金工艺'],
            isPublic: true,
            colorCount: 3,
        },
    ];

    let createdCount = 0;

    for (const workData of worksData) {
        // 检查是否已存在
        const existing = await prisma.userWork.findFirst({
            where: {
                userId: user.id,
                title: workData.title,
            },
        });

        if (existing) {
            console.log(`作品 "${workData.title}" 已存在，跳过`);
            continue;
        }

        // 随机选择一个色彩簿（50% 概率关联）
        const colorBook = Math.random() > 0.5 && colorBooks.length > 0
            ? colorBooks[Math.floor(Math.random() * colorBooks.length)]
            : null;

        // 创建作品
        const work = await prisma.userWork.create({
            data: {
                userId: user.id,
                title: workData.title,
                description: workData.description,
                imageUrl: workData.imageUrl,
                colorBookId: colorBook?.id,
                externalUrl: workData.externalUrl,
                tags: workData.tags,
                isPublic: workData.isPublic,
                viewCount: Math.floor(Math.random() * 100),
                likeCount: Math.floor(Math.random() * 30),
            },
        });

        console.log(`创建作品: ${work.title}`);

        // 添加颜色关联
        if (colors.length > 0 && workData.colorCount > 0) {
            const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
            const selectedColors = shuffledColors.slice(0, Math.min(workData.colorCount, colors.length));

            for (let i = 0; i < selectedColors.length; i++) {
                await prisma.userWorkColor.create({
                    data: {
                        workId: work.id,
                        colorId: selectedColors[i].id,
                        order: i,
                    },
                });
            }
            console.log(`  - 关联了 ${selectedColors.length} 个颜色`);
        }

        if (colorBook) {
            console.log(`  - 关联色彩簿: ${colorBook.name}`);
        }

        createdCount++;
    }

    console.log(`\n完成！共创建 ${createdCount} 个测试作品`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
