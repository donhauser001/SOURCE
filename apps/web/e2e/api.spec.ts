import { test, expect } from '@playwright/test';

test.describe('API 端点', () => {
    test('工具注册表端点正常', async ({ request }) => {
        const response = await request.get('/api/v1/tools');

        expect(response.ok()).toBe(true);

        const data = await response.json();
        expect(data).toHaveProperty('name', 'SOURCE');
        expect(data).toHaveProperty('version');
        expect(data).toHaveProperty('tools');
    });

    test('颜色列表端点需要认证', async ({ request }) => {
        const response = await request.get('/api/v1/colors');

        // 未认证应返回 401
        expect(response.status()).toBe(401);

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

        expect(response.ok()).toBe(true);

        const data = await response.json();
        expect(data).toHaveProperty('success', true);
        expect(data.data).toHaveProperty('colors');
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

        expect(response.ok()).toBe(false);

        const data = await response.json();
        expect(data).toHaveProperty('success', false);
    });

    test('插件验证端点需要认证', async ({ request }) => {
        const response = await request.post('/api/plugin/verify');

        // 未认证应返回 401
        expect(response.status()).toBe(401);
    });
});
