'use client';

/**
 * 色彩簿表单组件
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ColorBookStatus } from '@prisma/client';

const STATUS_OPTIONS: { value: ColorBookStatus; label: string }[] = [
    { value: 'DRAFT', label: '草稿' },
    { value: 'ACTIVE', label: '已发布' },
    { value: 'DISCONTINUED', label: '已停刊' },
];

interface ColorBookFormProps {
    colorBookId?: string;
    initialData?: {
        bookId: string;
        name: string;
        slug: string;
        description: string | null;
        shortDesc: string | null;
        coverImageUrl: string | null;
        publishedYear: number | null;
        edition: string | null;
        categoryId: string;
        tags: string[];
        status: ColorBookStatus;
    };
    /** 创建成功后的回调，返回新创建的色彩簿 ID */
    onCreateSuccess?: (colorBookId: string) => void;
}

export function ColorBookForm({ colorBookId, initialData, onCreateSuccess }: ColorBookFormProps) {
    const router = useRouter();
    const isEditMode = !!colorBookId;

    const [formData, setFormData] = useState({
        bookId: initialData?.bookId || '',
        name: initialData?.name || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        shortDesc: initialData?.shortDesc || '',
        coverImageUrl: initialData?.coverImageUrl || '',
        publishedYear: initialData?.publishedYear?.toString() || '',
        edition: initialData?.edition || '',
        categoryId: initialData?.categoryId || '',
        tags: initialData?.tags || [],
        status: initialData?.status || ('DRAFT' as ColorBookStatus),
    });

    const [tagInput, setTagInput] = useState('');
    const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
    const [showEditCategoryDialog, setShowEditCategoryDialog] = useState<{ id: string; name: string } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editCategoryName, setEditCategoryName] = useState('');

    // 获取分类列表
    const { data: categories, refetch: refetchCategories } = trpc.colorBookCategory.list.useQuery();

    // 设置默认分类
    useEffect(() => {
        if (categories && categories.length > 0 && !formData.categoryId) {
            const defaultCategory = categories.find((c: { isDefault: boolean }) => c.isDefault) || categories[0];
            setFormData((prev) => ({ ...prev, categoryId: defaultCategory.id }));
        }
    }, [categories, formData.categoryId]);

    // 自动生成 slug
    useEffect(() => {
        if (!isEditMode && formData.name && !formData.slug) {
            const slug = formData.name
                .toLowerCase()
                .replace(/[\u4e00-\u9fa5]/g, (char) => char)
                .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
                .replace(/^-|-$/g, '');
            setFormData((prev) => ({ ...prev, slug }));
        }
    }, [formData.name, formData.slug, isEditMode]);

    const createMutation = trpc.colorBook.create.useMutation({
        onSuccess: (data) => {
            if (onCreateSuccess) {
                onCreateSuccess(data.id);
            } else {
                router.push(`/admin/color-books/${data.id}`);
            }
        },
    });

    const updateMutation = trpc.colorBook.update.useMutation({
        onSuccess: () => {
            router.push('/admin/color-books');
        },
    });

    const createCategoryMutation = trpc.colorBookCategory.create.useMutation({
        onSuccess: (data) => {
            refetchCategories();
            setFormData((prev) => ({ ...prev, categoryId: data.id }));
            setShowAddCategoryDialog(false);
            setNewCategoryName('');
        },
    });

    const renameCategoryMutation = trpc.colorBookCategory.rename.useMutation({
        onSuccess: () => {
            refetchCategories();
            setShowEditCategoryDialog(null);
            setEditCategoryName('');
        },
    });

    const deleteCategoryMutation = trpc.colorBookCategory.delete.useMutation({
        onSuccess: () => {
            refetchCategories();
            setShowDeleteConfirm(null);
            // 如果删除的是当前选中的分类，切换到默认分类
            if (categories) {
                const defaultCategory = categories.find((c: { isDefault: boolean }) => c.isDefault);
                if (defaultCategory && formData.categoryId === showDeleteConfirm) {
                    setFormData((prev) => ({ ...prev, categoryId: defaultCategory.id }));
                }
            }
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            bookId: formData.bookId,
            name: formData.name,
            slug: formData.slug,
            description: formData.description || undefined,
            shortDesc: formData.shortDesc || undefined,
            coverImageUrl: formData.coverImageUrl || undefined,
            publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : undefined,
            edition: formData.edition || undefined,
            categoryId: formData.categoryId,
            tags: formData.tags,
            status: formData.status,
        };

        if (isEditMode) {
            updateMutation.mutate({ id: colorBookId!, ...data });
        } else {
            createMutation.mutate(data);
        }
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t) => t !== tag),
        }));
    };

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            createCategoryMutation.mutate({ name: newCategoryName.trim() });
        }
    };

    const handleRenameCategory = () => {
        if (showEditCategoryDialog && editCategoryName.trim()) {
            renameCategoryMutation.mutate({
                id: showEditCategoryDialog.id,
                name: editCategoryName.trim(),
            });
        }
    };

    const handleDeleteCategory = (categoryId: string) => {
        deleteCategoryMutation.mutate({ id: categoryId });
    };

    const openEditDialog = (cat: { id: string; name: string }) => {
        setShowEditCategoryDialog(cat);
        setEditCategoryName(cat.name);
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const error = createMutation.error || updateMutation.error;

    // 获取当前选中的分类名称
    const selectedCategory = categories?.find((c: { id: string }) => c.id === formData.categoryId);

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Card className="border-destructive bg-destructive/10">
                        <CardContent className="pt-6">
                            <p className="text-destructive text-sm">{error.message}</p>
                        </CardContent>
                    </Card>
                )}

                {/* 基本信息 */}
                <Card>
                    <CardHeader>
                        <CardTitle>基本信息</CardTitle>
                        <CardDescription>色彩簿的核心标识信息</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bookId">色彩簿编号 *</Label>
                                <Input
                                    id="bookId"
                                    value={formData.bookId}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, bookId: e.target.value }))}
                                    placeholder="如 CB-SONG-VOL1"
                                    disabled={isEditMode}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">名称 *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="如 宋韵色彩 第一卷"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL 标识 *</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                                    placeholder="song-vol1"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">状态</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as ColorBookStatus }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shortDesc">简短描述</Label>
                            <Input
                                id="shortDesc"
                                value={formData.shortDesc}
                                onChange={(e) => setFormData((prev) => ({ ...prev, shortDesc: e.target.value }))}
                                placeholder="用于列表展示的简短说明"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">详细描述</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="色彩簿的详细介绍"
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 分类与标签 */}
                <Card>
                    <CardHeader>
                        <CardTitle>分类与标签</CardTitle>
                        <CardDescription>色彩簿的分类与标签信息</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">分类 *</Label>
                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full md:w-64 justify-between">
                                            <span className="flex items-center gap-2">
                                                {selectedCategory?.name || '选择分类'}
                                                {selectedCategory?.isDefault && (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">默认</Badge>
                                                )}
                                            </span>
                                            <MoreHorizontal className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64">
                                        {categories?.map((cat: { id: string; name: string; isDefault: boolean }) => (
                                            <div key={cat.id} className="flex items-center">
                                                <DropdownMenuItem
                                                    className="flex-1 cursor-pointer"
                                                    onClick={() => setFormData((prev) => ({ ...prev, categoryId: cat.id }))}
                                                >
                                                    <span className="flex items-center gap-2 flex-1">
                                                        {cat.name}
                                                        {cat.isDefault && (
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">默认</Badge>
                                                        )}
                                                    </span>
                                                    {cat.id === formData.categoryId && (
                                                        <span className="text-primary">✓</span>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 shrink-0"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditDialog(cat)}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            重命名
                                                        </DropdownMenuItem>
                                                        {!cat.isDefault && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => setShowDeleteConfirm(cat.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    删除
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ))}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setShowAddCategoryDialog(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            添加新分类
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>标签</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="添加标签"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={addTag}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="gap-1">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 版本与封面 */}
                <Card>
                    <CardHeader>
                        <CardTitle>版本与封面</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="publishedYear">发布年份</Label>
                                <Input
                                    id="publishedYear"
                                    type="number"
                                    value={formData.publishedYear}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, publishedYear: e.target.value }))}
                                    placeholder="如 2026"
                                    min={1900}
                                    max={2100}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edition">版次</Label>
                                <Input
                                    id="edition"
                                    value={formData.edition}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, edition: e.target.value }))}
                                    placeholder="如 第一版"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverImageUrl">封面图片 URL</Label>
                            <Input
                                id="coverImageUrl"
                                value={formData.coverImageUrl}
                                onChange={(e) => setFormData((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                                placeholder="https://..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 提交按钮 */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        取消
                    </Button>
                    <Button type="submit" disabled={isPending || !formData.categoryId}>
                        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {isEditMode ? '保存修改' : '创建色彩簿'}
                    </Button>
                </div>
            </form>

            {/* 添加分类弹窗 */}
            <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>添加分类</DialogTitle>
                        <DialogDescription>
                            创建一个新的色彩簿分类
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="newCategory">分类名称</Label>
                        <Input
                            id="newCategory"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="如：中国传统色"
                            className="mt-2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCategory();
                                }
                            }}
                        />
                        {createCategoryMutation.error && (
                            <p className="text-destructive text-sm mt-2">
                                {createCategoryMutation.error.message}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>
                            取消
                        </Button>
                        <Button
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                        >
                            {createCategoryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            添加
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 编辑分类弹窗 */}
            <Dialog open={!!showEditCategoryDialog} onOpenChange={() => setShowEditCategoryDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>重命名分类</DialogTitle>
                        <DialogDescription>
                            修改分类名称
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="editCategory">分类名称</Label>
                        <Input
                            id="editCategory"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            placeholder="分类名称"
                            className="mt-2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleRenameCategory();
                                }
                            }}
                        />
                        {renameCategoryMutation.error && (
                            <p className="text-destructive text-sm mt-2">
                                {renameCategoryMutation.error.message}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditCategoryDialog(null)}>
                            取消
                        </Button>
                        <Button
                            onClick={handleRenameCategory}
                            disabled={!editCategoryName.trim() || renameCategoryMutation.isPending}
                        >
                            {renameCategoryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除分类确认弹窗 */}
            <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除分类</DialogTitle>
                        <DialogDescription>
                            删除后，使用该分类的色彩簿将自动切换到默认分类。此操作不可撤销。
                        </DialogDescription>
                    </DialogHeader>
                    {deleteCategoryMutation.error && (
                        <p className="text-destructive text-sm">
                            {deleteCategoryMutation.error.message}
                        </p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                            取消
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => showDeleteConfirm && handleDeleteCategory(showDeleteConfirm)}
                            disabled={deleteCategoryMutation.isPending}
                        >
                            {deleteCategoryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
