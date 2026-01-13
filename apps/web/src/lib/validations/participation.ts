/**
 * 颜色参与关联（ColorParticipation）验证 Schemas
 *
 * 核心关联层：任何"人/机构/共建者"与 Color ID 的参与关系
 */

import { z } from 'zod';

// =============================================================================
// 枚举
// =============================================================================

export const ParticipantEntityTypeEnum = z.enum([
    'PARTNER',      // 合作方（印厂/纸商/油墨商）
    'USER',         // 个人用户
    'EXTERNAL',     // 外部机构（临时，无需入库）
]);
export type ParticipantEntityType = z.infer<typeof ParticipantEntityTypeEnum>;

export const ParticipationRoleEnum = z.enum([
    'PRINTER',          // 印厂
    'PAPER_SUPPLIER',   // 纸张供应商
    'INK_SUPPLIER',     // 油墨供应商
    'AUDITOR',          // 审计顾问
    'CO_BUILDER',       // 共建者
    'TESTER',           // 测试员
    'RESEARCHER',       // 研究员
]);
export type ParticipationRole = z.infer<typeof ParticipationRoleEnum>;

export const ParticipationScopeEnum = z.enum([
    'IDENTITY',     // 色彩身份证整体
    'RECIPE',       // 配方验证
    'BATCH',        // 批次追样
    'COLLAB',       // 研究合作
]);
export type ParticipationScope = z.infer<typeof ParticipationScopeEnum>;

export const ParticipationStatusEnum = z.enum([
    'ACTIVE',       // 有效
    'INACTIVE',     // 暂停
    'REVOKED',      // 已撤销
    'EXPIRED',      // 已过期
]);
export type ParticipationStatus = z.infer<typeof ParticipationStatusEnum>;

export const EvidenceTypeEnum = z.enum([
    'REPORT',       // 测试报告
    'BATCH',        // 批次记录
    'COLLAB',       // ColLab 研究
    'DOCUMENT',     // 文档/合同
]);
export type EvidenceType = z.infer<typeof EvidenceTypeEnum>;

// =============================================================================
// 标签映射
// =============================================================================

export const ParticipantEntityTypeLabels: Record<ParticipantEntityType, string> = {
    PARTNER: '合作方',
    USER: '个人用户',
    EXTERNAL: '外部机构',
};

export const ParticipationRoleLabels: Record<ParticipationRole, string> = {
    PRINTER: '印厂',
    PAPER_SUPPLIER: '纸张供应商',
    INK_SUPPLIER: '油墨供应商',
    AUDITOR: '审计顾问',
    CO_BUILDER: '共建者',
    TESTER: '测试员',
    RESEARCHER: '研究员',
};

export const ParticipationScopeLabels: Record<ParticipationScope, string> = {
    IDENTITY: '色彩身份证',
    RECIPE: '配方验证',
    BATCH: '批次追样',
    COLLAB: '研究合作',
};

export const ParticipationStatusLabels: Record<ParticipationStatus, string> = {
    ACTIVE: '有效',
    INACTIVE: '暂停',
    REVOKED: '已撤销',
    EXPIRED: '已过期',
};

export const EvidenceTypeLabels: Record<EvidenceType, string> = {
    REPORT: '测试报告',
    BATCH: '批次记录',
    COLLAB: 'ColLab 研究',
    DOCUMENT: '文档/合同',
};

// =============================================================================
// 创建 ColorParticipation Schema
// =============================================================================

export const CreateColorParticipationSchema = z
    .object({
        colorId: z.string().min(1, '颜色 ID 不能为空'),
        entityType: ParticipantEntityTypeEnum,

        // 根据 entityType 选择性提供
        partnerId: z.string().optional(),
        userId: z.string().optional(),
        externalEntityName: z.string().max(100, '外部机构名称不能超过 100 字符').optional(),

        roleInColor: ParticipationRoleEnum,
        scope: ParticipationScopeEnum.optional().default('IDENTITY'),
        status: ParticipationStatusEnum.optional().default('ACTIVE'),

        startAt: z.date().optional(),
        endAt: z.date().optional(),

        evidenceType: EvidenceTypeEnum.optional(),
        evidenceId: z.string().optional(),
        evidenceUrl: z.string().url('证据链接格式不正确').optional(),

        note: z.string().max(500, '备注不能超过 500 字符').optional(),
    })
    .refine(
        (data) => {
            // 根据 entityType 验证必填字段
            if (data.entityType === 'PARTNER' && !data.partnerId) {
                return false;
            }
            if (data.entityType === 'USER' && !data.userId) {
                return false;
            }
            if (data.entityType === 'EXTERNAL' && !data.externalEntityName) {
                return false;
            }
            return true;
        },
        {
            message: '请根据实体类型提供对应的 partnerId、userId 或 externalEntityName',
        }
    );

export type CreateColorParticipationInput = z.infer<typeof CreateColorParticipationSchema>;

// =============================================================================
// 更新 ColorParticipation Schema
// =============================================================================

export const UpdateColorParticipationSchema = z.object({
    id: z.string().min(1, 'ID 不能为空'),
    roleInColor: ParticipationRoleEnum.optional(),
    scope: ParticipationScopeEnum.optional(),
    status: ParticipationStatusEnum.optional(),
    startAt: z.date().optional(),
    endAt: z.date().nullish(),
    evidenceType: EvidenceTypeEnum.nullish(),
    evidenceId: z.string().nullish(),
    evidenceUrl: z.string().url('证据链接格式不正确').nullish(),
    note: z.string().max(500, '备注不能超过 500 字符').nullish(),
});

export type UpdateColorParticipationInput = z.infer<typeof UpdateColorParticipationSchema>;

// =============================================================================
// 列表查询 Schema
// =============================================================================

export const ListColorParticipationsSchema = z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).optional().default(50),
    colorId: z.string().optional(),
    partnerId: z.string().optional(),
    userId: z.string().optional(),
    entityType: ParticipantEntityTypeEnum.optional(),
    roleInColor: ParticipationRoleEnum.optional(),
    scope: ParticipationScopeEnum.optional(),
    status: ParticipationStatusEnum.optional(),
});

export type ListColorParticipationsInput = z.infer<typeof ListColorParticipationsSchema>;

// =============================================================================
// 查询某颜色的所有共建者
// =============================================================================

export const GetColorParticipantsSchema = z.object({
    colorId: z.string().min(1, '颜色 ID 不能为空'),
    roleInColor: ParticipationRoleEnum.optional(),
    status: ParticipationStatusEnum.optional().default('ACTIVE'),
});

export type GetColorParticipantsInput = z.infer<typeof GetColorParticipantsSchema>;

// =============================================================================
// 查询某合作方参与的所有颜色
// =============================================================================

export const GetPartnerColorsSchema = z.object({
    partnerId: z.string().min(1, '合作方 ID 不能为空'),
    roleInColor: ParticipationRoleEnum.optional(),
    status: ParticipationStatusEnum.optional().default('ACTIVE'),
});

export type GetPartnerColorsInput = z.infer<typeof GetPartnerColorsSchema>;

