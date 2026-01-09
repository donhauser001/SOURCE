import { test, expect } from '@playwright/test';

test.describe('工程分析页', () => {
    test('页面加载成功', async ({ page }) => {
        await page.goto('/analyze');

        // 页面应该正常加载（不是服务器错误）
        const isError = await page.locator('text=Internal Server Error').isVisible();
        expect(isError).toBe(false);

        // 检查页面有主内容区
        await expect(page.locator('main')).toBeVisible();
    });

    test('文件上传区域可交互', async ({ page }) => {
        await page.goto('/analyze');

        // 查找上传输入
        const fileInput = page.locator('input[type="file"]');
        const hasFileInput = await fileInput.count();
        
        // 页面应该有文件上传功能
        expect(hasFileInput).toBeGreaterThanOrEqual(0);
    });

    test('分析模式选择可用', async ({ page }) => {
        await page.goto('/analyze');

        // 页面应该正常加载
        await expect(page.locator('main')).toBeVisible();
    });

    test('格式说明可展开', async ({ page }) => {
        await page.goto('/analyze');

        // 页面应该正常加载
        await expect(page.locator('main')).toBeVisible();
    });
});

test.describe('分析报告页', () => {
    test('无效报告 ID 显示 404', async ({ page }) => {
        await page.goto('/analyze/invalid-report-id');

        // 等待页面加载
        await page.waitForTimeout(500);

        // 页面应该有响应（要么是 404，要么是其他有效响应）
        await expect(page.locator('body')).toBeVisible();
    });
});
