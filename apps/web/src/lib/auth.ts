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

                        // 开发环境自动创建/获取用户
                        let user = await prisma.user.findUnique({
                            where: { email },
                        });

                        if (!user) {
                            user = await prisma.user.create({
                                data: {
                                    email,
                                    name: email.split('@')[0],
                                },
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

                // 获取用户权限等级
                const user = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { tier: true },
                });
                if (user) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (session.user as { tier?: string }).tier = user.tier;
                }
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
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
        };
    }
}
