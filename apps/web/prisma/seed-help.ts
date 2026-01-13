/**
 * 填充帮助文章示例数据
 * 
 * 运行: npx tsx prisma/seed-help.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充帮助文章数据...\n');

  // 创建帮助分类
  const categories = await Promise.all([
    prisma.helpCategory.upsert({
      where: { slug: 'getting-started' },
      update: {},
      create: {
        name: '快速入门',
        slug: 'getting-started',
        description: '新手指南，帮助您快速了解 SOURCE 平台',
        icon: 'book',
        order: 1,
      },
    }),
    prisma.helpCategory.upsert({
      where: { slug: 'colors' },
      update: {},
      create: {
        name: '色彩管理',
        slug: 'colors',
        description: '色彩库、色彩身份证、色彩数据相关问题',
        icon: 'palette',
        order: 2,
      },
    }),
    prisma.helpCategory.upsert({
      where: { slug: 'color-books' },
      update: {},
      create: {
        name: '色彩簿',
        slug: 'color-books',
        description: '色彩簿的创建、管理和使用',
        icon: 'book-open',
        order: 3,
      },
    }),
    prisma.helpCategory.upsert({
      where: { slug: 'account' },
      update: {},
      create: {
        name: '账户与安全',
        slug: 'account',
        description: '账户设置、密码、安全相关问题',
        icon: 'shield',
        order: 4,
      },
    }),
    prisma.helpCategory.upsert({
      where: { slug: 'collab' },
      update: {},
      create: {
        name: 'ColLab 创作',
        slug: 'collab',
        description: 'ColLab 内容创作与分享相关问题',
        icon: 'pen',
        order: 5,
      },
    }),
  ]);

  console.log(`✅ 创建了 ${categories.length} 个帮助分类\n`);

  // 创建帮助文章
  const articlesData = [
    // 快速入门
    {
      articleId: 'HELP-001',
      categoryId: categories[0].id,
      title: '什么是 SOURCE？',
      slug: 'what-is-source',
      summary: '了解 SOURCE 平台的核心功能和使用场景',
      content: `# 什么是 SOURCE？

SOURCE 是一个专业的色彩管理平台，致力于连接数字设计与实体印刷，让每一个色彩都可追溯、可复现。

## 核心功能

### 1. 色彩身份证
每个色号都拥有专属页面，包含：
- 真源 Lab 数据
- 不同纸张上的表现
- 油墨配方参考
- 印刷参数建议

### 2. 色彩簿
按类别整理的色彩合集，方便快速查找和应用。您可以浏览官方色彩簿，也可以创建自己的收藏。

### 3. 工程分析
上传设计文件，自动解析用色、识别印刷风险、获取材料推荐。

### 4. ColLab 社区
分享色彩作品、教程和灵感，与其他设计师交流。

## 适用人群

- **设计师**：获取准确的印刷色彩参考
- **印刷厂**：标准化色彩管理流程
- **品牌方**：确保品牌色彩的一致性

## 开始使用

1. 注册账户并完成邮箱验证
2. 浏览色彩库，了解色彩数据
3. 创建个人色彩簿收藏喜欢的色彩
4. 尝试工程分析功能`,
      status: 'PUBLISHED' as const,
      isPinned: true,
      publishedAt: new Date(),
      tags: ['入门', '介绍'],
    },
    {
      articleId: 'HELP-002',
      categoryId: categories[0].id,
      title: '如何注册账户？',
      slug: 'how-to-register',
      summary: '注册 SOURCE 账户的详细步骤',
      isPinned: true,
      content: `# 如何注册账户？

注册 SOURCE 账户非常简单，只需几个步骤。

## 注册步骤

### 1. 访问注册页面
点击网站右上角的「注册」按钮，或直接访问 /register 页面。

### 2. 填写信息
- **邮箱**：填写有效的邮箱地址，用于验证和找回密码
- **用户名**：3-20 个字符，支持中英文
- **密码**：至少 8 个字符，建议包含字母和数字

### 3. 验证邮箱
注册后系统会发送验证邮件到您的邮箱，点击邮件中的链接完成验证。

**注意**：如果没有收到邮件，请检查垃圾邮件文件夹。

### 4. 完善资料
登录后，您可以在「设置」中完善个人资料，包括头像、简介等。

## 常见问题

**Q: 可以用手机号注册吗？**
A: 目前仅支持邮箱注册。

**Q: 忘记密码怎么办？**
A: 点击登录页的「忘记密码」，通过邮箱重置密码。`,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      tags: ['注册', '账户'],
    },
    {
      articleId: 'HELP-003',
      categoryId: categories[0].id,
      title: '界面导航指南',
      slug: 'navigation-guide',
      summary: '了解 SOURCE 的主要功能区域和导航方式',
      content: `# 界面导航指南

本文帮助您快速熟悉 SOURCE 的界面布局。

## 顶部导航栏

- **色彩库**：浏览所有色彩数据
- **色彩簿**：查看和管理色彩簿
- **工程分析**：上传文件进行色彩分析
- **ColLab**：社区内容和创作

## 色彩库页面

### 筛选功能
- 按色系筛选（红、橙、黄、绿、蓝、紫等）
- 按状态筛选（已验证、待验证）
- 关键词搜索

### 视图模式
- **卡片视图**：显示色彩预览和基本信息
- **列表视图**：紧凑的表格形式

## 色彩详情页

每个色彩的详情页包含：
- Lab/RGB/CMYK 数据
- 纸张适配表
- 油墨配方（如有）
- 相关色彩推荐

## 个人中心

点击右上角头像进入：
- **我的色彩簿**：管理个人收藏
- **我的作品**：ColLab 发布的内容
- **设置**：账户和偏好设置`,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      tags: ['导航', '界面'],
    },

    // 色彩管理
    {
      articleId: 'HELP-004',
      categoryId: categories[1].id,
      title: '如何查看色彩详情？',
      slug: 'view-color-details',
      summary: '了解色彩身份证页面包含哪些信息',
      isPinned: true,
      content: `# 如何查看色彩详情？

每个色彩都有专属的「色彩身份证」页面，包含完整的色彩数据。

## 进入色彩详情

1. 在色彩库中点击任意色彩卡片
2. 或直接访问 /color/[色号] 页面

## 页面内容

### 基础数据
- **Lab 值**：L（明度）、a（红绿）、b（黄蓝）
- **RGB 值**：屏幕显示参考
- **CMYK 值**：印刷参考值
- **Hex 值**：网页设计使用

### 纸张表现
不同纸张上的色彩表现会有差异，我们提供：
- 铜版纸表现
- 胶版纸表现
- 特种纸表现
- 推荐纸张

### 油墨配方
部分色彩提供专色油墨配方参考，包括：
- 配方比例
- 推荐油墨品牌
- 调配注意事项

### 印刷参数
- 网点角度建议
- 叠印顺序
- 干燥时间参考`,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      tags: ['色彩', '详情'],
    },
    {
      articleId: 'HELP-005',
      categoryId: categories[1].id,
      title: 'Lab 色彩空间介绍',
      slug: 'lab-color-space',
      summary: '了解 Lab 色彩空间及其在印刷中的重要性',
      content: `# Lab 色彩空间介绍

Lab 是 SOURCE 采用的核心色彩空间，也是印刷行业的标准。

## 什么是 Lab？

Lab 色彩空间由三个分量组成：
- **L（Lightness）**：明度，0-100
- **a**：红绿轴，-128 到 +127
- **b**：黄蓝轴，-128 到 +127

## 为什么使用 Lab？

### 1. 设备无关
Lab 不依赖于显示器或打印机，描述的是人眼感知的颜色。

### 2. 感知均匀
Lab 空间中相同数值差异代表相同的视觉差异（ΔE）。

### 3. 印刷标准
ISO 12647 等印刷标准都基于 Lab 值定义色彩。

## Lab 与其他色彩空间

| 色彩空间 | 用途 | 特点 |
|---------|------|------|
| Lab | 测量标准 | 设备无关 |
| RGB | 屏幕显示 | 加色混合 |
| CMYK | 印刷输出 | 减色混合 |

## ΔE 色差

ΔE 表示两个颜色之间的差异：
- ΔE < 1：几乎无法察觉
- ΔE 1-2：仔细观察可见
- ΔE 2-3.5：一般可接受
- ΔE > 5：明显差异`,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      tags: ['Lab', '色彩空间', '技术'],
    },

    // 色彩簿
    {
      articleId: 'HELP-006',
      categoryId: categories[2].id,
      title: '如何创建色彩簿？',
      slug: 'create-color-book',
      summary: '创建个人色彩簿收藏喜欢的色彩',
      isPinned: true,
      content: `# 如何创建色彩簿？

色彩簿是整理和收藏色彩的好方法。

## 创建步骤

### 1. 进入色彩簿页面
点击顶部导航的「色彩簿」，然后点击「创建色彩簿」。

### 2. 填写信息
- **名称**：给色彩簿起个名字
- **描述**：简单介绍这个色彩簿的用途
- **公开/私密**：选择是否公开分享

### 3. 添加色彩
创建后，您可以通过以下方式添加色彩：
- 在色彩详情页点击「添加到色彩簿」
- 在色彩簿编辑页面搜索添加

## 管理色彩簿

### 编辑
点击色彩簿卡片上的编辑按钮，可以修改名称、描述等信息。

### 排序
在编辑模式下，拖动色彩卡片可以调整顺序。

### 删除
在设置中可以删除整个色彩簿，或单独移除某个色彩。

## 分享色彩簿

公开的色彩簿可以分享给其他用户，他们可以查看但不能编辑。`,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      tags: ['色彩簿', '收藏'],
    },

    // 账户与安全
    {
      articleId: 'HELP-007',
      categoryId: categories[3].id,
      title: '如何修改密码？',
      slug: 'change-password',
      summary: '修改账户密码的方法',
      isPinned: true,
      content: `# 如何修改密码？

定期修改密码有助于保护账户安全。

## 在设置中修改

1. 点击右上角头像，选择「设置」
2. 进入「安全」选项卡
3. 点击「修改密码」
4. 输入当前密码和新密码
5. 点击确认

## 忘记密码

如果忘记了当前密码：

1. 退出登录
2. 在登录页点击「忘记密码」
3. 输入注册邮箱
4. 查收重置邮件
5. 点击邮件中的链接设置新密码

## 密码要求

- 至少 8 个字符
- 建议包含大小写字母
- 建议包含数字
- 建议包含特殊字符

## 安全建议

- 不要使用与其他网站相同的密码
- 定期更换密码（建议每 3 个月）
- 不要将密码告诉他人`,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      tags: ['密码', '安全'],
    },
    {
      articleId: 'HELP-008',
      categoryId: categories[3].id,
      title: '如何修改个人资料？',
      slug: 'edit-profile',
      summary: '更新头像、昵称等个人信息',
      content: `# 如何修改个人资料？

您可以随时更新个人资料信息。

## 修改步骤

1. 点击右上角头像
2. 选择「设置」或「个人资料」
3. 修改需要更新的信息
4. 点击保存

## 可修改内容

### 基本信息
- **头像**：上传新头像，支持 JPG、PNG 格式
- **昵称**：显示名称，3-20 个字符
- **简介**：个人介绍，最多 200 字

### 联系信息
- **邮箱**：修改邮箱需要重新验证
- **手机**：可选填写

### 偏好设置
- **语言**：界面语言
- **主题**：浅色/深色模式
- **通知**：邮件通知偏好`,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      tags: ['资料', '设置'],
    },

    // ColLab
    {
      articleId: 'HELP-009',
      categoryId: categories[4].id,
      title: '什么是 ColLab？',
      slug: 'what-is-collab',
      summary: '了解 ColLab 社区功能',
      isPinned: true,
      content: `# 什么是 ColLab？

ColLab 是 SOURCE 的社区功能，让用户可以分享和发现色彩相关的内容。

## 内容类型

### 作品
分享您的设计作品，展示色彩应用案例。

### 教程
撰写色彩相关的教程，帮助其他用户学习。

### 灵感
分享色彩灵感和搭配建议。

## 功能特点

### 色彩关联
发布内容时可以关联 SOURCE 色彩库中的色彩，方便其他用户查看和使用。

### 互动
- 点赞：表达喜欢
- 评论：交流讨论
- 收藏：保存到个人收藏

### 发现
- 首页精选：编辑推荐的优质内容
- 热门：近期热度最高的内容
- 最新：按时间排序的新内容

## 创作指南

1. 内容需要与色彩相关
2. 原创或注明来源
3. 尊重他人，友善交流`,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      tags: ['ColLab', '社区'],
    },
  ];

  for (const article of articlesData) {
    await prisma.helpArticle.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        summary: article.summary,
        content: article.content,
        status: article.status,
        isPinned: article.isPinned || false,
        publishedAt: article.publishedAt,
        tags: article.tags,
      },
      create: article,
    });
  }

  console.log(`✅ 创建了 ${articlesData.length} 篇帮助文章\n`);

  // 创建法律文档
  const legalDocs = [
    {
      type: 'PRIVACY_POLICY' as const,
      title: '隐私政策',
      content: `# 隐私政策

最后更新日期：2026年1月13日

SOURCE（以下简称"我们"）非常重视用户的隐私保护。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。

## 1. 信息收集

### 1.1 您主动提供的信息
- 注册信息：邮箱、用户名、密码
- 个人资料：头像、简介
- 用户内容：上传的色彩数据、创作内容

### 1.2 自动收集的信息
- 设备信息：浏览器类型、操作系统
- 使用数据：访问页面、操作记录
- 日志信息：IP 地址、访问时间

## 2. 信息使用

我们使用收集的信息用于：
- 提供和维护服务
- 改进用户体验
- 发送服务通知
- 防止滥用和安全威胁

## 3. 信息共享

我们不会出售您的个人信息。仅在以下情况下共享：
- 获得您的明确同意
- 法律要求
- 保护我们的权利和安全

## 4. 数据安全

我们采取合理的技术和管理措施保护您的信息，包括：
- 数据加密传输
- 访问权限控制
- 定期安全审计

## 5. 您的权利

您有权：
- 访问您的个人信息
- 更正不准确的信息
- 删除您的账户和数据
- 导出您的数据

## 6. Cookie 使用

我们使用 Cookie 和类似技术来：
- 保持登录状态
- 记住偏好设置
- 分析使用情况

## 7. 联系我们

如有隐私相关问题，请联系：
- 邮箱：privacy@source-col.com`,
      version: '1.0',
      effectiveDate: new Date(),
      status: 'PUBLISHED' as const,
    },
    {
      type: 'TERMS_OF_SERVICE' as const,
      title: '服务条款',
      content: `# 服务条款

最后更新日期：2026年1月13日

欢迎使用 SOURCE！使用我们的服务即表示您同意以下条款。

## 1. 服务说明

SOURCE 是一个专业的色彩管理平台，提供：
- 色彩数据查询和管理
- 色彩簿创建和分享
- 工程文件分析
- 社区内容分享

## 2. 账户责任

### 2.1 账户注册
- 您需要提供真实、准确的信息
- 每人仅限注册一个账户
- 您需要妥善保管账户密码

### 2.2 账户行为
您对账户下的所有活动负责，包括：
- 发布的内容
- 与其他用户的互动
- 对服务的使用

## 3. 用户内容

### 3.1 内容所有权
您保留您创建内容的所有权，但授予我们展示和分发的许可。

### 3.2 内容规范
您同意不发布：
- 侵犯他人权利的内容
- 违法或有害内容
- 垃圾信息或广告
- 恶意软件或有害代码

## 4. 知识产权

- SOURCE 的商标、标识、界面设计等属于我们
- 色彩数据的使用需遵守相关授权
- 尊重第三方的知识产权

## 5. 服务变更

我们保留以下权利：
- 修改或终止服务功能
- 更新服务条款
- 调整定价策略

## 6. 免责声明

- 服务按"现状"提供
- 我们不保证服务不会中断
- 色彩数据仅供参考，实际印刷效果可能有差异

## 7. 责任限制

在法律允许的范围内，我们对间接损失不承担责任。

## 8. 争议解决

本条款受中华人民共和国法律管辖。争议应通过友好协商解决。

## 9. 联系方式

如有问题，请联系：
- 邮箱：legal@source-col.com`,
      version: '1.0',
      effectiveDate: new Date(),
      status: 'PUBLISHED' as const,
    },
  ];

  for (const doc of legalDocs) {
    await prisma.legalDocument.upsert({
      where: { type: doc.type },
      update: {
        title: doc.title,
        content: doc.content,
        version: doc.version,
        effectiveDate: doc.effectiveDate,
        status: doc.status,
      },
      create: doc,
    });
  }

  console.log(`✅ 创建了 ${legalDocs.length} 篇法律文档\n`);

  // 创建工单分类
  const ticketCategories = [
    {
      name: '账户问题',
      slug: 'account',
      description: '登录、注册、密码、账户安全等相关问题',
      order: 1,
      isActive: true,
    },
    {
      name: '功能咨询',
      slug: 'feature',
      description: '平台功能使用方法、操作指引等咨询',
      order: 2,
      isActive: true,
    },
    {
      name: '数据问题',
      slug: 'data',
      description: '色彩数据、色彩簿、导入导出等数据相关问题',
      order: 3,
      isActive: true,
    },
    {
      name: '技术支持',
      slug: 'technical',
      description: '系统错误、页面异常、兼容性等技术问题',
      order: 4,
      isActive: true,
    },
    {
      name: '建议反馈',
      slug: 'feedback',
      description: '功能建议、体验反馈、改进意见',
      order: 5,
      isActive: true,
    },
    {
      name: '商务合作',
      slug: 'business',
      description: '合作咨询、API 接入、企业服务等商务问题',
      order: 6,
      isActive: true,
    },
    {
      name: '其他',
      slug: 'other',
      description: '其他未分类的问题',
      order: 99,
      isActive: true,
    },
  ];

  for (const category of ticketCategories) {
    await prisma.ticketCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        order: category.order,
        isActive: category.isActive,
      },
      create: category,
    });
  }

  console.log(`✅ 创建了 ${ticketCategories.length} 个工单分类\n`);

  console.log('🎉 数据填充完成！');
}

main()
  .catch((e) => {
    console.error('❌ 填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
