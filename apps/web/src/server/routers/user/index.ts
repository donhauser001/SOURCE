/**
 * User Router - 路由聚合
 *
 * 将所有子模块合并为统一的 userRouter
 * 保持对外 API 完全兼容
 */

import { createTRPCRouter } from '../../trpc';
import { userQueriesRouter } from './queries';
import { userAssetsRouter } from './assets';
import { userColorBooksRouter } from './color-books';
import { userWorksRouter } from './works';
import { userAdminRouter } from './admin';

/**
 * 合并所有子路由为统一的 userRouter
 *
 * API 结构保持不变：
 * - user.me
 * - user.updateProfile
 * - user.assetsStats
 * - user.buyIntents
 * - user.analysisReports
 * - user.colorBooks
 * - user.createColorBook
 * - user.updateColorBook
 * - user.deleteColorBook
 * - user.getColorBook
 * - user.addColorToBook
 * - user.removeColorFromBook
 * - user.works
 * - user.worksStats
 * - user.createWork
 * - user.updateWork
 * - user.deleteWork
 * - user.getWork
 * - user.adminList
 * - user.adminUpdate
 * - user.adminStats
 * - user.adminDisable
 * - user.adminEnable
 * - user.adminDelete
 * - user.adminBatchUpdate
 */
export const userRouter = createTRPCRouter({
    // 基本查询
    me: userQueriesRouter.me,
    updateProfile: userQueriesRouter.updateProfile,

    // 用户资产
    assetsStats: userAssetsRouter.assetsStats,
    buyIntents: userAssetsRouter.buyIntents,
    analysisReports: userAssetsRouter.analysisReports,

    // 色彩簿
    colorBooks: userColorBooksRouter.colorBooks,
    createColorBook: userColorBooksRouter.createColorBook,
    updateColorBook: userColorBooksRouter.updateColorBook,
    deleteColorBook: userColorBooksRouter.deleteColorBook,
    getColorBook: userColorBooksRouter.getColorBook,
    addColorToBook: userColorBooksRouter.addColorToBook,
    removeColorFromBook: userColorBooksRouter.removeColorFromBook,

    // 用户作品 @deprecated - 请使用 content.* API
    /** @deprecated 使用 content.myContents */
    works: userWorksRouter.works,
    /** @deprecated 使用 content.myContents 并计算 */
    worksStats: userWorksRouter.worksStats,
    /** @deprecated 使用 content.create */
    createWork: userWorksRouter.createWork,
    /** @deprecated 使用 content.update */
    updateWork: userWorksRouter.updateWork,
    /** @deprecated 使用 content.delete */
    deleteWork: userWorksRouter.deleteWork,
    /** @deprecated 使用 content.get */
    getWork: userWorksRouter.getWork,

    // 管理员功能
    adminList: userAdminRouter.adminList,
    adminUpdate: userAdminRouter.adminUpdate,
    adminStats: userAdminRouter.adminStats,
    adminDisable: userAdminRouter.adminDisable,
    adminEnable: userAdminRouter.adminEnable,
    adminDelete: userAdminRouter.adminDelete,
    adminBatchUpdate: userAdminRouter.adminBatchUpdate,
});
