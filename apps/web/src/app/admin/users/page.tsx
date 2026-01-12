'use client';

/**
 * 用户管理页面
 * 
 * v0.6.0 - 支持禁用/启用/删除/批量操作
 */

import { useState } from 'react';
import {
    Search, Filter, Users, Shield, Key, MoreHorizontal,
    Crown, UserCheck, User, Ban, CheckCircle, Trash2,
    UserX, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// 标签映射
const ROLE_LABELS: Record<string, string> = {
    ADMIN: '管理员',
    OPERATOR: '运营',
    AUDITOR: '审计员',
    PARTNER: '合作方',
    USER: '普通用户',
};

const TIER_LABELS: Record<string, string> = {
    FREE: '免费',
    VERIFIED: '已验证',
    PAID: '付费',
};

type UserItem = {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    role: string;
    tier: string;
    isActive: boolean;
    disabledAt: Date | null;
    createdAt: Date;
    _count: { apiKeys: number };
};

export default function UsersPage() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [tierFilter, setTierFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // 弹窗状态
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [disablingUser, setDisablingUser] = useState<UserItem | null>(null);
    const [disableReason, setDisableReason] = useState('');
    const [enablingUser, setEnablingUser] = useState<UserItem | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
    const [batchAction, setBatchAction] = useState<'role' | 'tier' | null>(null);
    const [batchRole, setBatchRole] = useState<string>('USER');
    const [batchTier, setBatchTier] = useState<string>('FREE');

    // 查询
    const { data, isLoading, refetch } = trpc.user.adminList.useQuery({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter as 'ADMIN' | 'AUDITOR' | 'PARTNER' | 'USER' : undefined,
        tier: tierFilter !== 'all' ? tierFilter as 'FREE' | 'VERIFIED' | 'PAID' : undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        limit: 100,
    });

    const { data: stats } = trpc.user.adminStats.useQuery();

    // Mutations
    const updateMutation = trpc.user.adminUpdate.useMutation({
        onSuccess: () => {
            setEditingUser(null);
            refetch();
        },
    });

    const disableMutation = trpc.user.adminDisable.useMutation({
        onSuccess: () => {
            setDisablingUser(null);
            setDisableReason('');
            refetch();
        },
    });

    const enableMutation = trpc.user.adminEnable.useMutation({
        onSuccess: () => {
            setEnablingUser(null);
            refetch();
        },
    });

    const deleteMutation = trpc.user.adminDelete.useMutation({
        onSuccess: () => {
            setDeletingUser(null);
            refetch();
        },
    });

    const batchUpdateMutation = trpc.user.adminBatchUpdate.useMutation({
        onSuccess: () => {
            setBatchAction(null);
            setSelectedIds(new Set());
            refetch();
        },
    });

    // Handlers
    const handleUpdate = () => {
        if (!editingUser) return;
        updateMutation.mutate({
            id: editingUser.id,
            role: editingUser.role as 'ADMIN' | 'OPERATOR' | 'AUDITOR' | 'PARTNER' | 'USER',
            tier: editingUser.tier as 'FREE' | 'VERIFIED' | 'PAID',
        });
    };

    const handleDisable = () => {
        if (!disablingUser) return;
        disableMutation.mutate({
            id: disablingUser.id,
            reason: disableReason || undefined,
        });
    };

    const handleEnable = () => {
        if (!enablingUser) return;
        enableMutation.mutate({ id: enablingUser.id });
    };

    const handleDelete = () => {
        if (!deletingUser) return;
        deleteMutation.mutate({ id: deletingUser.id });
    };

    const handleBatchUpdate = () => {
        if (selectedIds.size === 0) return;
        batchUpdateMutation.mutate({
            ids: Array.from(selectedIds),
            role: batchAction === 'role' ? batchRole as 'ADMIN' | 'AUDITOR' | 'PARTNER' | 'USER' : undefined,
            tier: batchAction === 'tier' ? batchTier as 'FREE' | 'VERIFIED' | 'PAID' : undefined,
        });
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (!data?.items) return;
        if (selectedIds.size === data.items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(data.items.map(u => u.id)));
        }
    };

    // 角色 Badge 样式
    const getRoleVariant = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'destructive';
            case 'OPERATOR': return 'default';
            case 'AUDITOR': return 'default';
            case 'PARTNER': return 'secondary';
            default: return 'outline';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Crown className="h-3 w-3" />;
            case 'OPERATOR': return <Shield className="h-3 w-3" />;
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
                            <div className="text-xs text-muted-foreground mt-1">
                                活跃 {stats.active} / 禁用 {stats.disabled}
                            </div>
                        </CardContent>
                    </Card>
                    {stats.byRole.slice(0, 3).map((r) => (
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
                                <SelectItem value="OPERATOR">运营</SelectItem>
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
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部状态</SelectItem>
                                <SelectItem value="active">活跃</SelectItem>
                                <SelectItem value="disabled">已禁用</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 批量操作栏 */}
            {selectedIds.size > 0 && (
                <Card className="border-primary">
                    <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                已选择 <strong>{selectedIds.size}</strong> 个用户
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBatchAction('role')}
                                >
                                    批量修改角色
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBatchAction('tier')}
                                >
                                    批量修改等级
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedIds(new Set())}
                                >
                                    取消选择
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 用户列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>用户列表</CardTitle>
                    <CardDescription>
                        {isLoading ? '加载中...' : `共 ${data?.totalCount || 0} 个用户`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-3 px-4 w-10">
                                        <Checkbox
                                            checked={data?.items && data.items.length > 0 && selectedIds.size === data.items.length}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium">用户</th>
                                    <th className="text-left py-3 px-4 font-medium">状态</th>
                                    <th className="text-left py-3 px-4 font-medium">角色</th>
                                    <th className="text-left py-3 px-4 font-medium">等级</th>
                                    <th className="text-left py-3 px-4 font-medium">API 密钥</th>
                                    <th className="text-left py-3 px-4 font-medium">注册时间</th>
                                    <th className="text-right py-3 px-4 font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.items.map((user) => (
                                    <tr 
                                        key={user.id} 
                                        className={cn(
                                            "border-b hover:bg-muted/50",
                                            !user.isActive && "opacity-60 bg-muted/30"
                                        )}
                                    >
                                        <td className="py-3 px-4">
                                            <Checkbox
                                                checked={selectedIds.has(user.id)}
                                                onCheckedChange={() => toggleSelect(user.id)}
                                            />
                                        </td>
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
                                            {user.isActive ? (
                                                <Badge variant="outline" className="text-green-600 border-green-600">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    活跃
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-red-600 border-red-600">
                                                    <UserX className="h-3 w-3 mr-1" />
                                                    已禁用
                                                </Badge>
                                            )}
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
                                                        onClick={() => setEditingUser(user)}
                                                    >
                                                        编辑权限
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {user.isActive ? (
                                                        <DropdownMenuItem
                                                            onClick={() => setDisablingUser(user)}
                                                            className="text-orange-600"
                                                        >
                                                            <Ban className="h-4 w-4 mr-2" />
                                                            禁用用户
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={() => setEnablingUser(user)}
                                                            className="text-green-600"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            启用用户
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => setDeletingUser(user)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        删除用户
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                                {(!data?.items || data.items.length === 0) && !isLoading && (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
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
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
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
                                        <SelectItem value="OPERATOR">运营</SelectItem>
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
                            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 禁用确认弹窗 */}
            <Dialog open={!!disablingUser} onOpenChange={(open) => !open && setDisablingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>禁用用户</DialogTitle>
                        <DialogDescription>
                            确定要禁用用户 <strong>{disablingUser?.email}</strong> 吗？
                            禁用后，该用户将无法登录，其所有 API 密钥也将被撤销。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>禁用原因（可选）</Label>
                        <Textarea
                            value={disableReason}
                            onChange={(e) => setDisableReason(e.target.value)}
                            placeholder="输入禁用原因..."
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDisablingUser(null)}>
                            取消
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDisable} 
                            disabled={disableMutation.isPending}
                        >
                            {disableMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            确认禁用
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 启用确认弹窗 */}
            <Dialog open={!!enablingUser} onOpenChange={(open) => !open && setEnablingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>启用用户</DialogTitle>
                        <DialogDescription>
                            确定要启用用户 <strong>{enablingUser?.email}</strong> 吗？
                            启用后，该用户将可以正常登录。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEnablingUser(null)}>
                            取消
                        </Button>
                        <Button onClick={handleEnable} disabled={enableMutation.isPending}>
                            {enableMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            确认启用
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除确认弹窗 */}
            <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">删除用户</DialogTitle>
                        <DialogDescription>
                            确定要删除用户 <strong>{deletingUser?.email}</strong> 吗？
                            此操作不可恢复。如果该用户有关联数据，将无法删除。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingUser(null)}>
                            取消
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete} 
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            确认删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 批量操作弹窗 */}
            <Dialog open={!!batchAction} onOpenChange={(open) => !open && setBatchAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {batchAction === 'role' ? '批量修改角色' : '批量修改等级'}
                        </DialogTitle>
                        <DialogDescription>
                            将为选中的 {selectedIds.size} 个用户修改{batchAction === 'role' ? '角色' : '等级'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {batchAction === 'role' ? (
                            <div className="space-y-2">
                                <Label>新角色</Label>
                                <Select value={batchRole} onValueChange={setBatchRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">普通用户</SelectItem>
                                        <SelectItem value="PARTNER">合作方</SelectItem>
                                        <SelectItem value="AUDITOR">审计员</SelectItem>
                                        <SelectItem value="OPERATOR">运营</SelectItem>
                                        <SelectItem value="ADMIN">管理员</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>新等级</Label>
                                <Select value={batchTier} onValueChange={setBatchTier}>
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
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBatchAction(null)}>
                            取消
                        </Button>
                        <Button onClick={handleBatchUpdate} disabled={batchUpdateMutation.isPending}>
                            {batchUpdateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            确认修改
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
