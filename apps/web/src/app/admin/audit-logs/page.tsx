'use client';

/**
 * 管理员操作审计日志页面
 * 
 * 功能：
 * - 查看所有管理员操作记录
 * - 支持按操作类型、目标类型、时间范围筛选
 * - 查看操作详情
 */

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Search, Filter, Eye, Calendar, User, Target, Clock, Loader2 } from 'lucide-react';
import { ADMIN_ACTION_LABELS, TARGET_TYPE_LABELS } from '@/lib/admin-audit';

export default function AdminAuditLogsPage() {
    // 筛选状态
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    
    // 详情弹窗
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // 数据查询
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = trpc.adminAuditLog.list.useInfiniteQuery(
        {
            limit: 50,
            action: actionFilter !== 'all' ? (actionFilter as any) : undefined,
            targetType: targetTypeFilter !== 'all' ? targetTypeFilter : undefined,
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    // 统计数据
    const { data: stats } = trpc.adminAuditLog.stats.useQuery();

    // 合并分页数据
    const allLogs = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.items);
    }, [data]);

    // 搜索过滤（前端过滤用户邮箱）
    const filteredLogs = useMemo(() => {
        if (!search) return allLogs;
        const searchLower = search.toLowerCase();
        return allLogs.filter((log) =>
            log.userEmail.toLowerCase().includes(searchLower) ||
            log.targetId?.toLowerCase().includes(searchLower)
        );
    }, [allLogs, search]);

    // 获取操作类型 Badge 样式
    const getActionVariant = (action: string) => {
        switch (action) {
            case 'CREATE':
                return 'default';
            case 'UPDATE':
                return 'secondary';
            case 'DELETE':
            case 'BATCH_DELETE':
                return 'destructive';
            case 'IMPORT':
                return 'outline';
            case 'STATUS_CHANGE':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    // 格式化时间
    const formatTime = (date: string | Date) => {
        return new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 打开详情弹窗
    const handleViewDetail = (log: any) => {
        setSelectedLog(log);
        setIsDetailOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div>
                <h1 className="text-2xl font-bold">操作审计日志</h1>
                <p className="text-muted-foreground">查看所有管理员操作记录</p>
            </div>

            {/* 统计卡片 */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>总记录数</CardDescription>
                            <CardTitle className="text-2xl">{stats.total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>今日操作</CardDescription>
                            <CardTitle className="text-2xl">{stats.todayCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>近 7 天</CardDescription>
                            <CardTitle className="text-2xl">{stats.weekCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>近 30 天</CardDescription>
                            <CardTitle className="text-2xl">{stats.monthCount}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* 搜索和筛选 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索用户邮箱或目标 ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="w-36">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="操作类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部操作</SelectItem>
                                    <SelectItem value="CREATE">创建</SelectItem>
                                    <SelectItem value="UPDATE">更新</SelectItem>
                                    <SelectItem value="DELETE">删除</SelectItem>
                                    <SelectItem value="BATCH_DELETE">批量删除</SelectItem>
                                    <SelectItem value="IMPORT">导入</SelectItem>
                                    <SelectItem value="STATUS_CHANGE">状态变更</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="目标类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部类型</SelectItem>
                                    <SelectItem value="color">色彩</SelectItem>
                                    <SelectItem value="partner">合作者</SelectItem>
                                    <SelectItem value="user">用户</SelectItem>
                                    <SelectItem value="proofingPack">打样包</SelectItem>
                                    <SelectItem value="apiKey">API 密钥</SelectItem>
                                    <SelectItem value="batch">批次</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 日志列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>审计日志</CardTitle>
                    <CardDescription>
                        {isLoading ? '加载中...' : `共 ${filteredLogs.length} 条记录`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 font-medium">时间</th>
                                            <th className="text-left py-3 px-4 font-medium">操作人</th>
                                            <th className="text-left py-3 px-4 font-medium">操作</th>
                                            <th className="text-left py-3 px-4 font-medium">目标类型</th>
                                            <th className="text-left py-3 px-4 font-medium">目标 ID</th>
                                            <th className="text-right py-3 px-4 font-medium">详情</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {formatTime(log.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="truncate max-w-[200px]">{log.userEmail}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={getActionVariant(log.action)}>
                                                        {ADMIN_ACTION_LABELS[log.action as keyof typeof ADMIN_ACTION_LABELS] || log.action}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Target className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {TARGET_TYPE_LABELS[log.targetType] || log.targetType}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {log.targetId ? (
                                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[150px] inline-block">
                                                            {log.targetId}
                                                        </code>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleViewDetail(log)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                                    暂无审计日志
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* 加载更多 */}
                            {hasNextPage && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                    >
                                        {isFetchingNextPage ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                加载中...
                                            </>
                                        ) : (
                                            '加载更多'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 详情弹窗 */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>审计日志详情</DialogTitle>
                        <DialogDescription>
                            查看完整的操作记录信息
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">操作时间</label>
                                    <p className="mt-1">{formatTime(selectedLog.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">操作人</label>
                                    <p className="mt-1">{selectedLog.userEmail}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">操作类型</label>
                                    <p className="mt-1">
                                        <Badge variant={getActionVariant(selectedLog.action)}>
                                            {ADMIN_ACTION_LABELS[selectedLog.action as keyof typeof ADMIN_ACTION_LABELS] || selectedLog.action}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">目标类型</label>
                                    <p className="mt-1">
                                        {TARGET_TYPE_LABELS[selectedLog.targetType] || selectedLog.targetType}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground">目标 ID</label>
                                    <p className="mt-1">
                                        {selectedLog.targetId ? (
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                {selectedLog.targetId}
                                            </code>
                                        ) : (
                                            <span className="text-muted-foreground">无</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.changes && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">变更详情</label>
                                    <pre className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs max-h-60">
                                        {JSON.stringify(selectedLog.changes, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.metadata && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">元数据</label>
                                    <pre className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs max-h-40">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
