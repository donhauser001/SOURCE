/**
 * 激活码验证测试
 * 
 * v0.4.0 - Access 阶段
 */

import { describe, it, expect } from 'vitest';
import {
    activationCodeFormat,
    generateActivationCode,
    generateActivationCodes,
    getCodeStatus,
} from './activation-code';

describe('激活码格式验证', () => {
    it('应该接受有效的激活码格式', () => {
        const validCodes = [
            'SOURCE-ABCD-1234-EFGH',
            'SOURCE-0000-0000-0000',
            'SOURCE-ZZZZ-9999-AAAA',
        ];

        for (const code of validCodes) {
            const result = activationCodeFormat.safeParse(code);
            expect(result.success).toBe(true);
        }
    });

    it('应该拒绝无效的激活码格式', () => {
        const invalidCodes = [
            'ABCD-1234-EFGH-IJKL',      // 缺少 SOURCE 前缀
            'SOURCE-ABC-1234-EFGH',      // 段长度不对
            'SOURCE-ABCD-1234',          // 段数不够
            'source-abcd-1234-efgh',     // 小写
            'SOURCE_ABCD_1234_EFGH',     // 使用下划线
            '',                           // 空字符串
        ];

        for (const code of invalidCodes) {
            const result = activationCodeFormat.safeParse(code);
            expect(result.success).toBe(false);
        }
    });
});

describe('激活码生成', () => {
    it('应该生成正确格式的激活码', () => {
        const code = generateActivationCode();

        expect(code).toMatch(/^SOURCE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('应该生成唯一的激活码', () => {
        const codes = generateActivationCodes(100);
        const uniqueCodes = new Set(codes);

        expect(uniqueCodes.size).toBe(100);
    });

    it('每个生成的激活码都应该是有效格式', () => {
        const codes = generateActivationCodes(50);

        for (const code of codes) {
            const result = activationCodeFormat.safeParse(code);
            expect(result.success).toBe(true);
        }
    });
});

describe('激活码状态判断', () => {
    it('应该正确识别未使用的激活码', () => {
        const code = {
            usedAt: null,
            expiresAt: null,
        };

        expect(getCodeStatus(code)).toBe('unused');
    });

    it('应该正确识别已使用的激活码', () => {
        const code = {
            usedAt: new Date(),
            expiresAt: null,
        };

        expect(getCodeStatus(code)).toBe('used');
    });

    it('应该正确识别已过期的激活码', () => {
        const code = {
            usedAt: null,
            expiresAt: new Date(Date.now() - 1000), // 过去的时间
        };

        expect(getCodeStatus(code)).toBe('expired');
    });

    it('未使用但未过期的激活码应该是 unused', () => {
        const code = {
            usedAt: null,
            expiresAt: new Date(Date.now() + 86400000), // 明天
        };

        expect(getCodeStatus(code)).toBe('unused');
    });

    it('已使用的激活码即使过期也应该是 used', () => {
        const code = {
            usedAt: new Date(Date.now() - 86400000), // 昨天使用
            expiresAt: new Date(Date.now() - 3600000), // 一小时前过期
        };

        expect(getCodeStatus(code)).toBe('used');
    });
});

