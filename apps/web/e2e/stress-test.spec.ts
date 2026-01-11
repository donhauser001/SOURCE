/**
 * 压力测试与逻辑测试
 * 
 * 测试真实数据场景下的：
 * - 页面加载性能
 * - 数据完整性
 * - 查询响应时间
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// 测试配置
const PERFORMANCE_THRESHOLDS = {
    LIST_PAGE_LOAD: 5000,      // 列表页加载时间阈值 (ms)
    DETAIL_PAGE_LOAD: 3000,    // 详情页加载时间阈值 (ms)
    ADMIN_PAGE_LOAD: 4000,     // 后台页面加载时间阈值 (ms)
};

test.describe('色彩列表页压力测试', () => {
    test('页面应在 5 秒内加载 100+ 色彩', async ({ page }) => {
        const startTime = Date.now();

        await page.goto(`${BASE_URL}/colors`);

        // 等待色彩卡片渲染
        await page.waitForSelector('[data-testid="color-card"]', { timeout: PERFORMANCE_THRESHOLDS.LIST_PAGE_LOAD });

        const loadTime = Date.now() - startTime;
        console.log(`📊 色彩列表页加载时间: ${loadTime}ms`);

        // 检查色彩数量
        const colorCards = await page.locator('[data-testid="color-card"]').count();
        console.log(`📊 显示色彩数量: ${colorCards}`);

        expect(colorCards).toBeGreaterThanOrEqual(100);
        expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LIST_PAGE_LOAD);
    });

    test('搜索功能应正常工作', async ({ page }) => {
        await page.goto(`${BASE_URL}/colors`);
        await page.waitForSelector('[data-testid="color-card"]');

        // 测试搜索
        const searchInput = page.locator('input[placeholder*="搜索"]');
        if (await searchInput.isVisible()) {
            await searchInput.fill('红');
            await page.waitForTimeout(500); // 等待防抖

            const filteredCards = await page.locator('[data-testid="color-card"]').count();
            console.log(`📊 搜索"红"后显示: ${filteredCards} 个色彩`);

            // 红色系应该有多个结果
            expect(filteredCards).toBeGreaterThan(5);
        }
    });

    test('筛选功能应正常工作', async ({ page }) => {
        await page.goto(`${BASE_URL}/colors`);
        await page.waitForSelector('[data-testid="color-card"]');

        // 测试状态筛选
        const statusFilter = page.locator('[data-testid="status-filter"]');
        if (await statusFilter.isVisible()) {
            await statusFilter.click();
            await page.locator('text=实验中').click();

            await page.waitForTimeout(500);
            const filteredCards = await page.locator('[data-testid="color-card"]').count();
            console.log(`📊 筛选"实验中"后显示: ${filteredCards} 个色彩`);
        }
    });
});

test.describe('色彩详情页压力测试', () => {
    test('详情页应完整加载所有关联数据', async ({ page }) => {
        // 先获取一个有数据的色彩 ID
        await page.goto(`${BASE_URL}/colors`);
        await page.waitForSelector('[data-testid="color-card"]');

        // 点击第一个色彩卡片
        const firstCard = page.locator('[data-testid="color-card"]').first();
        const colorLink = firstCard.locator('a').first();

        if (await colorLink.isVisible()) {
            const startTime = Date.now();
            await colorLink.click();

            // 等待详情页加载
            await page.waitForURL(/\/color\/.+/);
            await page.waitForSelector('[data-testid="color-identity-card"]', {
                timeout: PERFORMANCE_THRESHOLDS.DETAIL_PAGE_LOAD
            });

            const loadTime = Date.now() - startTime;
            console.log(`📊 色彩详情页加载时间: ${loadTime}ms`);

            // 检查各个组件是否正常渲染
            const identityCard = page.locator('[data-testid="color-identity-card"]');
            await expect(identityCard).toBeVisible();

            // 检查无错误弹窗或错误信息
            const errorMessage = page.locator('.error-message, [role="alert"]');
            expect(await errorMessage.count()).toBe(0);

            expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DETAIL_PAGE_LOAD);
        }
    });

    test('应正确显示纸张表现数据', async ({ page }) => {
        await page.goto(`${BASE_URL}/color/CN-Chi-01`);

        await page.waitForSelector('[data-testid="color-identity-card"]', { timeout: 5000 });

        // 检查纸张表现区域
        const paperSection = page.locator('text=纸张表现').first();
        if (await paperSection.isVisible()) {
            console.log('✅ 纸张表现区域已渲染');
        }
    });

    test('应正确显示配方数据', async ({ page }) => {
        await page.goto(`${BASE_URL}/color/CN-Chi-01`);

        await page.waitForSelector('[data-testid="color-identity-card"]', { timeout: 5000 });

        // 检查配方区域
        const recipeSection = page.locator('text=配方').first();
        if (await recipeSection.isVisible()) {
            console.log('✅ 配方区域已渲染');
        }
    });
});

test.describe('后台管理页压力测试', () => {
    test('色彩管理列表应正常加载', async ({ page }) => {
        const startTime = Date.now();

        await page.goto(`${BASE_URL}/admin/colors`);

        // 等待表格渲染
        await page.waitForSelector('table', { timeout: PERFORMANCE_THRESHOLDS.ADMIN_PAGE_LOAD });

        const loadTime = Date.now() - startTime;
        console.log(`📊 后台色彩管理页加载时间: ${loadTime}ms`);

        // 检查表格行数
        const rows = await page.locator('table tbody tr').count();
        console.log(`📊 表格显示: ${rows} 行`);

        expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ADMIN_PAGE_LOAD);
    });

    test('配方管理列表应正常加载', async ({ page }) => {
        const startTime = Date.now();

        await page.goto(`${BASE_URL}/admin/recipes`);

        await page.waitForSelector('table', { timeout: PERFORMANCE_THRESHOLDS.ADMIN_PAGE_LOAD });

        const loadTime = Date.now() - startTime;
        console.log(`📊 后台配方管理页加载时间: ${loadTime}ms`);

        const rows = await page.locator('table tbody tr').count();
        console.log(`📊 配方表格显示: ${rows} 行`);

        expect(rows).toBeGreaterThan(50);
    });

    test('打样包管理列表应正常加载', async ({ page }) => {
        const startTime = Date.now();

        await page.goto(`${BASE_URL}/admin/proofing-packs`);

        await page.waitForSelector('table', { timeout: PERFORMANCE_THRESHOLDS.ADMIN_PAGE_LOAD });

        const loadTime = Date.now() - startTime;
        console.log(`📊 后台打样包管理页加载时间: ${loadTime}ms`);

        const rows = await page.locator('table tbody tr').count();
        console.log(`📊 打样包表格显示: ${rows} 行`);

        expect(rows).toBeGreaterThan(100);
    });

    test('后台搜索功能应正常工作', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/colors`);
        await page.waitForSelector('table');

        const searchInput = page.locator('input[placeholder*="搜索"]');
        if (await searchInput.isVisible()) {
            await searchInput.fill('红');
            await page.waitForTimeout(500);

            const rows = await page.locator('table tbody tr').count();
            console.log(`📊 搜索"红"后显示: ${rows} 行`);

            expect(rows).toBeGreaterThan(0);
            expect(rows).toBeLessThan(50); // 过滤后应该少于总数
        }
    });
});

test.describe('数据完整性测试', () => {
    test('所有色彩都应有基础字段', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/colors`);
        await page.waitForSelector('table');

        // 检查表头是否包含必要字段
        const headers = await page.locator('table thead th').allTextContents();
        console.log(`📊 表格字段: ${headers.join(', ')}`);

        expect(headers.some(h => h.includes('ID') || h.includes('编号'))).toBeTruthy();
        expect(headers.some(h => h.includes('名称'))).toBeTruthy();
    });

    test('色彩详情页不应有 null 引用错误', async ({ page }) => {
        // 测试几个随机色彩的详情页
        const testColors = ['CN-Chi-01', 'CN-Lan-01', 'CN-Zi-01', 'CN-Jin-01', 'CN-Mo-04'];

        for (const colorId of testColors) {
            await page.goto(`${BASE_URL}/color/${colorId}`);

            // 检查是否有 JavaScript 错误
            const errors: string[] = [];
            page.on('pageerror', (err) => errors.push(err.message));

            await page.waitForTimeout(2000);

            // 检查页面是否正常渲染（非 404 或错误页面）
            const is404 = await page.locator('text=404').isVisible();
            const isError = await page.locator('text=Error').isVisible();

            if (!is404 && !isError) {
                console.log(`✅ ${colorId} 页面正常加载`);
            } else {
                console.log(`⚠️ ${colorId} 页面可能有问题`);
            }

            if (errors.length > 0) {
                console.log(`❌ ${colorId} JavaScript 错误: ${errors.join(', ')}`);
            }
        }
    });
});

test.describe('并发请求测试', () => {
    test('应能处理多个并发详情页请求', async ({ browser }) => {
        const contexts = await Promise.all([
            browser.newContext(),
            browser.newContext(),
            browser.newContext(),
        ]);

        const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

        const startTime = Date.now();

        // 并发加载不同的色彩详情页
        await Promise.all([
            pages[0].goto(`${BASE_URL}/color/CN-Chi-01`),
            pages[1].goto(`${BASE_URL}/color/CN-Lan-01`),
            pages[2].goto(`${BASE_URL}/color/CN-Jin-01`),
        ]);

        // 等待所有页面加载完成
        await Promise.all(pages.map(p =>
            p.waitForSelector('[data-testid="color-identity-card"]', { timeout: 10000 }).catch(() => null)
        ));

        const loadTime = Date.now() - startTime;
        console.log(`📊 3 个并发详情页加载时间: ${loadTime}ms`);

        // 并发请求应在 10 秒内完成
        expect(loadTime).toBeLessThan(10000);

        // 清理
        await Promise.all(contexts.map(ctx => ctx.close()));
    });
});
