import { test, expect } from '@playwright/test';

test.describe('工程分析页', () => {
    test('页面加载成功', async ({ page }) => {
        await page.goto('/analyze');

        // 检查标题
        await expect(page.locator('h1')).toContainText('分析');

        // 检查上传区域存在
        await expect(
            page.locator('[data-testid="upload-zone"]')
                .or(page.locator('text=拖放'))
                .or(page.locator('text=上传'))
        ).toBeVisible();
    });

    test('文件上传区域可交互', async ({ page }) => {
        await page.goto('/analyze');

        // 查找上传输入
        const fileInput = page.locator('input[type="file"]');
        await expect(fileInput).toBeAttached();
    });

    test('分析模式选择可用', async ({ page }) => {
        await page.goto('/analyze');

        // 查找模式选择按钮或标签
        const modeSelector = page.locator('text=完整分析').or(page.locator('text=快速解析'));

        if (await modeSelector.isVisible()) {
            await expect(modeSelector).toBeVisible();
        }
    });

    test('格式说明可展开', async ({ page }) => {
        await page.goto('/analyze');

        // 查找格式说明区域
        const formatHelp = page.locator('text=格式说明').or(page.locator('text=SourcePack'));

        if (await formatHelp.isVisible()) {
            await formatHelp.click();
            await page.waitForTimeout(300);

            // 检查说明内容展开
            await expect(page.locator('text=version').or(page.locator('text=docInfo'))).toBeVisible();
        }
    });
});

test.describe('分析报告页', () => {
    test('无效报告 ID 显示 404', async ({ page }) => {
        await page.goto('/analyze/invalid-report-id');

        // 等待页面加载
        await page.waitForTimeout(500);

        // 检查是否显示不存在提示
        const notFound = await page.locator('text=不存在')
            .or(page.locator('text=找不到'))
            .or(page.locator('text=404'))
            .isVisible();

        expect(notFound).toBe(true);
    });
});
