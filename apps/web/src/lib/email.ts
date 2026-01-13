/**
 * 邮件服务封装
 * 使用 Resend 发送工单相关邮件
 */

import { Resend } from 'resend';

// 延迟初始化 Resend 客户端（避免在没有 API Key 时崩溃）
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// 发件人配置
const FROM_EMAIL = process.env.EMAIL_FROM || 'SOURCE 支持 <support@source-col.com>';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * 发送邮件
 */
export async function sendEmail(options: SendEmailOptions) {
  // 获取 Resend 客户端
  const client = getResendClient();
  
  if (!client) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('[Email] Sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return { success: false, error };
  }
}

// ============================================================================
// 工单相关邮件模板
// ============================================================================

/**
 * 工单创建通知
 */
export function ticketCreatedEmail(data: {
  ticketNumber: string;
  subject: string;
  description: string;
  userName: string;
}) {
  const { ticketNumber, subject, description, userName } = data;
  
  return {
    subject: `[#${ticketNumber}] 工单已创建：${subject}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 600;">SOURCE 支持</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: 0; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 20px;">您好，${userName}，</p>
    
    <p style="margin: 0 0 20px;">您的工单已成功创建，我们的支持团队会尽快处理。</p>
    
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">工单编号</p>
      <p style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #1a1a1a;">#${ticketNumber}</p>
      
      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">主题</p>
      <p style="margin: 0 0 20px; font-weight: 500;">${subject}</p>
      
      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">描述</p>
      <p style="margin: 0; color: #444;">${description.slice(0, 200)}${description.length > 200 ? '...' : ''}</p>
    </div>
    
    <p style="margin: 20px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://source-col.com'}/support" 
         style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
        查看工单状态
      </a>
    </p>
    
    <p style="margin: 20px 0 0; color: #666; font-size: 14px;">
      如有任何问题，请回复此邮件或访问我们的支持中心。
    </p>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
    <p style="margin: 0;">© ${new Date().getFullYear()} SOURCE. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    text: `您好，${userName}，

您的工单已成功创建。

工单编号：#${ticketNumber}
主题：${subject}
描述：${description.slice(0, 200)}${description.length > 200 ? '...' : ''}

请访问 ${process.env.NEXT_PUBLIC_APP_URL || 'https://source-col.com'}/support 查看工单状态。

SOURCE 支持团队`,
  };
}

/**
 * 工单回复通知
 */
export function ticketRepliedEmail(data: {
  ticketNumber: string;
  subject: string;
  replyContent: string;
  replierName: string;
  isStaffReply: boolean;
  userName: string;
}) {
  const { ticketNumber, subject, replyContent, replierName, isStaffReply, userName } = data;
  
  const replyType = isStaffReply ? '客服回复' : '新回复';
  
  return {
    subject: `[#${ticketNumber}] ${replyType}：${subject}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 600;">SOURCE 支持</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: 0; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 20px;">您好，${userName}，</p>
    
    <p style="margin: 0 0 20px;">您的工单 <strong>#${ticketNumber}</strong> 有新回复。</p>
    
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isStaffReply ? '#10b981' : '#6366f1'};">
      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
        <strong>${replierName}</strong> ${isStaffReply ? '（支持团队）' : ''} 回复：
      </p>
      <p style="margin: 0; color: #333; white-space: pre-wrap;">${replyContent}</p>
    </div>
    
    <p style="margin: 20px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://source-col.com'}/support" 
         style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
        查看完整对话
      </a>
    </p>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
    <p style="margin: 0;">© ${new Date().getFullYear()} SOURCE. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    text: `您好，${userName}，

您的工单 #${ticketNumber} 有新回复。

${replierName}${isStaffReply ? '（支持团队）' : ''} 回复：
${replyContent}

请访问 ${process.env.NEXT_PUBLIC_APP_URL || 'https://source-col.com'}/support 查看完整对话。

SOURCE 支持团队`,
  };
}

/**
 * 工单状态变更通知
 */
export function ticketStatusChangedEmail(data: {
  ticketNumber: string;
  subject: string;
  oldStatus: string;
  newStatus: string;
  userName: string;
}) {
  const { ticketNumber, subject, oldStatus, newStatus, userName } = data;
  
  const statusLabels: Record<string, string> = {
    OPEN: '待处理',
    IN_PROGRESS: '处理中',
    WAITING_REPLY: '等待回复',
    RESOLVED: '已解决',
    CLOSED: '已关闭',
  };
  
  const oldStatusLabel = statusLabels[oldStatus] || oldStatus;
  const newStatusLabel = statusLabels[newStatus] || newStatus;
  
  const statusColor = {
    OPEN: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    WAITING_REPLY: '#8b5cf6',
    RESOLVED: '#10b981',
    CLOSED: '#6b7280',
  }[newStatus] || '#666';
  
  return {
    subject: `[#${ticketNumber}] 状态更新：${newStatusLabel}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 600;">SOURCE 支持</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: 0; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 20px;">您好，${userName}，</p>
    
    <p style="margin: 0 0 20px;">您的工单状态已更新。</p>
    
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">工单编号</p>
      <p style="margin: 0 0 20px; font-weight: 600;">#${ticketNumber}</p>
      
      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">主题</p>
      <p style="margin: 0 0 20px;">${subject}</p>
      
      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">状态变更</p>
      <p style="margin: 0;">
        <span style="background: #e5e5e5; padding: 4px 12px; border-radius: 4px; font-size: 14px;">${oldStatusLabel}</span>
        <span style="margin: 0 10px;">→</span>
        <span style="background: ${statusColor}; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 14px;">${newStatusLabel}</span>
      </p>
    </div>
    
    <p style="margin: 20px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://source-col.com'}/support" 
         style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
        查看工单详情
      </a>
    </p>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
    <p style="margin: 0;">© ${new Date().getFullYear()} SOURCE. All rights reserved.</p>
  </div>
</body>
</html>
    `,
    text: `您好，${userName}，

您的工单状态已更新。

工单编号：#${ticketNumber}
主题：${subject}
状态变更：${oldStatusLabel} → ${newStatusLabel}

请访问 ${process.env.NEXT_PUBLIC_APP_URL || 'https://source-col.com'}/support 查看工单详情。

SOURCE 支持团队`,
  };
}
