'use client';

/**
 * 用户管理页面
 * 
 * v0.5.2 - Admin 阶段
 */

import { useState } from 'react';
import {
    Search, Filter, Users, Shield, Key, MoreHorizontal,
    Crown, UserCheck, User
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';

// 标签映射
const ROLE_LABELS: Record<string, string> = {
    ADMIN: '管理员',
    AUDITOR: '审计员',
    PARTNER: '合作方',
    USER: '普通用户',
};

const TIER_LABELS: Record<string, string> = {
    FREE: '免费',
    VERIFIED: '已验证',
    PAID: '付费',
};

export default function UsersPage() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [tierFilter, setTierFilter] = useState<string>('all');
    const [editingUser, setEditingUser] = useState<{
        id: string;
        email: string;
        name: string | null;
        role: string;
        tier: string;
    } | null>(null);

    // 查询
    const { data, isLoading, refetch } = trpc.user.adminList.useQuery({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter as 'ADMIN' | 'AUDITOR' | 'PARTNER' | 'USER' : undefined,
        tier: tierFilter !== 'all' ? tierFilter as 'FREE' | 'VERIFIED' | 'PAID' : undefined,
        limit: 100,
    });

    const { data: stats } = trpc.user.adminStats.useQuery();

    // 更新
    const updateMutation = trpc.user.adminUpdate.useMutation({
        onSuccess: () => {
            setEditingUser(null);
            refetch();
        },
    });

    const handleUpdate = () => {
        if (!editingUser) return;
        updateMutation.mutate({
            id: editingUser.id,
            role: editingUser.role as 'ADMIN' | 'AUDITOR' | 'PARTNER' | 'USER',
            tier: editingUser.tier as 'FREE' | 'VERIFIED' | 'PAID',
        });
    };

    // 角色 Badge 样式
    const getRoleVariant = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'destructive';
            case 'AUDITOR': return 'default';
            case 'PARTNER': return 'secondary';
            default: return 'outline';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Crown className="h-3 w-3" />;
            case 'AUDITOR': return <Shield className="h-3 w-3" />;
            case 'PARTNER': return <UserCheck className="h-3 w-3" />;
            default: return <User className="h-3 w-3" />;
        }
    };

    const getTierVariant = (tier: string) => {
        switch (tier) {
            case 'PAID': return 'default';
            case 'VERIFIED': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">用户管理</h1>
                    <p className="text-muted-foreground">管理系统用户和权限</p>
                </div>
            </div>

            {/* 统计卡片 */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                总用户
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    {stats.byRole.map((r) => (
                        <Card key={r.role}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    {getRoleIcon(r.role)}
                                    {ROLE_LABELS[r.role] || r.role}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{r.count}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* 筛选 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索邮箱或名称..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-32">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="角色" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部角色</SelectItem>
                                <SelectItem value="ADMIN">管理员</SelectItem>
                                <SelectItem value="AUDITOR">审计员</SelectItem>
                                <SelectItem value="PARTNER">合作方</SelectItem>
                                <SelectItem value="USER">普通用户</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={tierFilter} onValueChange={setTierFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="等级" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部等级</SelectItem>
                                <SelectItem value="FREE">免费</SelectItem>
                                <SelectItem value="VERIFIED">已验证</SelectItem>
                                <SelectItem value="PAID">付费</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 用户列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>用户列表</CardTitle>
                    <CardDescription>
                        {isLoading ? '加载中...' : `共 ${data?.items.length || 0} 个用户`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">用户</th>
                                    <th className="text-left py-3 px-4 font-medium">角色</th>
                                    <th className="text-left py-3 px-4 font-medium">等级</th>
                                    <th className="text-left py-3 px-4 font-medium">API 密钥</th>
                                    <th className="text-left py-3 px-4 font-medium">注册时间</th>
                                    <th className="text-right py-3 px-4 font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.items.map((user) => (
                                    <tr key={user.id} className="border-b hover:bg-muted/50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                {user.image ? (
                                                    <img
                                                        src={user.image}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium">{user.name || '未设置'}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={getRoleVariant(user.role)} className="gap-1">
                                                {getRoleIcon(user.role)}
                                                {ROLE_LABELS[user.role] || user.role}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={getTierVariant(user.tier)}>
                                                {TIER_LABELS[user.tier] || user.tier}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Key className="h-4 w-4" />
                                                {user._count.apiKeys}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => setEditingUser({
                                                            id: user.id,
                                                            email: user.email!,
                                                            name: user.name,
                                                            role: user.role,
                                                            tier: user.tier,
                                                        })}
                                                    >
                                                        编辑权限
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                                {(!data?.items || data.items.length === 0) && !isLoading && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                            暂无用户
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* 编辑弹窗 */}
            <Dialog open={!!editingUser} onOpenChange={(open: boolean) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑用户权限</DialogTitle>
                        <DialogDescription>
                            {editingUser?.email}
                        </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>角色</Label>
                                <Select
                                    value={editingUser.role}
                                    onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">普通用户</SelectItem>
                                        <SelectItem value="PARTNER">合作方</SelectItem>
                                        <SelectItem value="AUDITOR">审计员</SelectItem>
                                        <SelectItem value="ADMIN">管理员</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>等级</Label>
                                <Select
                                    value={editingUser.tier}
                                    onValueChange={(v) => setEditingUser({ ...editingUser, tier: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FREE">免费</SelectItem>
                                        <SelectItem value="VERIFIED">已验证</SelectItem>
                                        <SelectItem value="PAID">付费</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>
                            取消
                        </Button>
                        <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

