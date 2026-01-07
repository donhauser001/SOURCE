/**
 * Scope 权限系统测试
 */

import { describe, it, expect } from 'vitest';
import {
    SCOPES,
    hasScope,
    hasAllScopes,
    hasAnyScope,
    getScopesForRole,
    ROLE_SCOPES,
    type Scope,
} from './scopes';

describe('Scopes 权限系统', () => {
    describe('SCOPES 常量', () => {
        it('应包含基本只读权限', () => {
            expect(SCOPES['read:color']).toBe('读取色彩身份证');
            expect(SCOPES['read:paper']).toBe('读取纸张表现数据');
            expect(SCOPES['read:recipe']).toBe('读取油墨配方');
        });

        it('应包含搜索权限', () => {
            expect(SCOPES['search:color']).toBe('搜索色彩');
        });

        it('应包含推荐和估算权限', () => {
            expect(SCOPES['recommend:paper']).toBe('获取纸张推荐');
            expect(SCOPES['estimate:cost']).toBe('成本估算');
        });

        it('应包含管理员权限', () => {
            expect(SCOPES['admin:color']).toBe('管理色彩数据');
            expect(SCOPES['admin:user']).toBe('管理用户');
            expect(SCOPES['admin:apikey']).toBe('管理 API 密钥');
        });
    });

    describe('ROLE_SCOPES 角色定义', () => {
        it('ai-readonly 应包含只读权限', () => {
            const scopes = ROLE_SCOPES['ai-readonly'];
            expect(scopes).toContain('read:color');
            expect(scopes).toContain('read:paper');
            expect(scopes).toContain('search:color');
            expect(scopes).not.toContain('admin:color');
        });

        it('ai-full 应包含估算和分析权限', () => {
            const scopes = ROLE_SCOPES['ai-full'];
            expect(scopes).toContain('estimate:cost');
            expect(scopes).toContain('analyze:project');
        });

        it('admin 应包含所有权限', () => {
            const adminScopes = ROLE_SCOPES['admin'];
            const allScopes = Object.keys(SCOPES);
            expect(adminScopes.length).toBe(allScopes.length);
        });

        it('plugin-free 应只有基础权限', () => {
            const scopes = ROLE_SCOPES['plugin-free'];
            expect(scopes).toContain('read:color');
            expect(scopes).toContain('search:color');
            expect(scopes.length).toBe(2);
        });
    });

    describe('hasScope()', () => {
        it('用户拥有的权限应返回 true', () => {
            const userScopes = ['read:color', 'read:paper'];
            expect(hasScope(userScopes, 'read:color')).toBe(true);
            expect(hasScope(userScopes, 'read:paper')).toBe(true);
        });

        it('用户没有的权限应返回 false', () => {
            const userScopes = ['read:color'];
            expect(hasScope(userScopes, 'admin:color')).toBe(false);
            expect(hasScope(userScopes, 'search:color')).toBe(false);
        });

        it('空权限列表应返回 false', () => {
            expect(hasScope([], 'read:color')).toBe(false);
        });
    });

    describe('hasAllScopes()', () => {
        it('拥有所有权限应返回 true', () => {
            const userScopes = ['read:color', 'read:paper', 'search:color'];
            expect(hasAllScopes(userScopes, ['read:color', 'read:paper'])).toBe(true);
        });

        it('缺少任一权限应返回 false', () => {
            const userScopes = ['read:color'];
            expect(hasAllScopes(userScopes, ['read:color', 'read:paper'])).toBe(false);
        });

        it('空要求列表应返回 true', () => {
            expect(hasAllScopes(['read:color'], [])).toBe(true);
        });
    });

    describe('hasAnyScope()', () => {
        it('拥有任一权限应返回 true', () => {
            const userScopes = ['read:color'];
            expect(hasAnyScope(userScopes, ['read:color', 'read:paper'])).toBe(true);
        });

        it('完全没有权限应返回 false', () => {
            const userScopes = ['search:color'];
            expect(hasAnyScope(userScopes, ['read:color', 'read:paper'])).toBe(false);
        });

        it('空要求列表应返回 false', () => {
            expect(hasAnyScope(['read:color'], [])).toBe(false);
        });
    });

    describe('getScopesForRole()', () => {
        it('应返回角色对应的权限列表', () => {
            const scopes = getScopesForRole('ai-readonly');
            expect(Array.isArray(scopes)).toBe(true);
            expect(scopes.length).toBeGreaterThan(0);
        });

        it('未知角色应返回空数组', () => {
            const scopes = getScopesForRole('unknown-role');
            expect(scopes).toEqual([]);
        });
    });
});
