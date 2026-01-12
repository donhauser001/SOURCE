/**
 * ContentCategory 内容分类种子脚本
 *
 * 为 ColLab 内容系统添加三级分类数据
 * 并更新现有内容与分类的关联
 */

import { PrismaClient, ContentType } from '@prisma/client';

const prisma = new PrismaClient();

// 分类数据结构
interface CategoryData {
    name: string;
    slug: string;
    description: string;
    icon?: string;
    contentTypes: ContentType[];
    children?: CategoryData[];
}

// 三级分类数据
const categoriesData: CategoryData[] = [
    {
        name: '品牌设计',
        slug: 'brand-design',
        description: '品牌视觉识别、VI 系统、品牌升级相关内容',
        icon: 'Sparkles',
        contentTypes: ['WORK', 'TUTORIAL', 'ARTICLE'],
        children: [
            {
                name: '视觉识别',
                slug: 'visual-identity',
                description: 'Logo、标志、视觉系统设计',
                contentTypes: ['WORK', 'TUTORIAL'],
                children: [
                    {
                        name: 'Logo 设计',
                        slug: 'logo-design',
                        description: '标志、图形标识设计',
                        contentTypes: ['WORK', 'TUTORIAL'],
                    },
                    {
                        name: 'VI 系统',
                        slug: 'vi-system',
                        description: '企业视觉识别系统',
                        contentTypes: ['WORK', 'TUTORIAL'],
                    },
                    {
                        name: '色彩规范',
                        slug: 'color-spec',
                        description: '品牌色彩规范定义',
                        contentTypes: ['WORK', 'ARTICLE'],
                    },
                ],
            },
            {
                name: '品牌升级',
                slug: 'brand-upgrade',
                description: '品牌焕新、视觉升级案例',
                contentTypes: ['WORK', 'ARTICLE'],
                children: [
                    {
                        name: '品牌焕新',
                        slug: 'brand-refresh',
                        description: '品牌形象更新迭代',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '品牌延展',
                        slug: 'brand-extension',
                        description: '品牌视觉延展应用',
                        contentTypes: ['WORK'],
                    },
                ],
            },
            {
                name: '品牌策略',
                slug: 'brand-strategy',
                description: '品牌定位、策略分析',
                contentTypes: ['ARTICLE'],
                children: [
                    {
                        name: '品牌定位',
                        slug: 'brand-positioning',
                        description: '市场定位与差异化',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '案例分析',
                        slug: 'brand-case-study',
                        description: '知名品牌案例解析',
                        contentTypes: ['ARTICLE'],
                    },
                ],
            },
        ],
    },
    {
        name: '包装设计',
        slug: 'packaging-design',
        description: '产品包装、礼盒设计、包装工艺',
        icon: 'Package',
        contentTypes: ['WORK', 'TUTORIAL', 'ARTICLE'],
        children: [
            {
                name: '食品包装',
                slug: 'food-packaging',
                description: '食品、饮料、茶叶等包装设计',
                contentTypes: ['WORK'],
                children: [
                    {
                        name: '茶饮包装',
                        slug: 'tea-packaging',
                        description: '茶叶、茶饮料包装',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '零食包装',
                        slug: 'snack-packaging',
                        description: '休闲食品包装设计',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '饮品包装',
                        slug: 'beverage-packaging',
                        description: '饮料、果汁包装',
                        contentTypes: ['WORK'],
                    },
                ],
            },
            {
                name: '礼盒设计',
                slug: 'gift-box',
                description: '节日礼盒、高端礼品包装',
                contentTypes: ['WORK'],
                children: [
                    {
                        name: '节日礼盒',
                        slug: 'holiday-gift-box',
                        description: '中秋、春节等节日礼盒',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '伴手礼',
                        slug: 'souvenir-box',
                        description: '婚礼伴手礼、活动礼盒',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '奢侈品包装',
                        slug: 'luxury-packaging',
                        description: '高端产品定制包装',
                        contentTypes: ['WORK'],
                    },
                ],
            },
            {
                name: '包装工艺',
                slug: 'packaging-craft',
                description: '烫金、压纹、UV 等特殊工艺',
                contentTypes: ['TUTORIAL', 'ARTICLE'],
                children: [
                    {
                        name: '烫金工艺',
                        slug: 'hot-stamping',
                        description: '烫金、烫银、镭射烫',
                        contentTypes: ['TUTORIAL'],
                    },
                    {
                        name: '压纹工艺',
                        slug: 'embossing',
                        description: '击凸、压纹、浮雕效果',
                        contentTypes: ['TUTORIAL'],
                    },
                    {
                        name: '特种纸张',
                        slug: 'specialty-paper',
                        description: '艺术纸、特种纸应用',
                        contentTypes: ['TUTORIAL', 'ARTICLE'],
                    },
                ],
            },
        ],
    },
    {
        name: '印刷技术',
        slug: 'printing-tech',
        description: '印刷工艺、色彩管理、印刷知识',
        icon: 'Printer',
        contentTypes: ['TUTORIAL', 'ARTICLE'],
        children: [
            {
                name: '专色印刷',
                slug: 'spot-color',
                description: 'Pantone 专色、特殊油墨印刷',
                contentTypes: ['TUTORIAL', 'ARTICLE'],
                children: [
                    {
                        name: 'Pantone 系统',
                        slug: 'pantone-system',
                        description: 'Pantone 色彩匹配系统',
                        contentTypes: ['TUTORIAL', 'ARTICLE'],
                    },
                    {
                        name: '金属油墨',
                        slug: 'metallic-ink',
                        description: '金银墨、珠光墨应用',
                        contentTypes: ['TUTORIAL'],
                    },
                    {
                        name: '荧光油墨',
                        slug: 'fluorescent-ink',
                        description: '荧光、夜光油墨',
                        contentTypes: ['TUTORIAL'],
                    },
                ],
            },
            {
                name: '色彩管理',
                slug: 'color-management',
                description: 'ICC 配置、色彩校准、软打样',
                contentTypes: ['TUTORIAL', 'ARTICLE'],
                children: [
                    {
                        name: 'ICC 配置',
                        slug: 'icc-profile',
                        description: 'ICC 配置文件应用',
                        contentTypes: ['TUTORIAL'],
                    },
                    {
                        name: '软打样',
                        slug: 'soft-proofing',
                        description: '屏幕软打样技术',
                        contentTypes: ['TUTORIAL'],
                    },
                    {
                        name: '色彩校准',
                        slug: 'color-calibration',
                        description: '设备色彩校准',
                        contentTypes: ['TUTORIAL', 'ARTICLE'],
                    },
                ],
            },
            {
                name: '印刷工艺',
                slug: 'printing-process',
                description: '各种印刷工艺对比',
                contentTypes: ['TUTORIAL', 'ARTICLE'],
                children: [
                    {
                        name: '胶印',
                        slug: 'offset-printing',
                        description: '传统胶版印刷',
                        contentTypes: ['TUTORIAL', 'ARTICLE'],
                    },
                    {
                        name: '数字印刷',
                        slug: 'digital-printing',
                        description: '数码印刷技术',
                        contentTypes: ['TUTORIAL', 'ARTICLE'],
                    },
                    {
                        name: '丝网印刷',
                        slug: 'screen-printing',
                        description: '丝印工艺应用',
                        contentTypes: ['TUTORIAL'],
                    },
                ],
            },
        ],
    },
    {
        name: '书籍装帧',
        slug: 'book-design',
        description: '书籍封面、内页排版、装帧工艺',
        icon: 'BookOpen',
        contentTypes: ['WORK', 'TUTORIAL'],
        children: [
            {
                name: '封面设计',
                slug: 'cover-design',
                description: '书籍封面、精装本设计',
                contentTypes: ['WORK'],
                children: [
                    {
                        name: '平装封面',
                        slug: 'paperback-cover',
                        description: '平装书封面设计',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '精装封面',
                        slug: 'hardcover-design',
                        description: '精装书封面设计',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '书脊设计',
                        slug: 'spine-design',
                        description: '书脊视觉设计',
                        contentTypes: ['WORK'],
                    },
                ],
            },
            {
                name: '排版设计',
                slug: 'typography',
                description: '内页排版、字体应用',
                contentTypes: ['WORK', 'TUTORIAL'],
                children: [
                    {
                        name: '版式设计',
                        slug: 'layout-design',
                        description: '页面版式规划',
                        contentTypes: ['WORK', 'TUTORIAL'],
                    },
                    {
                        name: '字体应用',
                        slug: 'font-application',
                        description: '字体选择与搭配',
                        contentTypes: ['TUTORIAL'],
                    },
                    {
                        name: '网格系统',
                        slug: 'grid-system',
                        description: '排版网格应用',
                        contentTypes: ['TUTORIAL'],
                    },
                ],
            },
            {
                name: '装帧工艺',
                slug: 'binding-craft',
                description: '装订方式与工艺',
                contentTypes: ['TUTORIAL'],
                children: [
                    {
                        name: '胶装',
                        slug: 'perfect-binding',
                        description: '无线胶装工艺',
                        contentTypes: ['TUTORIAL'],
                    },
                    {
                        name: '锁线装',
                        slug: 'sewn-binding',
                        description: '锁线精装工艺',
                        contentTypes: ['TUTORIAL'],
                    },
                    {
                        name: '特殊装帧',
                        slug: 'special-binding',
                        description: '创意装帧方式',
                        contentTypes: ['TUTORIAL'],
                    },
                ],
            },
        ],
    },
    {
        name: '插画艺术',
        slug: 'illustration',
        description: '商业插画、艺术创作、绘本设计',
        icon: 'Palette',
        contentTypes: ['WORK', 'TUTORIAL'],
        children: [
            {
                name: '商业插画',
                slug: 'commercial-illustration',
                description: '广告、品牌、产品插画',
                contentTypes: ['WORK'],
                children: [
                    {
                        name: '广告插画',
                        slug: 'advertising-illustration',
                        description: '广告宣传插画',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '产品插画',
                        slug: 'product-illustration',
                        description: '产品配图插画',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '海报插画',
                        slug: 'poster-illustration',
                        description: '海报视觉插画',
                        contentTypes: ['WORK'],
                    },
                ],
            },
            {
                name: '绘本插画',
                slug: 'picture-book',
                description: '儿童绘本、故事插画',
                contentTypes: ['WORK'],
                children: [
                    {
                        name: '儿童绘本',
                        slug: 'children-book',
                        description: '幼儿、儿童绘本',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '故事插画',
                        slug: 'story-illustration',
                        description: '叙事性插画',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '科普插画',
                        slug: 'educational-illustration',
                        description: '科普教育插画',
                        contentTypes: ['WORK'],
                    },
                ],
            },
            {
                name: '数字艺术',
                slug: 'digital-art',
                description: '数字绘画、概念艺术',
                contentTypes: ['WORK', 'TUTORIAL'],
                children: [
                    {
                        name: '概念艺术',
                        slug: 'concept-art',
                        description: '概念设计、原画',
                        contentTypes: ['WORK'],
                    },
                    {
                        name: '3D 渲染',
                        slug: '3d-rendering',
                        description: '三维渲染艺术',
                        contentTypes: ['WORK', 'TUTORIAL'],
                    },
                    {
                        name: 'AI 艺术',
                        slug: 'ai-art',
                        description: 'AI 辅助艺术创作',
                        contentTypes: ['WORK', 'TUTORIAL'],
                    },
                ],
            },
        ],
    },
    {
        name: '色彩研究',
        slug: 'color-research',
        description: '色彩理论、色彩趋势、色彩心理学',
        icon: 'Droplet',
        contentTypes: ['ARTICLE', 'TUTORIAL'],
        children: [
            {
                name: '传统色彩',
                slug: 'traditional-colors',
                description: '中国传统色、日本传统色研究',
                contentTypes: ['ARTICLE', 'TUTORIAL'],
                children: [
                    {
                        name: '中国传统色',
                        slug: 'chinese-colors',
                        description: '中国古典色彩体系',
                        contentTypes: ['ARTICLE', 'TUTORIAL'],
                    },
                    {
                        name: '日本传统色',
                        slug: 'japanese-colors',
                        description: '和色、日本色彩美学',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '敦煌色彩',
                        slug: 'dunhuang-colors',
                        description: '敦煌壁画色彩研究',
                        contentTypes: ['ARTICLE'],
                    },
                ],
            },
            {
                name: '色彩趋势',
                slug: 'color-trends',
                description: '年度色彩、流行趋势分析',
                contentTypes: ['ARTICLE'],
                children: [
                    {
                        name: '年度流行色',
                        slug: 'color-of-year',
                        description: 'Pantone 年度色解读',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '季节色彩',
                        slug: 'seasonal-colors',
                        description: '季节性色彩趋势',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '行业趋势',
                        slug: 'industry-color-trends',
                        description: '各行业色彩趋势',
                        contentTypes: ['ARTICLE'],
                    },
                ],
            },
            {
                name: '色彩心理',
                slug: 'color-psychology',
                description: '色彩心理学、色彩情感',
                contentTypes: ['ARTICLE', 'TUTORIAL'],
                children: [
                    {
                        name: '色彩情感',
                        slug: 'color-emotion',
                        description: '色彩的情感表达',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '消费心理',
                        slug: 'consumer-psychology',
                        description: '色彩与购买决策',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '文化差异',
                        slug: 'cultural-differences',
                        description: '色彩的文化含义',
                        contentTypes: ['ARTICLE'],
                    },
                ],
            },
        ],
    },
    {
        name: '行业观察',
        slug: 'industry-insights',
        description: '行业动态、技术趋势、标准规范',
        icon: 'TrendingUp',
        contentTypes: ['ARTICLE'],
        children: [
            {
                name: '技术动态',
                slug: 'tech-news',
                description: '印刷技术、设备更新',
                contentTypes: ['ARTICLE'],
                children: [
                    {
                        name: '设备更新',
                        slug: 'equipment-updates',
                        description: '印刷设备新技术',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '材料创新',
                        slug: 'material-innovation',
                        description: '新材料、新工艺',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '软件工具',
                        slug: 'software-tools',
                        description: '设计软件动态',
                        contentTypes: ['ARTICLE'],
                    },
                ],
            },
            {
                name: '标准规范',
                slug: 'standards',
                description: '行业标准、认证体系',
                contentTypes: ['ARTICLE'],
                children: [
                    {
                        name: 'ISO 标准',
                        slug: 'iso-standards',
                        description: '国际印刷标准',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '认证体系',
                        slug: 'certifications',
                        description: 'G7、Fogra 等认证',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '国内标准',
                        slug: 'domestic-standards',
                        description: '国家印刷标准',
                        contentTypes: ['ARTICLE'],
                    },
                ],
            },
            {
                name: '可持续发展',
                slug: 'sustainability',
                description: '环保材料、绿色印刷',
                contentTypes: ['ARTICLE'],
                children: [
                    {
                        name: '环保油墨',
                        slug: 'eco-ink',
                        description: '大豆墨、水性墨',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '再生材料',
                        slug: 'recycled-materials',
                        description: '再生纸、环保材料',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '碳中和',
                        slug: 'carbon-neutral',
                        description: '印刷业碳中和',
                        contentTypes: ['ARTICLE'],
                    },
                ],
            },
        ],
    },
    {
        name: 'UI/UX 设计',
        slug: 'ui-ux-design',
        description: '界面设计、用户体验、交互设计',
        icon: 'Layout',
        contentTypes: ['WORK', 'TUTORIAL', 'ARTICLE'],
        children: [
            {
                name: '界面设计',
                slug: 'ui-design',
                description: 'App、网页界面设计',
                contentTypes: ['WORK', 'TUTORIAL'],
                children: [
                    {
                        name: 'App 设计',
                        slug: 'app-design',
                        description: '移动应用界面',
                        contentTypes: ['WORK', 'TUTORIAL'],
                    },
                    {
                        name: '网页设计',
                        slug: 'web-design',
                        description: '网站界面设计',
                        contentTypes: ['WORK', 'TUTORIAL'],
                    },
                    {
                        name: '后台设计',
                        slug: 'dashboard-design',
                        description: '管理后台界面',
                        contentTypes: ['WORK'],
                    },
                ],
            },
            {
                name: '设计系统',
                slug: 'design-system',
                description: '组件库、设计规范',
                contentTypes: ['TUTORIAL', 'ARTICLE'],
                children: [
                    {
                        name: '组件库',
                        slug: 'component-library',
                        description: 'UI 组件设计',
                        contentTypes: ['TUTORIAL'],
                    },
                    {
                        name: '设计规范',
                        slug: 'design-guidelines',
                        description: '设计规范文档',
                        contentTypes: ['ARTICLE'],
                    },
                    {
                        name: '设计 Token',
                        slug: 'design-tokens',
                        description: '设计变量管理',
                        contentTypes: ['TUTORIAL', 'ARTICLE'],
                    },
                ],
            },
            {
                name: '交互设计',
                slug: 'interaction-design',
                description: '交互模式、动效设计',
                contentTypes: ['WORK', 'TUTORIAL'],
                children: [
                    {
                        name: '微交互',
                        slug: 'micro-interactions',
                        description: '细节交互设计',
                        contentTypes: ['WORK', 'TUTORIAL'],
                    },
                    {
                        name: '动效设计',
                        slug: 'motion-design',
                        description: '界面动画设计',
                        contentTypes: ['WORK', 'TUTORIAL'],
                    },
                    {
                        name: '原型设计',
                        slug: 'prototyping',
                        description: '交互原型制作',
                        contentTypes: ['TUTORIAL'],
                    },
                ],
            },
        ],
    },
];

// 内容与分类的映射规则（基于标签和标题关键词）
const contentCategoryMapping: { keywords: string[]; categorySlug: string }[] = [
    { keywords: ['品牌', 'VI', '视觉', '升级'], categorySlug: 'brand-design' },
    { keywords: ['包装', '礼盒', '月饼'], categorySlug: 'packaging-design' },
    { keywords: ['食品', '茶饮', '饮料'], categorySlug: 'tea-packaging' },
    { keywords: ['专色', 'Pantone', '油墨'], categorySlug: 'pantone-system' },
    { keywords: ['CMYK', 'ICC', '色彩管理', '软打样'], categorySlug: 'color-management' },
    { keywords: ['数字印刷', '数码'], categorySlug: 'digital-printing' },
    { keywords: ['胶印'], categorySlug: 'offset-printing' },
    { keywords: ['书籍', '装帧', '封面'], categorySlug: 'book-design' },
    { keywords: ['排版', '字体'], categorySlug: 'typography' },
    { keywords: ['插画', '绘本', '儿童'], categorySlug: 'children-book' },
    { keywords: ['数字艺术', '抽象'], categorySlug: 'digital-art' },
    { keywords: ['传统色', '中国色', '国风', '节气'], categorySlug: 'chinese-colors' },
    { keywords: ['趋势', '年度色', 'Pantone'], categorySlug: 'color-of-year' },
    { keywords: ['心理学', '消费心理'], categorySlug: 'consumer-psychology' },
    { keywords: ['行业', '标准', '规范'], categorySlug: 'iso-standards' },
    { keywords: ['环保', '可持续', '绿色'], categorySlug: 'eco-ink' },
    { keywords: ['UI', 'UX', '界面', '用户体验'], categorySlug: 'ui-design' },
    { keywords: ['海报', '艺术'], categorySlug: 'poster-illustration' },
    { keywords: ['婚礼', '请柬'], categorySlug: 'souvenir-box' },
    { keywords: ['咖啡'], categorySlug: 'brand-refresh' },
    { keywords: ['印刷'], categorySlug: 'printing-tech' },
];

async function createCategories(
    categories: CategoryData[],
    parentId: string | null = null,
    level: number = 0
): Promise<void> {
    for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];

        // 检查是否已存在
        const existing = await prisma.contentCategory.findUnique({
            where: { slug: cat.slug },
        });

        let categoryId: string;

        if (existing) {
            // 更新现有分类
            await prisma.contentCategory.update({
                where: { slug: cat.slug },
                data: {
                    name: cat.name,
                    description: cat.description,
                    icon: cat.icon || null,
                    parentId,
                    level,
                    order: i,
                    contentTypes: cat.contentTypes,
                },
            });
            console.log(`  ${'  '.repeat(level)}↻ ${cat.name} (已更新)`);
            categoryId = existing.id;
        } else {
            const created = await prisma.contentCategory.create({
                data: {
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    icon: cat.icon || null,
                    parentId,
                    level,
                    order: i,
                    contentTypes: cat.contentTypes,
                    isActive: true,
                },
            });
            categoryId = created.id;
            console.log(`  ${'  '.repeat(level)}✓ ${cat.name} (${cat.slug})`);
        }

        // 递归创建子分类
        if (cat.children && cat.children.length > 0) {
            await createCategories(cat.children, categoryId, level + 1);
        }
    }
}

async function updateContentCategories(): Promise<void> {
    console.log('\n更新内容分类关联...');

    // 获取所有分类
    const categories = await prisma.contentCategory.findMany({
        select: { id: true, slug: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

    // 获取所有内容
    const contents = await prisma.content.findMany({
        select: {
            id: true,
            title: true,
            tags: true,
            categoryId: true,
        },
    });

    let updatedCount = 0;

    for (const content of contents) {
        // 根据标题和标签匹配分类
        const searchText = `${content.title} ${content.tags.join(' ')}`.toLowerCase();

        let matchedCategorySlug: string | null = null;
        let maxMatchScore = 0;

        for (const mapping of contentCategoryMapping) {
            const matchScore = mapping.keywords.filter((kw) =>
                searchText.includes(kw.toLowerCase())
            ).length;

            if (matchScore > maxMatchScore) {
                maxMatchScore = matchScore;
                matchedCategorySlug = mapping.categorySlug;
            }
        }

        if (matchedCategorySlug && categoryMap.has(matchedCategorySlug)) {
            const newCategoryId = categoryMap.get(matchedCategorySlug);
            if (content.categoryId !== newCategoryId) {
                await prisma.content.update({
                    where: { id: content.id },
                    data: { categoryId: newCategoryId },
                });
                console.log(`  ✓ "${content.title}" → ${matchedCategorySlug}`);
                updatedCount++;
            }
        }
    }

    console.log(`\n更新了 ${updatedCount} 条内容的分类`);
}

async function main() {
    console.log('='.repeat(60));
    console.log('ContentCategory 三级内容分类种子脚本');
    console.log('='.repeat(60));

    // 创建分类
    console.log('\n创建/更新分类...');
    await createCategories(categoriesData);

    // 更新内容关联
    await updateContentCategories();

    // 统计
    console.log('\n' + '='.repeat(60));
    console.log('完成！');
    console.log('='.repeat(60));

    const stats = await prisma.contentCategory.groupBy({
        by: ['level'],
        _count: true,
    });

    console.log('\n分类统计:');
    stats.forEach((s) => {
        console.log(`  Level ${s.level}: ${s._count} 个`);
    });

    const total = await prisma.contentCategory.count();
    console.log(`  总计: ${total} 个`);

    const contentStats = await prisma.content.aggregate({
        _count: { categoryId: true },
    });
    console.log(`\n已关联分类的内容: ${contentStats._count.categoryId} 条`);
}

main()
    .catch((e) => {
        console.error('错误:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
