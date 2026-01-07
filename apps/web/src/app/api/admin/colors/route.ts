/**
 * 色彩管理 API - 列表和创建
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createColorSchema } from '@/lib/validations/color';

// 权限检查
async function checkAdminPermission() {
    const session = await auth();
    if (!session?.user) {
        return { error: 'Unauthorized', status: 401 };
    }

    const userRole = (session.user as { role?: string })?.role || 'USER';
    if (!['ADMIN', 'OPERATOR'].includes(userRole)) {
        return { error: 'Forbidden', status: 403 };
    }

    return { session, userRole };
}

// POST: 创建色彩
export async function POST(request: NextRequest) {
    const authResult = await checkAdminPermission();
    if ('error' in authResult) {
        return NextResponse.json(
            { message: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const body = await request.json();
        const validatedData = createColorSchema.parse(body);

        // 检查 colorId 和 slug 是否已存在
        const existing = await prisma.color.findFirst({
            where: {
                OR: [
                    { colorId: validatedData.colorId },
                    { slug: validatedData.slug },
                ],
            },
        });

        if (existing) {
            return NextResponse.json(
                { message: '色彩编号或 slug 已存在' },
                { status: 400 }
            );
        }

        const color = await prisma.color.create({
            data: {
                colorId: validatedData.colorId,
                name: validatedData.name,
                slug: validatedData.slug,
                labL: validatedData.labL,
                labA: validatedData.labA,
                labB: validatedData.labB,
                deltaETolerance: validatedData.deltaETolerance,
                measurementDevice: validatedData.measurementDevice,
                measurementStandard: validatedData.measurementStandard,
                measurementCondition: validatedData.measurementCondition || null,
                measuredAt: validatedData.measuredAt,
                trueSourceNote: validatedData.trueSourceNote || null,
                status: validatedData.status,
                auditStatus: validatedData.auditStatus,
                auditors: validatedData.auditors,
                auditNotes: validatedData.auditNotes || null,
                version: validatedData.version,
                sourceType: validatedData.sourceType,
                batchId: validatedData.batchId || null,
            },
        });

        return NextResponse.json(color, { status: 201 });
    } catch (error) {
        console.error('Create color error:', error);

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { message: '数据验证失败', details: error },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: '创建失败' },
            { status: 500 }
        );
    }
}

// GET: 获取色彩列表
export async function GET() {
    const authResult = await checkAdminPermission();
    if ('error' in authResult) {
        return NextResponse.json(
            { message: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const colors = await prisma.color.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        recipes: true,
                        paperProfiles: true,
                        participations: true,
                    },
                },
            },
        });

        return NextResponse.json(colors);
    } catch (error) {
        console.error('Get colors error:', error);
        return NextResponse.json(
            { message: '获取失败' },
            { status: 500 }
        );
    }
}

