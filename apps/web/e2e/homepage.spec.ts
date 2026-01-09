import { test, expect } from '@playwright/test';

test.describe('首页', () => {
    test('页面加载成功', async ({ page }) => {
        await page.goto('/');

        // 检查标题
        await expect(page).toHaveTitle(/SOURCE/);

        // 检查页面结构
        await expect(page.locator('body')).toBeVisible();

        // 检查主要内容区域
        await expect(page.locator('main')).toBeVisible();
    });

    test('导航链接可用', async ({ page }) => {
        await page.goto('/');

        // 检查页面有导航元素
        await expect(page.locator('header')).toBeVisible();

        // 检查页面有一些链接
        const links = page.locator('a');
        const linkCount = await links.count();
        expect(linkCount).toBeGreaterThan(0);
    });

    test('响应式布局正常', async ({ page }) => {
        await page.goto('/');

        // 检查页面不会水平滚动
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    });
});
