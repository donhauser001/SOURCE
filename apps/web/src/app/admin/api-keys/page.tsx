'use client';

/**
 * API 密钥管理页面
 * 
 * v0.5.2 - Admin 阶段
 */

import { useState } from 'react';
import { 
    Search, Filter, Key, MoreHorizontal, Ban, Clock,
    CheckCircle, XCircle, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { trpc } from '@/lib/trpc';

// 角色标签
const ROLE_LABELS: Record<string, string> = {
    READONLY: '只读',
    PLUGIN_FREE: '插件免费版',
    PLUGIN_PAID: '插件付费版',
    ADMIN: '管理员',
};

export default function ApiKeysPage() {
    const [search, setSearch] = useState('');

    // 查询
    const { data, isLoading, refetch } = trpc.apikey.adminList.useQuery({
        limit: 100,
    });

    // 撤销
    const revokeMutation = trpc.apikey.adminRevoke.useMutation({
        onSuccess: () => refetch(),
    });

    // 状态判断
    const getKeyStatus = (key: {
        revokedAt: Date | null;
        expiresAt: Date | null;
    }): 'active' | 'revoked' | 'expired' => {
        if (key.revokedAt) return 'revoked';
        if (key.expiresAt && new Date(key.expiresAt) < new Date()) return 'expired';
        return 'active';
    };

    const getStatusBadge = (status: 'active' | 'revoked' | 'expired') => {
        switch (status) {
            case 'active':
                return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />有效</Badge>;
            case 'revoked':
                return <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />已撤销</Badge>;
            case 'expired':
                return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />已过期</Badge>;
        }
    };

    // 筛选
    const filteredItems = data?.items.filter((key) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            key.name.toLowerCase().includes(searchLower) ||
            key.keyPrefix.toLowerCase().includes(searchLower) ||
            key.ownerUser?.email?.toLowerCase().includes(searchLower)
        );
    }) || [];

    // 统计
    const stats = {
        total: data?.items.length || 0,
        active: data?.items.filter((k) => getKeyStatus(k) === 'active').length || 0,
        revoked: data?.items.filter((k) => getKeyStatus(k) === 'revoked').length || 0,
        expired: data?.items.filter((k) => getKeyStatus(k) === 'expired').length || 0,
    };

    return (
        <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Key className="h-4 w-4" />
                            总计
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            有效
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                            <Ban className="h-4 w-4" />
                            已撤销
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            已过期
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.expired}</div>
                    </CardContent>
                </Card>
            </div>

            {/* 搜索 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索密钥名称、前缀或用户邮箱..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 密钥列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>密钥列表</CardTitle>
                    <CardDescription>
                        {isLoading ? '加载中...' : `共 ${filteredItems.length} 个密钥`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">密钥</th>
                                    <th className="text-left py-3 px-4 font-medium">所有者</th>
                                    <th className="text-left py-3 px-4 font-medium">角色</th>
                                    <th className="text-left py-3 px-4 font-medium">状态</th>
                                    <th className="text-left py-3 px-4 font-medium">限流</th>
                                    <th className="text-left py-3 px-4 font-medium">最后使用</th>
                                    <th className="text-left py-3 px-4 font-medium">创建时间</th>
                                    <th className="text-right py-3 px-4 font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((key) => {
                                    const status = getKeyStatus(key);
                                    
                                    return (
                                        <tr key={key.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium">{key.name}</div>
                                                    <code className="text-xs text-muted-foreground">
                                                        {key.keyPrefix}...
                                                    </code>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {key.ownerUser ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span>{key.ownerUser.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline">
                                                    {ROLE_LABELS[key.role] || key.role}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                {getStatusBadge(status)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {key.rateLimitPolicy ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <span className="text-xs">
                                                                    {key.rateLimitPolicy.name}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{key.rateLimitPolicy.requestsPerMinute}/分钟</p>
                                                                <p>{key.rateLimitPolicy.requestsPerDay}/天</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {key.lastUsedAt
                                                    ? new Date(key.lastUsedAt).toLocaleString('zh-CN')
                                                    : '从未'}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {new Date(key.createdAt).toLocaleDateString('zh-CN')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {status === 'active' && (
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => {
                                                                    if (confirm('确定要撤销此密钥吗？撤销后无法恢复。')) {
                                                                        revokeMutation.mutate({ id: key.id });
                                                                    }
                                                                }}
                                                            >
                                                                <Ban className="h-4 w-4 mr-2" />
                                                                撤销密钥
                                                            </DropdownMenuItem>
                                                        )}
                                                        {status !== 'active' && (
                                                            <DropdownMenuItem disabled>
                                                                密钥已失效
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredItems.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                                            {search ? '没有匹配的密钥' : '暂无 API 密钥'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

