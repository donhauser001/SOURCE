import { test, expect } from '@playwright/test';

test.describe('首页', () => {
    test('页面加载成功', async ({ page }) => {
        await page.goto('/');

        // 检查标题
        await expect(page).toHaveTitle(/SOURCE/);

        // 检查导航栏
        await expect(page.locator('header')).toBeVisible();

        // 检查主要内容区域
        await expect(page.locator('main')).toBeVisible();
    });

    test('导航链接可用', async ({ page }) => {
        await page.goto('/');

        // 检查色彩列表链接
        const colorsLink = page.locator('a[href="/colors"]');
        await expect(colorsLink).toBeVisible();

        // 检查文档链接
        const docsLink = page.locator('a[href="/docs"]');
        await expect(docsLink).toBeVisible();
    });

    test('响应式布局正常', async ({ page }) => {
        await page.goto('/');

        // 检查页面不会水平滚动
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    });
});
