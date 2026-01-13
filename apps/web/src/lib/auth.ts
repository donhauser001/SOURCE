/**
 * NextAuth.js 配置 (v5)
 *
 * 支持：
 * - 邮箱密码登录
 */

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './db';

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    providers: [
        // 邮箱密码登录
        Credentials({
            id: 'credentials',
            name: '邮箱密码登录',
            credentials: {
                email: { label: '邮箱', type: 'email' },
                password: { label: '密码', type: 'password' },
            },
            async authorize(credentials) {
                const email = credentials?.email as string;
                const password = credentials?.password as string;
                
                if (!email || !password) return null;

                // 查找用户
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) return null;

                // 验证密码（从环境变量或数据库验证）
                // 管理员密码验证
                const adminPassword = process.env.ADMIN_PASSWORD || 'Anyfree752538';
                if (user.role === 'ADMIN' && password === adminPassword) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    };
                }

                // 普通用户暂不支持密码登录
                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub!;

                // 获取用户权限等级和角色
                const user = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { tier: true, role: true },
                });
                if (user) {
                    (session.user as { tier?: string; role?: string }).tier = user.tier;
                    (session.user as { tier?: string; role?: string }).role = user.role;
                }
            }
            return session;
        },
        async jwt({ token, user, trigger }) {
            if (user) {
                token.sub = user.id;
                // 首次登录时获取角色
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { role: true },
                });
                (token as { role?: string }).role = dbUser?.role || 'USER';
            }
            // 刷新时也更新角色
            if (trigger === 'update' && token.sub) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { role: true },
                });
                (token as { role?: string }).role = dbUser?.role || 'USER';
            }
            return token;
        },
        async redirect({ url, baseUrl }) {
            // 默认行为：如果有 callbackUrl 则使用
            if (url.startsWith(baseUrl)) return url;
            if (url.startsWith('/')) return `${baseUrl}${url}`;
            return baseUrl;
        },
    },
});

// 扩展 NextAuth 类型
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            tier?: string;
            role?: string;
        };
    }
}

