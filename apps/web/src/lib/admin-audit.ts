/**
 * 管理员操作审计日志工具函数
 * 
 * 用于记录所有管理员在后台执行的操作，便于追踪和审计
 */

import { prisma } from './db';
import { Prisma } from '@prisma/client';
import type { AdminAction } from '@prisma/client';

/**
 * 审计日志参数接口
 */
export interface AuditLogParams {
    userId: string;
    userEmail: string;
    action: AdminAction;
    targetType: string;
    targetId?: string | null;
    changes?: {
        before?: unknown;
        after?: unknown;
    };
    metadata?: Record<string, unknown>;
}

/**
 * 记录管理员操作日志
 * 
 * @example
 * await logAdminAction({
 *   userId: ctx.session.user.id,
 *   userEmail: ctx.session.user.email,
 *   action: 'CREATE',
 *   targetType: 'color',
 *   targetId: color.id,
 *   changes: { after: color },
 * });
 */
export async function logAdminAction(params: AuditLogParams): Promise<void> {
    try {
        await prisma.adminAuditLog.create({
            data: {
                userId: params.userId,
                userEmail: params.userEmail,
                action: params.action,
                targetType: params.targetType,
                targetId: params.targetId ?? null,
                changes: params.changes ? (params.changes as Prisma.InputJsonValue) : Prisma.JsonNull,
                metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
            },
        });
    } catch (error) {
        // 审计日志写入失败不应影响主业务流程
        console.error('[AdminAuditLog] 写入失败:', error);
    }
}

/**
 * 批量记录管理员操作日志（用于批量删除等操作）
 */
export async function logAdminBatchAction(params: {
    userId: string;
    userEmail: string;
    action: AdminAction;
    targetType: string;
    targetIds: string[];
    metadata?: Record<string, unknown>;
}): Promise<void> {
    try {
        await prisma.adminAuditLog.create({
            data: {
                userId: params.userId,
                userEmail: params.userEmail,
                action: params.action,
                targetType: params.targetType,
                targetId: null,
                changes: Prisma.JsonNull,
                metadata: {
                    ...params.metadata,
                    targetIds: params.targetIds,
                    count: params.targetIds.length,
                } as Prisma.InputJsonValue,
            },
        });
    } catch (error) {
        console.error('[AdminAuditLog] 批量写入失败:', error);
    }
}

/**
 * 目标类型常量
 */
export const AUDIT_TARGET_TYPES = {
    COLOR: 'color',
    PARTNER: 'partner',
    USER: 'user',
    BATCH: 'batch',
    PROOFING_PACK: 'proofingPack',
    API_KEY: 'apiKey',
    ACTIVATION_CODE: 'activationCode',
    AUDIT_NOTE: 'auditNote',
    PAPER_PROFILE: 'paperProfile',
    SYSTEM_CONFIG: 'systemConfig',
} as const;

export type AuditTargetType = typeof AUDIT_TARGET_TYPES[keyof typeof AUDIT_TARGET_TYPES];

/**
 * 操作类型标签映射（用于 UI 显示）
 */
export const ADMIN_ACTION_LABELS: Record<AdminAction, string> = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
    BATCH_DELETE: '批量删除',
    IMPORT: '导入',
    EXPORT: '导出',
    STATUS_CHANGE: '状态变更',
};

/**
 * 目标类型标签映射（用于 UI 显示）
 */
export const TARGET_TYPE_LABELS: Record<string, string> = {
    color: '色彩',
    partner: '共建者',
    user: '用户',
    batch: '批次',
    proofingPack: '打样包',
    apiKey: 'API 密钥',
    activationCode: '激活码',
    auditNote: '审计注记',
    paperProfile: '纸张表现',
};
