'use client';

/**
 * 我的工单页面
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Search,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ticketStatusLabels,
  ticketPriorityLabels,
} from '@/lib/validations/support';
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

export default function SupportPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // 获取工单列表
  const { data: tickets, isLoading } = trpc.ticket.myTickets.useQuery({
    status: status || undefined,
    search: search || undefined,
    page,
    limit: 10,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* 顶部分割线 */}
      <div className="h-px bg-foreground/5 mt-16" />

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* 面包屑 */}
        <nav className="flex items-center gap-1.5 text-[13px] text-foreground/40 mb-6">
          <Link href="/docs" className="hover:text-foreground/60 transition-colors">
            支持
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground/70">我的工单</span>
        </nav>

        {/* 头部 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">我的工单</h1>
            <p className="text-foreground/50 mt-1 text-sm">
              查看和管理您提交的支持请求
            </p>
          </div>
          <Link
            href="/support/new"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            提交工单
          </Link>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <Input
              placeholder="搜索工单..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 h-10 bg-foreground/[0.06] border-0 rounded-full placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-0"
            />
          </div>
          <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[160px] h-10 rounded-full bg-foreground/[0.06] border-0">
              <SelectValue placeholder="所有状态" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">所有状态</SelectItem>
              {Object.entries(ticketStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 工单列表 */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-foreground/[0.03] animate-pulse" />
            ))}
          </div>
        ) : tickets?.items?.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-foreground/[0.04] flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-foreground/30" />
            </div>
            <h3 className="text-lg font-medium text-foreground/70 mb-2">暂无工单</h3>
            <p className="text-foreground/40 mb-6 text-sm">
              {search || status ? '没有找到匹配的工单' : '您还没有提交过工单'}
            </p>
            <Link
              href="/support/new"
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              提交第一个工单
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets?.items?.map((ticket: any) => {
              const StatusIcon = statusIcons[ticket.status] || Clock;
              
              return (
                <div
                  key={ticket.id}
                  onClick={() => router.push(`/support/${ticket.id}`)}
                  className="group p-5 rounded-2xl border border-foreground/5 hover:border-foreground/10 hover:bg-foreground/[0.02] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-foreground/40 font-mono">
                          #{ticket.ticketNo}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          statusStyles[ticket.status]
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {ticketStatusLabels[ticket.status as keyof typeof ticketStatusLabels]}
                        </span>
                        <span className="text-xs text-foreground/40">
                          {ticketPriorityLabels[ticket.priority as keyof typeof ticketPriorityLabels]}
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-foreground/90 truncate mb-1">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-foreground/50 line-clamp-1">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-foreground/40">
                        <span>
                          {new Date(ticket.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        {ticket._count?.replies > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {ticket._count.replies} 条回复
                          </span>
                        )}
                        {ticket.category && (
                          <span>{ticket.category.name}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground/20 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {tickets && tickets.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full"
            >
              上一页
            </Button>
            <span className="text-sm text-foreground/40 px-4">
              {page} / {tickets.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(tickets.totalPages, p + 1))}
              disabled={page >= tickets.totalPages}
              className="rounded-full"
            >
              下一页
            </Button>
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-12 p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-foreground/50" />
            </div>
            <div>
              <h3 className="font-medium text-foreground/80 mb-1">需要帮助？</h3>
              <p className="text-sm text-foreground/50 mb-3">
                在提交工单之前，您可以先查看文档中心，也许能找到您需要的答案。
              </p>
              <Link
                href="/docs/center"
                className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                访问文档中心
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
