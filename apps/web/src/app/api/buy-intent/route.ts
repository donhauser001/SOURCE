/**
 * 购买意图记录 API
 * 
 * v0.3.0 - Bridge 阶段
 * 
 * POST /api/buy-intent
 * 记录用户的购买意图（点击购买按钮时触发）
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { cookies } from 'next/headers';

// 简单的 session ID 生成
function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// 请求 Schema
const buyIntentSchema = z.object({
    proofingPackId: z.string(),
    referrer: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = buyIntentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: '请求数据格式错误' } },
                { status: 400 }
            );
        }

        const { proofingPackId, referrer } = parsed.data;

        // 验证打样包存在
        const proofingPack = await prisma.proofingPack.findUnique({
            where: { id: proofingPackId },
        });

        if (!proofingPack) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: '打样包不存在' } },
                { status: 404 }
            );
        }

        // 获取用户 ID（如果已登录）
        const session = await auth();
        const userId = session?.user?.id || null;

        // 获取或创建 session ID（用于匿名用户追踪）
        const cookieStore = await cookies();
        const existingSessionId = cookieStore.get('source_session')?.value;
        const sessionId = existingSessionId || generateSessionId();

        // 创建购买意图记录
        const buyIntent = await prisma.buyIntent.create({
            data: {
                proofingPackId,
                userId,
                sessionId,
                referrer: referrer?.substring(0, 500), // 限制长度
            },
        });

        // 构建响应
        const response = NextResponse.json({
            ok: true,
            data: {
                id: buyIntent.id,
                recorded: true,
            },
        });

        // 设置 session cookie（如果是新的）
        if (!existingSessionId) {
            response.cookies.set({
                name: 'source_session',
                value: sessionId,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 365, // 1 年
            });
        }

        return response;

    } catch (error) {
        console.error('[BuyIntent Error]', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
            { status: 500 }
        );
    }
}

