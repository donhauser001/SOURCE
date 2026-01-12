/**
 * ColLab 内容系统验证 Schema
 * 
 * 基于《ColLab 内容系统改造方案 V1.1》
 */

import { z } from 'zod';

// ============================================================================
// 枚举定义
// ============================================================================

export const ContentTypeEnum = z.enum(['WORK', 'TUTORIAL', 'ARTICLE']);
export const ContentStatusEnum = z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED']);
export const FeaturedLevelEnum = z.enum(['NONE', 'EDITOR_PICK', 'HOMEPAGE', 'HERO']);
export const ReviewActionEnum = z.enum([
  'APPROVE',
  'REJECT',
  'REQUEST_CHANGE',
  'SET_FEATURED',
  'UNSET_FEATURED',
  'ARCHIVE',
  'RESTORE',
]);

// ============================================================================
// 中文标签映射
// ============================================================================

export const ContentTypeLabels: Record<z.infer<typeof ContentTypeEnum>, string> = {
  WORK: '作品',
  TUTORIAL: '教程',
  ARTICLE: '文章',
};

export const ContentStatusLabels: Record<z.infer<typeof ContentStatusEnum>, string> = {
  DRAFT: '草稿',
  PENDING: '待审核',
  PUBLISHED: '已发布',
  REJECTED: '已拒绝',
  ARCHIVED: '已归档',
};

export const FeaturedLevelLabels: Record<z.infer<typeof FeaturedLevelEnum>, string> = {
  NONE: '普通',
  EDITOR_PICK: '编辑推荐',
  HOMEPAGE: '首页推荐',
  HERO: '首焦图推荐',
};

export const ReviewActionLabels: Record<z.infer<typeof ReviewActionEnum>, string> = {
  APPROVE: '通过',
  REJECT: '拒绝',
  REQUEST_CHANGE: '退回修改',
  SET_FEATURED: '设置推荐',
  UNSET_FEATURED: '取消推荐',
  ARCHIVE: '归档',
  RESTORE: '恢复',
};

// ============================================================================
// 内容类型字段要求配置
// ============================================================================

/**
 * 各内容类型的字段要求
 */
export const contentTypeRequirements = {
  WORK: {
    colorAssociation: 'required' as const,  // 必须关联色彩或色彩簿
    galleryImages: 'optional' as const,     // 可选
    body: 'optional' as const,              // 可选（作品可以只有图片）
  },
  TUTORIAL: {
    colorAssociation: 'optional' as const,  // 可选
    galleryImages: 'optional' as const,     // 可选
    body: 'required' as const,              // 必须有正文内容
  },
  ARTICLE: {
    colorAssociation: 'optional' as const,  // 可选
    galleryImages: 'none' as const,         // 不适用
    body: 'required' as const,              // 必须有正文内容
  },
} as const;

// ============================================================================
// 内容验证 Schema
// ============================================================================

/**
 * 内容创建/更新验证 Schema
 * 
 * 核心规则：
 * - 作品（WORK）：必须关联至少一个色彩或色彩簿
 * - 教程（TUTORIAL）：色彩关联可选
 * - 文章（ARTICLE）：色彩关联可选
 */
export const contentInputSchema = z.object({
  contentType: ContentTypeEnum,
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过 200 字'),
  summary: z.string().max(500, '摘要不能超过 500 字').optional(),
  body: z.string().optional(),
  coverImageUrl: z.string().url('封面图 URL 格式不正确'),
  galleryImages: z.array(z.string().url()).optional(),
  externalUrl: z.string().url('外部链接 URL 格式不正确').optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).max(10, '标签不能超过 10 个').optional(),
  colorIds: z.array(z.string()).optional(),
  colorBookId: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // 作品类型：必须关联色彩或色彩簿
  if (data.contentType === 'WORK') {
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

  // 教程和文章类型：正文必填
  if (data.contentType === 'TUTORIAL' || data.contentType === 'ARTICLE') {
    if (!data.body || data.body.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${ContentTypeLabels[data.contentType]}必须有正文内容`,
        path: ['body'],
      });
    }
  }
});

/**
 * 内容更新 Schema
 */
export const contentUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(500).optional().nullable(),
  body: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  galleryImages: z.array(z.string().url()).optional(),
  externalUrl: z.string().url().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).max(10).optional(),
  colorIds: z.array(z.string()).optional(),
  colorBookId: z.string().optional().nullable(),
});

/**
 * 内容列表查询 Schema
 */
export const contentListSchema = z.object({
  // 选项卡筛选（对应前端 Tab）
  tab: z.enum(['all_featured', 'featured_works', 'featured_tutorials', 'featured_articles', 'all_contents']).optional(),
  
  // 内容类型筛选（多选）
  contentTypes: z.array(ContentTypeEnum).optional(),
  
  // 分类筛选
  categorySlug: z.string().optional(),
  
  // 其他筛选
  tags: z.array(z.string()).optional(),
  q: z.string().optional(),  // 搜索关键词
  
  // 分页
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

/**
 * 获取单个内容 Schema
 */
export const contentGetSchema = z.object({
  id: z.string().optional(),
  contentId: z.string().optional(),
}).refine((data) => data.id || data.contentId, {
  message: '必须提供 id 或 contentId',
});

/**
 * 提交审核 Schema
 */
export const contentSubmitSchema = z.object({
  id: z.string(),
});

/**
 * 删除内容 Schema
 */
export const contentDeleteSchema = z.object({
  id: z.string(),
});

/**
 * 我的内容列表 Schema
 */
export const myContentsSchema = z.object({
  status: ContentStatusEnum.optional(),
  contentType: ContentTypeEnum.optional(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

// ============================================================================
// 分类验证 Schema
// ============================================================================

/**
 * 创建分类 Schema
 */
export const contentCategoryCreateSchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过 50 字'),
  slug: z.string()
    .min(1, 'URL 标识不能为空')
    .max(50, 'URL 标识不能超过 50 字')
    .regex(/^[a-z0-9-]+$/, 'URL 标识只能包含小写字母、数字和连字符'),
  description: z.string().max(200, '描述不能超过 200 字').optional(),
  icon: z.string().max(50).optional(),
  parentId: z.string().optional().nullable(),
  contentTypes: z.array(ContentTypeEnum).min(1, '至少选择一种内容类型'),
  order: z.number().int().optional(),
});

/**
 * 更新分类 Schema
 */
export const contentCategoryUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(200).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  parentId: z.string().optional().nullable(),
  contentTypes: z.array(ContentTypeEnum).min(1).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * 分类列表查询 Schema
 */
export const contentCategoryListSchema = z.object({
  contentType: ContentTypeEnum.optional(),
  includeInactive: z.boolean().optional().default(false),
});

/**
 * 分类排序 Schema
 */
export const contentCategoryReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    order: z.number().int(),
  })),
});

// ============================================================================
// 审核相关 Schema
// ============================================================================

/**
 * 审核操作 Schema
 */
export const contentReviewSchema = z.object({
  id: z.string(),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGE']),
  reason: z.string().max(500).optional(),
  note: z.string().max(500).optional(),
}).refine((data) => {
  // REJECT 和 REQUEST_CHANGE 必须提供原因
  if ((data.action === 'REJECT' || data.action === 'REQUEST_CHANGE') && !data.reason) {
    return false;
  }
  return true;
}, {
  message: '拒绝或退回修改时必须提供原因',
  path: ['reason'],
});

/**
 * 设置推荐等级 Schema
 */
export const setFeaturedSchema = z.object({
  id: z.string(),
  level: FeaturedLevelEnum,
});

/**
 * 待审核列表 Schema
 */
export const pendingListSchema = z.object({
  contentType: ContentTypeEnum.optional(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

// ============================================================================
// 类型导出
// ============================================================================

export type ContentType = z.infer<typeof ContentTypeEnum>;
export type ContentStatus = z.infer<typeof ContentStatusEnum>;
export type FeaturedLevel = z.infer<typeof FeaturedLevelEnum>;
export type ReviewAction = z.infer<typeof ReviewActionEnum>;

export type ContentInput = z.infer<typeof contentInputSchema>;
export type ContentUpdate = z.infer<typeof contentUpdateSchema>;
export type ContentListInput = z.infer<typeof contentListSchema>;
export type ContentGetInput = z.infer<typeof contentGetSchema>;
export type MyContentsInput = z.infer<typeof myContentsSchema>;

export type ContentCategoryCreate = z.infer<typeof contentCategoryCreateSchema>;
export type ContentCategoryUpdate = z.infer<typeof contentCategoryUpdateSchema>;
export type ContentCategoryList = z.infer<typeof contentCategoryListSchema>;
export type ContentCategoryReorder = z.infer<typeof contentCategoryReorderSchema>;

export type ContentReviewInput = z.infer<typeof contentReviewSchema>;
export type SetFeaturedInput = z.infer<typeof setFeaturedSchema>;
export type PendingListInput = z.infer<typeof pendingListSchema>;
