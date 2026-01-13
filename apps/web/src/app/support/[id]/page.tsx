'use client';

/**
 * 工单详情页面
 */

import { use, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronRight,
  Send,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Plus,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ticketStatusLabels,
  ticketPriorityLabels,
} from '@/lib/validations/support';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 状态颜色映射
const statusStyles: Record<string, string> = {
  OPEN: 'bg-blue-500/10 text-blue-600',
  IN_PROGRESS: 'bg-yellow-500/10 text-yellow-600',
  PENDING_USER: 'bg-orange-500/10 text-orange-600',
  RESOLVED: 'bg-green-500/10 text-green-600',
  CLOSED: 'bg-foreground/10 text-foreground/60',
};

// 状态图标映射
const statusIcons: Record<string, typeof Clock> = {
  OPEN: AlertCircle,
  IN_PROGRESS: Clock,
  PENDING_USER: MessageSquare,
  RESOLVED: CheckCircle,
  CLOSED: CheckCircle,
};

// 回复表单 schema
const replySchema = z.object({
  content: z.string().min(1, '回复内容不能为空'),
});

type ReplyForm = z.infer<typeof replySchema>;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  // 获取工单详情
  const { data: ticket, isLoading } = trpc.ticket.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  // 获取回复列表
  const { data: replies } = trpc.ticket.replyList.useQuery(
    { ticketId: id },
    { enabled: !!id }
  );

  const form = useForm<ReplyForm>({
    resolver: zodResolver(replySchema),
    defaultValues: { content: '' },
  });

  // 提交回复
  const replyMutation = trpc.ticket.replyCreate.useMutation({
    onSuccess: () => {
      toast.success('回复已发送');
      form.reset();
      utils.ticket.replyList.invalidate({ ticketId: id });
      utils.ticket.getById.invalidate({ id });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error(error.message || '发送失败，请重试');
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: ReplyForm) => {
    setIsSubmitting(true);
    replyMutation.mutate({
      ticketId: id,
      content: data.content,
      replyType: 'PUBLIC',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="h-px bg-foreground/5 mt-16" />
        <main className="max-w-[1000px] mx-auto px-6 py-8">
          <div className="space-y-4">
            <div className="h-6 w-48 rounded bg-foreground/5 animate-pulse" />
            <div className="h-10 w-3/4 rounded bg-foreground/5 animate-pulse" />
            <div className="h-40 rounded-2xl bg-foreground/[0.03] animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="h-px bg-foreground/5 mt-16" />
        <main className="max-w-[1000px] mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-foreground/[0.04] flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-foreground/30" />
          </div>
          <h1 className="text-xl font-bold text-foreground/80 mb-2">工单不存在</h1>
          <p className="text-foreground/50 mb-6">
            您访问的工单不存在或无权查看
          </p>
          <Link
            href="/support"
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            返回工单列表
          </Link>
        </main>
      </div>
    );
  }

  const StatusIcon = statusIcons[ticket.status] || Clock;
  const canReply = ticket.status !== 'CLOSED';

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* 顶部分割线 */}
      <div className="h-px bg-foreground/5 mt-16" />

      <main className="max-w-[1000px] mx-auto px-6 py-8">
        {/* 面包屑 */}
        <nav className="flex items-center gap-1.5 text-[13px] text-foreground/40 mb-6">
          <Link href="/docs" className="hover:text-foreground/60 transition-colors">
            支持
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/support" className="hover:text-foreground/60 transition-colors">
            我的工单
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground/70">#{ticket.ticketNo}</span>
        </nav>

        {/* 工单头部 */}
        <div className="mb-8 pb-8 border-b border-foreground/5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-foreground/40 font-mono">
              #{ticket.ticketNo}
            </span>
            <span className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
              statusStyles[ticket.status]
            )}>
              <StatusIcon className="w-3.5 h-3.5" />
              {ticketStatusLabels[ticket.status as keyof typeof ticketStatusLabels]}
            </span>
            <span className="text-xs text-foreground/40 px-2 py-1 rounded-full bg-foreground/[0.04]">
              {ticketPriorityLabels[ticket.priority as keyof typeof ticketPriorityLabels]}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            {ticket.subject}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/40">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(ticket.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
            {ticket.category && (
              <span>分类：{ticket.category.name}</span>
            )}
            {ticket.assignee && (
              <span>处理人：{ticket.assignee.name || ticket.assignee.email}</span>
            )}
          </div>
        </div>

        {/* 工单描述 */}
        <div className="mb-6 p-5 rounded-2xl bg-foreground/[0.02] border border-foreground/5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-foreground/[0.08] text-foreground/60 text-sm">
                {ticket.user?.name?.[0] || ticket.user?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground/80">
                {ticket.user?.name || ticket.user?.email || '用户'}
              </p>
              <p className="text-xs text-foreground/40">
                {new Date(ticket.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm text-foreground/70 leading-relaxed">
            {ticket.description}
          </div>
        </div>

        {/* 回复列表 */}
        {replies && replies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-foreground/60 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              回复记录 ({replies.length})
            </h2>
            
            <div className="space-y-4">
              {replies.map((reply: any) => {
                const isStaff = reply.user?.role === 'ADMIN' || reply.user?.role === 'OPERATOR';
                
                return (
                  <div
                    key={reply.id}
                    className={cn(
                      "p-5 rounded-2xl border",
                      isStaff 
                        ? "bg-blue-500/[0.03] border-blue-500/10" 
                        : "bg-foreground/[0.02] border-foreground/5"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className={cn(
                          "text-sm",
                          isStaff 
                            ? "bg-blue-500/20 text-blue-600" 
                            : "bg-foreground/[0.08] text-foreground/60"
                        )}>
                          {isStaff ? 'S' : (reply.user?.name?.[0] || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground/80">
                            {reply.user?.name || reply.user?.email || '用户'}
                          </p>
                          {isStaff && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                              客服
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/40">
                          {new Date(reply.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-foreground/70 leading-relaxed">
                      {reply.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 回复表单 */}
        {canReply ? (
          <div className="p-5 rounded-2xl border border-foreground/5">
            <h3 className="text-sm font-medium text-foreground/70 mb-4">添加回复</h3>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Textarea
                placeholder="输入您的回复内容..."
                rows={4}
                className="rounded-xl bg-foreground/[0.03] border-foreground/10 placeholder:text-foreground/30 resize-none"
                {...form.register('content')}
              />
              {form.formState.errors.content && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {form.formState.errors.content.message}
                </p>
              )}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      发送回复
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-foreground/[0.02] border border-foreground/5 text-center">
            <CheckCircle className="w-10 h-10 mx-auto text-foreground/30 mb-3" />
            <p className="text-foreground/50 mb-4">
              此工单已关闭，如有其他问题请提交新工单
            </p>
            <Link
              href="/support/new"
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              提交新工单
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
