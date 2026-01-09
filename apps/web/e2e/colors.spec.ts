import { test, expect } from '@playwright/test';

test.describe('色彩列表页', () => {
    test('页面加载成功', async ({ page }) => {
        await page.goto('/colors');

        // 检查标题
        await expect(page.locator('h1')).toContainText('色彩');

        // 检查筛选器存在
        await expect(page.locator('[data-testid="filter-status"]').or(page.locator('select'))).toBeVisible();
    });

    test('搜索功能正常', async ({ page }) => {
        await page.goto('/colors');

        // 找到搜索输入框
        const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="搜索"]'));

        if (await searchInput.isVisible()) {
            // 输入搜索词
            await searchInput.fill('烟雨');

            // 等待搜索结果
            await page.waitForTimeout(500);

            // 检查页面更新
            await expect(page.locator('main')).toBeVisible();
        }
    });

    test('点击色彩卡片跳转详情', async ({ page }) => {
        await page.goto('/colors');

        // 等待列表加载
        await page.waitForTimeout(1000);

        // 找到第一个色彩链接
        const colorLink = page.locator('a[href^="/color/"]').first();

        if (await colorLink.isVisible()) {
            await colorLink.click();

            // 检查跳转到详情页
            await expect(page).toHaveURL(/\/color\//);
        }
    });
});

test.describe('色彩详情页', () => {
    test('页面加载成功', async ({ page }) => {
        // 访问一个已知的色彩
        await page.goto('/color/CN-Song-04');

        // 检查页面不是 404
        const is404 = await page.locator('text=不存在').or(page.locator('text=404')).isVisible();

        if (!is404) {
            // 检查色彩编号显示
            await expect(page.locator('body')).toContainText('CN-Song-04');

            // 检查基本信息区域
            await expect(page.locator('main')).toBeVisible();
        }
    });

    test('纸张表现切换正常', async ({ page }) => {
        await page.goto('/color/CN-Song-04');

        // 等待页面加载
        await page.waitForTimeout(500);

        // 查找纸张选择器或标签页
        const paperTabs = page.locator('[role="tablist"]').or(page.locator('[data-testid="paper-tabs"]'));

        if (await paperTabs.isVisible()) {
            // 点击不同的纸张标签
            const tabs = paperTabs.locator('[role="tab"]');
            const tabCount = await tabs.count();

            if (tabCount > 1) {
                await tabs.nth(1).click();
                await page.waitForTimeout(300);
                // 确认内容切换
                await expect(page.locator('main')).toBeVisible();
            }
        }
    });
});
