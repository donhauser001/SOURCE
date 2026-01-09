import { test, expect } from '@playwright/test';

test.describe('文档中心', () => {
    test('文档首页加载成功', async ({ page }) => {
        await page.goto('/docs');
        
        // 页面应该正常加载
        const isError = await page.locator('text=Internal Server Error').isVisible();
        expect(isError).toBe(false);
        
        // 检查页面有内容
        await expect(page.locator('main')).toBeVisible();
    });

    test('API 文档页加载成功', async ({ page }) => {
        await page.goto('/docs/api');
        
        // 页面应该正常加载
        const isError = await page.locator('text=Internal Server Error').isVisible();
        expect(isError).toBe(false);
        
        // 检查页面有内容
        await expect(page.locator('main')).toBeVisible();
    });

    test('CLI 文档页加载成功', async ({ page }) => {
        await page.goto('/docs/cli');
        
        // 页面应该正常加载
        const isError = await page.locator('text=Internal Server Error').isVisible();
        expect(isError).toBe(false);
        
        // 检查页面有内容
        await expect(page.locator('main')).toBeVisible();
    });

    test('色彩身份证文档页加载成功', async ({ page }) => {
        await page.goto('/docs/color-identity');
        
        // 页面应该正常加载
        const isError = await page.locator('text=Internal Server Error').isVisible();
        expect(isError).toBe(false);
        
        // 检查页面有内容
        await expect(page.locator('main')).toBeVisible();
    });
});
