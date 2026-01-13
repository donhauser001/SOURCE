/**
 * 工单优先级自动升级
 * 
 * 升级规则：
 * - LOW 超过 72 小时未处理 -> NORMAL
 * - NORMAL 超过 48 小时未处理 -> HIGH
 * - HIGH 超过 24 小时未处理 -> URGENT
 * 
 * 可通过 Vercel Cron 或外部调度器定期执行
 */

import { prisma } from '@/lib/db';

// 升级规则（小时）
const ESCALATION_RULES = {
  LOW: { threshold: 72, targetPriority: 'NORMAL' },      // 72小时 -> NORMAL
  NORMAL: { threshold: 48, targetPriority: 'HIGH' },     // 48小时 -> HIGH
  HIGH: { threshold: 24, targetPriority: 'URGENT' },     // 24小时 -> URGENT
} as const;

// 需要检查的工单状态（排除已解决和已关闭的）
const ACTIVE_STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING_USER'];

export interface EscalationResult {
  total: number;
  escalated: number;
  details: Array<{
    ticketNo: string;
    oldPriority: string;
    newPriority: string;
    hoursOpen: number;
  }>;
}

/**
 * 执行工单优先级升级
 */
export async function runTicketEscalation(): Promise<EscalationResult> {
  const now = new Date();
  const result: EscalationResult = {
    total: 0,
    escalated: 0,
    details: [],
  };

  // 获取所有活跃工单
  const tickets = await prisma.supportTicket.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      priority: { in: ['LOW', 'NORMAL', 'HIGH'] }, // 不包含 URGENT
    },
    select: {
      id: true,
      ticketNo: true,
      priority: true,
      createdAt: true,
      firstReplyAt: true,
    },
  });

  result.total = tickets.length;

  // 批量更新
  const updates: Array<{ id: string; priority: string; ticketNo: string; oldPriority: string; hoursOpen: number }> = [];

  for (const ticket of tickets) {
    const rule = ESCALATION_RULES[ticket.priority as keyof typeof ESCALATION_RULES];
    if (!rule) continue;

    // 计算未处理时间（以首次回复时间或创建时间为准）
    const referenceTime = ticket.firstReplyAt || ticket.createdAt;
    const hoursOpen = (now.getTime() - referenceTime.getTime()) / (1000 * 60 * 60);

    if (hoursOpen >= rule.threshold) {
      updates.push({
        id: ticket.id,
        priority: rule.targetPriority,
        ticketNo: ticket.ticketNo,
        oldPriority: ticket.priority,
        hoursOpen: Math.round(hoursOpen),
      });
    }
  }

  // 执行批量更新
  if (updates.length > 0) {
    await Promise.all(
      updates.map(update =>
        prisma.supportTicket.update({
          where: { id: update.id },
          data: { priority: update.priority as 'NORMAL' | 'HIGH' | 'URGENT' },
        })
      )
    );

    result.escalated = updates.length;
    result.details = updates.map(u => ({
      ticketNo: u.ticketNo,
      oldPriority: u.oldPriority,
      newPriority: u.priority,
      hoursOpen: u.hoursOpen,
    }));
  }

  return result;
}

/**
 * 记录升级日志
 */
export function logEscalationResult(result: EscalationResult): void {
  console.log(`[Ticket Escalation] Processed ${result.total} tickets, escalated ${result.escalated}`);
  
  if (result.details.length > 0) {
    console.log('[Ticket Escalation] Escalated tickets:');
    result.details.forEach(detail => {
      console.log(`  - ${detail.ticketNo}: ${detail.oldPriority} -> ${detail.newPriority} (${detail.hoursOpen}h open)`);
    });
  }
}
