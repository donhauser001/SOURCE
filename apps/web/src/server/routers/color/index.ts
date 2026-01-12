/**
 * Color Router - 路由聚合
 *
 * 将所有子模块合并为统一的 colorRouter
 * 保持对外 API 完全兼容
 */

import { createTRPCRouter } from '../../trpc';
import { colorQueriesRouter } from './queries';
import { colorMutationsRouter } from './mutations';
import { colorAdminRouter } from './admin';
import { paperProfileRouter } from './paper-profile';

// 导出类型和工具函数供其他模块使用
export * from './types';

/**
 * 合并所有子路由为统一的 colorRouter
 *
 * API 结构保持不变：
 * - color.get
 * - color.getIdentity
 * - color.list
 * - color.search
 * - color.stats
 * - color.adminList
 * - color.adminListPaginated
 * - color.adminBatchDelete
 * - color.adminImport
 * - color.create
 * - color.update
 * - color.delete
 * - color.paperProfile.list
 * - color.paperProfile.get
 * - color.paperProfile.create
 * - color.paperProfile.update
 * - color.paperProfile.delete
 */
export const colorRouter = createTRPCRouter({
    // 公共查询
    get: colorQueriesRouter.get,
    getIdentity: colorQueriesRouter.getIdentity,
    list: colorQueriesRouter.list,
    search: colorQueriesRouter.search,
    stats: colorQueriesRouter.stats,

    // 管理员查询和操作
    adminList: colorAdminRouter.adminList,
    adminListPaginated: colorAdminRouter.adminListPaginated,
    adminBatchDelete: colorAdminRouter.adminBatchDelete,
    adminImport: colorAdminRouter.adminImport,

    // CRUD 变更
    create: colorMutationsRouter.create,
    update: colorMutationsRouter.update,
    delete: colorMutationsRouter.delete,

    // PaperProfile 子路由
    paperProfile: paperProfileRouter,
});
