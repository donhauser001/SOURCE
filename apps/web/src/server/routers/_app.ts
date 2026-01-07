/**
 * 根 Router
 *
 * 所有子路由在此汇总
 */

import { createTRPCRouter } from '../trpc';
import { colorRouter } from './color';
import { batchRouter } from './batch';
import { userRouter } from './user';
import { apikeyRouter } from './apikey';

export const appRouter = createTRPCRouter({
    color: colorRouter,
    batch: batchRouter,
    user: userRouter,
    apikey: apikeyRouter,
});

export type AppRouter = typeof appRouter;

