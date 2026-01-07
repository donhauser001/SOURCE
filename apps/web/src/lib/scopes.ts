/**
 * API 权限范围（Scope）定义
 *
 * 遵循 CLI-first AI 架构原则：
 * - 最小权限原则
 * - 只读优先
 * - 可审计
 */

/**
 * 所有可用的 Scope
 */
export const SCOPES = {
    // 色彩相关（只读）
    'read:color': '读取色彩身份证',
    'read:recipe': '读取油墨配方',
    'read:paper': '读取纸张表现数据',

    // 搜索
    'search:color': '搜索色彩',

    // 推荐（基于规则，非 AI 判断）
    'recommend:paper': '获取纸张推荐',

    // 估算（只输出区间，不承诺）
    'estimate:cost': '成本估算',

    // 分析（需要更高权限）
    'analyze:project': '工程分析',

    // 引用
    'cite:generate': '生成引用',

    // 管理（仅管理员）
    'admin:color': '管理色彩数据',
    'admin:paper': '管理纸张数据',
    'admin:user': '管理用户',
    'admin:apikey': '管理 API 密钥',
} as const;

export type Scope = keyof typeof SCOPES;

/**
 * 预定义的角色及其权限
 */
export const ROLE_SCOPES: Record<string, Scope[]> = {
    // AI 只读角色（默认）
    'ai-readonly': [
        'read:color',
        'read:paper',
        'search:color',
        'recommend:paper',
        'cite:generate',
    ],

    // AI 完整角色（含估算和分析）
    'ai-full': [
        'read:color',
        'read:recipe',
        'read:paper',
        'search:color',
        'recommend:paper',
        'estimate:cost',
        'analyze:project',
        'cite:generate',
    ],

    // 插件免费版
    'plugin-free': ['read:color', 'search:color'],

    // 插件付费版
    'plugin-paid': [
        'read:color',
        'read:recipe',
        'read:paper',
        'search:color',
        'recommend:paper',
    ],

    // 管理员
    admin: Object.keys(SCOPES) as Scope[],
};

/**
 * 检查是否拥有指定权限
 */
export function hasScope(userScopes: string[], requiredScope: Scope): boolean {
    return userScopes.includes(requiredScope);
}

/**
 * 检查是否拥有所有指定权限
 */
export function hasAllScopes(userScopes: string[], requiredScopes: Scope[]): boolean {
    return requiredScopes.every((scope) => userScopes.includes(scope));
}

/**
 * 检查是否拥有任一指定权限
 */
export function hasAnyScope(userScopes: string[], requiredScopes: Scope[]): boolean {
    return requiredScopes.some((scope) => userScopes.includes(scope));
}

/**
 * 获取角色对应的权限列表
 */
export function getScopesForRole(role: string): Scope[] {
    return ROLE_SCOPES[role] || [];
}

