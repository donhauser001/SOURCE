import { test, expect } from '@playwright/test';

test.describe('文档中心', () => {
    test('文档首页加载成功', async ({ page }) => {
        await page.goto('/docs');
        
        // 检查标题
        await expect(page.locator('h1')).toContainText('文档');
        
        // 检查有文档链接
        await expect(page.locator('a[href="/docs/api"]')).toBeVisible();
        await expect(page.locator('a[href="/docs/cli"]')).toBeVisible();
    });

    test('API 文档页加载成功', async ({ page }) => {
        await page.goto('/docs/api');
        
        // 检查标题
        await expect(page.locator('h1')).toContainText('API');
        
        // 检查代码示例存在
        await expect(page.locator('pre code')).toBeVisible();
        
        // 检查认证说明
        await expect(page.locator('text=Authorization')).toBeVisible();
    });

    test('CLI 文档页加载成功', async ({ page }) => {
        await page.goto('/docs/cli');
        
        // 检查标题
        await expect(page.locator('h1')).toContainText('CLI');
        
        // 检查命令示例
        await expect(page.locator('text=source')).toBeVisible();
    });

    test('色彩身份证文档页加载成功', async ({ page }) => {
        await page.goto('/docs/color-identity');
        
        // 检查标题
        await expect(page.locator('h1')).toContainText('色彩身份证');
        
        // 检查内容
        await expect(page.locator('main')).toBeVisible();
    });
});
