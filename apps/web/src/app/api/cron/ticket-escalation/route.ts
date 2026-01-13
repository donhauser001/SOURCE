/**
 * 工单优先级升级 Cron API
 * 
 * 用于定期检查和升级长时间未处理的工单优先级
 * 
 * 配置 Vercel Cron（vercel.json）:
 * {
 *   "crons": [{
 *     "path": "/api/cron/ticket-escalation",
 *     "schedule": "0 * * * *"  // 每小时执行
 *   }]
 * }
 */

import { NextResponse } from 'next/server';
import { runTicketEscalation, logEscalationResult } from '@/lib/cron/ticket-escalation';

// Vercel Cron 需要的配置
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 最大执行时间 60 秒

export async function GET(request: Request) {
  try {
    // 验证请求来源（Vercel Cron 或授权请求）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // 如果设置了 CRON_SECRET，则验证
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 执行升级任务
    const result = await runTicketEscalation();
    
    // 记录日志
    logEscalationResult(result);

    return NextResponse.json({
      success: true,
      message: `Processed ${result.total} tickets, escalated ${result.escalated}`,
      result,
    });
  } catch (error) {
    console.error('[Cron] Ticket escalation failed:', error);
    return NextResponse.json(
      { error: 'Escalation failed', details: String(error) },
      { status: 500 }
    );
  }
}
