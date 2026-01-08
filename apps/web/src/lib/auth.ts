/**
 * NextAuth.js 配置 (v5)
 *
 * 支持：
 * - 邮箱魔法链接登录
 * - 开发环境凭证登录
 */

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Nodemailer from 'next-auth/providers/nodemailer';
import { prisma } from './db';

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
        error: '/login',
        verifyRequest: '/login/verify',
    },
    providers: [
        // 邮箱魔法链接登录（需要配置 EMAIL_SERVER）
        ...(process.env.EMAIL_SERVER
            ? [
                Nodemailer({
                    server: process.env.EMAIL_SERVER,
                    from: process.env.EMAIL_FROM || 'SOURCE <noreply@source.ink>',
                }),
            ]
            : []),
        // 开发环境：凭证登录（仅用于测试）
        ...(process.env.NODE_ENV === 'development'
            ? [
                Credentials({
                    id: 'dev-credentials',
                    name: '开发登录',
                    credentials: {
                        email: { label: '邮箱', type: 'email' },
                    },
                    async authorize(credentials) {
                        const email = credentials?.email as string;
                        if (!email) return null;

                        // 管理员邮箱列表（开发环境自动授权）
                        const adminEmails = ['admin@source.ink', 'dev-admin@source.ink'];
                        const isAdmin = adminEmails.includes(email);

                        // 开发环境自动创建/获取用户
                        let user = await prisma.user.findUnique({
                            where: { email },
                        });

                        if (!user) {
                            user = await prisma.user.create({
                                data: {
                                    email,
                                    name: email.split('@')[0],
                                    role: isAdmin ? 'ADMIN' : 'USER',
                                },
                            });
                        } else if (isAdmin && user.role !== 'ADMIN') {
                            // 确保管理员邮箱拥有管理员权限
                            user = await prisma.user.update({
                                where: { id: user.id },
                                data: { role: 'ADMIN' },
                            });
                        }

                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            image: user.image,
                        };
                    },
                }),
            ]
            : []),
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

