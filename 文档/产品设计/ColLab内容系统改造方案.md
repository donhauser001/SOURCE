# ColLab 内容系统改造方案

> 版本：V1.1  
> 日期：2026-01-12  
> 作者：架构组  
> 状态：规划中

---

## 〇、需求概述

### 核心需求

1. **三种内容类型**：作品（Work）、教程（Tutorial）、文章（Article）
2. **发布流程**：所有用户可发表，默认草稿，需后台审核通过后发布
3. **推荐等级**：普通内容、编辑推荐、首页推荐
4. **多级分类**：可单独配置，支持层级结构

### 业务规则

| 内容类型 | 色彩/色彩簿关联 | 说明 |
|---------|----------------|------|
| **作品（WORK）** | **强制必须** | 作品必须关联至少一个色彩或色彩簿 |
| **教程（TUTORIAL）** | 可选 | 可以关联色彩或色彩簿，但非必需 |
| **文章（ARTICLE）** | 可选 | 可以关联色彩或色彩簿，但非必需 |

---

## 一、现状架构（文字版）

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ColLab 现有内容架构                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         数据层                                    │   │
│  │                                                                   │   │
│  │   UserWork (用户作品)                                            │   │
│  │   ├── id, userId, title, description                            │   │
│  │   ├── imageUrl, colorBookId, externalUrl                        │   │
│  │   ├── tags[], isPublic                                          │   │
│  │   ├── viewCount, likeCount                                      │   │
│  │   └── createdAt, updatedAt                                      │   │
│  │                                                                   │   │
│  │   UserWorkColor (作品-颜色关联)                                   │   │
│  │   └── workId, colorId, note, order                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         API 层                                    │   │
│  │                                                                   │   │
│  │   userWorksRouter                                                │   │
│  │   ├── works (列表) - 仅当前用户                                  │   │
│  │   ├── worksStats (统计)                                          │   │
│  │   ├── createWork (创建)                                          │   │
│  │   ├── updateWork (更新)                                          │   │
│  │   ├── deleteWork (删除)                                          │   │
│  │   └── getWork (详情)                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         页面层                                    │   │
│  │                                                                   │   │
│  │   /works                    公开作品展示页                        │   │
│  │   └── 首焦轮播 + 作品卡片列表 + 搜索/筛选                        │   │
│  │                                                                   │   │
│  │   /account/works            我的作品（待实现）                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  关键特点：                                                            │
│  • 仅支持"作品"一种内容类型                                           │
│  • 状态只有 isPublic (公开/私有)                                       │
│  • 无审核流程                                                          │
│  • 无推荐等级                                                          │
│  • 无分类体系（仅 tags 标签）                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、痛点与风险

### 2.1 功能痛点

| 痛点 | 描述 | 影响 |
|------|------|------|
| **单一内容类型** | 仅支持"作品"，无法承载教程、文章等内容形式 | 限制社区内容丰富度 |
| **无审核机制** | 用户直接发布/公开，缺乏内容质量把控 | 可能出现低质、违规内容 |
| **无推荐体系** | 所有内容平等展示，无法突出优质内容 | 难以引导用户发现好内容 |
| **扁平标签** | 仅支持 tags 数组，无层级分类 | 内容组织混乱，发现困难 |
| **首页展示单一** | 固定按浏览/点赞排序取 Top 3 | 无法运营推荐内容 |

### 2.2 技术风险

| 风险 | 说明 | 缓解措施 |
|------|------|---------|
| **数据迁移** | 现有 UserWork 需要迁移到新模型 | 设计兼容性迁移脚本 |
| **API 兼容** | 现有 router 接口需保持向后兼容 | 新增字段设默认值 |
| **权限复杂化** | 审核流程引入新的权限角色 | 复用现有 UserRole |
| **性能影响** | 多级分类关联查询 | 合理设计索引 |

---

## 三、目标架构原则

| 原则 | 说明 |
|------|------|
| **统一内容模型** | 将作品、教程、文章统一为 `Content` 模型，通过 `contentType` 区分 |
| **状态机驱动** | 内容生命周期通过状态机管理：草稿 → 待审核 → 已发布/已拒绝 |
| **分离推荐等级** | 内容状态与推荐等级解耦，允许已发布内容独立设置推荐级别 |
| **多级分类独立配置** | 分类体系独立于内容，支持后台动态配置 |
| **向后兼容** | 现有 UserWork API 保持兼容，新增 Content API |
| **审计可追溯** | 审核操作记录完整日志，支持回溯 |

---

## 四、模块边界与接口契约

### 4.1 目标架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       ColLab 目标内容架构                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         数据层                                    │   │
│  │                                                                   │   │
│  │   Content (统一内容表)                                            │   │
│  │   ├── id, contentId (唯一编号，如 "CL-W-0001")                   │   │
│  │   ├── contentType: WORK | TUTORIAL | ARTICLE                    │   │
│  │   ├── title, summary, body (Markdown/HTML)                      │   │
│  │   ├── coverImageUrl, galleryImages[]                            │   │
│  │   │                                                              │   │
│  │   ├── status: DRAFT | PENDING | PUBLISHED | REJECTED | ARCHIVED │   │
│  │   ├── featuredLevel: NONE | EDITOR_PICK | HOMEPAGE              │   │
│  │   │                                                              │   │
│  │   ├── authorId → User                                           │   │
│  │   ├── categoryId → ContentCategory                              │   │
│  │   ├── tags[]                                                    │   │
│  │   │                                                              │   │
│  │   ├── viewCount, likeCount, commentCount                        │   │
│  │   ├── publishedAt, reviewedAt, reviewedBy                       │   │
│  │   └── createdAt, updatedAt                                      │   │
│  │                                                                   │   │
│  │   ContentCategory (多级分类)                                      │   │
│  │   ├── id, name, slug                                            │   │
│  │   ├── parentId → ContentCategory (自引用)                       │   │
│  │   ├── contentTypes[] (适用的内容类型)                           │   │
│  │   ├── level, order, isActive                                    │   │
│  │   └── icon, description                                         │   │
│  │                                                                   │   │
│  │   ContentColor (内容-颜色关联)                                    │   │
│  │   └── contentId, colorId, note, order                           │   │
│  │                                                                   │   │
│  │   ContentReview (审核记录)                                        │   │
│  │   ├── contentId, reviewerId                                     │   │
│  │   ├── action: APPROVE | REJECT | REQUEST_CHANGE                 │   │
│  │   ├── reason, note                                              │   │
│  │   └── createdAt                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         API 层                                    │   │
│  │                                                                   │   │
│  │   contentRouter (新增)                                           │   │
│  │   ├── list (公开列表，支持按类型/分类/推荐等级筛选)              │   │
│  │   ├── get (详情)                                                 │   │
│  │   ├── search (全文搜索)                                          │   │
│  │   ├── featured (首页推荐内容)                                    │   │
│  │   │                                                              │   │
│  │   ├── create (创建，默认草稿)                                    │   │
│  │   ├── update (更新)                                              │   │
│  │   ├── delete (删除)                                              │   │
│  │   ├── submit (提交审核)                                          │   │
│  │   └── myContents (我的内容列表)                                  │   │
│  │                                                                   │   │
│  │   contentAdminRouter (后台管理)                                   │   │
│  │   ├── pendingList (待审核列表)                                   │   │
│  │   ├── review (审核：通过/拒绝/退回)                              │   │
│  │   ├── setFeatured (设置推荐等级)                                 │   │
│  │   ├── archive (归档)                                             │   │
│  │   └── stats (统计面板)                                           │   │
│  │                                                                   │   │
│  │   contentCategoryRouter (分类管理)                                │   │
│  │   ├── list (分类树)                                              │   │
│  │   ├── create / update / delete                                  │   │
│  │   └── reorder (调整顺序)                                         │   │
│  │                                                                   │   │
│  │   userWorksRouter (兼容层，逐步废弃)                              │   │
│  │   └── 内部转发到 contentRouter                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         页面层                                    │   │
│  │                                                                   │   │
│  │   顶部导航栏                                                      │   │
│  │   └── 右侧新增「发表」下拉按钮                                   │   │
│  │       ├── 发表作品 → /collab/create?type=work                   │   │
│  │       ├── 发布教程 → /collab/create?type=tutorial               │   │
│  │       └── 发表文章 → /collab/create?type=article                │   │
│  │                                                                   │   │
│  │   /collab                   ColLab 首页                          │   │
│  │   ├── 首页推荐内容轮播                                           │   │
│  │   ├── 编辑推荐精选                                               │   │
│  │   ├── 选项卡切换（所有推荐/推荐作品/推荐教程/推荐文章/所有内容） │   │
│  │   └── 内容类型筛选 + 分类筛选                                    │   │
│  │                                                                   │   │
│  │   /collab/works             作品列表                             │   │
│  │   /collab/tutorials         教程列表                             │   │
│  │   /collab/articles          文章列表                             │   │
│  │   /collab/category/[slug]   分类页面                             │   │
│  │                                                                   │   │
│  │   /collab/[id]              内容详情页                           │   │
│  │   /collab/create            创建内容（通过 ?type= 区分类型）     │   │
│  │   /collab/edit/[id]         编辑内容                             │   │
│  │                                                                   │   │
│  │   /account/contents         我的发表（原「我的作品」）           │   │
│  │                                                                   │   │
│  │   /admin/contents           后台内容管理                         │   │
│  │   /admin/content-categories 后台分类管理                         │   │
│  │   /admin/content-review     后台审核队列                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 核心数据模型设计

```prisma
// =============================================================================
// ColLab 内容系统
// =============================================================================

// 内容类型
enum ContentType {
  WORK          // 作品
  TUTORIAL      // 教程
  ARTICLE       // 文章
}

// 内容状态
enum ContentStatus {
  DRAFT         // 草稿（默认）
  PENDING       // 待审核
  PUBLISHED     // 已发布
  REJECTED      // 已拒绝
  ARCHIVED      // 已归档
}

// 推荐等级
enum FeaturedLevel {
  NONE          // 普通内容
  EDITOR_PICK   // 编辑推荐
  HOMEPAGE      // 首页推荐
}

// 统一内容表
model Content {
  id              String         @id @default(cuid())
  contentId       String         @unique  // 唯一编号，如 "CL-W-0001"
  
  // 内容类型
  contentType     ContentType
  
  // 基本信息
  title           String
  summary         String?        @db.Text  // 摘要
  body            String         @db.Text  // 正文（Markdown/HTML）
  
  // 媒体
  coverImageUrl   String                   // 封面图
  galleryImages   String[]                 // 图片集（作品/教程适用）
  externalUrl     String?                  // 外部链接
  
  // 状态与推荐
  status          ContentStatus  @default(DRAFT)
  featuredLevel   FeaturedLevel  @default(NONE)
  
  // 作者
  authorId        String
  author          User           @relation(fields: [authorId], references: [id])
  
  // 分类
  categoryId      String?
  category        ContentCategory? @relation(fields: [categoryId], references: [id])
  
  // 标签
  tags            String[]
  
  // 关联 - 颜色
  colors          ContentColor[]
  
  // 关联 - 色彩簿（作品适用）
  colorBookId     String?
  colorBook       ColorBook?     @relation(fields: [colorBookId], references: [id])
  
  // 统计
  viewCount       Int            @default(0)
  likeCount       Int            @default(0)
  commentCount    Int            @default(0)
  
  // 审核信息
  publishedAt     DateTime?               // 首次发布时间
  reviewedAt      DateTime?               // 最近审核时间
  reviewedBy      String?                 // 审核人
  rejectReason    String?                 // 拒绝原因
  
  // 审核记录
  reviews         ContentReview[]
  
  // 时间戳
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([contentId])
  @@index([contentType, status])
  @@index([status, featuredLevel])
  @@index([authorId, status])
  @@index([categoryId, status])
  @@index([publishedAt])
}

// 多级分类
model ContentCategory {
  id              String         @id @default(cuid())
  name            String                   // 分类名称
  slug            String         @unique   // URL 标识
  description     String?                  // 描述
  icon            String?                  // 图标（Lucide icon name）
  
  // 层级
  parentId        String?
  parent          ContentCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        ContentCategory[] @relation("CategoryHierarchy")
  level           Int            @default(0)  // 层级深度（根节点为 0）
  
  // 适用的内容类型（可多选）
  contentTypes    ContentType[]
  
  // 管理
  order           Int            @default(0)
  isActive        Boolean        @default(true)
  
  // 关联
  contents        Content[]
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([parentId])
  @@index([slug])
  @@index([isActive, order])
}

// 内容-颜色关联
model ContentColor {
  id              String         @id @default(cuid())
  
  contentId       String
  content         Content        @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  colorId         String
  color           Color          @relation(fields: [colorId], references: [id], onDelete: Cascade)
  
  note            String?                  // 颜色在内容中的说明
  order           Int            @default(0)
  
  createdAt       DateTime       @default(now())

  @@unique([contentId, colorId])
  @@index([contentId])
  @@index([colorId])
}

// 审核记录
model ContentReview {
  id              String         @id @default(cuid())
  
  // 内容
  contentId       String
  content         Content        @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  // 审核人
  reviewerId      String
  reviewer        User           @relation(fields: [reviewerId], references: [id])
  
  // 审核操作
  action          ReviewAction
  
  // 审核详情
  reason          String?                  // 原因（拒绝/退回时必填）
  note            String?                  // 内部备注
  
  // 审核前状态
  previousStatus  ContentStatus
  
  createdAt       DateTime       @default(now())

  @@index([contentId])
  @@index([reviewerId, createdAt])
}

// 审核操作类型
enum ReviewAction {
  APPROVE         // 通过
  REJECT          // 拒绝
  REQUEST_CHANGE  // 退回修改
  SET_FEATURED    // 设置推荐
  UNSET_FEATURED  // 取消推荐
  ARCHIVE         // 归档
  RESTORE         // 恢复
}
```

### 4.3 业务验证规则

#### 4.3.1 内容类型与色彩关联规则

```typescript
// apps/web/src/lib/validations/content.ts

import { z } from 'zod';
import { ContentType } from '@prisma/client';

/**
 * 内容创建/更新验证 Schema
 * 
 * 核心规则：
 * - 作品（WORK）：必须关联至少一个色彩或色彩簿
 * - 教程（TUTORIAL）：色彩关联可选
 * - 文章（ARTICLE）：色彩关联可选
 */
export const contentInputSchema = z.object({
  contentType: z.nativeEnum(ContentType),
  title: z.string().min(1).max(200),
  summary: z.string().max(500).optional(),
  body: z.string().min(1),
  coverImageUrl: z.string().url(),
  galleryImages: z.array(z.string().url()).optional(),
  externalUrl: z.string().url().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
  colorIds: z.array(z.string()).optional(),
  colorBookId: z.string().optional(),
}).superRefine((data, ctx) => {
  // 作品类型：必须关联色彩或色彩簿
  if (data.contentType === ContentType.WORK) {
    const hasColors = data.colorIds && data.colorIds.length > 0;
    const hasColorBook = !!data.colorBookId;
    
    if (!hasColors && !hasColorBook) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '作品必须关联至少一个色彩或色彩簿',
        path: ['colorIds'],
      });
    }
  }
});

/**
 * 各内容类型的字段要求
 */
export const contentTypeRequirements = {
  WORK: {
    colorAssociation: 'required',  // 必须关联色彩或色彩簿
    galleryImages: 'optional',     // 可选
    body: 'optional',              // 可选（作品可以只有图片）
  },
  TUTORIAL: {
    colorAssociation: 'optional',  // 可选
    galleryImages: 'optional',     // 可选
    body: 'required',              // 必须有正文内容
  },
  ARTICLE: {
    colorAssociation: 'optional',  // 可选
    galleryImages: 'none',         // 不适用
    body: 'required',              // 必须有正文内容
  },
} as const;
```

#### 4.3.2 前端表单动态字段

| 字段 | 作品 | 教程 | 文章 |
|------|:----:|:----:|:----:|
| 标题 | ✅ 必填 | ✅ 必填 | ✅ 必填 |
| 摘要 | 可选 | 可选 | 可选 |
| 正文 | 可选 | ✅ 必填 | ✅ 必填 |
| 封面图 | ✅ 必填 | ✅ 必填 | ✅ 必填 |
| 图片集 | 可选 | 可选 | 隐藏 |
| 外部链接 | 可选 | 可选 | 可选 |
| 分类 | 可选 | 可选 | 可选 |
| 标签 | 可选 | 可选 | 可选 |
| **关联色彩** | ✅ **必填** | 可选 | 可选 |
| **关联色彩簿** | ✅ **必填**（与色彩二选一） | 可选 | 可选 |

> **注意**：作品类型中，「关联色彩」和「关联色彩簿」至少填写一项。

### 4.3 状态机设计

```typescript
// apps/web/src/server/machines/content-machine.ts

import { setup, assign } from 'xstate';

/**
 * ColLab 内容状态机
 * 
 * 状态流转：
 * 
 *   DRAFT ──submit──> PENDING ──approve──> PUBLISHED
 *     ↑                  │                    │
 *     │                  │ reject             │ archive
 *     │                  ↓                    ↓
 *     └──edit────── REJECTED             ARCHIVED
 *                       │                    │
 *                       │ edit               │ restore
 *                       └────> DRAFT <───────┘
 */

export const contentMachine = setup({
  types: {
    context: {} as {
      contentId: string;
      authorId: string;
      currentStatus: string;
      featuredLevel: string;
      rejectReason?: string;
    },
    events: {} as
      | { type: 'SAVE_DRAFT' }
      | { type: 'SUBMIT' }
      | { type: 'APPROVE'; reviewerId: string }
      | { type: 'REJECT'; reviewerId: string; reason: string }
      | { type: 'REQUEST_CHANGE'; reviewerId: string; reason: string }
      | { type: 'EDIT' }
      | { type: 'ARCHIVE'; reviewerId: string }
      | { type: 'RESTORE'; reviewerId: string }
      | { type: 'SET_FEATURED'; level: string; reviewerId: string }
      | { type: 'UNSET_FEATURED'; reviewerId: string },
  },
}).createMachine({
  id: 'content',
  initial: 'draft',
  states: {
    draft: {
      on: {
        SAVE_DRAFT: {
          target: 'draft',
          // 保存草稿
        },
        SUBMIT: {
          target: 'pending',
          // 提交审核
        },
      },
    },
    pending: {
      on: {
        APPROVE: {
          target: 'published',
          actions: assign({
            rejectReason: () => undefined,
          }),
        },
        REJECT: {
          target: 'rejected',
          actions: assign({
            rejectReason: ({ event }) => event.reason,
          }),
        },
        REQUEST_CHANGE: {
          target: 'draft',
          actions: assign({
            rejectReason: ({ event }) => event.reason,
          }),
        },
      },
    },
    published: {
      on: {
        ARCHIVE: {
          target: 'archived',
        },
        SET_FEATURED: {
          target: 'published',
          actions: assign({
            featuredLevel: ({ event }) => event.level,
          }),
        },
        UNSET_FEATURED: {
          target: 'published',
          actions: assign({
            featuredLevel: () => 'NONE',
          }),
        },
      },
    },
    rejected: {
      on: {
        EDIT: {
          target: 'draft',
          // 用户重新编辑
        },
      },
    },
    archived: {
      on: {
        RESTORE: {
          target: 'published',
        },
      },
    },
  },
});
```

### 4.4 API 接口契约

#### 4.4.1 contentRouter（公开接口）

```typescript
// 公开内容列表
content.list
  Input: {
    // 选项卡筛选（对应前端 Tab）
    tab?: 'all_featured' | 'featured_works' | 'featured_tutorials' | 'featured_articles' | 'all_contents';
    
    // 内容类型筛选（多选）
    contentTypes?: ContentType[];   // 默认全部
    
    // 分类筛选
    categorySlug?: string;
    
    // 其他筛选
    tags?: string[];
    q?: string;            // 搜索关键词
    
    // 分页
    limit?: number;        // 默认 20
    cursor?: string;
  }
  Output: {
    items: ContentListItem[];
    nextCursor?: string;
    total?: number;        // 可选，用于显示结果数量
  }
  
  // Tab 与筛选逻辑映射：
  // - all_featured:        featuredLevel != NONE
  // - featured_works:      featuredLevel != NONE && contentType = WORK
  // - featured_tutorials:  featuredLevel != NONE && contentType = TUTORIAL
  // - featured_articles:   featuredLevel != NONE && contentType = ARTICLE
  // - all_contents:        status = PUBLISHED（无 featuredLevel 筛选）

// 内容详情
content.get
  Input: { id: string } | { contentId: string }
  Output: ContentDetail

// 搜索
content.search
  Input: {
    q: string;
    contentType?: ContentType;
    limit?: number;
  }
  Output: {
    items: ContentListItem[];
    total: number;
  }

// 首页推荐
content.featured
  Output: {
    homepage: ContentListItem[];     // 首页推荐（轮播）
    editorPicks: ContentListItem[];  // 编辑推荐
  }

// 创建内容（需登录）
content.create
  Input: {
    contentType: ContentType;
    title: string;
    summary?: string;
    body: string;
    coverImageUrl: string;
    galleryImages?: string[];
    externalUrl?: string;
    categoryId?: string;
    tags?: string[];
    colorIds?: string[];      // 作品类型必填，教程/文章可选
    colorBookId?: string;     // 作品类型必须有 colorIds 或 colorBookId
  }
  Output: Content
  
  // 验证规则（Zod schema）：
  // - 当 contentType = WORK 时，colorIds 和 colorBookId 至少有一个非空
  // - 当 contentType = TUTORIAL | ARTICLE 时，colorIds 和 colorBookId 可选

// 更新内容（需登录，仅作者）
content.update
  Input: {
    id: string;
    // ... 同 create
  }
  Output: Content

// 提交审核（需登录，仅作者，仅草稿状态）
content.submit
  Input: { id: string }
  Output: Content

// 删除内容（需登录，仅作者，仅草稿/已拒绝状态）
content.delete
  Input: { id: string }
  Output: { success: boolean }

// 我的内容列表（需登录）
content.myContents
  Input: {
    status?: ContentStatus;
    contentType?: ContentType;
    limit?: number;
    cursor?: string;
  }
  Output: {
    items: MyContentItem[];
    nextCursor?: string;
  }
```

#### 4.4.2 contentAdminRouter（管理员接口）

```typescript
// 待审核列表（需 OPERATOR/ADMIN 权限）
contentAdmin.pendingList
  Input: {
    contentType?: ContentType;
    limit?: number;
    cursor?: string;
  }
  Output: {
    items: PendingContentItem[];
    nextCursor?: string;
    stats: {
      total: number;
      byType: Record<ContentType, number>;
    };
  }

// 审核（需 OPERATOR/ADMIN 权限）
contentAdmin.review
  Input: {
    id: string;
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGE';
    reason?: string;  // REJECT/REQUEST_CHANGE 必填
    note?: string;
  }
  Output: Content

// 设置推荐等级（需 OPERATOR/ADMIN 权限）
contentAdmin.setFeatured
  Input: {
    id: string;
    level: FeaturedLevel;
  }
  Output: Content

// 归档（需 OPERATOR/ADMIN 权限）
contentAdmin.archive
  Input: { id: string }
  Output: Content

// 恢复（需 ADMIN 权限）
contentAdmin.restore
  Input: { id: string }
  Output: Content

// 统计面板（需 OPERATOR/ADMIN 权限）
contentAdmin.stats
  Output: {
    total: number;
    byStatus: Record<ContentStatus, number>;
    byType: Record<ContentType, number>;
    byFeaturedLevel: Record<FeaturedLevel, number>;
    pending: number;
    todayPublished: number;
    weeklyPublished: number;
  }
```

#### 4.4.3 contentCategoryRouter（分类管理）

```typescript
// 分类树（公开）
contentCategory.list
  Input: {
    contentType?: ContentType;  // 筛选适用的类型
  }
  Output: CategoryTree[]

// 创建分类（需 ADMIN 权限）
contentCategory.create
  Input: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    parentId?: string;
    contentTypes: ContentType[];
    order?: number;
  }
  Output: ContentCategory

// 更新分类（需 ADMIN 权限）
contentCategory.update
  Input: {
    id: string;
    // ... 同 create
  }
  Output: ContentCategory

// 删除分类（需 ADMIN 权限，仅无内容时）
contentCategory.delete
  Input: { id: string }
  Output: { success: boolean }

// 调整顺序（需 ADMIN 权限）
contentCategory.reorder
  Input: {
    items: Array<{ id: string; order: number }>
  }
  Output: { success: boolean }
```

### 4.5 前端交互设计

#### 4.5.1 ColLab 前台页面工具栏

**改造说明**：
- ❌ 删除：作者筛选组件
- ❌ 删除：标签筛选组件
- ✅ 新增：选项卡切换按钮
- ✅ 新增：内容类型筛选组件

**工具栏布局**：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ColLab 工具栏                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         选项卡切换区域                                    │   │
│  │                                                                         │   │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │
│  │   │ 所有推荐 │ │ 推荐作品 │ │ 推荐教程 │ │ 推荐文章 │ │ 所有内容 │    │   │
│  │   │ (active) │ │          │ │          │ │          │ │          │    │   │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         筛选与搜索区域                                    │   │
│  │                                                                         │   │
│  │   🔍 搜索内容...          [内容类型 ▼]     [分类 ▼]       [清除筛选]    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.5.2 选项卡切换按钮

| 选项卡 | 筛选逻辑 | 说明 |
|-------|---------|------|
| **所有推荐** | `featuredLevel != NONE` | 显示所有编辑推荐和首页推荐的内容 |
| **推荐作品** | `featuredLevel != NONE && contentType = WORK` | 仅显示推荐的作品 |
| **推荐教程** | `featuredLevel != NONE && contentType = TUTORIAL` | 仅显示推荐的教程 |
| **推荐文章** | `featuredLevel != NONE && contentType = ARTICLE` | 仅显示推荐的文章 |
| **所有内容** | `status = PUBLISHED`（无推荐等级筛选） | 显示所有已发布内容 |

**交互规则**：
- 默认选中「所有推荐」
- 选项卡切换时重置分页到第一页
- 选项卡切换不影响搜索关键词和分类筛选

#### 4.5.3 内容类型筛选组件

**组件设计**：下拉选择器（Popover + Checkbox）

```
┌──────────────────────┐
│   内容类型 ▼         │
├──────────────────────┤
│  ☑ 作品              │
│  ☑ 教程              │
│  ☑ 文章              │
├──────────────────────┤
│  [全选] [清除]       │
└──────────────────────┘
```

**交互规则**：
- 支持多选
- 默认全选（不显示筛选数量徽章）
- 部分选择时显示已选数量徽章，如「内容类型 (2)」
- 筛选变化时重置分页到第一页
- 与选项卡联动：
  - 选择「推荐作品」时，内容类型自动设为仅「作品」且禁用
  - 选择「推荐教程」时，内容类型自动设为仅「教程」且禁用
  - 选择「推荐文章」时，内容类型自动设为仅「文章」且禁用
  - 选择「所有推荐」或「所有内容」时，内容类型筛选启用

#### 4.5.4 分类筛选组件

**组件设计**：下拉选择器（支持层级展示）

```
┌──────────────────────┐
│   分类 ▼             │
├──────────────────────┤
│  ○ 全部分类          │
│  ● 印刷技术          │
│    ├─ 专色印刷       │
│    ├─ 四色印刷       │
│    └─ 特种工艺       │
│  ○ 设计灵感          │
│  ○ 色彩理论          │
└──────────────────────┘
```

**交互规则**：
- 单选
- 点击父分类显示该分类及其所有子分类的内容
- 点击子分类仅显示该子分类的内容
- 分类选项根据当前内容类型筛选动态过滤（只显示适用的分类）

#### 4.5.5 组件状态联动表

| 选项卡 | 内容类型筛选 | 分类筛选 | 搜索框 |
|-------|-------------|---------|--------|
| 所有推荐 | ✅ 启用（多选） | ✅ 启用 | ✅ 启用 |
| 推荐作品 | 🔒 锁定为「作品」 | ✅ 启用（过滤为作品分类） | ✅ 启用 |
| 推荐教程 | 🔒 锁定为「教程」 | ✅ 启用（过滤为教程分类） | ✅ 启用 |
| 推荐文章 | 🔒 锁定为「文章」 | ✅ 启用（过滤为文章分类） | ✅ 启用 |
| 所有内容 | ✅ 启用（多选） | ✅ 启用 | ✅ 启用 |

#### 4.5.6 顶部导航栏改造

**新增「发表」按钮**：

位置：顶部导航栏右侧按钮组（用户头像左侧）

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LOGO    [色彩]  [色彩簿]  [ColLab]  [文档]           [发表 ▼]  [🔔]  [头像]   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────┐
                                                  │  ✏️ 发表作品    │
                                                  │  📖 发布教程    │
                                                  │  📝 发表文章    │
                                                  └─────────────────┘
```

**下拉菜单项**：

| 菜单项 | 图标 | 跳转路径 |
|-------|------|---------|
| 发表作品 | `Palette` | `/collab/create?type=work` |
| 发布教程 | `BookOpen` | `/collab/create?type=tutorial` |
| 发表文章 | `FileText` | `/collab/create?type=article` |

**交互规则**：
- 未登录用户：点击任意菜单项跳转登录页，登录后重定向到对应创建页
- 已登录用户：直接跳转到创建页面
- 按钮样式：Primary 风格，与品牌色一致

#### 4.5.7 个人中心导航改造

**导航项变更**：

| 原名称 | 新名称 | 路径变更 |
|-------|-------|---------|
| 我的作品 | **我的发表** | `/account/works` → `/account/contents` |

**「我的发表」页面功能**：
- 展示用户发表的所有内容（作品、教程、文章）
- 支持按内容类型筛选
- 支持按状态筛选（草稿、待审核、已发布、已拒绝）
- 显示内容的审核状态和推荐等级

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  个人中心侧边栏                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   👤 个人资料                                                                   │
│   🎨 我的色彩簿                                                                 │
│   📄 我的发表        ← 原「我的作品」                                           │
│   📊 分析报告                                                                   │
│   🔐 账户安全                                                                   │
│   🔑 API 密钥                                                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.5.8 视觉设计要求

**选项卡样式**：
```css
/* 选项卡容器 - 圆角胶囊风格 */
.tab-container {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--gray-100);
  border-radius: 9999px;
}

/* 单个选项卡 */
.tab-item {
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-600);
  transition: all 0.2s;
}

/* 激活状态 */
.tab-item.active {
  background: white;
  color: var(--gray-900);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

**筛选组件样式**：
- 与现有 `works-gallery.tsx` 中的筛选组件风格保持一致
- 使用 shadcn/ui 的 `Popover`、`Checkbox`、`Button` 组件
- 圆角胶囊按钮风格

---

## 五、迁移路线图

### 5.1 阶段划分

```
Phase 1: 基础设施（1 周）
├── 数据库模型
├── 分类管理后台
└── API 基础

Phase 2: 内容管理（1.5 周）
├── 内容 CRUD
├── 审核流程
└── 用户端页面

Phase 3: 展示与推荐（1 周）
├── 首页改版
├── 列表页面
└── 详情页面

Phase 4: 数据迁移（0.5 周）
├── UserWork → Content 迁移
├── 兼容层
└── 清理废弃代码
```

### 5.2 Phase 1: 基础设施

**目标**：完成数据模型和分类管理后台

**任务清单**：

| 任务 | 描述 | 产出 |
|------|------|------|
| 1.1 数据库模型 | 新增 Content, ContentCategory, ContentColor, ContentReview 表 | Prisma Schema |
| 1.2 状态机实现 | 实现 content-machine.ts | 状态机文件 |
| 1.3 分类管理 Router | contentCategoryRouter 完整实现 | Router 文件 |
| 1.4 分类管理后台 | /admin/content-categories 页面 | 后台页面 |
| 1.5 数据库迁移 | prisma migrate | 迁移文件 |

**验收标准**：
- [ ] 数据库迁移成功执行
- [ ] 分类管理后台可以 CRUD 多级分类
- [ ] 分类可以指定适用的内容类型

**回滚方案**：
- 删除新增的数据表
- 回滚 Prisma 迁移

### 5.3 Phase 2: 内容管理

**目标**：完成内容创建、编辑、审核流程

**任务清单**：

| 任务 | 描述 | 产出 |
|------|------|------|
| 2.1 Content Router | contentRouter 完整实现 | Router 文件 |
| 2.2 ContentAdmin Router | contentAdminRouter 完整实现 | Router 文件 |
| 2.3 顶部导航栏改造 | 添加「发表」下拉按钮（发表作品/发布教程/发表文章） | 组件代码 |
| 2.4 内容创建页面 | /collab/create 页面（支持三种类型，通过 URL 参数区分） | 前端页面 |
| 2.5 内容编辑页面 | /collab/edit/[id] 页面 | 前端页面 |
| 2.6 个人中心改造 | 「我的作品」→「我的发表」，路径 /account/contents | 前端页面 |
| 2.7 后台内容列表 | /admin/contents 页面 | 后台页面 |
| 2.8 后台审核队列 | /admin/content-review 页面 | 后台页面 |

**验收标准**：
- [ ] 顶部导航栏显示「发表」按钮，下拉菜单包含三种内容类型入口
- [ ] 用户可以创建三种类型的内容
- [ ] 创建的内容默认为草稿状态
- [ ] 用户可以提交审核
- [ ] 运营人员可以审核内容
- [ ] 审核通过后内容变为已发布
- [ ] 审核拒绝后用户可以重新编辑
- [ ] 个人中心「我的发表」页面正常显示所有内容类型

**回滚方案**：
- 禁用新页面路由
- 保留数据，不删除

### 5.4 Phase 3: 展示与推荐

**目标**：完成前台展示页面和推荐机制

**任务清单**：

| 任务 | 描述 | 产出 |
|------|------|------|
| 3.1 ColLab 首页 | /collab 首页（首推 + 编推 + 最新） | 前端页面 |
| 3.2 工具栏组件改造 | 选项卡切换 + 内容类型筛选 + 分类筛选（移除作者/标签筛选） | 组件代码 |
| 3.3 内容列表组件 | 通用内容卡片列表，支持三种类型 | 组件代码 |
| 3.4 作品列表 | /collab/works 页面 | 前端页面 |
| 3.5 教程列表 | /collab/tutorials 页面 | 前端页面 |
| 3.6 文章列表 | /collab/articles 页面 | 前端页面 |
| 3.7 分类页面 | /collab/category/[slug] 页面 | 前端页面 |
| 3.8 内容详情 | /collab/[id] 页面（根据类型展示不同布局） | 前端页面 |
| 3.9 推荐设置 | 后台推荐等级设置功能 | 后台功能 |

**验收标准**：
- [ ] ColLab 首页展示首页推荐和编辑推荐
- [ ] 工具栏选项卡切换正常工作（所有推荐/推荐作品/推荐教程/推荐文章/所有内容）
- [ ] 内容类型筛选组件正常工作
- [ ] 分类筛选组件正常工作（支持层级展示）
- [ ] 选项卡与筛选组件正确联动
- [ ] 按类型浏览内容
- [ ] 按分类浏览内容
- [ ] 内容详情页展示完整信息
- [ ] 运营人员可以设置推荐等级

**回滚方案**：
- 恢复旧 /works 页面路由

### 5.5 Phase 4: 数据迁移

**目标**：迁移现有 UserWork 数据，完成兼容层

**任务清单**：

| 任务 | 描述 | 产出 |
|------|------|------|
| 4.1 迁移脚本 | UserWork → Content 迁移脚本 | 迁移脚本 |
| 4.2 兼容层 | userWorksRouter 转发到 contentRouter | 兼容代码 |
| 4.3 数据验证 | 验证迁移数据完整性 | 验证报告 |
| 4.4 旧页面重定向 | /works → /collab、/account/works → /account/contents 重定向 | Next.js 配置 |
| 4.5 废弃代码清理 | 标记废弃代码（不立即删除） | 代码注释 |

**验收标准**：
- [ ] 所有 UserWork 数据成功迁移到 Content
- [ ] isPublic=true 的作品状态为 PUBLISHED
- [ ] isPublic=false 的作品状态为 DRAFT
- [ ] 旧 API 仍可正常调用（兼容层）
- [ ] 旧页面正确重定向

**回滚方案**：
- 恢复 UserWork 相关代码
- 清理 Content 中的迁移数据
- 移除重定向配置

---

## 六、架构决策记录 (ADR)

### ADR-001: 统一内容模型 vs 分表

**决策**：采用统一 Content 表 + contentType 字段

**背景**：
- 方案 A：三种内容类型分三张表（Work, Tutorial, Article）
- 方案 B：统一 Content 表，通过 contentType 字段区分

**选择理由**：
1. **统一查询**：首页展示需要混合查询，单表更简单
2. **统一审核**：审核流程对三种类型一致，单表易于管理
3. **分类共享**：多级分类可以跨类型复用
4. **扩展性**：未来新增内容类型只需加枚举值

**成本**：
- 部分字段对某些类型无意义（如 Article 的 galleryImages）
- 需要在应用层校验类型与字段匹配

**缓解措施**：
- 使用 Zod 在 API 层做类型相关的字段校验
- 前端表单根据类型动态展示字段

---

### ADR-002: 审核流程状态机 vs 简单状态字段

**决策**：采用 XState 状态机管理内容生命周期

**背景**：
- 方案 A：简单 status 字段 + 业务逻辑判断
- 方案 B：XState 状态机定义状态流转

**选择理由**：
1. **清晰可视化**：状态机图清楚表达所有可能的状态和转换
2. **防止非法转换**：状态机强制执行合法的状态流转
3. **与现有架构一致**：项目技术架构已选型 XState
4. **易于扩展**：未来增加状态只需修改状态机定义

**成本**：
- 增加一层抽象
- 开发者需要理解状态机概念

---

### ADR-003: 多级分类 vs 标签体系

**决策**：采用多级分类 + 标签并存

**背景**：
- 方案 A：仅使用标签（扁平）
- 方案 B：仅使用多级分类（层级）
- 方案 C：多级分类 + 标签并存

**选择理由**：
1. **分类用于导航**：固定的、有层级的分类便于用户浏览
2. **标签用于灵活标记**：用户自定义标签便于搜索和聚合
3. **符合 UGC 平台惯例**：多数内容平台采用此模式

**分工**：
- 分类：后台配置，数量有限，用于一级导航
- 标签：用户自定义，数量不限，用于搜索和聚合

---

### ADR-004: 向后兼容策略

**决策**：保留 userWorksRouter 作为兼容层，逐步废弃

**背景**：
- 现有 /works 页面和 API 已在使用
- 可能存在外部链接指向旧页面

**策略**：
1. **Phase 1-3**：新旧系统并行运行
2. **Phase 4**：userWorksRouter 内部转发到 contentRouter
3. **Phase 5（未来）**：监控旧 API 调用量，确认无调用后移除

**收益**：
- 平滑过渡，不中断现有功能
- 给用户和外部系统时间适应

---

### ADR-005: 作品强制关联色彩规则

**决策**：作品类型必须关联色彩或色彩簿，教程和文章可选

**背景**：
- ColLab 定位为「色彩实践社区」
- 作品是色彩应用的直接展示，必须与 SOURCE 色彩体系关联
- 教程和文章可能涉及更广泛的主题

**选择理由**：
1. **突出平台特色**：作品强制关联色彩，确保 ColLab 内容与 SOURCE 色彩体系紧密结合
2. **内容多样性**：教程和文章可选关联，允许发布更广泛主题的内容
3. **用户体验**：作品页面可以直接展示关联的色彩信息，提供一致的浏览体验

**实现方式**：
- Zod schema 使用 `superRefine` 进行条件验证
- 前端表单根据内容类型动态调整必填标记
- 提交审核前进行客户端和服务端双重验证

---

### ADR-006: 前台工具栏简化设计

**决策**：移除作者和标签筛选，采用选项卡 + 内容类型 + 分类的筛选组合

**背景**：
- 现有工具栏包含：搜索框、作者筛选、标签筛选
- 新增需求：按推荐等级和内容类型浏览

**选择理由**：
1. **聚焦核心场景**：用户主要按「推荐」和「类型」浏览，作者筛选使用率低
2. **简化界面**：减少筛选组件数量，降低认知负担
3. **突出推荐内容**：选项卡设计让推荐内容更醒目
4. **分类替代标签**：运营控制的分类比用户自定义标签更有序

**保留能力**：
- 搜索框仍可按作者名、标签搜索
- 后台管理仍有完整的筛选能力

---

## 七、权限矩阵

| 操作 | USER | AUDITOR | OPERATOR | ADMIN |
|------|:----:|:-------:|:--------:|:-----:|
| 创建内容 | ✓ | ✓ | ✓ | ✓ |
| 编辑自己的内容 | ✓ | ✓ | ✓ | ✓ |
| 删除自己的内容 | ✓ | ✓ | ✓ | ✓ |
| 提交审核 | ✓ | ✓ | ✓ | ✓ |
| 查看待审核列表 | - | ✓ | ✓ | ✓ |
| 审核内容 | - | - | ✓ | ✓ |
| 设置推荐等级 | - | - | ✓ | ✓ |
| 归档内容 | - | - | ✓ | ✓ |
| 恢复归档内容 | - | - | - | ✓ |
| 管理分类 | - | - | - | ✓ |
| 删除他人内容 | - | - | - | ✓ |

---

## 八、待决策项

| 问题 | 选项 | 建议 | 状态 |
|------|------|------|------|
| 评论系统 | 自建 vs 第三方 | Phase 2 后再决定 | 待定 |
| 点赞/收藏 | 是否需要 | 建议 Phase 3 实现 | 待定 |
| 搜索引擎 | Meilisearch vs PostgreSQL 全文 | 初期用 PostgreSQL，后期迁移 | 建议 |
| 图片存储 | 现有 OSS 还是独立 | 复用现有基础设施 | 建议 |
| 内容 Markdown 编辑器 | TipTap vs MDXEditor | 需调研 | 待定 |

---

*文档结束*
