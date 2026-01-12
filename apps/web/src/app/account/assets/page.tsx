'use client';

/**
 * 色彩资产页面
 * 
 * 展示用户的色彩相关资产：色彩簿、购买意向、分析报告等
 */

import { useState } from 'react';
import Link from 'next/link';
import {
    Palette,
    ShoppingCart,
    FileText,
    Clock,
    ArrowRight,
    ChevronRight,
    Package,
    Loader2,
    ExternalLink,
    Plus,
    BookOpen,
    Trash2,
    Edit3,
    MoreHorizontal,
    Globe,
    Lock,
    Check,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

// Lab 转 RGB
function labToRgb(L: number, a: number, b: number): string {
    let y = (L + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    const xyz = [x, y, z].map((v) => {
        const v3 = v * v * v;
        return v3 > 0.008856 ? v3 : (v - 16 / 116) / 7.787;
    });

    x = xyz[0] * 95.047;
    y = xyz[1] * 100.0;
    z = xyz[2] * 108.883;

    let r = x * 0.032406 + y * -0.015372 + z * -0.004986;
    let g = x * -0.009689 + y * 0.018758 + z * 0.000415;
    let bVal = x * 0.000557 + y * -0.002040 + z * 0.010570;

    [r, g, bVal] = [r, g, bVal].map((v) =>
        v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v
    );

    const toHex = (v: number) => {
        const val = Math.max(0, Math.min(255, Math.round(v * 255)));
        return val.toString(16).padStart(2, '0');
    };

    return `#${toHex(r)}${toHex(g)}${toHex(bVal)}`;
}

type TabType = 'colorBooks' | 'intents' | 'reports';

export default function AssetsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('colorBooks');
    const [isCreating, setIsCreating] = useState(false);
    const [newBookName, setNewBookName] = useState('');
    const [newBookDesc, setNewBookDesc] = useState('');
    const [editingBook, setEditingBook] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');

    const utils = trpc.useUtils();
    const { data: stats, isLoading: statsLoading } = trpc.user.assetsStats.useQuery();
    const { data: colorBooks, isLoading: booksLoading } = trpc.user.colorBooks.useQuery({ limit: 50 });
    const { data: buyIntents, isLoading: intentsLoading } = trpc.user.buyIntents.useQuery({ limit: 20 });
    const { data: reports, isLoading: reportsLoading } = trpc.user.analysisReports.useQuery({ limit: 20 });

    const createMutation = trpc.user.createColorBook.useMutation({
        onSuccess: () => {
            setIsCreating(false);
            setNewBookName('');
            setNewBookDesc('');
            utils.user.colorBooks.invalidate();
            utils.user.assetsStats.invalidate();
        },
    });

    const updateMutation = trpc.user.updateColorBook.useMutation({
        onSuccess: () => {
            setEditingBook(null);
            utils.user.colorBooks.invalidate();
        },
    });

    const deleteMutation = trpc.user.deleteColorBook.useMutation({
        onSuccess: () => {
            utils.user.colorBooks.invalidate();
            utils.user.assetsStats.invalidate();
        },
    });

    const handleCreate = async () => {
        if (!newBookName.trim()) return;
        await createMutation.mutateAsync({
            name: newBookName.trim(),
            description: newBookDesc.trim() || undefined,
        });
    };

    const handleUpdate = async (id: string) => {
        await updateMutation.mutateAsync({
            id,
            name: editName.trim() || undefined,
            description: editDesc.trim() || null,
        });
    };

    const handleDelete = async (id: string) => {
        if (confirm('确定要删除这个色彩簿吗？此操作不可撤销。')) {
            await deleteMutation.mutateAsync({ id });
        }
    };

    const startEdit = (book: { id: string; name: string; description?: string | null }) => {
        setEditingBook(book.id);
        setEditName(book.name);
        setEditDesc(book.description || '');
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">色彩资产</h1>
                <p className="text-gray-500 mt-1">管理你的色彩簿和相关记录</p>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                    onClick={() => setActiveTab('colorBooks')}
                    className={`bg-white rounded-2xl border p-5 text-left transition-all ${activeTab === 'colorBooks'
                            ? 'border-gray-900 ring-1 ring-gray-900'
                            : 'border-black/10 hover:border-gray-300'
                        }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                        </div>
                        {activeTab === 'colorBooks' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white">
                                当前
                            </span>
                        )}
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {statsLoading ? '-' : stats?.colorBooks || 0}
                    </p>
                    <p className="text-sm text-gray-500">我的色彩簿</p>
                </button>

                <button
                    onClick={() => setActiveTab('intents')}
                    className={`bg-white rounded-2xl border p-5 text-left transition-all ${activeTab === 'intents'
                            ? 'border-gray-900 ring-1 ring-gray-900'
                            : 'border-black/10 hover:border-gray-300'
                        }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-amber-600" />
                        </div>
                        {activeTab === 'intents' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white">
                                当前
                            </span>
                        )}
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {statsLoading ? '-' : stats?.buyIntents || 0}
                    </p>
                    <p className="text-sm text-gray-500">购买意向</p>
                </button>

                <button
                    onClick={() => setActiveTab('reports')}
                    className={`bg-white rounded-2xl border p-5 text-left transition-all ${activeTab === 'reports'
                            ? 'border-gray-900 ring-1 ring-gray-900'
                            : 'border-black/10 hover:border-gray-300'
                        }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        {activeTab === 'reports' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white">
                                当前
                            </span>
                        )}
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {statsLoading ? '-' : stats?.analysisReports || 0}
                    </p>
                    <p className="text-sm text-gray-500">分析报告</p>
                </button>
            </div>

            {/* 色彩簿列表 */}
            {activeTab === 'colorBooks' && (
                <div className="space-y-4">
                    {/* 创建新色彩簿 */}
                    {isCreating ? (
                        <div className="bg-white rounded-3xl border border-black/10 p-6 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                                新建色彩簿
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <Input
                                        placeholder="色彩簿名称"
                                        value={newBookName}
                                        onChange={(e) => setNewBookName(e.target.value)}
                                        className="h-11 rounded-xl border-gray-200"
                                    />
                                </div>
                                <div>
                                    <Input
                                        placeholder="简短描述（可选）"
                                        value={newBookDesc}
                                        onChange={(e) => setNewBookDesc(e.target.value)}
                                        className="h-11 rounded-xl border-gray-200"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleCreate}
                                    disabled={!newBookName.trim() || createMutation.isPending}
                                    className="rounded-xl bg-gray-900 hover:bg-gray-800"
                                >
                                    {createMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        '创建'
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewBookName('');
                                        setNewBookDesc('');
                                    }}
                                    className="rounded-xl"
                                >
                                    取消
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="w-full h-12 rounded-2xl bg-gray-900 hover:bg-gray-800"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            新建色彩簿
                        </Button>
                    )}

                    {/* 色彩簿列表 */}
                    <div className="bg-white rounded-3xl border border-black/10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                                我的色彩簿 ({colorBooks?.items.length || 0})
                            </h3>
                        </div>

                        {booksLoading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                            </div>
                        ) : !colorBooks?.items.length ? (
                            <div className="p-12 text-center">
                                <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">暂无色彩簿</p>
                                <p className="text-sm text-gray-400 mt-1">创建一个色彩簿来收藏你喜欢的颜色</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {colorBooks.items.map((book) => (
                                    <div key={book.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        {editingBook === book.id ? (
                                            /* 编辑模式 */
                                            <div className="space-y-3">
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-10 rounded-lg border-gray-200"
                                                    placeholder="色彩簿名称"
                                                />
                                                <Input
                                                    value={editDesc}
                                                    onChange={(e) => setEditDesc(e.target.value)}
                                                    className="h-10 rounded-lg border-gray-200"
                                                    placeholder="简短描述"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdate(book.id)}
                                                        disabled={updateMutation.isPending}
                                                        className="rounded-lg bg-gray-900 hover:bg-gray-800"
                                                    >
                                                        {updateMutation.isPending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Check className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setEditingBook(null)}
                                                        className="rounded-lg"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* 显示模式 */
                                            <div className="flex items-center gap-4">
                                                {/* 色彩预览 */}
                                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                                                    <BookOpen className="h-6 w-6 text-purple-600" />
                                                </div>

                                                {/* 信息 */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-gray-900 truncate">
                                                            {book.name}
                                                        </h4>
                                                        {book.isPublic ? (
                                                            <Globe className="h-3.5 w-3.5 text-gray-400" />
                                                        ) : (
                                                            <Lock className="h-3.5 w-3.5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                        <span>{book.totalColors} 个颜色</span>
                                                        <span>·</span>
                                                        <span>更新于 {new Date(book.updatedAt).toLocaleDateString('zh-CN')}</span>
                                                    </div>
                                                </div>

                                                {/* 操作按钮 */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <Link
                                                        href={`/color-book/${book.slug}`}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => startEdit(book)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(book.id)}
                                                        disabled={deleteMutation.isPending}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 购买意向列表 */}
            {activeTab === 'intents' && (
                <div className="bg-white rounded-3xl border border-black/10 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                            购买意向记录
                        </h3>
                        <Link
                            href="/colors"
                            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                        >
                            浏览色彩库
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {intentsLoading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : !buyIntents?.items.length ? (
                        <div className="p-12 text-center">
                            <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">暂无购买意向</p>
                            <p className="text-sm text-gray-400 mt-1">浏览色彩详情页，点击购买按钮即可记录意向</p>
                            <Link
                                href="/colors"
                                className="inline-flex items-center mt-4 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                前往色彩库
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {buyIntents.items.map((intent) => {
                                const color = intent.proofingPack.color;
                                const bgColor = labToRgb(color.labL, color.labA, color.labB);

                                return (
                                    <Link
                                        key={intent.id}
                                        href={`/color/${color.colorId}`}
                                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                                    >
                                        <div
                                            className="h-12 w-12 rounded-xl flex-shrink-0"
                                            style={{ backgroundColor: bgColor }}
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {color.name}
                                                </h4>
                                                <span className="text-xs text-gray-400 font-mono">
                                                    {color.colorId}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Package className="h-3 w-3" />
                                                    {intent.proofingPack.paperType?.name || '标准纸张'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(intent.createdAt).toLocaleDateString('zh-CN')}
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 分析报告列表 */}
            {activeTab === 'reports' && (
                <div className="bg-white rounded-3xl border border-black/10 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                            分析报告
                        </h3>
                        <Link
                            href="/analyze"
                            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                        >
                            新建分析
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {reportsLoading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : !reports?.items.length ? (
                        <div className="p-12 text-center">
                            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">暂无分析报告</p>
                            <p className="text-sm text-gray-400 mt-1">上传设计文件进行色彩分析</p>
                            <Link
                                href="/analyze"
                                className="inline-flex items-center mt-4 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                前往分析工具
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {reports.items.map((report) => {
                                // 从 summary 中提取文件名
                                const summary = report.summary as { fileName?: string; docType?: string } | null;
                                const fileName = summary?.fileName || '未命名报告';
                                const docType = summary?.docType || '设计文件';

                                // 检查是否过期
                                const isExpired = new Date(report.expiresAt) < new Date();

                                return (
                                    <Link
                                        key={report.id}
                                        href={`/analyze/${report.id}`}
                                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <FileText className="h-6 w-6 text-gray-500" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {fileName}
                                                </h4>
                                                {isExpired ? (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                        已过期
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                        有效
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span>{docType}</span>
                                                <span>·</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(report.createdAt).toLocaleDateString('zh-CN')}
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 快捷入口 */}
            <div className="bg-gray-50 rounded-3xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
                    快捷入口
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link
                        href="/colors"
                        className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-black/10 hover:border-gray-300 hover:shadow-sm transition-all group"
                    >
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Palette className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">色彩库</p>
                            <p className="text-xs text-gray-500">浏览所有颜色</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                    </Link>

                    <Link
                        href="/analyze"
                        className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-black/10 hover:border-gray-300 hover:shadow-sm transition-all group"
                    >
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">色彩分析</p>
                            <p className="text-xs text-gray-500">上传文件分析</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                    </Link>

                    <Link
                        href="/color-books"
                        className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-black/10 hover:border-gray-300 hover:shadow-sm transition-all group"
                    >
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">色彩簿</p>
                            <p className="text-xs text-gray-500">查看色彩合集</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
