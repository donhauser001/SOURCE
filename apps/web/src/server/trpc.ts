/**
 * tRPC 服务端配置
 *
 * 这是 tRPC 的核心配置文件，定义了：
 * - Context 创建
 * - Router 初始化
 * - Procedure 构建器（公开/受保护）
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { Session } from 'next-auth';
import crypto from 'crypto';

/**
 * Context 类型定义
 */
interface CreateContextOptions {
    session: Session | null;
    clientFingerprint: string;
}

/**
 * 生成客户端指纹（用于浏览量防刷等场景）
 */
function generateClientFingerprint(req?: Request): string {
    if (!req) {
        return 'unknown';
    }

    // 从请求头提取标识信息
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
        || req.headers.get('x-real-ip') 
        || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-ua';

    // 生成哈希指纹
    const hash = crypto.createHash('sha256');
    hash.update(`${ip}:${userAgent}`);
    return hash.digest('hex').slice(0, 16);
}

/**
 * 创建内部 Context（用于测试或服务端调用）
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
    return {
        session: opts.session,
        clientFingerprint: opts.clientFingerprint,
        prisma,
    };
};

/**
 * 创建 API Context
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
    const session = await auth();
    const req = (opts as any).req as Request | undefined;
    const clientFingerprint = generateClientFingerprint(req);

    return createInnerTRPCContext({
        session: session as Session | null,
        clientFingerprint,
    });
};

/**
 * tRPC 初始化
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
            },
        };
    },
});

/**
 * Router 创建器
 */
export const createTRPCRouter = t.router;

/**
 * 公开 Procedure（无需认证）
 */
export const publicProcedure = t.procedure;

/**
 * 受保护 Procedure（需要登录）
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: '请先登录',
        });
    }
    return next({
        ctx: {
            ...ctx,
            session: { ...ctx.session, user: ctx.session.user },
        },
    });
});

/**
 * 运营人员 Procedure（需要运营或管理员权限）
 */
export const operatorProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: '请先登录',
        });
    }

    const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'OPERATOR') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: '需要运营人员或管理员权限',
        });
    }

    return next({
        ctx: {
            ...ctx,
            session: { ...ctx.session, user: ctx.session.user },
        },
    });
});

/**
 * 管理员 Procedure（需要管理员权限）
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: '请先登录',
        });
    }

    const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: '需要管理员权限',
        });
    }

    return next({
        ctx: {
            ...ctx,
            session: { ...ctx.session, user: ctx.session.user },
        },
    });
});
