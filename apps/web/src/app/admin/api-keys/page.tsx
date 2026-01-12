'use client';

/**
 * API 密钥管理页面
 * 
 * v0.6.0 - 支持管理员为用户生成密钥、重新颁发密钥
 */

import { useState, useEffect } from 'react';
import { 
    Search, Key, MoreHorizontal, Ban, Clock,
    CheckCircle, User, Plus, RefreshCw, Copy, Loader2
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';

// 角色标签
const ROLE_LABELS: Record<string, string> = {
    READONLY: '只读',
    PLUGIN_FREE: '插件免费版',
    PLUGIN_PAID: '插件付费版',
    ADMIN: '管理员',
};

const CREATE_ROLE_OPTIONS = [
    { value: 'ai-readonly', label: 'AI 只读', description: '仅可读取色彩和纸张数据' },
    { value: 'ai-full', label: 'AI 完整', description: '可读取数据、估算成本、分析工程' },
    { value: 'plugin-free', label: '插件免费版', description: '基础色彩查询' },
    { value: 'plugin-paid', label: '插件付费版', description: '完整色彩数据和推荐' },
];

const EXPIRE_OPTIONS = [
    { value: '30', label: '30 天' },
    { value: '90', label: '90 天' },
    { value: '180', label: '180 天' },
    { value: '365', label: '1 年' },
    { value: '', label: '永不过期' },
];

export default function ApiKeysPage() {
    const [search, setSearch] = useState('');
    
    // 创建密钥弹窗
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [userSearchOpen, setUserSearchOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<{ id: string; email: string | null; name: string | null } | null>(null);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyRole, setNewKeyRole] = useState('ai-readonly');
    const [newKeyExpire, setNewKeyExpire] = useState('90');
    
    // 新生成的密钥
    const [newKeyResult, setNewKeyResult] = useState<{ key: string; keyPrefix: string } | null>(null);
    
    // 重新颁发确认
    const [reissueKeyId, setReissueKeyId] = useState<string | null>(null);
    const [reissueResult, setReissueResult] = useState<{ key: string; keyPrefix: string } | null>(null);

    // 查询
    const { data, isLoading, refetch } = trpc.apikey.adminList.useQuery({
        limit: 100,
    });

    // 用户搜索
    const { data: userSearchResults } = trpc.apikey.adminSearchUsers.useQuery(
        { search: userSearchQuery },
        { enabled: userSearchQuery.length > 0 }
    );

    // Mutations
    const revokeMutation = trpc.apikey.adminRevoke.useMutation({
        onSuccess: () => refetch(),
    });

    const createMutation = trpc.apikey.adminCreate.useMutation({
        onSuccess: (data) => {
            setNewKeyResult({ key: data.key, keyPrefix: data.keyPrefix });
            refetch();
        },
    });

    const reissueMutation = trpc.apikey.adminReissue.useMutation({
        onSuccess: (data) => {
            setReissueKeyId(null);
            setReissueResult({ key: data.key, keyPrefix: data.keyPrefix });
            refetch();
        },
    });

    // 复制到剪贴板
    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
    };

    // 重置创建表单
    const resetCreateForm = () => {
        setSelectedUser(null);
        setNewKeyName('');
        setNewKeyRole('ai-readonly');
        setNewKeyExpire('90');
        setNewKeyResult(null);
    };

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

    // 创建密钥
    const handleCreate = () => {
        if (!selectedUser || !newKeyName) return;
        createMutation.mutate({
            userId: selectedUser.id,
            name: newKeyName,
            role: newKeyRole as 'ai-readonly' | 'ai-full' | 'plugin-free' | 'plugin-paid',
            expiresInDays: newKeyExpire ? parseInt(newKeyExpire) : undefined,
        });
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

            {/* 搜索和操作 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索密钥名称、前缀或用户邮箱..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            为用户生成密钥
                        </Button>
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
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() => setReissueKeyId(key.id)}
                                                                >
                                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                                    重新颁发
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
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
                                                            </>
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

            {/* 创建密钥弹窗 */}
            <Dialog 
                open={createDialogOpen} 
                onOpenChange={(open) => {
                    if (!open) {
                        setCreateDialogOpen(false);
                        resetCreateForm();
                    } else {
                        setCreateDialogOpen(true);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>为用户生成 API 密钥</DialogTitle>
                        <DialogDescription>
                            选择用户并配置密钥参数
                        </DialogDescription>
                    </DialogHeader>

                    {newKeyResult ? (
                        // 显示新生成的密钥
                        <div className="py-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <p className="text-green-800 text-sm mb-2">
                                    密钥已生成！请立即复制，此密钥只会显示一次。
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono break-all">
                                        {newKeyResult.key}
                                    </code>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => copyToClipboard(newKeyResult.key)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => {
                                    setCreateDialogOpen(false);
                                    resetCreateForm();
                                }}>
                                    完成
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        // 创建表单
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>选择用户</Label>
                                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                        >
                                            {selectedUser ? (
                                                <span>{selectedUser.email}</span>
                                            ) : (
                                                <span className="text-muted-foreground">搜索用户...</span>
                                            )}
                                            <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-2">
                                        <Input
                                            placeholder="输入邮箱或名称搜索..."
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            className="mb-2"
                                        />
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {userSearchQuery.length === 0 ? (
                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                    请输入关键词搜索
                                                </div>
                                            ) : !userSearchResults || userSearchResults.length === 0 ? (
                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                    未找到用户
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {userSearchResults.map((user) => (
                                                        <button
                                                            key={user.id}
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setUserSearchOpen(false);
                                                            }}
                                                            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left"
                                                        >
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <div className="text-sm">{user.email}</div>
                                                                {user.name && (
                                                                    <div className="text-xs text-muted-foreground">{user.name}</div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>密钥名称</Label>
                                <Input
                                    placeholder="例如：生产环境密钥"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>密钥角色</Label>
                                <Select value={newKeyRole} onValueChange={setNewKeyRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CREATE_ROLE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <div>
                                                    <div>{option.label}</div>
                                                    <div className="text-xs text-muted-foreground">{option.description}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>有效期</Label>
                                <Select value={newKeyExpire} onValueChange={setNewKeyExpire}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXPIRE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value || 'never'} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                    setCreateDialogOpen(false);
                                    resetCreateForm();
                                }}>
                                    取消
                                </Button>
                                <Button 
                                    onClick={handleCreate}
                                    disabled={!selectedUser || !newKeyName || createMutation.isPending}
                                >
                                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    生成密钥
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* 重新颁发确认弹窗 */}
            <Dialog open={!!reissueKeyId} onOpenChange={(open) => !open && setReissueKeyId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>重新颁发密钥</DialogTitle>
                        <DialogDescription>
                            重新颁发将撤销当前密钥并生成一个新密钥（继承原有配置）。此操作不可撤销。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReissueKeyId(null)}>
                            取消
                        </Button>
                        <Button 
                            onClick={() => {
                                if (reissueKeyId) {
                                    reissueMutation.mutate({ id: reissueKeyId });
                                }
                            }}
                            disabled={reissueMutation.isPending}
                        >
                            {reissueMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            确认重新颁发
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 显示重新颁发的新密钥 */}
            <Dialog open={!!reissueResult} onOpenChange={(open) => !open && setReissueResult(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新密钥已生成</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-800 text-sm mb-2">
                                密钥已重新颁发！请立即复制，此密钥只会显示一次。
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono break-all">
                                    {reissueResult?.key}
                                </code>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => reissueResult && copyToClipboard(reissueResult.key)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setReissueResult(null)}>
                            完成
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
