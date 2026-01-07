/**
 * 错误处理工具测试
 */

import { describe, it, expect } from 'vitest';
import {
    ErrorCode,
    ApiError,
    Errors,
    createErrorResponse,
    createSuccessResponse,
    type ErrorResponse,
    type SuccessResponse,
} from './errors';

describe('错误处理系统', () => {
    describe('ErrorCode 枚举', () => {
        it('应包含通用错误码', () => {
            expect(ErrorCode.UNKNOWN).toBe('ERR_UNKNOWN');
            expect(ErrorCode.VALIDATION).toBe('ERR_VALIDATION');
            expect(ErrorCode.NOT_FOUND).toBe('ERR_NOT_FOUND');
        });

        it('应包含认证错误码', () => {
            expect(ErrorCode.UNAUTHORIZED).toBe('ERR_UNAUTHORIZED');
            expect(ErrorCode.FORBIDDEN).toBe('ERR_FORBIDDEN');
            expect(ErrorCode.INVALID_API_KEY).toBe('ERR_INVALID_API_KEY');
            expect(ErrorCode.EXPIRED_API_KEY).toBe('ERR_EXPIRED_API_KEY');
            expect(ErrorCode.REVOKED_API_KEY).toBe('ERR_REVOKED_API_KEY');
            expect(ErrorCode.INSUFFICIENT_SCOPE).toBe('ERR_INSUFFICIENT_SCOPE');
        });

        it('应包含限流错误码', () => {
            expect(ErrorCode.RATE_LIMIT).toBe('ERR_RATE_LIMIT');
            expect(ErrorCode.QUOTA_EXCEEDED).toBe('ERR_QUOTA_EXCEEDED');
        });

        it('应包含业务错误码', () => {
            expect(ErrorCode.COLOR_NOT_FOUND).toBe('ERR_COLOR_NOT_FOUND');
            expect(ErrorCode.PAPER_NOT_FOUND).toBe('ERR_PAPER_NOT_FOUND');
            expect(ErrorCode.INVALID_COLOR_ID).toBe('ERR_INVALID_COLOR_ID');
        });
    });

    describe('ApiError 类', () => {
        it('应正确创建错误实例', () => {
            const error = new ApiError(ErrorCode.NOT_FOUND, '资源不存在');
            expect(error.code).toBe('ERR_NOT_FOUND');
            expect(error.message).toBe('资源不存在');
            expect(error.statusCode).toBe(400); // 默认值
        });

        it('应支持自定义 statusCode', () => {
            const error = new ApiError(ErrorCode.VALIDATION, '验证失败', undefined, 422);
            expect(error.statusCode).toBe(422);
        });

        it('应支持 details', () => {
            const details = { field: 'colorId', reason: '格式错误' };
            const error = new ApiError(ErrorCode.VALIDATION, '验证失败', details, 400);
            expect(error.details).toEqual(details);
        });

        it('toResponse() 应返回正确格式', () => {
            const error = new ApiError(ErrorCode.NOT_FOUND, '颜色不存在', { colorId: 'CN-001' }, 404);
            const response = error.toResponse('req-123');

            expect(response.ok).toBe(false);
            expect(response.code).toBe('ERR_NOT_FOUND');
            expect(response.message).toBe('颜色不存在');
            expect(response.details).toEqual({ colorId: 'CN-001' });
            expect(response.requestId).toBe('req-123');
            expect(response.timestamp).toBeDefined();
        });
    });

    describe('createErrorResponse()', () => {
        it('应创建正确格式的错误响应', () => {
            const response = createErrorResponse(ErrorCode.NOT_FOUND, '资源不存在');

            expect(response.ok).toBe(false);
            expect(response.code).toBe('ERR_NOT_FOUND');
            expect(response.message).toBe('资源不存在');
            expect(response.timestamp).toBeDefined();
        });

        it('应包含 details 和 requestId', () => {
            const response = createErrorResponse(
                ErrorCode.VALIDATION,
                '验证失败',
                { fields: ['name'] },
                'req-456'
            );

            expect(response.details).toEqual({ fields: ['name'] });
            expect(response.requestId).toBe('req-456');
        });
    });

    describe('createSuccessResponse()', () => {
        it('应创建正确格式的成功响应', () => {
            const data = { id: '1', name: 'Test' };
            const response = createSuccessResponse(data);

            expect(response.ok).toBe(true);
            expect(response.data).toEqual(data);
            expect(response.timestamp).toBeDefined();
        });

        it('应包含 citations', () => {
            const data = { id: '1' };
            const citations = [{ type: 'color' as const, id: 'CN-001', label: '测试颜色' }];
            const response = createSuccessResponse(data, citations);

            expect(response.citations).toEqual(citations);
        });
    });

    describe('Errors 预定义错误', () => {
        it('unauthorized() 应返回 401 错误', () => {
            const error = Errors.unauthorized();
            expect(error.code).toBe('ERR_UNAUTHORIZED');
            expect(error.statusCode).toBe(401);
        });

        it('forbidden() 应返回 403 错误', () => {
            const error = Errors.forbidden();
            expect(error.code).toBe('ERR_FORBIDDEN');
            expect(error.statusCode).toBe(403);
        });

        it('invalidApiKey() 应返回正确错误', () => {
            const error = Errors.invalidApiKey();
            expect(error.code).toBe('ERR_INVALID_API_KEY');
            expect(error.statusCode).toBe(401);
        });

        it('rateLimit() 应返回 429 错误', () => {
            const error = Errors.rateLimit(60);
            expect(error.code).toBe('ERR_RATE_LIMIT');
            expect(error.statusCode).toBe(429);
            expect(error.details).toEqual({ retryAfter: 60 });
        });

        it('colorNotFound() 应包含 colorId', () => {
            const error = Errors.colorNotFound('CN-Song-04');
            expect(error.code).toBe('ERR_COLOR_NOT_FOUND');
            expect(error.message).toContain('CN-Song-04');
            expect(error.details).toEqual({ colorId: 'CN-Song-04' });
        });

        it('insufficientScope() 应包含所需权限', () => {
            const error = Errors.insufficientScope('admin:color');
            expect(error.code).toBe('ERR_INSUFFICIENT_SCOPE');
            expect(error.details).toEqual({ required: 'admin:color' });
        });

        it('validation() 应包含字段信息', () => {
            const error = Errors.validation('email', '邮箱格式错误');
            expect(error.code).toBe('ERR_VALIDATION');
            expect(error.details).toEqual({ field: 'email' });
        });
    });
});
