/**
 * 激活码数据验证 Schema
 * 
 * v0.4.0 - Access 阶段
 * 
 * 设计原则：
 * - 一码一用（绑定用户后不可转让）
 * - 激活后升级用户 tier 为 VERIFIED
 * - 支持批量生成和过期时间
 */

import { z } from 'zod';

// ============================================================================
// 激活码格式
// ============================================================================

// 激活码格式：SOURCE-XXXX-XXXX-XXXX（16 位字母数字）
const ACTIVATION_CODE_REGEX = /^SOURCE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export const activationCodeFormat = z
    .string()
    .regex(ACTIVATION_CODE_REGEX, '激活码格式错误，应为 SOURCE-XXXX-XXXX-XXXX');

// ============================================================================
// 批量生成激活码
// ============================================================================

export const generateActivationCodesSchema = z.object({
    count: z.number().int().min(1).max(1000).default(10),
    batchLabel: z.string().min(1).max(100), // 批次标签，如 "首印-2026-01"
    expiresInDays: z.number().int().min(1).max(365).optional(), // 过期天数
});

// ============================================================================
// 激活码列表查询
// ============================================================================

export const listActivationCodesSchema = z.object({
    batchLabel: z.string().optional(),
    status: z.enum(['all', 'unused', 'used', 'expired']).default('all'),
    limit: z.number().min(1).max(100).default(50),
    cursor: z.string().optional(),
});

// ============================================================================
// 用户激活
// ============================================================================

export const activateCodeSchema = z.object({
    code: activationCodeFormat,
});

// ============================================================================
// 检查激活码状态
// ============================================================================

export const checkCodeSchema = z.object({
    code: activationCodeFormat,
});

// ============================================================================
// 类型导出
// ============================================================================

export type GenerateActivationCodesInput = z.infer<typeof generateActivationCodesSchema>;
export type ListActivationCodesInput = z.infer<typeof listActivationCodesSchema>;
export type ActivateCodeInput = z.infer<typeof activateCodeSchema>;
export type CheckCodeInput = z.infer<typeof checkCodeSchema>;

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 生成随机激活码
 */
export function generateActivationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments: string[] = [];
    
    for (let i = 0; i < 3; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
            segment += chars[Math.floor(Math.random() * chars.length)];
        }
        segments.push(segment);
    }
    
    return `SOURCE-${segments.join('-')}`;
}

/**
 * 批量生成激活码
 */
export function generateActivationCodes(count: number): string[] {
    const codes = new Set<string>();
    
    while (codes.size < count) {
        codes.add(generateActivationCode());
    }
    
    return Array.from(codes);
}

/**
 * 获取激活码状态
 */
export function getCodeStatus(code: {
    usedAt: Date | null;
    expiresAt: Date | null;
}): 'unused' | 'used' | 'expired' {
    if (code.usedAt) {
        return 'used';
    }
    
    if (code.expiresAt && code.expiresAt < new Date()) {
        return 'expired';
    }
    
    return 'unused';
}

/**
 * 格式化激活码状态显示
 */
export const CODE_STATUS_LABELS = {
    unused: '未使用',
    used: '已使用',
    expired: '已过期',
};

