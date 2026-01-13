/**
 * 工单详情页面
 */

'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Send,
  Loader2,
  User,
  Clock,
  Tag,
  MessageSquare,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ticketStatusLabels,
  ticketPriorityLabels,
} from '@/lib/validations/support';

interface Props {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800 border-red-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  PENDING_USER: 'bg-orange-100 text-orange-800 border-orange-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function TicketDetailPage({ params }: Props) {
  const { id } = use(params);
  const utils = trpc.useUtils();

  const [replyContent, setReplyContent] = useState('');
  const [replyType, setReplyType] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');

  // 获取工单详情
  const { data: ticket, isLoading } = trpc.ticket.adminGet.useQuery({ id });

  // 获取可分配的管理员
  const { data: assignees } = trpc.ticket.adminAssignees.useQuery();

  // 更新工单
  const updateMutation = trpc.ticket.adminUpdate.useMutation({
    onSuccess: () => {
      utils.ticket.adminGet.invalidate({ id });
    },
  });

  // 分配工单
  const assignMutation = trpc.ticket.adminAssign.useMutation({
    onSuccess: () => {
      utils.ticket.adminGet.invalidate({ id });
    },
  });

  // 回复工单
  const replyMutation = trpc.ticket.adminReply.useMutation({
    onSuccess: () => {
      utils.ticket.adminGet.invalidate({ id });
      setReplyContent('');
    },
  });

  const handleReply = () => {
    if (!replyContent.trim()) return;
    replyMutation.mutate({
      ticketId: id,
      content: replyContent,
      replyType,
      attachments: [],
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">工单不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/support/tickets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <Badge className={statusColors[ticket.status]}>
              {ticketStatusLabels[ticket.status as keyof typeof ticketStatusLabels]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{ticket.ticketNo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：对话 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 原始问题 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={ticket.user?.image || ''} />
                  <AvatarFallback>
                    {ticket.user?.name?.[0] || ticket.user?.email?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{ticket.user?.name || ticket.user?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
                <Badge variant="outline">提交人</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
              {ticket.attachments?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ticket.attachments.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      附件 {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 回复列表 */}
          {ticket.replies?.map((reply) => {
            const isAdmin = reply.user?.role === 'ADMIN' || reply.user?.role === 'OPERATOR';
            const isInternal = reply.replyType === 'INTERNAL';

            return (
              <Card
                key={reply.id}
                className={isInternal ? 'border-dashed bg-muted/30' : ''}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={reply.user?.image || ''} />
                      <AvatarFallback>
                        {reply.user?.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{reply.user?.name || reply.user?.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(reply.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isInternal && (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          内部备注
                        </Badge>
                      )}
                      {isAdmin && (
                        <Badge variant="default">客服</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{reply.content}</p>
                  {reply.attachments?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {reply.attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          附件 {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* 回复框 */}
          {ticket.status !== 'CLOSED' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  添加回复
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={replyType} onValueChange={(v) => setReplyType(v as 'PUBLIC' | 'INTERNAL')}>
                  <TabsList>
                    <TabsTrigger value="PUBLIC" className="gap-1">
                      <Eye className="h-3 w-3" />
                      公开回复
                    </TabsTrigger>
                    <TabsTrigger value="INTERNAL" className="gap-1">
                      <EyeOff className="h-3 w-3" />
                      内部备注
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="PUBLIC" className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      此回复将发送给用户
                    </p>
                  </TabsContent>
                  <TabsContent value="INTERNAL" className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      仅内部可见，用户不会看到此备注
                    </p>
                  </TabsContent>
                </Tabs>
                <Textarea
                  placeholder="输入回复内容..."
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleReply}
                    disabled={!replyContent.trim() || replyMutation.isPending}
                  >
                    {replyMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <Send className="h-4 w-4 mr-2" />
                    发送
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：信息 */}
        <div className="space-y-6">
          {/* 工单状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">工单信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">状态</label>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => updateMutation.mutate({
                    id: ticket.id,
                    data: { status: v as 'OPEN' | 'IN_PROGRESS' | 'PENDING_USER' | 'RESOLVED' | 'CLOSED' },
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ticketStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">优先级</label>
                <Select
                  value={ticket.priority}
                  onValueChange={(v) => updateMutation.mutate({
                    id: ticket.id,
                    data: { priority: v as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' },
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ticketPriorityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">处理人</label>
                <Select
                  value={ticket.assigneeId || 'unassigned'}
                  onValueChange={(v) => assignMutation.mutate({
                    id: ticket.id,
                    assigneeId: v === 'unassigned' ? null : v,
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="未分配" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">未分配</SelectItem>
                    {assignees?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 提交人信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                提交人
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={ticket.user?.image || ''} />
                  <AvatarFallback>
                    {ticket.user?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{ticket.user?.name || '-'}</p>
                  <p className="text-sm text-muted-foreground">{ticket.user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 详细信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                详细信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">分类</span>
                <span>{ticket.category?.name || '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">提交时间</span>
                <span>{format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm')}</span>
              </div>
              {ticket.firstReplyAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">首次响应</span>
                    <span>{format(new Date(ticket.firstReplyAt), 'yyyy-MM-dd HH:mm')}</span>
                  </div>
                </>
              )}
              {ticket.resolvedAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">解决时间</span>
                    <span>{format(new Date(ticket.resolvedAt), 'yyyy-MM-dd HH:mm')}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">回复数</span>
                <span>{ticket.replies?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* 关联信息 */}
          {ticket.relatedType && ticket.relatedId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">关联信息</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  关联 {ticket.relatedType}: {ticket.relatedId}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
