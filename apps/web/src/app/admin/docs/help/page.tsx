/**
 * 帮助文档管理页面
 * 
 * 包含文章列表、分类管理入口、批量操作
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FolderTree,
  Pin,
  CheckCircle,
  Archive,
  FolderInput,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  DRAFT: { label: '草稿', variant: 'secondary' },
  PUBLISHED: { label: '已发布', variant: 'default' },
  ARCHIVED: { label: '已归档', variant: 'outline' },
};

export default function HelpArticlesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'delete' | 'publish' | 'archive' | 'category' | null>(null);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('');

  const utils = trpc.useUtils();

  // 获取分类列表
  const { data: categories } = trpc.help.categoryList.useQuery();

  // 获取文章列表
  const { data, isLoading } = trpc.help.articleListAdmin.useQuery({
    search: search || undefined,
    status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined,
    categoryId: categoryId || undefined,
    page,
    limit: 20,
  });

  // 删除文章
  const deleteMutation = trpc.help.articleDelete.useMutation({
    onSuccess: () => {
      utils.help.articleListAdmin.invalidate();
      setDeleteId(null);
    },
  });

  // 切换置顶
  const togglePinnedMutation = trpc.help.articleTogglePinned.useMutation({
    onSuccess: () => {
      utils.help.articleListAdmin.invalidate();
    },
  });

  // 批量更新状态
  const bulkUpdateStatusMutation = trpc.help.articleBulkUpdateStatus.useMutation({
    onSuccess: (result) => {
      toast.success(`已更新 ${result.count} 篇文章`);
      utils.help.articleListAdmin.invalidate();
      setSelectedIds(new Set());
      setBulkAction(null);
    },
    onError: (error) => {
      toast.error(error.message || '操作失败');
    },
  });

  // 批量删除
  const bulkDeleteMutation = trpc.help.articleBulkDelete.useMutation({
    onSuccess: (result) => {
      toast.success(`已删除 ${result.count} 篇文章`);
      utils.help.articleListAdmin.invalidate();
      setSelectedIds(new Set());
      setBulkAction(null);
    },
    onError: (error) => {
      toast.error(error.message || '删除失败');
    },
  });

  // 批量修改分类
  const bulkUpdateCategoryMutation = trpc.help.articleBulkUpdateCategory.useMutation({
    onSuccess: (result) => {
      toast.success(`已更新 ${result.count} 篇文章的分类`);
      utils.help.articleListAdmin.invalidate();
      setSelectedIds(new Set());
      setBulkAction(null);
      setBulkCategoryId('');
    },
    onError: (error) => {
      toast.error(error.message || '操作失败');
    },
  });

  // 切换选择
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (!data?.items) return;
    const allIds = data.items.map(item => item.id);
    const allSelected = allIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [data?.items, selectedIds]);

  // 执行批量操作
  const executeBulkAction = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    switch (bulkAction) {
      case 'publish':
        bulkUpdateStatusMutation.mutate({ ids, status: 'PUBLISHED' });
        break;
      case 'archive':
        bulkUpdateStatusMutation.mutate({ ids, status: 'ARCHIVED' });
        break;
      case 'delete':
        bulkDeleteMutation.mutate({ ids });
        break;
      case 'category':
        if (bulkCategoryId) {
          bulkUpdateCategoryMutation.mutate({ ids, categoryId: bulkCategoryId });
        }
        break;
    }
  }, [selectedIds, bulkAction, bulkCategoryId, bulkUpdateStatusMutation, bulkDeleteMutation, bulkUpdateCategoryMutation]);

  const isAllSelected = data?.items && data.items.length > 0 && data.items.every(item => selectedIds.has(item.id));
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">帮助文档</h1>
          <p className="text-muted-foreground">管理帮助中心的文章内容</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/docs/help/categories">
              <FolderTree className="h-4 w-4 mr-2" />
              分类管理
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/docs/help/new">
              <Plus className="h-4 w-4 mr-2" />
              新建文章
            </Link>
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索文章标题或编号..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select value={categoryId || 'all'} onValueChange={(v) => { setCategoryId(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="所有分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有分类</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.parent ? `└ ${cat.name}` : cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="所有状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="DRAFT">草稿</SelectItem>
            <SelectItem value="PUBLISHED">已发布</SelectItem>
            <SelectItem value="ARCHIVED">已归档</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 批量操作工具栏 */}
      {hasSelection && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 border rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">已选择 {selectedIds.size} 项</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="h-4 w-4 mr-1" />
              取消选择
            </Button>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkAction('publish')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              批量发布
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkAction('archive')}
            >
              <Archive className="h-4 w-4 mr-1" />
              批量归档
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderInput className="h-4 w-4 mr-1" />
                  修改分类
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {categories?.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => {
                      setBulkCategoryId(cat.id);
                      setBulkAction('category');
                    }}
                  >
                    {cat.parent ? `└ ${cat.name}` : cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkAction('delete')}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              批量删除
            </Button>
          </div>
        </div>
      )}

      {/* 文章列表 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="全选"
                />
              </TableHead>
              <TableHead className="w-[100px]">编号</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>浏览</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无文章
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((article) => (
                <TableRow key={article.id} className={selectedIds.has(article.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(article.id)}
                      onCheckedChange={() => toggleSelect(article.id)}
                      aria-label={`选择 ${article.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{article.articleId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {article.isPinned && (
                        <Pin className="h-3 w-3 text-primary" />
                      )}
                      <span className="font-medium">{article.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{article.category?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[article.status]?.variant || 'secondary'}>
                      {statusLabels[article.status]?.label || article.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{article.viewCount}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(article.updatedAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/help/${article.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            预览
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/docs/help/${article.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            编辑
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => togglePinnedMutation.mutate({ id: article.id })}
                          disabled={togglePinnedMutation.isPending}
                        >
                          <Pin className={`h-4 w-4 mr-2 ${article.isPinned ? 'text-primary' : ''}`} />
                          {article.isPinned ? '取消推荐' : '设为推荐'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(article.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {data.total} 条，第 {page} / {data.totalPages} 页
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，确定要删除这篇文章吗？
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
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量操作确认对话框 */}
      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'delete' && '批量删除'}
              {bulkAction === 'publish' && '批量发布'}
              {bulkAction === 'archive' && '批量归档'}
              {bulkAction === 'category' && '批量修改分类'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === 'delete' 
                ? `此操作不可撤销，确定要删除选中的 ${selectedIds.size} 篇文章吗？`
                : bulkAction === 'publish'
                ? `确定要发布选中的 ${selectedIds.size} 篇文章吗？`
                : bulkAction === 'archive'
                ? `确定要归档选中的 ${selectedIds.size} 篇文章吗？`
                : `确定要将选中的 ${selectedIds.size} 篇文章移动到新分类吗？`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkCategoryId('')}>取消</AlertDialogCancel>
            <AlertDialogAction
              className={bulkAction === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={executeBulkAction}
              disabled={bulkUpdateStatusMutation.isPending || bulkDeleteMutation.isPending || bulkUpdateCategoryMutation.isPending}
            >
              {bulkAction === 'delete' ? '删除' : '确认'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
