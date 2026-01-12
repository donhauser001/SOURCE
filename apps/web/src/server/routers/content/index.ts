/**
 * Content Router - 入口文件
 * 
 * 合并所有 content 相关的 router
 */

import { createTRPCRouter } from '../../trpc';
import { contentQueriesRouter } from './queries';
import { contentMutationsRouter } from './mutations';
import { contentAdminRouter } from './admin';

// 合并公开查询和用户操作
export const contentRouter = createTRPCRouter({
    // 公开接口
    publicList: contentQueriesRouter.publicList,
    list: contentQueriesRouter.list,
    get: contentQueriesRouter.get,
    search: contentQueriesRouter.search,
    featured: contentQueriesRouter.featured,
    stats: contentQueriesRouter.stats,

    // 用户操作接口（需要登录）
    create: contentMutationsRouter.create,
    update: contentMutationsRouter.update,
    delete: contentMutationsRouter.delete,
    submit: contentMutationsRouter.submit,
    myContents: contentMutationsRouter.myContents,
    getMyContent: contentMutationsRouter.getMyContent,
});

// 导出管理员 router
export { contentAdminRouter };

// 导出子 router（用于测试）
export { contentQueriesRouter, contentMutationsRouter };
