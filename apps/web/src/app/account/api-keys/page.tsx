'use client';

/**
 * API 密钥管理页面
 */

import { useState } from 'react';
import {
    Key,
    Plus,
    Loader2,
    Copy,
    CheckCircle2,
    Trash2,
    AlertCircle,
    Shield,
    Eye,
    EyeOff,
    Clock,
    Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

const roleDescriptions: Record<string, { name: string; description: string; color: string }> = {
    'ai-readonly': {
        name: 'AI 只读',
        description: '仅可读取色彩和纸张数据',
        color: 'bg-blue-100 text-blue-700',
    },
    'ai-full': {
        name: 'AI 完整',
        description: '可读取数据、估算成本、分析工程',
        color: 'bg-purple-100 text-purple-700',
    },
    'plugin-free': {
        name: '插件免费版',
        description: '基础色彩查询',
        color: 'bg-gray-100 text-gray-700',
    },
    'plugin-paid': {
        name: '插件付费版',
        description: '完整色彩数据和推荐',
        color: 'bg-amber-100 text-amber-700',
    },
};

export default function ApiKeysPage() {
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyRole, setNewKeyRole] = useState<'ai-readonly' | 'ai-full' | 'plugin-free' | 'plugin-paid'>('ai-readonly');
    const [newKeyExpiry, setNewKeyExpiry] = useState<number | undefined>(undefined);
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});

    const utils = trpc.useUtils();
    const { data: apiKeys, isLoading } = trpc.apikey.list.useQuery();

    const createMutation = trpc.apikey.create.useMutation({
        onSuccess: (data) => {
            setCreatedKey(data.key);
            setNewKeyName('');
            setNewKeyRole('ai-readonly');
            setNewKeyExpiry(undefined);
            utils.apikey.list.invalidate();
        },
    });

    const revokeMutation = trpc.apikey.revoke.useMutation({
        onSuccess: () => {
            utils.apikey.list.invalidate();
        },
    });

    const deleteMutation = trpc.apikey.delete.useMutation({
        onSuccess: () => {
            utils.apikey.list.invalidate();
        },
    });

    const handleCreate = async () => {
        if (!newKeyName.trim()) return;
        await createMutation.mutateAsync({
            name: newKeyName.trim(),
            role: newKeyRole,
            expiresInDays: newKeyExpiry,
        });
    };

    const handleCopy = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedKey(id);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const activeKeys = apiKeys?.filter(key => !key.revokedAt) || [];
    const revokedKeys = apiKeys?.filter(key => key.revokedAt) || [];

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">API 密钥</h1>
                    <p className="text-gray-500 mt-1">管理你的 API 访问密钥</p>
                </div>
                <Button
                    onClick={() => setIsCreating(true)}
                    className="rounded-xl bg-gray-900 hover:bg-gray-800"
                    disabled={isCreating}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    创建密钥
                </Button>
            </div>

            {/* 新创建的密钥提示 */}
            {createdKey && (
                <div className="bg-emerald-50 rounded-3xl border border-emerald-200 p-6">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-emerald-900">密钥创建成功</h4>
                            <p className="text-sm text-emerald-700 mt-1">
                                请立即复制并保存密钥，关闭此提示后将无法再次查看完整密钥。
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <code className="flex-1 bg-white rounded-xl px-4 py-3 font-mono text-sm text-gray-900 border border-emerald-200 truncate">
                                    {createdKey}
                                </code>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-xl border-emerald-200 hover:bg-emerald-100 flex-shrink-0"
                                    onClick={() => handleCopy(createdKey, 'new-key')}
                                >
                                    {copiedKey === 'new-key' ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                        <Copy className="h-4 w-4 text-emerald-600" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <button
                            onClick={() => setCreatedKey(null)}
                            className="text-emerald-400 hover:text-emerald-600"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* 创建密钥表单 */}
            {isCreating && (
                <div className="bg-white rounded-3xl border border-black/10 p-6 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        创建新密钥
                    </h3>

                    <div className="space-y-4">
                        {/* 密钥名称 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">密钥名称</label>
                            <Input
                                placeholder="例如：我的应用"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="h-11 rounded-xl border-gray-200"
                            />
                        </div>

                        {/* 密钥类型 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">密钥类型</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {Object.entries(roleDescriptions).map(([role, info]) => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setNewKeyRole(role as typeof newKeyRole)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${newKeyRole === role
                                                ? 'border-gray-900 bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
                                                {info.name}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{info.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 有效期 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">有效期（可选）</label>
                            <div className="flex gap-2">
                                {[
                                    { label: '永不过期', value: undefined },
                                    { label: '30 天', value: 30 },
                                    { label: '90 天', value: 90 },
                                    { label: '365 天', value: 365 },
                                ].map((option) => (
                                    <button
                                        key={option.label}
                                        type="button"
                                        onClick={() => setNewKeyExpiry(option.value)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${newKeyExpiry === option.value
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                        <Button
                            onClick={handleCreate}
                            disabled={!newKeyName.trim() || createMutation.isPending}
                            className="rounded-xl bg-gray-900 hover:bg-gray-800"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    创建中...
                                </>
                            ) : (
                                '创建密钥'
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreating(false);
                                setNewKeyName('');
                            }}
                            className="rounded-xl"
                        >
                            取消
                        </Button>
                    </div>
                </div>
            )}

            {/* 密钥列表 */}
            <div className="bg-white rounded-3xl border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        有效密钥 ({activeKeys.length})
                    </h3>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    </div>
                ) : activeKeys.length === 0 ? (
                    <div className="p-12 text-center">
                        <Key className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">暂无 API 密钥</p>
                        <p className="text-sm text-gray-400 mt-1">点击上方按钮创建你的第一个密钥</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {activeKeys.map((key) => {
                            const roleInfo = roleDescriptions[key.role] || roleDescriptions['ai-readonly'];
                            const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();

                            return (
                                <div key={key.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <Key className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-gray-900">{key.name}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                                                    {roleInfo.name}
                                                </span>
                                                {isExpired && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                        已过期
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <code className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-xs text-gray-600">
                                                    {key.keyPrefix}...
                                                </code>
                                                <button
                                                    onClick={() => handleCopy(key.keyPrefix + '...', key.id)}
                                                    className="p-1 text-gray-400 hover:text-gray-600"
                                                >
                                                    {copiedKey === key.id ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    创建于 {new Date(key.createdAt).toLocaleDateString('zh-CN')}
                                                </span>
                                                {key.expiresAt && (
                                                    <span className="flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {isExpired ? '已过期' : `${new Date(key.expiresAt).toLocaleDateString('zh-CN')} 过期`}
                                                    </span>
                                                )}
                                                {key.lastUsedAt && (
                                                    <span className="flex items-center gap-1">
                                                        最近使用 {new Date(key.lastUsedAt).toLocaleDateString('zh-CN')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => revokeMutation.mutate({ id: key.id })}
                                                disabled={revokeMutation.isPending}
                                            >
                                                <Ban className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg text-gray-600 border-gray-200 hover:bg-gray-100"
                                                onClick={() => {
                                                    if (confirm('确定要删除此密钥吗？此操作不可撤销。')) {
                                                        deleteMutation.mutate({ id: key.id });
                                                    }
                                                }}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 已撤销的密钥 */}
            {revokedKeys.length > 0 && (
                <div className="bg-white rounded-3xl border border-black/10 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                            已撤销密钥 ({revokedKeys.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100 opacity-60">
                        {revokedKeys.map((key) => (
                            <div key={key.id} className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Key className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-500 line-through">{key.name}</h4>
                                        <p className="text-xs text-gray-400">
                                            撤销于 {key.revokedAt && new Date(key.revokedAt).toLocaleDateString('zh-CN')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-lg text-gray-400 hover:text-red-600"
                                        onClick={() => {
                                            if (confirm('确定要删除此密钥吗？')) {
                                                deleteMutation.mutate({ id: key.id });
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 安全提示 */}
            <div className="bg-amber-50 rounded-3xl border border-amber-200 p-6">
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="font-medium text-amber-900">安全提示</h4>
                        <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                            <li>API 密钥只在创建时显示一次，请妥善保存</li>
                            <li>不要在公开场合分享你的 API 密钥</li>
                            <li>如果密钥泄露，请立即撤销并创建新密钥</li>
                            <li>建议为不同用途创建不同的密钥</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
