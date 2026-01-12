'use client';

/**
 * 我的作品页面
 * 
 * 用户可以发表使用该色彩体系的设计作品
 * 可以关联某个色彩簿或色彩
 */

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
    Plus, 
    ImageIcon, 
    Edit, 
    Trash2, 
    ExternalLink,
    Loader2,
    Eye,
    EyeOff,
    Palette,
    Link2,
    X,
    Search,
    Check,
    BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';

// Lab to RGB 转换
function labToRgb(L: number, a: number, b: number): string {
    // Lab to XYZ
    let y = (L + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    const y3 = Math.pow(y, 3);
    const x3 = Math.pow(x, 3);
    const z3 = Math.pow(z, 3);

    y = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787;
    x = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787;
    z = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787;

    x *= 95.047;
    y *= 100.0;
    z *= 108.883;

    // XYZ to RGB
    x = x / 100;
    y = y / 100;
    z = z / 100;

    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let bVal = x * 0.0557 + y * -0.204 + z * 1.057;

    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
    bVal = bVal > 0.0031308 ? 1.055 * Math.pow(bVal, 1 / 2.4) - 0.055 : 12.92 * bVal;

    const toHex = (c: number) => {
        const val = Math.max(0, Math.min(255, Math.round(c * 255)));
        return val.toString(16).padStart(2, '0');
    };

    return `#${toHex(r)}${toHex(g)}${toHex(bVal)}`;
}

// 颜色类型定义
interface ColorInfo {
    id: string;
    colorId: string;
    name: string;
    labL: number;
    labA: number;
    labB: number;
}

// 作品类型定义
interface Work {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    colorBookId: string | null;
    colorBook: {
        id: string;
        name: string;
        slug: string;
    } | null;
    colors: Array<{
        id: string;
        colorId: string;
        color: ColorInfo;
    }>;
    externalUrl: string | null;
    tags: string[];
    isPublic: boolean;
    viewCount: number;
    likeCount: number;
    createdAt: string;
    updatedAt: string;
}

// 色彩簿选择器组件
function ColorBookSelector({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (id: string | null) => void;
}) {
    const { data: colorBooksData } = trpc.user.colorBooks.useQuery({ limit: 50 });
    const colorBooks = colorBooksData?.items || [];

    return (
        <div className="space-y-2">
            <Label>关联色彩簿（可选）</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-xl bg-gray-50">
                {colorBooks.length === 0 ? (
                    <p className="text-sm text-gray-500">暂无色彩簿，请先创建</p>
                ) : (
                    colorBooks.map((book) => (
                        <button
                            key={book.id}
                            type="button"
                            onClick={() => onChange(value === book.id ? null : book.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                                value === book.id
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                            {book.name}
                            {value === book.id && <Check className="h-3.5 w-3.5" />}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

// 颜色选择器组件
function ColorSelector({
    selectedIds,
    onChange,
}: {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const { data: colorsData, isLoading } = trpc.color.list.useQuery({
        limit: 50,
        search: searchQuery || undefined,
    });
    const colors = colorsData?.items || [];

    const toggleColor = (colorId: string) => {
        if (selectedIds.includes(colorId)) {
            onChange(selectedIds.filter((id) => id !== colorId));
        } else if (selectedIds.length < 20) {
            onChange([...selectedIds, colorId]);
        }
    };

    return (
        <div className="space-y-2">
            <Label>关联颜色（可选，最多 20 个）</Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="搜索颜色..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-xl"
                />
            </div>
            
            {/* 已选择的颜色 */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border rounded-xl bg-gray-50">
                    {selectedIds.map((id) => {
                        const color = colors.find((c) => c.id === id);
                        if (!color) return null;
                        const bgColor = labToRgb(color.labL, color.labA, color.labB);
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => toggleColor(id)}
                                className="flex items-center gap-2 px-2 py-1 rounded-full bg-white border border-gray-200 text-sm"
                            >
                                <span
                                    className="h-4 w-4 rounded-full border border-black/10"
                                    style={{ backgroundColor: bgColor }}
                                />
                                <span className="text-gray-700">{color.name}</span>
                                <X className="h-3.5 w-3.5 text-gray-400" />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* 搜索结果 */}
            <div className="max-h-40 overflow-y-auto p-2 border rounded-xl bg-white">
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                ) : colors.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                        {searchQuery ? '未找到匹配的颜色' : '暂无颜色'}
                    </p>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {colors.slice(0, 20).map((color) => {
                            const bgColor = labToRgb(color.labL, color.labA, color.labB);
                            const isSelected = selectedIds.includes(color.id);
                            return (
                                <button
                                    key={color.id}
                                    type="button"
                                    onClick={() => toggleColor(color.id)}
                                    disabled={!isSelected && selectedIds.length >= 20}
                                    className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                                        isSelected
                                            ? 'bg-gray-100 ring-2 ring-gray-900'
                                            : 'hover:bg-gray-50 disabled:opacity-50'
                                    }`}
                                >
                                    <span
                                        className="h-6 w-6 rounded-md border border-black/10 flex-shrink-0"
                                        style={{ backgroundColor: bgColor }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {color.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{color.colorId}</p>
                                    </div>
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-gray-900 flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// 作品卡片组件
function WorkCard({ 
    work, 
    onEdit, 
    onDelete 
}: { 
    work: Work; 
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <Card className="rounded-3xl bg-white border-black/10 shadow-sm overflow-hidden group">
            {/* 作品图片 */}
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={work.imageUrl}
                    alt={work.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"%3E%3Cpath stroke="%23ccc" stroke-width="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/%3E%3C/svg%3E';
                    }}
                />
                {/* 公开/私有标识 */}
                <div className="absolute top-3 right-3">
                    <Badge 
                        variant="secondary" 
                        className={`${work.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                        {work.isPublic ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                        {work.isPublic ? '公开' : '私有'}
                    </Badge>
                </div>
                {/* 悬浮操作 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full"
                        onClick={onEdit}
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="rounded-full"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                删除
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                    确定要删除作品「{work.title}」吗？此操作不可撤销。
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={onDelete}
                                    className="rounded-xl bg-red-600 hover:bg-red-700"
                                >
                                    删除
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <CardContent className="p-4 space-y-3">
                {/* 标题 */}
                <h3 className="font-semibold text-gray-900 truncate">{work.title}</h3>

                {/* 描述 */}
                {work.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{work.description}</p>
                )}

                {/* 关联的色彩簿 */}
                {work.colorBook && (
                    <Link
                        href={`/color-book/${work.colorBook.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <BookOpen className="h-3.5 w-3.5" />
                        {work.colorBook.name}
                    </Link>
                )}

                {/* 关联的颜色 */}
                {work.colors.length > 0 && (
                    <div className="flex items-center gap-1">
                        {work.colors.slice(0, 6).map(({ color }) => {
                            const bgColor = labToRgb(color.labL, color.labA, color.labB);
                            return (
                                <div
                                    key={color.id}
                                    className="h-5 w-5 rounded-full border border-black/10"
                                    style={{ backgroundColor: bgColor }}
                                    title={color.name}
                                />
                            );
                        })}
                        {work.colors.length > 6 && (
                            <span className="text-xs text-gray-500 ml-1">
                                +{work.colors.length - 6}
                            </span>
                        )}
                    </div>
                )}

                {/* 外部链接 */}
                {work.externalUrl && (
                    <a
                        href={work.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                    >
                        <Link2 className="h-3.5 w-3.5" />
                        查看原作
                        <ExternalLink className="h-3 w-3" />
                    </a>
                )}

                {/* 标签 */}
                {work.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {work.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* 时间 */}
                <p className="text-xs text-gray-400">
                    {new Date(work.createdAt).toLocaleDateString('zh-CN')}
                </p>
            </CardContent>
        </Card>
    );
}

// 创建/编辑作品对话框
function WorkFormDialog({
    work,
    open,
    onOpenChange,
    onSuccess,
}: {
    work?: Work | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const isEdit = !!work;
    const [title, setTitle] = useState(work?.title || '');
    const [description, setDescription] = useState(work?.description || '');
    const [imageUrl, setImageUrl] = useState(work?.imageUrl || '');
    const [colorBookId, setColorBookId] = useState<string | null>(work?.colorBookId || null);
    const [colorIds, setColorIds] = useState<string[]>(work?.colors.map((c) => c.color.id) || []);
    const [externalUrl, setExternalUrl] = useState(work?.externalUrl || '');
    const [tags, setTags] = useState(work?.tags.join(', ') || '');
    const [isPublic, setIsPublic] = useState(work?.isPublic || false);

    const createMutation = trpc.user.createWork.useMutation({
        onSuccess: () => {
            onSuccess();
            onOpenChange(false);
            resetForm();
        },
    });

    const updateMutation = trpc.user.updateWork.useMutation({
        onSuccess: () => {
            onSuccess();
            onOpenChange(false);
        },
    });

    const isLoading = createMutation.isPending || updateMutation.isPending;

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setImageUrl('');
        setColorBookId(null);
        setColorIds([]);
        setExternalUrl('');
        setTags('');
        setIsPublic(false);
    };

    const handleSubmit = async () => {
        const tagsArray = tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t);

        if (isEdit && work) {
            await updateMutation.mutateAsync({
                id: work.id,
                title,
                description: description || null,
                imageUrl,
                colorBookId,
                colorIds,
                externalUrl: externalUrl || null,
                tags: tagsArray,
                isPublic,
            });
        } else {
            await createMutation.mutateAsync({
                title,
                description: description || undefined,
                imageUrl,
                colorBookId: colorBookId || undefined,
                colorIds: colorIds.length > 0 ? colorIds : undefined,
                externalUrl: externalUrl || undefined,
                tags: tagsArray.length > 0 ? tagsArray : undefined,
                isPublic,
            });
        }
    };

    // 当 work 变化时更新表单
    useEffect(() => {
        if (work) {
            setTitle(work.title);
            setDescription(work.description || '');
            setImageUrl(work.imageUrl);
            setColorBookId(work.colorBookId);
            setColorIds(work.colors.map((c) => c.color.id));
            setExternalUrl(work.externalUrl || '');
            setTags(work.tags.join(', '));
            setIsPublic(work.isPublic);
        }
    }, [work]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] rounded-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {isEdit ? '编辑作品' : '发布新作品'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit ? '修改作品信息' : '分享你使用 SOURCE 色彩体系创作的设计作品'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 作品标题 */}
                    <div className="space-y-2">
                        <Label htmlFor="title">作品标题 *</Label>
                        <Input
                            id="title"
                            placeholder="给你的作品起个名字"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-xl"
                            maxLength={100}
                        />
                    </div>

                    {/* 作品描述 */}
                    <div className="space-y-2">
                        <Label htmlFor="description">作品描述</Label>
                        <Textarea
                            id="description"
                            placeholder="介绍一下你的作品..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="rounded-xl min-h-[100px]"
                            maxLength={2000}
                        />
                    </div>

                    {/* 作品图片 URL */}
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">作品图片 URL *</Label>
                        <Input
                            id="imageUrl"
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="rounded-xl"
                        />
                        {imageUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageUrl}
                                    alt="预览"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* 关联色彩簿 */}
                    <ColorBookSelector value={colorBookId} onChange={setColorBookId} />

                    {/* 关联颜色 */}
                    <ColorSelector selectedIds={colorIds} onChange={setColorIds} />

                    {/* 外部链接 */}
                    <div className="space-y-2">
                        <Label htmlFor="externalUrl">外部链接</Label>
                        <Input
                            id="externalUrl"
                            placeholder="https://dribbble.com/shots/..."
                            value={externalUrl}
                            onChange={(e) => setExternalUrl(e.target.value)}
                            className="rounded-xl"
                        />
                        <p className="text-xs text-gray-500">
                            可以添加 Behance、Dribbble 等平台的作品链接
                        </p>
                    </div>

                    {/* 标签 */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">标签</Label>
                        <Input
                            id="tags"
                            placeholder="品牌设计, 印刷, 包装（用逗号分隔）"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>

                    {/* 公开设置 */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                        <div>
                            <Label htmlFor="isPublic" className="text-base font-medium">
                                公开作品
                            </Label>
                            <p className="text-sm text-gray-500">
                                公开后其他用户可以看到你的作品
                            </p>
                        </div>
                        <Switch
                            id="isPublic"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="rounded-xl"
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!title || !imageUrl || isLoading}
                        className="rounded-xl bg-gray-900 hover:bg-gray-800"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isEdit ? '保存中...' : '发布中...'}
                            </>
                        ) : (
                            <>
                                {isEdit ? '保存修改' : '发布作品'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function WorksPage() {
    const { data: session } = useSession();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingWork, setEditingWork] = useState<Work | null>(null);

    const { data: worksData, isLoading, refetch } = trpc.user.works.useQuery(
        { limit: 50 },
        { enabled: !!session?.user }
    );
    const works = (worksData?.items || []) as Work[];

    const deleteMutation = trpc.user.deleteWork.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    const handleDelete = async (workId: string) => {
        await deleteMutation.mutateAsync({ id: workId });
    };

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <Card className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">我的作品</h1>
                            <p className="text-gray-300">
                                展示你使用 SOURCE 色彩体系创作的设计作品
                            </p>
                        </div>
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            className="rounded-xl bg-white text-gray-900 hover:bg-gray-100"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            发布新作品
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 作品列表 */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : works.length === 0 ? (
                <Card className="rounded-3xl border-black/10">
                    <CardContent className="p-16 text-center">
                        <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            还没有发布作品
                        </h3>
                        <p className="text-gray-600 mb-6">
                            分享你使用 SOURCE 色彩体系创作的设计作品，<br />
                            让更多人看到你的创意
                        </p>
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            className="rounded-xl bg-gray-900 hover:bg-gray-800"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            发布第一个作品
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {works.map((work) => (
                        <WorkCard
                            key={work.id}
                            work={work}
                            onEdit={() => setEditingWork(work)}
                            onDelete={() => handleDelete(work.id)}
                        />
                    ))}
                </div>
            )}

            {/* 创建作品对话框 */}
            <WorkFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={refetch}
            />

            {/* 编辑作品对话框 */}
            <WorkFormDialog
                work={editingWork}
                open={!!editingWork}
                onOpenChange={(open) => {
                    if (!open) setEditingWork(null);
                }}
                onSuccess={refetch}
            />
        </div>
    );
}
