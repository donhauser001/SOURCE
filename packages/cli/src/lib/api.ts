/**
 * API 客户端
 *
 * 与 SOURCE 服务器通信
 */

import { config } from './config.js';
import { output } from './output.js';

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
     * 获取认证头
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
                headers: {
                    ...this.getAuthHeader(),
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data as ApiResponse<T>;
        } catch (error: any) {
            return {
                ok: false,
                error: {
                    code: 'ERR_NETWORK',
                    message: error.message || '网络请求失败',
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
                headers: {
                    ...this.getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json();
            return data as ApiResponse<T>;
        } catch (error: any) {
            return {
                ok: false,
                error: {
                    code: 'ERR_NETWORK',
                    message: error.message || '网络请求失败',
                },
                timestamp: new Date().toISOString(),
            };
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
    async getTools(): Promise<ApiResponse<any>> {
        // tools 端点不需要认证
        const url = new URL('/api/v1/tools', this.baseUrl);
        try {
            const response = await fetch(url.toString());
            const data = await response.json();
            return { ok: true, data, timestamp: new Date().toISOString() };
        } catch (error: any) {
            return {
                ok: false,
                error: {
                    code: 'ERR_NETWORK',
                    message: error.message || '网络请求失败',
                },
                timestamp: new Date().toISOString(),
            };
        }
    }
}

export const api = new ApiClient();

