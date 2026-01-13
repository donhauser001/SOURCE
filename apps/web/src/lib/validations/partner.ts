/**
 * 共建者（Partner）验证 Schemas
 *
 * 印厂/纸商/油墨商统一抽象
 */

import { z } from 'zod';

// =============================================================================
// 枚举
// =============================================================================

export const PartnerTypeEnum = z.enum([
    'PRINTER',      // 印厂
    'PAPER_VENDOR', // 纸商
    'INK_VENDOR',   // 油墨商
    'LAB',          // 实验室/检测机构
    'CONSULTANT',   // 顾问/专家
]);
export type PartnerType = z.infer<typeof PartnerTypeEnum>;

export const PartnerStatusEnum = z.enum([
    'PENDING',      // 待审核
    'ACTIVE',       // 正常
    'SUSPENDED',    // 暂停合作
    'INACTIVE',     // 停止合作
]);
export type PartnerStatus = z.infer<typeof PartnerStatusEnum>;

// =============================================================================
// 标签映射
// =============================================================================

export const PartnerTypeLabels: Record<PartnerType, string> = {
    PRINTER: '印厂',
    PAPER_VENDOR: '纸商',
    INK_VENDOR: '油墨商',
    LAB: '实验室',
    CONSULTANT: '顾问',
};

export const PartnerStatusLabels: Record<PartnerStatus, string> = {
    PENDING: '待审核',
    ACTIVE: '正常',
    SUSPENDED: '暂停合作',
    INACTIVE: '停止合作',
};

// =============================================================================
// 创建 Partner Schema
// =============================================================================

export const CreatePartnerSchema = z.object({
    partnerId: z
        .string()
        .min(1, '共建者编号不能为空')
        .max(50, '共建者编号不能超过 50 字符')
        .regex(/^[A-Z0-9-]+$/, '共建者编号只能包含大写字母、数字和连字符'),
    name: z.string().min(1, '名称不能为空').max(100, '名称不能超过 100 字符'),
    shortName: z.string().max(20, '简称不能超过 20 字符').optional(),
    types: z.array(PartnerTypeEnum).min(1, '至少选择一个共建者类型'),
    description: z.string().max(500, '描述不能超过 500 字符').optional(),
    logoUrl: z.string().url('Logo URL 格式不正确').optional(),
    websiteUrl: z.string().url('官网 URL 格式不正确').optional(),
    contactEmail: z.string().email('邮箱格式不正确').optional(),
    contactPhone: z.string().max(20, '电话不能超过 20 字符').optional(),
    address: z.string().max(200, '地址不能超过 200 字符').optional(),
    region: z.string().max(50, '地区不能超过 50 字符').optional(),
    certifications: z.array(z.string()).optional(),
    establishedYear: z.number().int().min(1800).max(2100).optional(),
    status: PartnerStatusEnum.optional(),
});

export type CreatePartnerInput = z.infer<typeof CreatePartnerSchema>;

// =============================================================================
// 更新 Partner Schema
// =============================================================================

export const UpdatePartnerSchema = z.object({
    id: z.string().min(1, 'ID 不能为空'),
    name: z.string().min(1, '名称不能为空').max(100, '名称不能超过 100 字符').optional(),
    shortName: z.string().max(20, '简称不能超过 20 字符').nullish(),
    types: z.array(PartnerTypeEnum).min(1, '至少选择一个共建者类型').optional(),
    description: z.string().max(500, '描述不能超过 500 字符').nullish(),
    logoUrl: z.string().url('Logo URL 格式不正确').nullish(),
    websiteUrl: z.string().url('官网 URL 格式不正确').nullish(),
    contactEmail: z.string().email('邮箱格式不正确').nullish(),
    contactPhone: z.string().max(20, '电话不能超过 20 字符').nullish(),
    address: z.string().max(200, '地址不能超过 200 字符').nullish(),
    region: z.string().max(50, '地区不能超过 50 字符').nullish(),
    certifications: z.array(z.string()).optional(),
    establishedYear: z.number().int().min(1800).max(2100).nullish(),
    status: PartnerStatusEnum.optional(),
});

export type UpdatePartnerInput = z.infer<typeof UpdatePartnerSchema>;

// =============================================================================
// 列表查询 Schema
// =============================================================================

export const ListPartnersSchema = z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).optional().default(20),
    types: z.array(PartnerTypeEnum).optional(),
    status: PartnerStatusEnum.optional(),
    search: z.string().optional(),
    region: z.string().optional(),
});

export type ListPartnersInput = z.infer<typeof ListPartnersSchema>;

// =============================================================================
// 获取单个 Schema
// =============================================================================

export const GetPartnerSchema = z
    .object({
        id: z.string().optional(),
        partnerId: z.string().optional(),
    })
    .refine((data) => data.id || data.partnerId, {
        message: '必须提供 id 或 partnerId',
    });

export type GetPartnerInput = z.infer<typeof GetPartnerSchema>;

