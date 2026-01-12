/**
 * 扩展用户作品测试数据种子脚本
 * 
 * 创建多个测试用户，并为每个用户添加多个作品
 * 总作品数量 30+
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 测试用户数据
const testUsers = [
    { email: 'designer1@test.com', name: '张设计' },
    { email: 'designer2@test.com', name: '李艺术' },
    { email: 'designer3@test.com', name: '王创意' },
    { email: 'designer4@test.com', name: '陈印刷' },
    { email: 'designer5@test.com', name: '刘色彩' },
];

// 作品模板数据 - 多样化的设计作品
const worksTemplates = [
    // 品牌设计类
    {
        title: '咖啡品牌视觉系统',
        description: '为精品咖啡品牌打造的完整视觉识别系统，主色调采用深棕与奶白的经典搭配，辅以金色点缀提升品质感。',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        tags: ['品牌设计', '咖啡', 'VI设计'],
        category: 'brand',
    },
    {
        title: '护肤品牌包装设计',
        description: '高端护肤品牌的包装系统设计，采用柔和的粉色与香槟金配色，营造优雅精致的产品形象。',
        imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
        tags: ['包装设计', '护肤品', '高端品牌'],
        category: 'packaging',
    },
    {
        title: '茶叶品牌形象设计',
        description: '传统茶叶品牌的现代化改造，融合山水画意境与极简设计理念，呈现东方美学的当代表达。',
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
        tags: ['品牌设计', '茶叶', '东方美学'],
        category: 'brand',
    },
    // 海报设计类
    {
        title: '音乐节主视觉海报',
        description: '电子音乐节的主视觉设计，使用霓虹色彩与几何图形创造未来感十足的视觉冲击。',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        tags: ['海报设计', '音乐节', '霓虹风格'],
        category: 'poster',
    },
    {
        title: '艺术展览海报系列',
        description: '当代艺术展览的系列海报设计，以极简主义手法呈现艺术作品的精髓与展览主题。',
        imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
        tags: ['海报设计', '艺术展览', '极简主义'],
        category: 'poster',
    },
    {
        title: '电影海报设计',
        description: '独立电影的宣传海报，通过大胆的色彩对比和意象性构图传达影片的情感基调。',
        imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
        tags: ['海报设计', '电影', '独立电影'],
        category: 'poster',
    },
    // 包装设计类
    {
        title: '有机食品包装系列',
        description: '有机食品系列的包装设计，采用自然色调与手绘插画风格，传递健康天然的产品理念。',
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
        tags: ['包装设计', '有机食品', '手绘插画'],
        category: 'packaging',
    },
    {
        title: '精酿啤酒标签设计',
        description: '精酿啤酒品牌的系列标签设计，每款啤酒都有独特的色彩主题和插画风格，体现品牌的创意精神。',
        imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800',
        tags: ['包装设计', '啤酒', '插画'],
        category: 'packaging',
    },
    {
        title: '巧克力礼盒包装',
        description: '高端巧克力礼盒的包装设计，深紫色与金色的搭配营造奢华感，几何图案增添现代气息。',
        imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
        tags: ['包装设计', '巧克力', '礼盒'],
        category: 'packaging',
    },
    // 书籍装帧类
    {
        title: '诗集装帧设计',
        description: '现代诗歌集的装帧设计，以水墨渲染效果呈现诗意空间，留白处理强调文字的呼吸感。',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
        tags: ['书籍装帧', '诗集', '水墨风格'],
        category: 'book',
    },
    {
        title: '摄影集版面设计',
        description: '风景摄影集的整体设计，大幅留白与极简排版让影像成为绝对主角，印刷工艺精良。',
        imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
        tags: ['书籍装帧', '摄影集', '极简排版'],
        category: 'book',
    },
    {
        title: '儿童绘本设计',
        description: '原创儿童绘本的插画与装帧设计，明快的色彩和可爱的造型为孩子们创造梦幻阅读体验。',
        imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
        tags: ['书籍装帧', '儿童绘本', '插画'],
        category: 'book',
    },
    // 印刷品设计类
    {
        title: '企业年报设计',
        description: '上市公司年度报告的视觉设计，通过信息图表和色彩编码让枯燥的数据变得生动易读。',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        tags: ['印刷品', '年报设计', '信息图表'],
        category: 'print',
    },
    {
        title: '婚礼请柬设计',
        description: '定制婚礼请柬套件设计，珊瑚粉与象牙白的配色搭配烫金工艺，呈现浪漫优雅的婚礼氛围。',
        imageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800',
        tags: ['印刷品', '婚礼请柬', '烫金工艺'],
        category: 'print',
    },
    {
        title: '菜单设计',
        description: '高级餐厅的菜单设计，黑金配色彰显尊贵感，排版清晰优雅，纸张触感上佳。',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        tags: ['印刷品', '菜单设计', '餐饮'],
        category: 'print',
    },
    // 插画设计类
    {
        title: '商业插画系列',
        description: '科技公司官网的配图插画系列，扁平化风格结合渐变色彩，传达创新与活力。',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        tags: ['插画', '商业插画', '扁平风格'],
        category: 'illustration',
    },
    {
        title: '节日主题插画',
        description: '春节主题的系列插画创作，融合传统元素与现代审美，适用于品牌节日营销物料。',
        imageUrl: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=800',
        tags: ['插画', '春节', '节日营销'],
        category: 'illustration',
    },
    {
        title: '城市风景插画',
        description: '城市地标建筑的艺术插画系列，独特的色彩处理和线条风格展现城市魅力。',
        imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
        tags: ['插画', '城市风景', '建筑'],
        category: 'illustration',
    },
    // UI/UX 设计类
    {
        title: 'App界面设计',
        description: '健康管理App的界面设计，清新的绿色调传达健康理念，交互流畅，视觉舒适。',
        imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
        tags: ['UI设计', 'App', '健康管理'],
        category: 'ui',
    },
    {
        title: '电商平台界面',
        description: '时尚电商平台的移动端界面设计，简约大气的视觉风格提升用户购物体验。',
        imageUrl: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=800',
        tags: ['UI设计', '电商', '移动端'],
        category: 'ui',
    },
    // 更多作品...
    {
        title: '文创产品设计',
        description: '博物馆文创产品的设计开发，将传统文化元素转化为现代生活用品，兼具美观与实用。',
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800',
        tags: ['文创设计', '博物馆', '产品设计'],
        category: 'product',
    },
    {
        title: '名片设计系列',
        description: '创意名片设计合集，探索不同材质、工艺和形式的名片表现可能，展现个人或品牌特色。',
        imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800',
        tags: ['印刷品', '名片设计', '特种工艺'],
        category: 'print',
    },
    {
        title: '日历设计',
        description: '艺术插画日历的设计，每月一幅原创插画，色彩搭配考究，装饰性与实用性兼备。',
        imageUrl: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800',
        tags: ['印刷品', '日历', '插画'],
        category: 'print',
    },
    {
        title: '杂志版面设计',
        description: '时尚杂志的内页版面设计，大胆的排版实验与精准的色彩把控展现编辑设计功力。',
        imageUrl: 'https://images.unsplash.com/photo-1585241920473-b472eb9ffbae?w=800',
        tags: ['版面设计', '杂志', '编辑设计'],
        category: 'editorial',
    },
    {
        title: '唱片封面设计',
        description: '独立音乐人专辑的封面设计，抽象艺术风格与音乐氛围完美契合，引人遐想。',
        imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800',
        tags: ['封面设计', '唱片', '独立音乐'],
        category: 'cover',
    },
    {
        title: '活动主视觉设计',
        description: '科技峰会的主视觉设计，数字化元素与前卫色彩组合呈现科技感与未来感。',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        tags: ['活动设计', '科技峰会', '主视觉'],
        category: 'event',
    },
    {
        title: '品牌IP形象设计',
        description: '互联网品牌的吉祥物IP设计，可爱的形象与丰富的表情包延展助力品牌传播。',
        imageUrl: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800',
        tags: ['IP设计', '吉祥物', '品牌形象'],
        category: 'brand',
    },
    {
        title: '环保主题海报',
        description: '公益环保宣传海报设计，通过视觉隐喻和强烈的色彩对比唤起公众环保意识。',
        imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
        tags: ['海报设计', '环保', '公益'],
        category: 'poster',
    },
    {
        title: '香水包装设计',
        description: '奢侈品牌香水的包装设计，晶莹剔透的瓶身与渐变色彩营造梦幻氛围。',
        imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800',
        tags: ['包装设计', '香水', '奢侈品'],
        category: 'packaging',
    },
    {
        title: '数据可视化设计',
        description: '复杂数据的可视化呈现设计，通过色彩编码和图形语言让数据讲述故事。',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        tags: ['数据可视化', '信息设计', '图表'],
        category: 'data',
    },
    {
        title: '字体设计作品',
        description: '原创中文字体设计，融合书法韵味与现代审美，适用于标题与品牌字体定制。',
        imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
        tags: ['字体设计', '中文字体', '品牌字体'],
        category: 'typography',
    },
    {
        title: '产品摄影与后期',
        description: '商业产品摄影的色彩调整与后期处理，精准还原产品质感与品牌色彩。',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        tags: ['摄影后期', '产品摄影', '色彩校正'],
        category: 'photography',
    },
    {
        title: '动态视觉设计',
        description: '品牌动态视觉系统设计，包含Logo动画、转场效果等，为品牌注入活力。',
        imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
        tags: ['动态设计', '品牌动画', 'Motion'],
        category: 'motion',
    },
    {
        title: '织物图案设计',
        description: '服装面料的图案设计，几何与花卉元素的组合创造独特的织物纹理。',
        imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
        tags: ['图案设计', '织物', '服装'],
        category: 'pattern',
    },
];

async function main() {
    console.log('🚀 开始创建扩展作品数据...\n');

    // 1. 创建或获取测试用户
    console.log('📋 创建测试用户...');
    const users: Array<{ id: string; name: string | null; email: string }> = [];

    // 先获取 admin 用户
    const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@source.ink' },
    });
    if (adminUser) {
        users.push(adminUser);
        console.log(`  ✓ 找到管理员: ${adminUser.name || adminUser.email}`);
    }

    // 创建其他测试用户
    for (const userData of testUsers) {
        let user = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: userData.email,
                    name: userData.name,
                    emailVerified: new Date(),
                },
            });
            console.log(`  ✓ 创建用户: ${user.name}`);
        } else {
            console.log(`  ✓ 用户已存在: ${user.name}`);
        }
        users.push(user);
    }

    console.log(`\n👥 共 ${users.length} 个用户\n`);

    // 2. 获取颜色数据
    const colors = await prisma.color.findMany({
        take: 50,
        select: { id: true, colorId: true, name: true },
    });
    console.log(`🎨 找到 ${colors.length} 个颜色\n`);

    // 3. 获取色彩簿数据
    const colorBooks = await prisma.colorBook.findMany({
        take: 10,
        select: { id: true, name: true },
    });
    console.log(`📚 找到 ${colorBooks.length} 个色彩簿\n`);

    // 4. 为每个用户创建作品
    console.log('🖼️ 创建作品...\n');

    let totalCreated = 0;
    let workIndex = 0;

    for (const user of users) {
        // 每个用户分配 5-8 个作品
        const worksCount = 5 + Math.floor(Math.random() * 4);
        console.log(`  👤 ${user.name || user.email}:`);

        for (let i = 0; i < worksCount && workIndex < worksTemplates.length; i++) {
            const template = worksTemplates[workIndex];
            workIndex++;

            // 检查是否已存在
            const existing = await prisma.userWork.findFirst({
                where: {
                    userId: user.id,
                    title: template.title,
                },
            });

            if (existing) {
                console.log(`    ⏭️ "${template.title}" 已存在`);
                continue;
            }

            // 随机关联色彩簿 (30% 概率)
            const colorBook = Math.random() < 0.3 && colorBooks.length > 0
                ? colorBooks[Math.floor(Math.random() * colorBooks.length)]
                : null;

            // 随机选择颜色数量 (3-8个)
            const colorCount = 3 + Math.floor(Math.random() * 6);
            const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
            const selectedColors = shuffledColors.slice(0, Math.min(colorCount, colors.length));

            // 创建作品
            const work = await prisma.userWork.create({
                data: {
                    userId: user.id,
                    title: template.title,
                    description: template.description,
                    imageUrl: template.imageUrl,
                    colorBookId: colorBook?.id,
                    tags: template.tags,
                    isPublic: Math.random() > 0.15, // 85% 公开
                    viewCount: Math.floor(Math.random() * 500) + 10,
                    likeCount: Math.floor(Math.random() * 100),
                },
            });

            // 添加颜色关联
            for (let j = 0; j < selectedColors.length; j++) {
                await prisma.userWorkColor.create({
                    data: {
                        workId: work.id,
                        colorId: selectedColors[j].id,
                        order: j,
                    },
                });
            }

            console.log(`    ✅ "${template.title}" (${selectedColors.length}色${colorBook ? ', 关联色彩簿' : ''})`);
            totalCreated++;
        }
        console.log('');
    }

    // 如果还有剩余模板，继续为随机用户创建
    while (workIndex < worksTemplates.length) {
        const user = users[Math.floor(Math.random() * users.length)];
        const template = worksTemplates[workIndex];
        workIndex++;

        const existing = await prisma.userWork.findFirst({
            where: {
                userId: user.id,
                title: template.title,
            },
        });

        if (existing) continue;

        const colorCount = 3 + Math.floor(Math.random() * 6);
        const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
        const selectedColors = shuffledColors.slice(0, Math.min(colorCount, colors.length));

        const work = await prisma.userWork.create({
            data: {
                userId: user.id,
                title: template.title,
                description: template.description,
                imageUrl: template.imageUrl,
                tags: template.tags,
                isPublic: Math.random() > 0.15,
                viewCount: Math.floor(Math.random() * 500) + 10,
                likeCount: Math.floor(Math.random() * 100),
            },
        });

        for (let j = 0; j < selectedColors.length; j++) {
            await prisma.userWorkColor.create({
                data: {
                    workId: work.id,
                    colorId: selectedColors[j].id,
                    order: j,
                },
            });
        }

        console.log(`  ✅ [${user.name}] "${template.title}"`);
        totalCreated++;
    }

    // 5. 统计
    const totalWorks = await prisma.userWork.count();
    const publicWorks = await prisma.userWork.count({ where: { isPublic: true } });

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 完成！`);
    console.log(`   本次创建: ${totalCreated} 个作品`);
    console.log(`   作品总数: ${totalWorks} 个`);
    console.log(`   公开作品: ${publicWorks} 个`);
    console.log('='.repeat(50));
}

main()
    .catch((e) => {
        console.error('❌ 错误:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
