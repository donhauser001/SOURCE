/**
 * 导入任务状态查询 API
 * 
 * GET /api/admin/import/status?jobId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getImportJobStatus, isRedisAvailable } from '@/lib/queue';

export async function GET(request: NextRequest) {
    // 验证登录
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 验证管理员权限
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'OPERATOR')) {
        return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 获取 jobId
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
        return NextResponse.json({ error: '缺少 jobId 参数' }, { status: 400 });
    }

    // 从数据库获取任务信息
    const importJob = await prisma.importJob.findUnique({
        where: { id: jobId },
        select: {
            id: true,
            type: true,
            status: true,
            totalCount: true,
            successCount: true,
            failedCount: true,
            errors: true,
            createdAt: true,
            completedAt: true,
        },
    });

    if (!importJob) {
        return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    // 如果任务还在进行中，尝试从队列获取实时进度
    let queueStatus = null;
    if (importJob.status === 'PENDING' || importJob.status === 'PROCESSING') {
        const redisAvailable = await isRedisAvailable();
        if (redisAvailable) {
            queueStatus = await getImportJobStatus(jobId);
        }
    }

    return NextResponse.json({
        ...importJob,
        progress: queueStatus?.progress ?? (importJob.status === 'COMPLETED' ? 100 : 0),
        queueState: queueStatus?.state,
    });
}
