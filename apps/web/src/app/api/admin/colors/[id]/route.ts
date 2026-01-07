/**
 * 色彩管理 API - 单个色彩操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateColorSchema } from '@/lib/validations/color';

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

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET: 获取单个色彩
export async function GET(
    _request: NextRequest,
    context: RouteContext
) {
    const authResult = await checkAdminPermission();
    if ('error' in authResult) {
        return NextResponse.json(
            { message: authResult.error },
            { status: authResult.status }
        );
    }

    const { id } = await context.params;

    try {
        const color = await prisma.color.findUnique({
            where: { id },
            include: {
                recipes: {
                    include: {
                        ingredients: true,
                    },
                },
                paperProfiles: true,
                paperRecommendations: {
                    include: {
                        paper: true,
                    },
                },
                risks: true,
                participations: {
                    include: {
                        partner: true,
                        user: true,
                    },
                },
            },
        });

        if (!color) {
            return NextResponse.json(
                { message: '色彩不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json(color);
    } catch (error) {
        console.error('Get color error:', error);
        return NextResponse.json(
            { message: '获取失败' },
            { status: 500 }
        );
    }
}

// PUT: 更新色彩
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    const authResult = await checkAdminPermission();
    if ('error' in authResult) {
        return NextResponse.json(
            { message: authResult.error },
            { status: authResult.status }
        );
    }

    const { id } = await context.params;

    try {
        const body = await request.json();
        const validatedData = updateColorSchema.parse({ ...body, id });

        // 检查色彩是否存在
        const existing = await prisma.color.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { message: '色彩不存在' },
                { status: 404 }
            );
        }

        // 如果更新 slug，检查是否与其他记录冲突
        if (validatedData.slug && validatedData.slug !== existing.slug) {
            const slugConflict = await prisma.color.findFirst({
                where: {
                    slug: validatedData.slug,
                    NOT: { id },
                },
            });

            if (slugConflict) {
                return NextResponse.json(
                    { message: 'Slug 已被使用' },
                    { status: 400 }
                );
            }
        }

        const color = await prisma.color.update({
            where: { id },
            data: {
                name: validatedData.name,
                slug: validatedData.slug,
                labL: validatedData.labL,
                labA: validatedData.labA,
                labB: validatedData.labB,
                deltaETolerance: validatedData.deltaETolerance,
                measurementDevice: validatedData.measurementDevice,
                measurementStandard: validatedData.measurementStandard,
                measurementCondition: validatedData.measurementCondition,
                measuredAt: validatedData.measuredAt,
                trueSourceNote: validatedData.trueSourceNote,
                status: validatedData.status,
                auditStatus: validatedData.auditStatus,
                auditors: validatedData.auditors,
                auditNotes: validatedData.auditNotes,
                lastAuditAt: validatedData.lastAuditAt,
                version: validatedData.version,
                lastVerifiedAt: validatedData.lastVerifiedAt,
                sourceType: validatedData.sourceType,
                batchId: validatedData.batchId,
            },
        });

        return NextResponse.json(color);
    } catch (error) {
        console.error('Update color error:', error);

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { message: '数据验证失败', details: error },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: '更新失败' },
            { status: 500 }
        );
    }
}

// DELETE: 删除色彩
export async function DELETE(
    _request: NextRequest,
    context: RouteContext
) {
    const authResult = await checkAdminPermission();
    if ('error' in authResult) {
        return NextResponse.json(
            { message: authResult.error },
            { status: authResult.status }
        );
    }

    // 仅 ADMIN 可删除
    if (authResult.userRole !== 'ADMIN') {
        return NextResponse.json(
            { message: '仅管理员可删除色彩' },
            { status: 403 }
        );
    }

    const { id } = await context.params;

    try {
        await prisma.color.delete({
            where: { id },
        });

        return NextResponse.json({ message: '删除成功' });
    } catch (error) {
        console.error('Delete color error:', error);
        return NextResponse.json(
            { message: '删除失败' },
            { status: 500 }
        );
    }
}

