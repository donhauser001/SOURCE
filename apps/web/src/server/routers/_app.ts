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
import { proofingPackRouter } from './proofing-pack';
import { buyIntentRouter } from './buy-intent';
import { activationCodeRouter } from './activation-code';

export const appRouter = createTRPCRouter({
    color: colorRouter,
    batch: batchRouter,
    user: userRouter,
    apikey: apikeyRouter,
    proofingPack: proofingPackRouter,
    buyIntent: buyIntentRouter,
    activationCode: activationCodeRouter,
});

export type AppRouter = typeof appRouter;

