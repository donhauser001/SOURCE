'use client';

/**
 * ColLab 内容分类管理页面
 *
 * 支持拖拽排序和按钮排序
 */

import { useState, useMemo } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    FolderTree,
    ChevronRight,
    ChevronDown,
    Loader2,
    ToggleLeft,
    ToggleRight,
    ArrowUp,
    ArrowDown,
    GripVertical,
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { trpc } from '@/lib/trpc';
import { ContentTypeLabels } from '@/lib/validations/content';
import type { ContentType } from '@/lib/validations/content';

const CONTENT_TYPES: ContentType[] = ['WORK', 'TUTORIAL', 'ARTICLE'];

interface CategoryFormData {
    name: string;
    slug: string;
    description: string;
    icon: string;
    parentId: string | null;
    contentTypes: ContentType[];
}

const defaultFormData: CategoryFormData = {
    name: '',
    slug: '',
    description: '',
    icon: '',
    parentId: null,
    contentTypes: ['WORK', 'TUTORIAL', 'ARTICLE'],
};

// 分类数据类型
interface CategoryItem {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    parentId: string | null;
    level: number;
    order: number;
    isActive: boolean;
    contentTypes: string[];
    _count?: { contents: number };
    children?: CategoryItem[];
}

// ============================================================================
// 可拖拽分类项组件
// ============================================================================

interface SortableCategoryItemProps {
    category: CategoryItem;
    level: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
    onAddChild: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

function SortableCategoryItem({
    category,
    level,
    isExpanded,
    onToggleExpand,
    onEdit,
    onDelete,
    onToggleActive,
    onAddChild,
    onMoveUp,
    onMoveDown,
}: SortableCategoryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const hasChildren = category.children && category.children.length > 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-lg ${!category.isActive ? 'opacity-50' : ''
                } ${isDragging ? 'bg-muted z-50' : ''}`}
        >
            {/* 拖拽手柄 */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 text-muted-foreground hover:text-foreground"
                title="拖拽排序"
            >
                <GripVertical className="h-4 w-4" />
            </button>

            {/* 展开/折叠按钮 */}
            <button
                onClick={onToggleExpand}
                className="w-5 h-5 flex items-center justify-center text-muted-foreground"
                disabled={!hasChildren}
            >
                {hasChildren ? (
                    isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )
                ) : (
                    <span className="w-4" />
                )}
            </button>

            {/* 分类名称 */}
            <div className="flex-1 flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{category.name}</span>
                <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {category.slug}
                </code>
            </div>

            {/* 适用类型 */}
            <div className="flex gap-1">
                {category.contentTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                        {ContentTypeLabels[type as ContentType]}
                    </Badge>
                ))}
            </div>

            {/* 内容数量 */}
            <Badge variant="secondary" className="text-xs">
                {category._count?.contents || 0} 条
            </Badge>

            {/* 状态 */}
            {!category.isActive && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                    已停用
                </Badge>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-1">
                {level < 2 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onAddChild}
                        title="添加子分类"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onMoveUp}
                    title="上移"
                >
                    <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onMoveDown}
                    title="下移"
                >
                    <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onToggleActive}
                    title={category.isActive ? '停用' : '启用'}
                >
                    {category.isActive ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                        <ToggleLeft className="h-4 w-4" />
                    )}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onEdit}
                    title="编辑"
                >
                    <Edit className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onDelete}
                    title="删除"
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        </div>
    );
}

// ============================================================================
// 主页面组件
// ============================================================================

export default function AdminContentCategoriesPage() {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);

    // 拖拽传感器
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 获取分类列表
    const { data, isLoading, refetch } = trpc.contentCategory.list.useQuery({
        includeInactive: true,
    });

    // 创建分类
    const createMutation = trpc.contentCategory.create.useMutation({
        onSuccess: () => {
            setDialogOpen(false);
            setFormData(defaultFormData);
            refetch();
        },
    });

    // 更新分类
    const updateMutation = trpc.contentCategory.update.useMutation({
        onSuccess: () => {
            setDialogOpen(false);
            setEditingId(null);
            setFormData(defaultFormData);
            refetch();
        },
    });

    // 删除分类
    const deleteMutation = trpc.contentCategory.delete.useMutation({
        onSuccess: () => {
            setDeleteDialogOpen(false);
            setDeletingId(null);
            refetch();
        },
    });

    // 切换激活状态
    const toggleActiveMutation = trpc.contentCategory.toggleActive.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    // 排序
    const reorderMutation = trpc.contentCategory.reorder.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    const categories = (data?.items || []) as CategoryItem[];
    const tree = (data?.tree || []) as CategoryItem[];

    // 按父级分组的分类 ID 列表（用于拖拽排序）
    const sortableGroups = useMemo(() => {
        const groups: Record<string, string[]> = { root: [] };
        categories.forEach((cat) => {
            const parentKey = cat.parentId || 'root';
            if (!groups[parentKey]) {
                groups[parentKey] = [];
            }
            groups[parentKey].push(cat.id);
        });
        return groups;
    }, [categories]);

    // 切换展开状态
    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    // 打开新建对话框
    const handleCreate = (parentId?: string) => {
        setEditingId(null);
        setFormData({
            ...defaultFormData,
            parentId: parentId || null,
        });
        setDialogOpen(true);
    };

    // 打开编辑对话框
    const handleEdit = (category: CategoryItem) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            icon: category.icon || '',
            parentId: category.parentId,
            contentTypes: category.contentTypes as ContentType[],
        });
        setDialogOpen(true);
    };

    // 打开删除确认
    const handleDelete = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    // 提交表单
    const handleSubmit = () => {
        if (editingId) {
            updateMutation.mutate({
                id: editingId,
                ...formData,
                parentId: formData.parentId || null,
            });
        } else {
            createMutation.mutate({
                ...formData,
                parentId: formData.parentId || undefined,
            });
        }
    };

    // 移动排序（按钮方式）
    const handleMove = (id: string, direction: 'up' | 'down') => {
        const category = categories.find((c) => c.id === id);
        if (!category) return;

        const siblings = categories
            .filter((c) => c.parentId === category.parentId)
            .sort((a, b) => a.order - b.order);
        const currentIndex = siblings.findIndex((c) => c.id === id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= siblings.length) return;

        // 交换顺序
        const items = siblings.map((s, i) => ({
            id: s.id,
            order: i === currentIndex ? targetIndex : i === targetIndex ? currentIndex : i,
        }));

        reorderMutation.mutate({ items });
    };

    // 拖拽结束处理
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const activeCategory = categories.find((c) => c.id === active.id);
        const overCategory = categories.find((c) => c.id === over.id);

        if (!activeCategory || !overCategory) return;

        // 只允许同级拖拽
        if (activeCategory.parentId !== overCategory.parentId) return;

        const siblings = categories
            .filter((c) => c.parentId === activeCategory.parentId)
            .sort((a, b) => a.order - b.order);

        const oldIndex = siblings.findIndex((c) => c.id === active.id);
        const newIndex = siblings.findIndex((c) => c.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // 计算新顺序
        const newSiblings = [...siblings];
        const [removed] = newSiblings.splice(oldIndex, 1);
        newSiblings.splice(newIndex, 0, removed);

        const items = newSiblings.map((s, i) => ({
            id: s.id,
            order: i,
        }));

        reorderMutation.mutate({ items });
    };

    // 自动生成 slug
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    // 渲染分类树
    const renderCategoryTree = (items: CategoryItem[], level = 0, parentId: string | null = null) => {
        const sortableIds = sortableGroups[parentId || 'root'] || [];

        return (
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <div style={{ marginLeft: level > 0 ? 24 : 0 }}>
                    {items.map((category) => {
                        const isExpanded = expandedIds.has(category.id);
                        const hasChildren = category.children && category.children.length > 0;

                        return (
                            <div key={category.id}>
                                <SortableCategoryItem
                                    category={category}
                                    level={level}
                                    isExpanded={isExpanded}
                                    onToggleExpand={() => toggleExpand(category.id)}
                                    onEdit={() => handleEdit(category)}
                                    onDelete={() => handleDelete(category.id)}
                                    onToggleActive={() => toggleActiveMutation.mutate({ id: category.id })}
                                    onAddChild={() => handleCreate(category.id)}
                                    onMoveUp={() => handleMove(category.id, 'up')}
                                    onMoveDown={() => handleMove(category.id, 'down')}
                                />
                                {/* 子分类 */}
                                {hasChildren && isExpanded && (
                                    renderCategoryTree(category.children!, level + 1, category.id)
                                )}
                            </div>
                        );
                    })}
                </div>
            </SortableContext>
        );
    };

    return (
        <div className="space-y-6">
            {/* 操作按钮 */}
            <div className="flex justify-end">
                <Button onClick={() => handleCreate()}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建分类
                </Button>
            </div>

            {/* 分类列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>内容分类</CardTitle>
                    <CardDescription>
                        管理 ColLab 内容的分类体系，支持最多 3 级分类。可拖拽调整排序。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            加载中...
                        </div>
                    ) : tree.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            暂无分类，点击右上角新建
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="space-y-1">
                                {renderCategoryTree(tree)}
                            </div>
                        </DndContext>
                    )}
                </CardContent>
            </Card>

            {/* 新建/编辑对话框 */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? '编辑分类' : '新建分类'}</DialogTitle>
                        <DialogDescription>
                            {editingId ? '修改分类信息' : '创建一个新的内容分类'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">分类名称</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                        slug: editingId ? formData.slug : generateSlug(e.target.value),
                                    });
                                }}
                                placeholder="如：印刷技术"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">URL 标识</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="如：printing-tech"
                            />
                            <p className="text-xs text-muted-foreground">
                                仅允许小写字母、数字和连字符
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">描述</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="分类描述（可选）"
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="icon">图标</Label>
                            <Input
                                id="icon"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="Lucide 图标名称（可选）"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="parentId">父级分类</Label>
                            <Select
                                value={formData.parentId || 'root'}
                                onValueChange={(v) => setFormData({ ...formData, parentId: v === 'root' ? null : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择父级分类" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="root">无（顶级分类）</SelectItem>
                                    {categories
                                        .filter((c) => c.level < 2 && c.id !== editingId)
                                        .map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.level > 0 ? '├─ ' : ''}{c.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>适用内容类型</Label>
                            <div className="flex flex-wrap gap-4">
                                {CONTENT_TYPES.map((type) => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`type-${type}`}
                                            checked={formData.contentTypes.includes(type)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setFormData({
                                                        ...formData,
                                                        contentTypes: [...formData.contentTypes, type],
                                                    });
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        contentTypes: formData.contentTypes.filter((t) => t !== type),
                                                    });
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`type-${type}`} className="font-normal">
                                            {ContentTypeLabels[type]}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {formData.contentTypes.length === 0 && (
                                <p className="text-xs text-destructive">至少选择一种内容类型</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                !formData.name ||
                                !formData.slug ||
                                formData.contentTypes.length === 0 ||
                                createMutation.isPending ||
                                updateMutation.isPending
                            }
                        >
                            {(createMutation.isPending || updateMutation.isPending) && (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            {editingId ? '保存' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除此分类吗？此操作无法撤销。
                            <br />
                            注意：如果分类下有子分类或内容，将无法删除。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
