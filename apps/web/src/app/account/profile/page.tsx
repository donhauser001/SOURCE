'use client';

/**
 * 个人资料编辑页面
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
    User, 
    Mail, 
    Loader2, 
    Save,
    CheckCircle2,
    Camera,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // 初始化名称
    useEffect(() => {
        if (session?.user?.name) {
            setName(session.user.name);
        }
    }, [session?.user?.name]);

    const updateProfile = trpc.user.updateProfile.useMutation({
        onSuccess: async () => {
            setSuccess(true);
            setError('');
            await update();
            setTimeout(() => setSuccess(false), 3000);
        },
        onError: (err) => {
            setError(err.message || '保存失败，请稍后重试');
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        setError('');
        try {
            await updateProfile.mutateAsync({ name: name.trim() });
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = name !== (session?.user?.name || '');

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">个人资料</h1>
                <p className="text-gray-500 mt-1">更新你的个人信息</p>
            </div>

            {/* 头像卡片 */}
            <div className="bg-white rounded-3xl border border-black/10 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">
                    头像
                </h3>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-2xl bg-gray-900 flex items-center justify-center overflow-hidden">
                            {session?.user?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                    src={session.user.image} 
                                    alt="" 
                                    className="h-24 w-24 object-cover" 
                                />
                            ) : (
                                <span className="text-3xl font-bold text-white">
                                    {(session?.user?.name || session?.user?.email)?.[0]?.toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <button 
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
                            disabled
                            title="头像上传功能即将推出"
                        >
                            <Camera className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-600">
                            推荐使用正方形图片，支持 JPG、PNG 格式
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            头像上传功能即将推出
                        </p>
                    </div>
                </div>
            </div>

            {/* 基本信息卡片 */}
            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-3xl border border-black/10 p-6 space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        基本信息
                    </h3>

                    {/* 错误提示 */}
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* 成功提示 */}
                    {success && (
                        <div className="bg-emerald-50 text-emerald-600 text-sm p-4 rounded-2xl flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                            资料已保存
                        </div>
                    )}

                    {/* 邮箱（只读） */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Mail className="h-4 w-4 text-gray-400" />
                            邮箱地址
                        </label>
                        <Input
                            type="email"
                            value={session?.user?.email || ''}
                            disabled
                            className="h-12 rounded-xl bg-gray-50 border-gray-200"
                        />
                        <p className="text-xs text-gray-400">邮箱地址是你的登录凭证，不可更改</p>
                    </div>

                    {/* 显示名称 */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <User className="h-4 w-4 text-gray-400" />
                            显示名称
                        </label>
                        <Input
                            type="text"
                            placeholder="输入你的名称"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSaving}
                            className="h-12 rounded-xl border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                            maxLength={50}
                        />
                        <p className="text-xs text-gray-400">这个名称将显示在你的个人资料和评论中</p>
                    </div>

                    {/* 保存按钮 */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                        <Button 
                            type="submit" 
                            disabled={isSaving || !hasChanges || !name.trim()}
                            className="h-11 px-6 rounded-xl bg-gray-900 hover:bg-gray-800"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    保存中...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    保存更改
                                </>
                            )}
                        </Button>
                        {hasChanges && !isSaving && (
                            <span className="text-sm text-amber-600">有未保存的更改</span>
                        )}
                    </div>
                </div>
            </form>

            {/* 账户信息（只读） */}
            <div className="bg-white rounded-3xl border border-black/10 p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    账户信息
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 mb-1">用户 ID</p>
                        <p className="font-mono text-sm text-gray-700 truncate">
                            {session?.user?.id || '-'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 mb-1">注册方式</p>
                        <p className="text-sm text-gray-700">邮箱登录</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
