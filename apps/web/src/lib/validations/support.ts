/**
 * 支持系统验证 Schema
 * 
 * 包含帮助文档和工单系统的输入验证
 */

import { z } from 'zod';

// =============================================================================
// 帮助文档分类
// =============================================================================

export const helpCategoryCreateSchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称最多 50 个字符'),
  slug: z.string().min(1, 'URL 标识不能为空').max(100).regex(/^[a-z0-9-]+$/, 'URL 标识只能包含小写字母、数字和连字符'),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  parentId: z.string().optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const helpCategoryUpdateSchema = helpCategoryCreateSchema.partial();

export type HelpCategoryCreate = z.infer<typeof helpCategoryCreateSchema>;
export type HelpCategoryUpdate = z.infer<typeof helpCategoryUpdateSchema>;

// =============================================================================
// 帮助文章
// =============================================================================

export const helpArticleStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const helpArticleCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题最多 200 个字符'),
  slug: z.string().min(1, 'URL 标识不能为空').max(200).regex(/^[a-z0-9-]+$/, 'URL 标识只能包含小写字母、数字和连字符'),
  summary: z.string().max(500).optional(),
  content: z.string().min(1, '内容不能为空'),
  categoryId: z.string().min(1, '请选择分类'),
  tags: z.array(z.string()).default([]),
  status: helpArticleStatusEnum.default('DRAFT'),
  order: z.number().int().min(0).default(0),
  isPinned: z.boolean().default(false),
});

export const helpArticleUpdateSchema = helpArticleCreateSchema.partial();

export type HelpArticleCreate = z.infer<typeof helpArticleCreateSchema>;
export type HelpArticleUpdate = z.infer<typeof helpArticleUpdateSchema>;

// =============================================================================
// 法律文档
// =============================================================================

export const legalDocumentTypeEnum = z.enum([
  'PRIVACY_POLICY',
  'TERMS_OF_SERVICE',
  'COOKIE_POLICY',
  'REFUND_POLICY',
]);

export const legalDocumentStatusEnum = z.enum(['DRAFT', 'PUBLISHED']);

export const legalDocumentCreateSchema = z.object({
  type: legalDocumentTypeEnum,
  title: z.string().min(1, '标题不能为空').max(200),
  content: z.string().min(1, '内容不能为空'),
  version: z.string().default('1.0'),
  effectiveDate: z.coerce.date().optional(),
  status: legalDocumentStatusEnum.default('DRAFT'),
});

export const legalDocumentUpdateSchema = legalDocumentCreateSchema.omit({ type: true }).partial();

export type LegalDocumentCreate = z.infer<typeof legalDocumentCreateSchema>;
export type LegalDocumentUpdate = z.infer<typeof legalDocumentUpdateSchema>;

// 法律文档类型中文映射
export const legalDocumentTypeLabels: Record<z.infer<typeof legalDocumentTypeEnum>, string> = {
  PRIVACY_POLICY: '隐私政策',
  TERMS_OF_SERVICE: '服务条款',
  COOKIE_POLICY: 'Cookie 政策',
  REFUND_POLICY: '退款政策',
};

// =============================================================================
// 工单分类
// =============================================================================

export const ticketCategoryCreateSchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50),
  slug: z.string().min(1, 'URL 标识不能为空').max(100).regex(/^[a-z0-9-]+$/, 'URL 标识只能包含小写字母、数字和连字符'),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  defaultAssigneeRole: z.enum(['ADMIN', 'OPERATOR', 'AUDITOR', 'PARTNER', 'USER']).optional(),
});

export const ticketCategoryUpdateSchema = ticketCategoryCreateSchema.partial();

export type TicketCategoryCreate = z.infer<typeof ticketCategoryCreateSchema>;
export type TicketCategoryUpdate = z.infer<typeof ticketCategoryUpdateSchema>;

// =============================================================================
// 工单
// =============================================================================

export const ticketStatusEnum = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'PENDING_USER',
  'RESOLVED',
  'CLOSED',
]);

export const ticketPriorityEnum = z.enum([
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
]);

export const ticketRelatedTypeEnum = z.enum([
  'COLOR',
  'REPORT',
  'ORDER',
  'CONTENT',
]);

export const ticketCreateSchema = z.object({
  subject: z.string().min(1, '主题不能为空').max(200, '主题最多 200 个字符'),
  description: z.string().min(10, '描述至少 10 个字符'),
  categoryId: z.string().min(1, '请选择分类'),
  priority: ticketPriorityEnum.default('NORMAL'),
  relatedType: ticketRelatedTypeEnum.optional(),
  relatedId: z.string().optional(),
  attachments: z.array(z.string()).default([]), // 支持相对路径和 URL
});

export const ticketUpdateSchema = z.object({
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  assigneeId: z.string().optional().nullable(),
  categoryId: z.string().optional(),
});

export type TicketCreate = z.infer<typeof ticketCreateSchema>;
export type TicketUpdate = z.infer<typeof ticketUpdateSchema>;

// 工单状态中文映射
export const ticketStatusLabels: Record<z.infer<typeof ticketStatusEnum>, string> = {
  OPEN: '待处理',
  IN_PROGRESS: '处理中',
  PENDING_USER: '等待用户回复',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
};

// 工单优先级中文映射
export const ticketPriorityLabels: Record<z.infer<typeof ticketPriorityEnum>, string> = {
  LOW: '低',
  NORMAL: '普通',
  HIGH: '高',
  URGENT: '紧急',
};

// 工单关联类型中文映射
export const ticketRelatedTypeLabels: Record<z.infer<typeof ticketRelatedTypeEnum>, string> = {
  COLOR: '颜色',
  REPORT: '分析报告',
  ORDER: '订单',
  CONTENT: '内容',
};

// =============================================================================
// 工单回复
// =============================================================================

export const ticketReplyTypeEnum = z.enum(['PUBLIC', 'INTERNAL']);

export const ticketReplyCreateSchema = z.object({
  ticketId: z.string().min(1),
  content: z.string().min(1, '回复内容不能为空'),
  replyType: ticketReplyTypeEnum.default('PUBLIC'),
  attachments: z.array(z.string().url()).default([]),
});

export type TicketReplyCreate = z.infer<typeof ticketReplyCreateSchema>;

// 回复类型中文映射
export const ticketReplyTypeLabels: Record<z.infer<typeof ticketReplyTypeEnum>, string> = {
  PUBLIC: '公开回复',
  INTERNAL: '内部备注',
};

// =============================================================================
// 查询参数
// =============================================================================

export const helpArticleListSchema = z.object({
  categoryId: z.string().optional().transform(v => v || undefined),
  status: z.union([helpArticleStatusEnum, z.literal('')]).optional().transform(v => v || undefined),
  search: z.string().optional().transform(v => v || undefined),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const ticketListSchema = z.object({
  categoryId: z.string().optional().transform(v => v || undefined),
  status: z.union([ticketStatusEnum, z.literal('')]).optional().transform(v => v || undefined),
  priority: z.union([ticketPriorityEnum, z.literal('')]).optional().transform(v => v || undefined),
  assigneeId: z.string().optional().transform(v => v || undefined),
  userId: z.string().optional().transform(v => v || undefined),
  search: z.string().optional().transform(v => v || undefined),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type HelpArticleListParams = z.infer<typeof helpArticleListSchema>;
export type TicketListParams = z.infer<typeof ticketListSchema>;
