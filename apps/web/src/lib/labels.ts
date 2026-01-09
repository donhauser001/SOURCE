/**
 * 状态标签映射
 * 
 * 统一管理后台系统中的各种状态标签显示
 */

// =============================================================================
// 色彩状态
// =============================================================================

export const COLOR_STATUS_LABELS = {
    ACTIVE: '激活',
    DEPRECATED: '已废弃',
    EXPERIMENTAL: '实验中',
    DRAFT: '草稿',
    VERIFIED: '已验证',
} as const;

export type ColorStatus = keyof typeof COLOR_STATUS_LABELS;

// =============================================================================
// 审计状态
// =============================================================================

export const AUDIT_STATUS_LABELS = {
    VERIFIED: '已验证',
    PENDING: '待审核',
} as const;

export type AuditStatus = keyof typeof AUDIT_STATUS_LABELS;

// =============================================================================
// 合作者状态
// =============================================================================

export const PARTNER_STATUS_LABELS = {
    PENDING: '待审核',
    ACTIVE: '正常',
    SUSPENDED: '暂停合作',
    INACTIVE: '停止合作',
} as const;

export type PartnerStatus = keyof typeof PARTNER_STATUS_LABELS;

// =============================================================================
// 合作者类型
// =============================================================================

export const PARTNER_TYPE_LABELS = {
    PRINTER: '印厂',
    PAPER_VENDOR: '纸商',
    INK_VENDOR: '油墨商',
    LAB: '实验室',
    CONSULTANT: '顾问',
} as const;

export type PartnerType = keyof typeof PARTNER_TYPE_LABELS;

// =============================================================================
// 纸张类型
// =============================================================================

export const PAPER_TYPE_LABELS = {
    PREMIUM_MATTE: '高阶映画',
    UNCOATED: '纯质纸',
    COATED: '铜版纸',
    OFFSET: '双胶纸',
    LIGHTWEIGHT: '轻型纸',
} as const;

export type PaperType = keyof typeof PAPER_TYPE_LABELS;

// =============================================================================
// 推荐等级
// =============================================================================

export const RECOMMENDATION_LABELS = {
    BEST: '最佳拍档',
    GOOD: '表现良好',
    CAUTION: '需注意',
    AVOID: '建议慎用',
} as const;

export type Recommendation = keyof typeof RECOMMENDATION_LABELS;

// =============================================================================
// 用户角色
// =============================================================================

export const USER_ROLE_LABELS = {
    ADMIN: '管理员',
    OPERATOR: '运营人员',
    AUDITOR: '审计成员',
    PARTNER: '合作方用户',
    USER: '普通用户',
} as const;

export type UserRole = keyof typeof USER_ROLE_LABELS;

// =============================================================================
// 用户等级
// =============================================================================

export const USER_TIER_LABELS = {
    FREE: '免费用户',
    VERIFIED: '已验证',
    PAID: '付费用户',
} as const;

export type UserTier = keyof typeof USER_TIER_LABELS;

// =============================================================================
// API 密钥角色
// =============================================================================

export const API_KEY_ROLE_LABELS = {
    READONLY: '只读',
    PLUGIN_FREE: '插件免费版',
    PLUGIN_PAID: '插件付费版',
    ADMIN: '管理员',
} as const;

export type ApiKeyRole = keyof typeof API_KEY_ROLE_LABELS;

// =============================================================================
// Badge 样式
// =============================================================================

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export function getColorStatusVariant(status: ColorStatus): BadgeVariant {
    switch (status) {
        case 'ACTIVE':
        case 'VERIFIED':
            return 'default';
        case 'EXPERIMENTAL':
            return 'secondary';
        case 'DEPRECATED':
            return 'destructive';
        case 'DRAFT':
            return 'outline';
        default:
            return 'outline';
    }
}

export function getAuditStatusVariant(status: AuditStatus): BadgeVariant {
    switch (status) {
        case 'VERIFIED':
            return 'default';
        case 'PENDING':
            return 'secondary';
        default:
            return 'outline';
    }
}

export function getPartnerStatusVariant(status: PartnerStatus): BadgeVariant {
    switch (status) {
        case 'ACTIVE':
            return 'default';
        case 'PENDING':
            return 'secondary';
        case 'SUSPENDED':
            return 'destructive';
        case 'INACTIVE':
            return 'outline';
        default:
            return 'outline';
    }
}

export function getRecommendationVariant(recommendation: Recommendation): BadgeVariant {
    switch (recommendation) {
        case 'BEST':
            return 'default';
        case 'GOOD':
            return 'secondary';
        case 'CAUTION':
            return 'outline';
        case 'AVOID':
            return 'destructive';
        default:
            return 'outline';
    }
}

export function getUserRoleVariant(role: UserRole): BadgeVariant {
    switch (role) {
        case 'ADMIN':
            return 'destructive';
        case 'AUDITOR':
            return 'default';
        case 'OPERATOR':
            return 'secondary';
        case 'PARTNER':
            return 'secondary';
        case 'USER':
            return 'outline';
        default:
            return 'outline';
    }
}

export function getUserTierVariant(tier: UserTier): BadgeVariant {
    switch (tier) {
        case 'PAID':
            return 'default';
        case 'VERIFIED':
            return 'secondary';
        case 'FREE':
            return 'outline';
        default:
            return 'outline';
    }
}
