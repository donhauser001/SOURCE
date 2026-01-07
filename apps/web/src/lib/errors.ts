/**
 * 统一错误码与响应格式
 *
 * 遵循 AI-ready 架构原则：
 * - 结构化错误（机器可解析）
 * - 错误码枚举（可映射处理）
 * - 详细信息（便于调试）
 */

/**
 * 错误码枚举
 */
export const ErrorCode = {
    // 通用错误
    UNKNOWN: 'ERR_UNKNOWN',
    VALIDATION: 'ERR_VALIDATION',
    NOT_FOUND: 'ERR_NOT_FOUND',

    // 认证错误
    UNAUTHORIZED: 'ERR_UNAUTHORIZED',
    FORBIDDEN: 'ERR_FORBIDDEN',
    INVALID_API_KEY: 'ERR_INVALID_API_KEY',
    EXPIRED_API_KEY: 'ERR_EXPIRED_API_KEY',
    REVOKED_API_KEY: 'ERR_REVOKED_API_KEY',
    INSUFFICIENT_SCOPE: 'ERR_INSUFFICIENT_SCOPE',

    // 限流错误
    RATE_LIMIT: 'ERR_RATE_LIMIT',
    QUOTA_EXCEEDED: 'ERR_QUOTA_EXCEEDED',

    // 业务错误
    COLOR_NOT_FOUND: 'ERR_COLOR_NOT_FOUND',
    PAPER_NOT_FOUND: 'ERR_PAPER_NOT_FOUND',
    BATCH_NOT_FOUND: 'ERR_BATCH_NOT_FOUND',
    INVALID_COLOR_ID: 'ERR_INVALID_COLOR_ID',
    UNVERIFIED_COLOR: 'ERR_UNVERIFIED_COLOR',

    // 分析错误
    INVALID_SOURCEPACK: 'ERR_INVALID_SOURCEPACK',
    UNMAPPED_COLORS: 'ERR_UNMAPPED_COLORS',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * 统一错误响应格式
 */
export interface ErrorResponse {
    ok: false;
    code: ErrorCodeType;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
}

/**
 * 统一成功响应格式
 */
export interface SuccessResponse<T> {
    ok: true;
    data: T;
    citations?: Citation[];
    timestamp: string;
    requestId?: string;
}

/**
 * 引用信息（证据链）
 */
export interface Citation {
    type: 'color' | 'paperProfile' | 'batch' | 'auditNote';
    id: string;
    label?: string;
}

/**
 * API 响应类型
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * 创建错误响应
 */
export function createErrorResponse(
    code: ErrorCodeType,
    message: string,
    details?: Record<string, unknown>,
    requestId?: string
): ErrorResponse {
    return {
        ok: false,
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId,
    };
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
    data: T,
    citations?: Citation[],
    requestId?: string
): SuccessResponse<T> {
    return {
        ok: true,
        data,
        citations,
        timestamp: new Date().toISOString(),
        requestId,
    };
}

/**
 * 自定义 API 错误类
 */
export class ApiError extends Error {
    constructor(
        public code: ErrorCodeType,
        message: string,
        public details?: Record<string, unknown>,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = 'ApiError';
    }

    toResponse(requestId?: string): ErrorResponse {
        return createErrorResponse(this.code, this.message, this.details, requestId);
    }
}

/**
 * 预定义错误
 */
export const Errors = {
    unauthorized: () => new ApiError(ErrorCode.UNAUTHORIZED, '请先登录', undefined, 401),

    forbidden: () => new ApiError(ErrorCode.FORBIDDEN, '无权访问', undefined, 403),

    invalidApiKey: () => new ApiError(ErrorCode.INVALID_API_KEY, 'API 密钥无效', undefined, 401),

    expiredApiKey: () => new ApiError(ErrorCode.EXPIRED_API_KEY, 'API 密钥已过期', undefined, 401),

    revokedApiKey: () => new ApiError(ErrorCode.REVOKED_API_KEY, 'API 密钥已被撤销', undefined, 401),

    insufficientScope: (required: string) =>
        new ApiError(ErrorCode.INSUFFICIENT_SCOPE, `需要权限: ${required}`, { required }, 403),

    rateLimit: (retryAfter?: number) =>
        new ApiError(ErrorCode.RATE_LIMIT, '请求过于频繁，请稍后重试', { retryAfter }, 429),

    colorNotFound: (colorId: string) =>
        new ApiError(ErrorCode.COLOR_NOT_FOUND, `色彩不存在: ${colorId}`, { colorId }, 404),

    notFound: (resource: string) =>
        new ApiError(ErrorCode.NOT_FOUND, `${resource}不存在`, { resource }, 404),

    validation: (field: string, message: string) =>
        new ApiError(ErrorCode.VALIDATION, message, { field }, 400),
};

