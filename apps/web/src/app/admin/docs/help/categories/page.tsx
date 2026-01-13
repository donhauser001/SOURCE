/**
 * 帮助文档分类管理页面
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { helpCategoryCreateSchema, type HelpCategoryCreate } from '@/lib/validations/support';

export default function HelpCategoriesPage() {
  const [editCategory, setEditCategory] = useState<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    parentId: string | null;
    order: number;
    isActive: boolean;
  } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // 获取分类列表
  const { data: categories, isLoading } = trpc.help.categoryList.useQuery();

  // 创建分类
  const createMutation = trpc.help.categoryCreate.useMutation({
    onSuccess: () => {
      utils.help.categoryList.invalidate();
      setShowCreate(false);
      form.reset();
    },
  });

  // 更新分类
  const updateMutation = trpc.help.categoryUpdate.useMutation({
    onSuccess: () => {
      utils.help.categoryList.invalidate();
      setEditCategory(null);
    },
  });

  // 删除分类
  const deleteMutation = trpc.help.categoryDelete.useMutation({
    onSuccess: () => {
      utils.help.categoryList.invalidate();
      setDeleteId(null);
    },
  });

  const form = useForm<HelpCategoryCreate>({
    resolver: zodResolver(helpCategoryCreateSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: '',
      parentId: undefined,
      order: 0,
      isActive: true,
    },
  });

  const handleCreate = (data: HelpCategoryCreate) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: HelpCategoryCreate) => {
    if (editCategory) {
      updateMutation.mutate({
        id: editCategory.id,
        data,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/docs/help">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">帮助文档分类</h1>
            <p className="text-muted-foreground">管理帮助文档的分类结构</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建分类
        </Button>
      </div>

      {/* 分类列表 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>URL 标识</TableHead>
              <TableHead>父分类</TableHead>
              <TableHead>文章数</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : categories?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  暂无分类
                </TableCell>
              </TableRow>
            ) : (
              categories?.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <span className={cat.parent ? 'pl-4' : ''}>
                      {cat.parent ? '└ ' : ''}{cat.name}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{cat.slug}</TableCell>
                  <TableCell>{cat.parent?.name || '-'}</TableCell>
                  <TableCell>{cat._count.articles}</TableCell>
                  <TableCell>{cat.order}</TableCell>
                  <TableCell>
                    <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                      {cat.isActive ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditCategory(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 创建分类对话框 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建分类</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>名称</Label>
              <Input {...form.register('name')} placeholder="分类名称" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>URL 标识</Label>
              <Input {...form.register('slug')} placeholder="category-slug" />
              {form.formState.errors.slug && (
                <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea {...form.register('description')} placeholder="分类描述（可选）" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>父分类</Label>
              <Select
                value={form.watch('parentId') || 'none'}
                onValueChange={(v) => form.setValue('parentId', v === 'none' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="无（顶级分类）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无（顶级分类）</SelectItem>
                  {categories?.filter(c => !c.parentId).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>图标</Label>
                <Input {...form.register('icon')} placeholder="Lucide 图标名" />
              </div>
              <div className="space-y-2">
                <Label>排序</Label>
                <Input
                  type="number"
                  {...form.register('order', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch('isActive')}
                onCheckedChange={(v) => form.setValue('isActive', v)}
              />
              <Label>启用</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                创建
              </Button>
            </DialogFooter>
            {createMutation.error && (
              <p className="text-sm text-destructive">{createMutation.error.message}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑分类对话框 */}
      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
          </DialogHeader>
          {editCategory && (
            <EditCategoryForm
              category={editCategory}
              categories={categories || []}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
              error={updateMutation.error?.message}
              onCancel={() => setEditCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除分类后，该分类下的文章将需要重新分配。确定要删除吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
          {deleteMutation.error && (
            <p className="text-sm text-destructive mt-2">{deleteMutation.error.message}</p>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 编辑分类表单组件
function EditCategoryForm({
  category,
  categories,
  onSubmit,
  isLoading,
  error,
  onCancel,
}: {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    parentId: string | null;
    order: number;
    isActive: boolean;
  };
  categories: { id: string; name: string; parentId: string | null }[];
  onSubmit: (data: HelpCategoryCreate) => void;
  isLoading: boolean;
  error?: string;
  onCancel: () => void;
}) {
  const form = useForm<HelpCategoryCreate>({
    resolver: zodResolver(helpCategoryCreateSchema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      parentId: category.parentId || undefined,
      order: category.order,
      isActive: category.isActive,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>名称</Label>
        <Input {...form.register('name')} placeholder="分类名称" />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>URL 标识</Label>
        <Input {...form.register('slug')} placeholder="category-slug" />
        {form.formState.errors.slug && (
          <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>描述</Label>
        <Textarea {...form.register('description')} placeholder="分类描述（可选）" rows={2} />
      </div>
      <div className="space-y-2">
        <Label>父分类</Label>
        <Select
          value={form.watch('parentId') || 'none'}
          onValueChange={(v) => form.setValue('parentId', v === 'none' ? undefined : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="无（顶级分类）" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">无（顶级分类）</SelectItem>
            {categories?.filter(c => !c.parentId && c.id !== category.id).map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>图标</Label>
          <Input {...form.register('icon')} placeholder="Lucide 图标名" />
        </div>
        <div className="space-y-2">
          <Label>排序</Label>
          <Input
            type="number"
            {...form.register('order', { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.watch('isActive')}
          onCheckedChange={(v) => form.setValue('isActive', v)}
        />
        <Label>启用</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          保存
        </Button>
      </DialogFooter>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
