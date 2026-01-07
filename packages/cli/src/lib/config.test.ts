/**
 * CLI 配置管理测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { config } from './config.js';

describe('CLI 配置管理', () => {
    beforeEach(() => {
        // 清除环境变量
        delete process.env.SOURCE_API_KEY;
        delete process.env.SOURCE_SERVER_URL;
        // 重置配置
        config.reset();
    });

    afterEach(() => {
        config.reset();
    });

    describe('getApiKey()', () => {
        it('应优先读取环境变量', () => {
            process.env.SOURCE_API_KEY = 'sk_source_env_key';
            config.setApiKey('sk_source_stored_key');

            expect(config.getApiKey()).toBe('sk_source_env_key');
        });

        it('环境变量不存在时应读取存储值', () => {
            config.setApiKey('sk_source_stored_key');

            expect(config.getApiKey()).toBe('sk_source_stored_key');
        });

        it('都不存在时应返回 undefined', () => {
            expect(config.getApiKey()).toBeUndefined();
        });
    });

    describe('setApiKey() / clearApiKey()', () => {
        it('应正确存储 API Key', () => {
            config.setApiKey('sk_source_test123');
            expect(config.getApiKey()).toBe('sk_source_test123');
        });

        it('clearApiKey 应清除存储的 Key', () => {
            config.setApiKey('sk_source_test123');
            config.clearApiKey();
            expect(config.getApiKey()).toBeUndefined();
        });
    });

    describe('getServerUrl() / setServerUrl()', () => {
        it('应优先读取环境变量', () => {
            process.env.SOURCE_SERVER_URL = 'https://env.example.com';
            config.setServerUrl('https://stored.example.com');

            expect(config.getServerUrl()).toBe('https://env.example.com');
        });

        it('环境变量不存在时应读取存储值', () => {
            config.setServerUrl('https://stored.example.com');

            expect(config.getServerUrl()).toBe('https://stored.example.com');
        });

        it('默认值应为 https://source.ink', () => {
            expect(config.getServerUrl()).toBe('https://source.ink');
        });
    });

    describe('getAll()', () => {
        it('应返回配置摘要', () => {
            config.setServerUrl('https://test.example.com');
            const all = config.getAll();

            expect(all).toHaveProperty('serverUrl', 'https://test.example.com');
            expect(all).toHaveProperty('profile');
        });

        it('apiKey 应被遮盖', () => {
            config.setApiKey('sk_source_test123456789');
            const all = config.getAll();

            expect(all.apiKey).not.toBe('sk_source_test123456789');
            expect(all.apiKey).toContain('***');
        });
    });

    describe('hasApiKey()', () => {
        it('有 key 时应返回 true', () => {
            config.setApiKey('sk_source_test');
            expect(config.hasApiKey()).toBe(true);
        });

        it('无 key 时应返回 false', () => {
            expect(config.hasApiKey()).toBe(false);
        });

        it('环境变量有 key 时应返回 true', () => {
            process.env.SOURCE_API_KEY = 'sk_source_env';
            expect(config.hasApiKey()).toBe(true);
        });
    });

    describe('reset()', () => {
        it('应清除所有配置', () => {
            config.setApiKey('sk_source_test');
            config.setServerUrl('https://test.example.com');
            config.reset();

            expect(config.getApiKey()).toBeUndefined();
            expect(config.getServerUrl()).toBe('https://source.ink'); // 回到默认值
        });
    });
});

