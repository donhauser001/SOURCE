/**
 * API 客户端
 *
 * 与 SOURCE 服务器通信
 * 
 * 审计功能：
 * - 发送 X-CLI-Version 头标识 CLI 版本
 * - 发送 X-CLI-Command 头标识当前命令
 */

import { config } from './config.js';
import { output } from './output.js';

// CLI 版本（与 index.ts 保持同步）
const CLI_VERSION = '0.4.2';

// 错误码到友好消息的映射
const ERROR_MESSAGES: Record<string, string> = {
    'UNAUTHORIZED': '认证失败：请检查 API Key 是否正确配置',
    'FORBIDDEN': '权限不足：您的 API Key 没有执行此操作的权限',
    'INSUFFICIENT_SCOPE': '权限不足：缺少必要的访问范围',
    'RATE_LIMIT_EXCEEDED': '请求过于频繁：请稍后再试',
    'NOT_FOUND': '资源不存在',
    'INVALID_API_KEY': 'API Key 无效或已过期',
};

// 当前执行的命令（全局跟踪）
let currentCommand = 'unknown';

interface ApiResponse<T> {
    ok: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    citations?: Array<{
        type: string;
        id: string;
        label?: string;
    }>;
    timestamp: string;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.getServerUrl();
    }

    /**
     * 设置当前命令（用于审计）
     */
    setCurrentCommand(command: string): void {
        currentCommand = command;
    }

    /**
     * 获取基础请求头
     */
    private getBaseHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-CLI-Version': CLI_VERSION,
            'X-CLI-Command': currentCommand,
        };

        const apiKey = config.getApiKey();
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        return headers;
    }

    /**
     * 获取认证头（兼容旧代码）
     * @deprecated 使用 getBaseHeaders() 代替
     */
    private getAuthHeader(): Record<string, string> {
        const apiKey = config.getApiKey();
        if (!apiKey) {
            return {};
        }
        return {
            Authorization: `Bearer ${apiKey}`,
        };
    }

    /**
     * 发起 GET 请求
     */
    async get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
        const url = new URL(`/api/v1${path}`, this.baseUrl);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) {
                    url.searchParams.set(key, value);
                }
            }
        }

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.getBaseHeaders(),
            });

            const data = await response.json();
            
            // 处理 HTTP 错误状态码
            if (!response.ok) {
                return this.handleHttpError(response.status, data);
            }
            
            return data as ApiResponse<T>;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '网络请求失败';
            return {
                ok: false,
                error: {
                    code: 'ERR_NETWORK',
                    message,
                },
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * 发起 POST 请求
     */
    async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
        const url = new URL(`/api/v1${path}`, this.baseUrl);

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.getBaseHeaders(),
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json();
            
            // 处理 HTTP 错误状态码
            if (!response.ok) {
                return this.handleHttpError(response.status, data);
            }
            
            return data as ApiResponse<T>;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '网络请求失败';
            return {
                ok: false,
                error: {
                    code: 'ERR_NETWORK',
                    message,
                },
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * 处理 HTTP 错误状态码
     */
    private handleHttpError<T>(status: number, data: unknown): ApiResponse<T> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorData = data as any;
        const errorCode = errorData?.error?.code || this.getErrorCodeFromStatus(status);
        const originalMessage = errorData?.error?.message || '';
        
        // 获取友好的错误消息
        const friendlyMessage = ERROR_MESSAGES[errorCode] || originalMessage;
        
        return {
            ok: false,
            error: {
                code: errorCode,
                message: friendlyMessage,
                details: errorData?.error?.details,
            },
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * 根据 HTTP 状态码获取错误代码
     */
    private getErrorCodeFromStatus(status: number): string {
        switch (status) {
            case 401: return 'UNAUTHORIZED';
            case 403: return 'FORBIDDEN';
            case 404: return 'NOT_FOUND';
            case 429: return 'RATE_LIMIT_EXCEEDED';
            default: return `HTTP_${status}`;
        }
    }

    /**
     * 检查 API 连接
     */
    async checkConnection(): Promise<boolean> {
        try {
            const response = await this.get('/tools');
            return response.ok || 'version' in (response as any);
        } catch {
            return false;
        }
    }

    /**
     * 获取工具列表
     */
    async getTools(): Promise<ApiResponse<unknown>> {
        // tools 端点不需要认证，但仍发送审计头
        const url = new URL('/api/v1/tools', this.baseUrl);
        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'X-CLI-Version': CLI_VERSION,
                    'X-CLI-Command': currentCommand,
                },
            });
            const data = await response.json();
            return { ok: true, data, timestamp: new Date().toISOString() };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '网络请求失败';
            return {
                ok: false,
                error: {
                    code: 'ERR_NETWORK',
                    message,
                },
                timestamp: new Date().toISOString(),
            };
        }
    }
}

export const api = new ApiClient();

