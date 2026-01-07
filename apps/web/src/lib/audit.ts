/**
 * 审计日志服务
 *
 * 记录所有 CLI/API 调用，用于：
 * - 安全审计
 * - 问题追溯
 * - 使用分析
 */

import { prisma } from './db';

/**
 * 审计日志参数
 */
export interface AuditLogParams {
    apiKeyId?: string;
    command: string;
    args: Record<string, unknown>;
    result: 'success' | 'error';
    errorCode?: string;
    duration: number;
    citations?: string[];
}

/**
 * 记录审计日志
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
    try {
        await prisma.cliAuditLog.create({
            data: {
                apiKeyId: params.apiKeyId,
                command: params.command,
                args: sanitizeArgs(params.args) as object,
                result: params.result,
                errorCode: params.errorCode,
                duration: params.duration,
                citations: params.citations || [],
            },
        });
    } catch (error) {
        // 审计日志写入失败不应影响主流程
        console.error('Failed to write audit log:', error);
    }
}

/**
 * 清理敏感参数
 */
function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...args };

    // 移除敏感字段
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}

/**
 * 创建审计日志包装器
 *
 * 用于包装 API 处理函数，自动记录调用信息
 */
export function withAudit<T extends (...args: any[]) => Promise<any>>(
    command: string,
    handler: T,
    options?: {
        extractCitations?: (result: Awaited<ReturnType<T>>) => string[];
        extractApiKeyId?: (...args: Parameters<T>) => string | undefined;
    }
): T {
    return (async (...args: Parameters<T>) => {
        const startTime = Date.now();
        let result: 'success' | 'error' = 'success';
        let errorCode: string | undefined;
        let citations: string[] | undefined;
        let returnValue: Awaited<ReturnType<T>>;

        try {
            returnValue = await handler(...args);

            if (options?.extractCitations) {
                citations = options.extractCitations(returnValue);
            }

            return returnValue;
        } catch (error: any) {
            result = 'error';
            errorCode = error.code || 'UNKNOWN';
            throw error;
        } finally {
            const duration = Date.now() - startTime;

            await logAudit({
                apiKeyId: options?.extractApiKeyId?.(...args),
                command,
                args: argsToObject(args),
                result,
                errorCode,
                duration,
                citations,
            });
        }
    }) as T;
}

/**
 * 将参数数组转换为对象
 */
function argsToObject(args: any[]): Record<string, unknown> {
    if (args.length === 0) return {};
    if (args.length === 1 && typeof args[0] === 'object') {
        return args[0] as Record<string, unknown>;
    }
    return { args };
}

/**
 * 获取审计日志统计
 */
export async function getAuditStats(apiKeyId?: string, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where = {
        createdAt: { gte: since },
        ...(apiKeyId ? { apiKeyId } : {}),
    };

    const [total, byCommand, byResult] = await Promise.all([
        prisma.cliAuditLog.count({ where }),
        prisma.cliAuditLog.groupBy({
            by: ['command'],
            where,
            _count: { command: true },
            orderBy: { _count: { command: 'desc' } },
            take: 10,
        }),
        prisma.cliAuditLog.groupBy({
            by: ['result'],
            where,
            _count: { result: true },
        }),
    ]);

    return {
        total,
        byCommand: byCommand.map((c: { command: string; _count: { command: number } }) => ({
            command: c.command,
            count: c._count.command,
        })),
        byResult: byResult.reduce(
            (acc: Record<string, number>, r: { result: string; _count: { result: number } }) => {
                acc[r.result] = r._count.result;
                return acc;
            },
            {} as Record<string, number>
        ),
    };
}

