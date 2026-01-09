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
import { auditNoteRouter } from './audit-note';
import { partnerRouter } from './partner';
import { adminAuditLogRouter } from './admin-audit-log';
import { colorBookRouter } from './color-book';
import { colorBookCategoryRouter } from './color-book-category';
import { paperTypeRouter } from './paper-type';
import { inkRouter } from './ink';

export const appRouter = createTRPCRouter({
    color: colorRouter,
    batch: batchRouter,
    user: userRouter,
    apikey: apikeyRouter,
    proofingPack: proofingPackRouter,
    buyIntent: buyIntentRouter,
    activationCode: activationCodeRouter,
    auditNote: auditNoteRouter,
    partner: partnerRouter,
    adminAuditLog: adminAuditLogRouter,
    colorBook: colorBookRouter,
    colorBookCategory: colorBookCategoryRouter,
    paperType: paperTypeRouter,
    ink: inkRouter,
});

export type AppRouter = typeof appRouter;

