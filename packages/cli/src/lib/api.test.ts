/**
 * API 客户端测试
 * 
 * 测试审计头和请求构建逻辑
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// CLI 版本
const CLI_VERSION = '0.1.4';

// 当前执行的命令（模拟全局状态）
let currentCommand = 'unknown';

// 模拟 config
const mockConfig = {
    getServerUrl: () => 'https://source.ink',
    getApiKey: () => 'sk_source_test123',
};

// 模拟 API 客户端的头部构建逻辑
function getBaseHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-CLI-Version': CLI_VERSION,
        'X-CLI-Command': currentCommand,
    };

    const apiKey = mockConfig.getApiKey();
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return headers;
}

function setCurrentCommand(command: string): void {
    currentCommand = command;
}

describe('API 客户端', () => {
    beforeEach(() => {
        currentCommand = 'unknown';
    });

    describe('审计头', () => {
        it('应包含 X-CLI-Version 头', () => {
            const headers = getBaseHeaders();
            expect(headers['X-CLI-Version']).toBe('0.1.4');
        });

        it('应包含 X-CLI-Command 头', () => {
            setCurrentCommand('color:get');
            const headers = getBaseHeaders();
            expect(headers['X-CLI-Command']).toBe('color:get');
        });

        it('应包含 Content-Type 头', () => {
            const headers = getBaseHeaders();
            expect(headers['Content-Type']).toBe('application/json');
        });

        it('有 API Key 时应包含 Authorization 头', () => {
            const headers = getBaseHeaders();
            expect(headers['Authorization']).toBe('Bearer sk_source_test123');
        });

        it('setCurrentCommand 应更新命令名', () => {
            expect(currentCommand).toBe('unknown');
            setCurrentCommand('cite');
            expect(currentCommand).toBe('cite');
        });
    });

    describe('不同命令场景', () => {
        it('color:get 命令', () => {
            setCurrentCommand('color:get');
            const headers = getBaseHeaders();
            expect(headers['X-CLI-Command']).toBe('color:get');
        });

        it('color:recommend 命令', () => {
            setCurrentCommand('color:recommend');
            const headers = getBaseHeaders();
            expect(headers['X-CLI-Command']).toBe('color:recommend');
        });

        it('cite 命令', () => {
            setCurrentCommand('cite');
            const headers = getBaseHeaders();
            expect(headers['X-CLI-Command']).toBe('cite');
        });

        it('search 命令', () => {
            setCurrentCommand('search');
            const headers = getBaseHeaders();
            expect(headers['X-CLI-Command']).toBe('search');
        });
    });

    describe('URL 构建', () => {
        it('应正确构建 API URL', () => {
            const baseUrl = mockConfig.getServerUrl();
            const path = '/colors/CN-Song-04';
            const url = new URL(`/api/v1${path}`, baseUrl);
            expect(url.toString()).toBe('https://source.ink/api/v1/colors/CN-Song-04');
        });

        it('应正确处理查询参数', () => {
            const baseUrl = mockConfig.getServerUrl();
            const path = '/colors';
            const url = new URL(`/api/v1${path}`, baseUrl);
            url.searchParams.set('status', 'ACTIVE');
            url.searchParams.set('limit', '10');
            expect(url.toString()).toBe('https://source.ink/api/v1/colors?status=ACTIVE&limit=10');
        });

        it('应正确编码特殊字符', () => {
            const colorId = 'CN-Song-04';
            const encoded = encodeURIComponent(colorId);
            expect(encoded).toBe('CN-Song-04');
        });

        it('应正确编码中文', () => {
            const name = '烟雨青';
            const encoded = encodeURIComponent(name);
            expect(encoded).toBe('%E7%83%9F%E9%9B%A8%E9%9D%92');
        });
    });
});

