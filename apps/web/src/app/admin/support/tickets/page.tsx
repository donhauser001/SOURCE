/**
 * 工单管理页面
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Search,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ticketStatusLabels,
  ticketPriorityLabels,
} from '@/lib/validations/support';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
  OPEN: { label: '待处理', variant: 'destructive', icon: AlertCircle },
  IN_PROGRESS: { label: '处理中', variant: 'default', icon: Clock },
  PENDING_USER: { label: '等待回复', variant: 'secondary', icon: MessageSquare },
  RESOLVED: { label: '已解决', variant: 'outline', icon: CheckCircle2 },
  CLOSED: { label: '已关闭', variant: 'outline', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: '低', className: 'text-muted-foreground' },
  NORMAL: { label: '普通', className: '' },
  HIGH: { label: '高', className: 'text-orange-600 font-medium' },
  URGENT: { label: '紧急', className: 'text-red-600 font-bold' },
};

export default function TicketsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [page, setPage] = useState(1);

  // 获取分类列表
  const { data: categories } = trpc.ticket.categoryListAdmin.useQuery();

  // 获取工单统计
  const { data: stats } = trpc.ticket.adminStats.useQuery();

  // 获取工单列表
  const { data, isLoading } = trpc.ticket.adminList.useQuery({
    search: search || undefined,
    status: status as 'OPEN' | 'IN_PROGRESS' | 'PENDING_USER' | 'RESOLVED' | 'CLOSED' | undefined,
    priority: priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | undefined,
    categoryId: categoryId || undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">工单管理</h1>
          <p className="text-muted-foreground">处理用户提交的支持请求</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              待处理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {stats?.byStatus.open || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              处理中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {stats?.byStatus.inProgress || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              等待回复
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {stats?.byStatus.pendingUser || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              紧急工单
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {stats?.urgent || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              今日新增
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.todayNew || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              平均响应
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.avgResponseTime ? `${stats.avgResponseTime}分` : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索工单编号或主题..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="所有状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            {Object.entries(ticketStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority || 'all'} onValueChange={(v) => { setPriority(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="所有优先级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有优先级</SelectItem>
            {Object.entries(ticketPriorityLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryId || 'all'} onValueChange={(v) => { setCategoryId(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="所有分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有分类</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 工单列表 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">工单编号</TableHead>
              <TableHead>主题</TableHead>
              <TableHead>提交人</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>处理人</TableHead>
              <TableHead>回复</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead className="w-[60px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  暂无工单
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((ticket) => {
                const statusCfg = statusConfig[ticket.status];
                const priorityCfg = priorityConfig[ticket.priority];
                const StatusIcon = statusCfg?.icon;

                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">{ticket.ticketNo}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/support/tickets/${ticket.id}`}
                        className="font-medium hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={ticket.user?.image || ''} />
                          <AvatarFallback className="text-xs">
                            {ticket.user?.name?.[0] || ticket.user?.email?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate max-w-[100px]">
                          {ticket.user?.name || ticket.user?.email || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{ticket.category?.name || '-'}</TableCell>
                    <TableCell>
                      <span className={priorityCfg?.className}>
                        {priorityCfg?.label || ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg?.variant || 'secondary'} className="gap-1">
                        {StatusIcon && <StatusIcon className="h-3 w-3" />}
                        {statusCfg?.label || ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={ticket.assignee?.image || ''} />
                            <AvatarFallback className="text-xs">
                              {ticket.assignee?.name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate max-w-[80px]">
                            {ticket.assignee?.name || '-'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">未分配</span>
                      )}
                    </TableCell>
                    <TableCell>{ticket._count?.replies || 0}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(ticket.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/support/tickets/${ticket.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {data.total} 条，第 {page} / {data.totalPages} 页
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
