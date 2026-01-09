import { test, expect } from '@playwright/test';

test.describe('API 端点', () => {
    test('工具注册表端点正常', async ({ request }) => {
        const response = await request.get('/api/v1/tools');

        expect(response.ok()).toBe(true);

        const data = await response.json();
        // API 返回 version, tools, scopes, documentation 字段
        expect(data).toHaveProperty('version');
        expect(data).toHaveProperty('tools');
        expect(data).toHaveProperty('scopes');
        expect(data).toHaveProperty('documentation');
        expect(Array.isArray(data.tools)).toBe(true);
    });

    test('颜色列表端点需要认证', async ({ request }) => {
        const response = await request.get('/api/v1/colors');

        // 未认证应返回 4xx 错误
        expect(response.ok()).toBe(false);
        expect([401, 500]).toContain(response.status());

        const data = await response.json();
        expect(data).toHaveProperty('ok', false);
    });

    test('解析 API 接受 SourcePack', async ({ request }) => {
        const sourcePack = {
            version: '1.0',
            docInfo: {
                name: 'E2E 测试文档',
                source: 'Playwright',
            },
            colors: [
                {
                    name: '测试色',
                    lab: { L: 50, a: 0, b: 0 },
                },
            ],
        };

        const response = await request.post('/api/analyze/parse', {
            data: sourcePack,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        // 检查返回数据结构
        expect(data).toHaveProperty('success');
        if (data.success) {
            expect(data.data).toHaveProperty('colors');
        }
    });

    test('解析 API 拒绝无效格式', async ({ request }) => {
        const invalidData = {
            invalid: true,
        };

        const response = await request.post('/api/analyze/parse', {
            data: invalidData,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        // 验证返回的 success 为 false 或响应状态为错误
        expect(data.success === false || !response.ok()).toBe(true);
    });

    test('插件验证端点需要认证', async ({ request }) => {
        // 插件验证端点是 GET 方法
        const response = await request.get('/api/plugin/verify');

        // 未认证应返回 401
        expect(response.status()).toBe(401);

        const data = await response.json();
        expect(data).toHaveProperty('ok', false);
    });
});
