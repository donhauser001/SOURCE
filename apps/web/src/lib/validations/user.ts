/**
 * 用户（User）验证 Schemas
 *
 * 5 级角色体系：管理员、运营人员、审计成员、合作方用户、普通用户
 */

import { z } from 'zod';

// =============================================================================
// 枚举
// =============================================================================

export const UserRoleEnum = z.enum([
    'ADMIN',        // 管理员 - 全部权限
    'OPERATOR',     // 运营人员 - 数据管理、内容发布
    'AUDITOR',      // 审计成员 - 数据审核、质量把控
    'PARTNER',      // 合作方用户 - 关联到 Partner，查看相关数据
    'USER',         // 普通用户 - 基础访问
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserTierEnum = z.enum([
    'FREE',         // 免费用户
    'VERIFIED',     // 已验证（激活码）
    'PAID',         // 付费用户
]);
export type UserTier = z.infer<typeof UserTierEnum>;

// =============================================================================
// 标签映射
// =============================================================================

export const UserRoleLabels: Record<UserRole, string> = {
    ADMIN: '管理员',
    OPERATOR: '运营人员',
    AUDITOR: '审计成员',
    PARTNER: '合作方用户',
    USER: '普通用户',
};

export const UserTierLabels: Record<UserTier, string> = {
    FREE: '免费',
    VERIFIED: '已验证',
    PAID: '付费',
};

// =============================================================================
// 角色权限定义
// =============================================================================

export const RolePermissions: Record<UserRole, string[]> = {
    ADMIN: [
        'manage:users',
        'manage:partners',
        'manage:colors',
        'manage:recipes',
        'manage:reports',
        'manage:system',
        'audit:all',
        'view:all',
    ],
    OPERATOR: [
        'manage:colors',
        'manage:recipes',
        'manage:reports',
        'view:all',
    ],
    AUDITOR: [
        'audit:colors',
        'audit:recipes',
        'audit:reports',
        'view:all',
    ],
    PARTNER: [
        'view:own_participations',
        'view:related_colors',
        'view:related_reports',
    ],
    USER: [
        'view:public',
    ],
};

// =============================================================================
// 更新用户 Schema
// =============================================================================

export const UpdateUserSchema = z.object({
    id: z.string().min(1, 'ID 不能为空'),
    name: z.string().min(1, '名称不能为空').max(50, '名称不能超过 50 字符').optional(),
    role: UserRoleEnum.optional(),
    tier: UserTierEnum.optional(),
    partnerId: z.string().nullish(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// =============================================================================
// 列表查询 Schema
// =============================================================================

export const ListUsersSchema = z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).optional().default(20),
    role: UserRoleEnum.optional(),
    tier: UserTierEnum.optional(),
    search: z.string().optional(),
    partnerId: z.string().optional(),
});

export type ListUsersInput = z.infer<typeof ListUsersSchema>;

// =============================================================================
// 权限检查工具函数
// =============================================================================

/**
 * 检查用户是否具有指定权限
 */
export function hasPermission(role: UserRole, permission: string): boolean {
    const permissions = RolePermissions[role] || [];
    return permissions.includes(permission) || permissions.includes('manage:system');
}

/**
 * 检查用户是否为管理员级别
 */
export function isAdmin(role: UserRole): boolean {
    return role === 'ADMIN';
}

/**
 * 检查用户是否为运营级别或更高
 */
export function isOperatorOrAbove(role: UserRole): boolean {
    return ['ADMIN', 'OPERATOR'].includes(role);
}

/**
 * 检查用户是否为审计级别或更高
 */
export function isAuditorOrAbove(role: UserRole): boolean {
    return ['ADMIN', 'OPERATOR', 'AUDITOR'].includes(role);
}

/**
 * 检查用户是否可以访问合作方数据
 */
export function canAccessPartnerData(role: UserRole): boolean {
    return ['ADMIN', 'OPERATOR', 'AUDITOR', 'PARTNER'].includes(role);
}

