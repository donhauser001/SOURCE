/**
 * Content 测试数据种子脚本
 *
 * 为 ColLab 内容系统添加 30 条测试内容
 * 包含作品、教程、文章三种类型
 */

import { PrismaClient, ContentType, ContentStatus, FeaturedLevel } from '@prisma/client';

const prisma = new PrismaClient();

// 测试用封面图 (Unsplash)
const coverImages = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800',
    'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
    'https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?w=800',
];

// 作品数据
const worksData = [
    {
        title: '春日品牌视觉设计',
        summary: '为某茶饮品牌设计的春季限定视觉系统，使用传统色彩营造春日氛围。',
        body: '为某茶饮品牌设计的春季限定视觉系统，使用了中国传统色彩中的草绿和粉色系，营造清新淡雅的春日氛围。\n\n整体设计注重色彩的和谐统一，同时保持品牌的辨识度。主色调选用嫩绿色（#90EE90），辅以淡粉色（#FFB6C1）作为点缀，形成清新活力的视觉效果。',
        tags: ['品牌设计', '茶饮', '春季限定'],
        colorCount: 4,
    },
    {
        title: '印刷品色彩测试报告',
        summary: '针对特种纸张的色彩还原测试，使用 SOURCE 色彩体系进行标准化测量。',
        body: '针对特种纸张的色彩还原测试，使用 SOURCE 色彩体系进行标准化测量和记录。\n\n本报告详细记录了不同油墨配方在艺术纸上的表现效果，包括：\n- CMYK 四色印刷\n- 专色印刷\n- 混合印刷\n\n测试结果显示，特种纸张对色彩的吸收率和呈现效果有显著差异。',
        tags: ['印刷测试', '色彩还原', '特种纸'],
        colorCount: 6,
    },
    {
        title: '国风包装设计',
        summary: '月饼礼盒包装设计，采用传统中国色彩搭配现代简约的版式设计。',
        body: '月饼礼盒包装设计，采用传统中国色彩搭配现代简约的版式设计。\n\n色彩选用朱红、金黄、墨绿等经典配色，呈现端庄大气的节日氛围。工艺方面采用烫金、压纹等特殊工艺，提升档次感。',
        tags: ['包装设计', '国风', '月饼礼盒'],
        colorCount: 5,
    },
    {
        title: '企业画册色彩规范',
        summary: '为某科技企业设计的画册色彩规范手册。',
        body: '为某科技企业设计的画册色彩规范手册，定义了主色、辅助色、点缀色的使用规则，确保品牌在各种印刷物料中的色彩一致性。\n\n规范内容包括：\n1. 色彩体系定义\n2. 色彩搭配规则\n3. 禁用色彩组合\n4. 印刷色彩还原标准',
        tags: ['企业画册', '色彩规范', 'VI设计'],
        colorCount: 3,
    },
    {
        title: '艺术海报系列 - 春分',
        summary: '以中国传统二十四节气为灵感的艺术海报系列。',
        body: '以中国传统二十四节气为灵感的艺术海报系列，每幅作品都选用与节气相对应的传统色彩。\n\n这是"春分"主题的设计稿，主要使用了：\n- 草绿色：象征春天的生机\n- 淡黄色：代表温暖的阳光\n- 粉色：点缀春花的绚烂',
        tags: ['海报设计', '二十四节气', '艺术'],
        colorCount: 4,
    },
    {
        title: '书籍装帧设计',
        summary: '《宋词三百首》精装版书籍装帧设计。',
        body: '《宋词三百首》精装版书籍装帧设计，封面采用雅致的青灰色调，烫金工艺呈现诗词意境。\n\n内页配色延续淡雅风格，注重阅读体验。选用米白色特种纸，印刷采用低饱和度配色，营造古典韵味。',
        tags: ['书籍装帧', '古典文学', '烫金工艺'],
        colorCount: 3,
    },
    {
        title: '咖啡品牌视觉升级',
        summary: '独立咖啡馆品牌视觉升级项目，融合复古与现代元素。',
        body: '独立咖啡馆品牌视觉升级项目，融合复古与现代元素。\n\n色彩方案以深棕色为主调，搭配奶油白和墨绿色，营造温暖舒适的空间感。标志设计采用简约线条，辅以手写字体增添温度。',
        tags: ['品牌升级', '咖啡', '视觉设计'],
        colorCount: 4,
    },
    {
        title: '数字艺术作品集',
        summary: '抽象数字艺术作品集，探索色彩与形式的关系。',
        body: '抽象数字艺术作品集，探索色彩与形式的关系。\n\n作品灵感来源于自然界的色彩变化，通过数字手段进行抽象化处理。每幅作品都附有色彩提取和调色参考。',
        tags: ['数字艺术', '抽象', '色彩实验'],
        colorCount: 6,
    },
    {
        title: '婚礼请柬设计',
        summary: '高端定制婚礼请柬设计，采用莫兰迪色系。',
        body: '高端定制婚礼请柬设计，采用莫兰迪色系打造低调奢华的视觉效果。\n\n工艺采用：\n- 凸版印刷\n- 烫金工艺\n- 手工裁切\n- 丝带封口\n\n整体呈现高雅精致的婚礼氛围。',
        tags: ['婚礼请柬', '莫兰迪', '高端定制'],
        colorCount: 3,
    },
    {
        title: '儿童绘本插画',
        summary: '原创儿童绘本插画，色彩明快活泼。',
        body: '原创儿童绘本插画，色彩明快活泼，适合 3-6 岁儿童阅读。\n\n色彩选用高饱和度的主色调，搭配柔和的背景色，既能吸引儿童注意，又不会造成视觉疲劳。插画风格温馨可爱，传递正能量的故事内容。',
        tags: ['绘本插画', '儿童', '原创'],
        colorCount: 5,
    },
];

// 教程数据
const tutorialsData = [
    {
        title: '专色印刷入门指南',
        summary: '从零开始学习专色印刷，掌握 Pantone 色彩匹配系统。',
        body: `# 专色印刷入门指南

专色印刷是商业印刷中重要的工艺之一，本教程将带你从零开始了解专色印刷的核心知识。

## 什么是专色印刷？

专色印刷（Spot Color Printing）是指使用预先调配好的特定颜色油墨进行印刷，而非通过 CMYK 四色叠印产生颜色。

## Pantone 色彩匹配系统

Pantone 是全球最通用的色彩标准系统，包含上千种标准色彩...

## 专色与四色印刷的区别

| 特性 | 专色印刷 | 四色印刷 |
|------|---------|---------|
| 色彩准确度 | 高 | 中等 |
| 成本 | 较高 | 较低 |
| 色彩范围 | 特定色彩 | 广泛 |

## 实战案例

以下是一个品牌色彩的专色印刷案例...`,
        tags: ['专色印刷', 'Pantone', '印刷入门'],
        colorCount: 3,
    },
    {
        title: 'CMYK 色彩管理最佳实践',
        summary: '深入了解 CMYK 色彩管理，提升印刷品质量。',
        body: `# CMYK 色彩管理最佳实践

色彩管理是确保设计稿到印刷品色彩一致性的关键环节。

## 色彩配置文件（ICC Profile）

ICC 配置文件定义了设备的色彩特性，是色彩管理的基础...

## 软打样（Soft Proofing）

在 Photoshop 或 InDesign 中启用软打样功能，可以预览印刷效果...

## 常见问题与解决方案

### 色彩偏差

原因：未使用正确的 ICC 配置文件
解决：根据印刷厂提供的配置文件进行转换

### 色彩溢出

原因：设计稿中包含超出 CMYK 色域的颜色
解决：使用"转换为配置文件"功能进行色域映射`,
        tags: ['CMYK', '色彩管理', 'ICC'],
        colorCount: 4,
    },
    {
        title: '中国传统色彩在现代设计中的应用',
        summary: '探索如何将传统色彩融入现代设计语言。',
        body: `# 中国传统色彩在现代设计中的应用

中国传统色彩蕴含深厚的文化内涵，本教程探讨如何在现代设计中巧妙运用这些色彩。

## 传统色彩体系概述

中国传统色彩命名优美，如：
- 天青色：雨过天青云破处
- 黛色：远山如黛
- 胭脂：春染梅花色

## 色彩搭配原则

### 1. 主次分明
传统配色讲究主次，通常一个主色配两三个辅色...

### 2. 对比与调和
利用色相、明度、纯度的对比创造视觉层次...

## 案例分析

### 故宫文创产品
分析故宫博物院文创产品的色彩运用...`,
        tags: ['传统色彩', '现代设计', '色彩搭配'],
        colorCount: 5,
    },
    {
        title: '数字印刷与胶印的色彩差异',
        summary: '对比两种印刷工艺的色彩表现特点。',
        body: `# 数字印刷与胶印的色彩差异

了解不同印刷工艺的色彩特性，有助于选择合适的印刷方案。

## 胶印（Offset Printing）

传统胶印使用油性油墨，色彩浓郁，适合大批量印刷...

## 数字印刷（Digital Printing）

数字印刷无需制版，适合小批量、个性化印刷...

## 色彩对比

| 指标 | 胶印 | 数字印刷 |
|-----|------|---------|
| 色彩饱和度 | 高 | 中等 |
| 色彩一致性 | 优秀 | 良好 |
| 专色支持 | 完善 | 有限 |

## 选择建议

根据项目需求选择合适的印刷工艺...`,
        tags: ['数字印刷', '胶印', '印刷工艺'],
        colorCount: 2,
    },
    {
        title: '色彩心理学在品牌设计中的应用',
        summary: '了解色彩如何影响消费者心理和品牌感知。',
        body: `# 色彩心理学在品牌设计中的应用

色彩是品牌与消费者沟通的重要语言，不同色彩会引发不同的心理反应。

## 色彩的心理效应

### 红色
- 情感联想：热情、能量、紧迫
- 适用场景：促销、餐饮、运动品牌

### 蓝色
- 情感联想：信任、专业、冷静
- 适用场景：科技、金融、医疗

### 绿色
- 情感联想：自然、健康、成长
- 适用场景：环保、有机、健康产品

## 行业色彩偏好

不同行业有其约定俗成的色彩倾向...

## 突破常规的案例

一些品牌通过非常规的色彩选择脱颖而出...`,
        tags: ['色彩心理学', '品牌设计', '消费心理'],
        colorCount: 4,
    },
];

// 文章数据
const articlesData = [
    {
        title: 'SOURCE 色彩体系 2026 年度更新',
        summary: '介绍 SOURCE 色彩体系的最新版本更新内容。',
        body: `# SOURCE 色彩体系 2026 年度更新

我们很高兴地宣布 SOURCE 色彩体系 2026 年度更新正式发布！

## 主要更新内容

### 新增色彩系列
本次更新新增了 200+ 中国传统色彩，涵盖：
- 宋代美学色彩系列
- 敦煌壁画色彩系列
- 明清瓷器色彩系列

### 色彩数据精度提升
所有色彩的 Lab 值均经过重新测量校准，精度提升至小数点后两位。

### 印刷配方优化
针对常用纸张类型，优化了专色印刷配方...

## 迁移指南

从旧版本迁移到新版本的步骤...`,
        tags: ['版本更新', 'SOURCE', '色彩体系'],
    },
    {
        title: '印刷行业色彩标准化的现状与未来',
        summary: '探讨印刷行业色彩标准化的发展趋势。',
        body: `# 印刷行业色彩标准化的现状与未来

色彩标准化是印刷行业长期追求的目标，本文将分析当前的发展状况和未来趋势。

## 现状分析

### 国际标准
- ISO 12647 系列标准
- G7 认证体系
- Fogra 认证

### 国内标准
- GB/T 印刷标准
- 行业自律规范

## 面临的挑战

1. 设备差异
2. 材料多样性
3. 环境因素

## 未来展望

### 数字化色彩管理
基于云端的色彩管理系统将成为主流...

### AI 辅助色彩匹配
人工智能技术将大幅提升色彩匹配效率...`,
        tags: ['行业观察', '标准化', '色彩管理'],
    },
    {
        title: '从 Pantone 年度色看色彩趋势',
        summary: '解读 Pantone 年度代表色背后的社会文化含义。',
        body: `# 从 Pantone 年度色看色彩趋势

每年 Pantone 发布的年度代表色都会引起设计界的广泛关注。

## 历年回顾

### 2024: Peach Fuzz
柔和的桃色，传递温暖与关怀...

### 2023: Viva Magenta
活力洋红，庆祝生命的力量...

## 年度色的选定过程

Pantone 色彩研究所如何选定年度代表色...

## 对设计行业的影响

年度色如何影响产品设计、时尚、家居等领域...

## 预测未来趋势

基于社会文化变迁预测未来色彩趋势...`,
        tags: ['Pantone', '色彩趋势', '行业观察'],
    },
    {
        title: '环保油墨的发展与应用',
        summary: '介绍环保油墨技术的最新进展。',
        body: `# 环保油墨的发展与应用

随着环保意识的提升，环保油墨在印刷行业的应用越来越广泛。

## 环保油墨类型

### 大豆油墨
以大豆油为主要载体，可再生、可降解...

### 水性油墨
以水为溶剂，VOC 排放极低...

### UV 油墨
紫外线固化，零 VOC 排放...

## 色彩表现对比

环保油墨与传统油墨的色彩表现对比...

## 成本分析

环保油墨的成本构成和经济性分析...

## 未来发展

环保油墨技术的发展趋势...`,
        tags: ['环保油墨', '可持续发展', '印刷技术'],
    },
    {
        title: '色彩在用户界面设计中的作用',
        summary: '探讨色彩如何提升数字产品的用户体验。',
        body: `# 色彩在用户界面设计中的作用

色彩是 UI 设计中最直观的视觉元素，合理运用色彩能显著提升用户体验。

## 色彩的功能性作用

### 信息层级
通过色彩区分信息的重要程度...

### 状态反馈
用色彩传达成功、警告、错误等状态...

### 引导视线
利用色彩对比引导用户注意力...

## 无障碍设计

### 色彩对比度
WCAG 2.1 标准要求...

### 色盲友好设计
为色觉障碍用户提供替代方案...

## 暗黑模式的色彩适配

暗黑模式下的色彩调整原则...`,
        tags: ['UI设计', '用户体验', '色彩设计'],
    },
];

async function main() {
    console.log('='.repeat(60));
    console.log('Content 测试数据种子脚本');
    console.log('='.repeat(60));

    // 查找或创建测试用户
    let user = await prisma.user.findFirst({
        where: { email: 'admin@source.ink' },
    });

    if (!user) {
        user = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
        });
    }

    if (!user) {
        console.error('未找到管理员用户，请先创建用户。');
        return;
    }

    console.log(`使用用户: ${user.id} (${user.email})`);

    // 获取分类
    const categories = await prisma.contentCategory.findMany({
        where: { isActive: true },
        take: 10,
    });
    console.log(`找到 ${categories.length} 个分类`);

    // 获取颜色
    const colors = await prisma.color.findMany({
        where: { status: 'ACTIVE' },
        take: 50,
        select: { id: true },
    });
    console.log(`找到 ${colors.length} 个颜色`);

    // 获取色彩簿
    const colorBooks = await prisma.colorBook.findMany({
        where: { isPublic: true },
        take: 10,
        select: { id: true, name: true },
    });
    console.log(`找到 ${colorBooks.length} 个色彩簿`);

    let sequence = 1;
    let createdCount = 0;

    // 获取当前最大序号
    const existingContent = await prisma.content.findFirst({
        where: { contentId: { startsWith: 'CL-' } },
        orderBy: { contentId: 'desc' },
    });
    if (existingContent?.contentId) {
        const match = existingContent.contentId.match(/CL-[WTA]-(\d+)/);
        if (match) {
            sequence = parseInt(match[1], 10) + 1;
        }
    }

    // 状态和推荐等级分布
    const statusDistribution: ContentStatus[] = [
        'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED',
        'PUBLISHED', 'PUBLISHED', 'PENDING', 'DRAFT', 'DRAFT',
    ];
    const featuredDistribution: FeaturedLevel[] = [
        'HOMEPAGE', 'EDITOR_PICK', 'EDITOR_PICK', 'NONE', 'NONE',
        'NONE', 'NONE', 'NONE', 'NONE', 'NONE',
    ];

    // 创建作品 (10 条)
    console.log('\n创建作品...');
    for (let i = 0; i < worksData.length; i++) {
        const work = worksData[i];
        const contentId = `CL-W-${String(sequence).padStart(4, '0')}`;
        const status = statusDistribution[i % statusDistribution.length];
        const featuredLevel = status === 'PUBLISHED'
            ? featuredDistribution[i % featuredDistribution.length]
            : 'NONE';

        // 检查是否已存在
        const existing = await prisma.content.findFirst({
            where: { title: work.title, authorId: user.id },
        });
        if (existing) {
            console.log(`  跳过: ${work.title} (已存在)`);
            continue;
        }

        const content = await prisma.content.create({
            data: {
                contentId,
                contentType: ContentType.WORK,
                title: work.title,
                summary: work.summary,
                body: work.body,
                coverImageUrl: coverImages[i % coverImages.length],
                galleryImages: [],
                status,
                featuredLevel,
                authorId: user.id,
                categoryId: categories.length > 0 ? categories[i % categories.length]?.id : null,
                tags: work.tags,
                colorBookId: colorBooks.length > 0 && i % 3 === 0 ? colorBooks[i % colorBooks.length]?.id : null,
                viewCount: Math.floor(Math.random() * 500) + 50,
                likeCount: Math.floor(Math.random() * 100) + 10,
                publishedAt: status === 'PUBLISHED' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
            },
        });

        // 添加颜色关联
        if (colors.length > 0 && work.colorCount > 0) {
            const shuffled = [...colors].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, work.colorCount);
            await prisma.contentColor.createMany({
                data: selected.map((c, idx) => ({
                    contentId: content.id,
                    colorId: c.id,
                    order: idx,
                })),
            });
        }

        console.log(`  ✓ ${contentId}: ${work.title} [${status}${featuredLevel !== 'NONE' ? ` ${featuredLevel}` : ''}]`);
        sequence++;
        createdCount++;
    }

    // 创建教程 (10 条，每个教程创建两个变体)
    console.log('\n创建教程...');
    for (let i = 0; i < tutorialsData.length; i++) {
        const tutorial = tutorialsData[i];
        const contentId = `CL-T-${String(sequence).padStart(4, '0')}`;
        const status = statusDistribution[i % statusDistribution.length];
        const featuredLevel = status === 'PUBLISHED'
            ? featuredDistribution[i % featuredDistribution.length]
            : 'NONE';

        const existing = await prisma.content.findFirst({
            where: { title: tutorial.title, authorId: user.id },
        });
        if (existing) {
            console.log(`  跳过: ${tutorial.title} (已存在)`);
            continue;
        }

        const content = await prisma.content.create({
            data: {
                contentId,
                contentType: ContentType.TUTORIAL,
                title: tutorial.title,
                summary: tutorial.summary,
                body: tutorial.body,
                coverImageUrl: coverImages[(i + 3) % coverImages.length],
                galleryImages: [],
                status,
                featuredLevel,
                authorId: user.id,
                categoryId: categories.length > 0 ? categories[(i + 2) % categories.length]?.id : null,
                tags: tutorial.tags,
                viewCount: Math.floor(Math.random() * 1000) + 100,
                likeCount: Math.floor(Math.random() * 200) + 20,
                publishedAt: status === 'PUBLISHED' ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) : null,
            },
        });

        // 添加颜色关联
        if (colors.length > 0 && tutorial.colorCount > 0) {
            const shuffled = [...colors].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, tutorial.colorCount);
            await prisma.contentColor.createMany({
                data: selected.map((c, idx) => ({
                    contentId: content.id,
                    colorId: c.id,
                    order: idx,
                })),
            });
        }

        console.log(`  ✓ ${contentId}: ${tutorial.title} [${status}${featuredLevel !== 'NONE' ? ` ${featuredLevel}` : ''}]`);
        sequence++;
        createdCount++;
    }

    // 创建文章 (10 条，补足至 30 条)
    console.log('\n创建文章...');
    for (let i = 0; i < articlesData.length; i++) {
        const article = articlesData[i];
        const contentId = `CL-A-${String(sequence).padStart(4, '0')}`;
        const status = statusDistribution[i % statusDistribution.length];
        const featuredLevel = status === 'PUBLISHED'
            ? featuredDistribution[i % featuredDistribution.length]
            : 'NONE';

        const existing = await prisma.content.findFirst({
            where: { title: article.title, authorId: user.id },
        });
        if (existing) {
            console.log(`  跳过: ${article.title} (已存在)`);
            continue;
        }

        await prisma.content.create({
            data: {
                contentId,
                contentType: ContentType.ARTICLE,
                title: article.title,
                summary: article.summary,
                body: article.body,
                coverImageUrl: coverImages[(i + 5) % coverImages.length],
                galleryImages: [],
                status,
                featuredLevel,
                authorId: user.id,
                categoryId: categories.length > 0 ? categories[(i + 4) % categories.length]?.id : null,
                tags: article.tags,
                viewCount: Math.floor(Math.random() * 800) + 80,
                likeCount: Math.floor(Math.random() * 150) + 15,
                publishedAt: status === 'PUBLISHED' ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : null,
            },
        });

        console.log(`  ✓ ${contentId}: ${article.title} [${status}${featuredLevel !== 'NONE' ? ` ${featuredLevel}` : ''}]`);
        sequence++;
        createdCount++;
    }

    // 补足剩余内容（复制变体）
    const remainingCount = 30 - createdCount;
    if (remainingCount > 0) {
        console.log(`\n创建补充内容 (${remainingCount} 条)...`);
        const allData = [...worksData, ...tutorialsData, ...articlesData];
        const types: ContentType[] = ['WORK', 'TUTORIAL', 'ARTICLE'];
        const typePrefixes = { WORK: 'W', TUTORIAL: 'T', ARTICLE: 'A' };

        for (let i = 0; i < remainingCount; i++) {
            const baseData = allData[i % allData.length];
            const type = types[i % 3];
            const contentId = `CL-${typePrefixes[type]}-${String(sequence).padStart(4, '0')}`;
            const title = `${baseData.title} (续)`;
            const status = statusDistribution[i % statusDistribution.length];
            const featuredLevel = status === 'PUBLISHED'
                ? featuredDistribution[(i + 3) % featuredDistribution.length]
                : 'NONE';

            const existing = await prisma.content.findFirst({
                where: { title, authorId: user.id },
            });
            if (existing) continue;

            await prisma.content.create({
                data: {
                    contentId,
                    contentType: type,
                    title,
                    summary: baseData.summary,
                    body: baseData.body + '\n\n---\n\n*续篇内容，敬请期待...*',
                    coverImageUrl: coverImages[(i + 7) % coverImages.length],
                    galleryImages: [],
                    status,
                    featuredLevel,
                    authorId: user.id,
                    tags: baseData.tags,
                    viewCount: Math.floor(Math.random() * 300) + 30,
                    likeCount: Math.floor(Math.random() * 50) + 5,
                    publishedAt: status === 'PUBLISHED' ? new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000) : null,
                },
            });

            console.log(`  ✓ ${contentId}: ${title} [${status}]`);
            sequence++;
            createdCount++;
        }
    }

    // 统计
    console.log('\n' + '='.repeat(60));
    console.log('完成！');
    console.log('='.repeat(60));

    const stats = await prisma.content.groupBy({
        by: ['contentType', 'status'],
        _count: true,
    });

    console.log('\n内容统计:');
    stats.forEach((s) => {
        console.log(`  ${s.contentType} - ${s.status}: ${s._count}`);
    });

    const featuredStats = await prisma.content.groupBy({
        by: ['featuredLevel'],
        where: { status: 'PUBLISHED' },
        _count: true,
    });

    console.log('\n推荐等级统计 (已发布):');
    featuredStats.forEach((s) => {
        console.log(`  ${s.featuredLevel}: ${s._count}`);
    });
}

main()
    .catch((e) => {
        console.error('错误:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
