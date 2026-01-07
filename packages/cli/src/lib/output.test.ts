/**
 * CLI 输出工具测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { output } from './output.js';

describe('CLI 输出工具', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        // 重置为默认状态
        output.setJsonMode(false);
        output.setColorMode(true);
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('setJsonMode()', () => {
        it('应切换 JSON 模式', () => {
            output.setJsonMode(true);
            output.success({ test: 'data' });

            expect(consoleLogSpy).toHaveBeenCalled();
            const output_str = consoleLogSpy.mock.calls[0][0];
            const parsed = JSON.parse(output_str);
            expect(parsed.ok).toBe(true);
            expect(parsed.data).toEqual({ test: 'data' });
        });
    });

    describe('success()', () => {
        it('JSON 模式应输出结构化数据', () => {
            output.setJsonMode(true);
            output.success({ id: 1, name: 'Test' });

            const output_str = consoleLogSpy.mock.calls[0][0];
            const parsed = JSON.parse(output_str);

            expect(parsed.ok).toBe(true);
            expect(parsed.data).toEqual({ id: 1, name: 'Test' });
            expect(parsed.timestamp).toBeDefined();
        });

        it('JSON 模式应包含 citations', () => {
            output.setJsonMode(true);
            const citations = [{ type: 'color', id: 'CN-001' }];
            output.success({ data: 'test' }, citations);

            const output_str = consoleLogSpy.mock.calls[0][0];
            const parsed = JSON.parse(output_str);

            expect(parsed.citations).toEqual(citations);
        });

        it('普通模式应格式化输出', () => {
            output.setJsonMode(false);
            output.setColorMode(false);
            output.success({ name: 'Test' });

            expect(consoleLogSpy).toHaveBeenCalled();
            // 普通模式输出格式化文本
            const output_str = consoleLogSpy.mock.calls[0][0];
            expect(output_str).toContain('name');
        });
    });

    describe('error()', () => {
        it('JSON 模式应输出结构化错误', () => {
            output.setJsonMode(true);
            output.error('ERR_NOT_FOUND', '资源不存在');

            const output_str = consoleErrorSpy.mock.calls[0][0];
            const parsed = JSON.parse(output_str);

            expect(parsed.ok).toBe(false);
            expect(parsed.error.code).toBe('ERR_NOT_FOUND');
            expect(parsed.error.message).toBe('资源不存在');
        });

        it('JSON 模式应包含 details', () => {
            output.setJsonMode(true);
            output.error('ERR_VALIDATION', '验证失败', { field: 'email' });

            const output_str = consoleErrorSpy.mock.calls[0][0];
            const parsed = JSON.parse(output_str);

            expect(parsed.error.details).toEqual({ field: 'email' });
        });

        it('普通模式应输出可读错误', () => {
            output.setJsonMode(false);
            output.setColorMode(false);
            output.error('ERR_TEST', '测试错误');

            expect(consoleErrorSpy).toHaveBeenCalled();
            const output_str = consoleErrorSpy.mock.calls[0][0];
            expect(output_str).toContain('ERR_TEST');
            expect(output_str).toContain('测试错误');
        });
    });

    describe('info()', () => {
        it('JSON 模式不应输出', () => {
            output.setJsonMode(true);
            output.info('信息消息');

            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it('普通模式应输出', () => {
            output.setJsonMode(false);
            output.setColorMode(false);
            output.info('信息消息');

            expect(consoleLogSpy).toHaveBeenCalled();
            expect(consoleLogSpy.mock.calls[0][0]).toContain('信息消息');
        });
    });

    describe('warn()', () => {
        it('JSON 模式不应输出', () => {
            output.setJsonMode(true);
            output.warn('警告消息');

            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it('普通模式应输出', () => {
            output.setJsonMode(false);
            output.setColorMode(false);
            output.warn('警告消息');

            expect(consoleLogSpy).toHaveBeenCalled();
            expect(consoleLogSpy.mock.calls[0][0]).toContain('警告');
        });
    });

    describe('table()', () => {
        it('JSON 模式应输出数组', () => {
            output.setJsonMode(true);
            output.table(['ID', '名称'], [
                ['1', 'A'],
                ['2', 'B'],
            ]);

            const output_str = consoleLogSpy.mock.calls[0][0];
            const parsed = JSON.parse(output_str);

            expect(parsed.ok).toBe(true);
            expect(parsed.data).toEqual([
                { ID: '1', '名称': 'A' },
                { ID: '2', '名称': 'B' },
            ]);
        });

        it('普通模式应输出表格', () => {
            output.setJsonMode(false);
            output.setColorMode(false);
            output.table(['ID', '名称'], [['1', 'Test']]);

            expect(consoleLogSpy).toHaveBeenCalled();
            // 应包含表头和分隔线
            const calls = consoleLogSpy.mock.calls.map((c: unknown[]) => c[0]);
            expect(calls.some((c: unknown) => typeof c === 'string' && c.includes('ID'))).toBe(true);
        });
    });

    describe('颜色工具函数', () => {
        it('colorMode=true 应返回文本（可能带或不带颜色）', () => {
            output.setColorMode(true);
            const result = output.red('test');
            // chalk 在某些环境下可能不添加颜色码
            expect(result).toContain('test');
        });

        it('colorMode=false 应返回原始文本', () => {
            output.setColorMode(false);
            expect(output.red('test')).toBe('test');
            expect(output.green('test')).toBe('test');
            expect(output.yellow('test')).toBe('test');
            expect(output.cyan('test')).toBe('test');
            expect(output.dim('test')).toBe('test');
            expect(output.bold('test')).toBe('test');
        });
    });
});

