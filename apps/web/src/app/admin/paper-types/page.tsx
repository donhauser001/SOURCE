'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  RotateCcw,
  FileText,
  Package,
} from 'lucide-react';
import { PaperCategory } from '@prisma/client';

const CATEGORY_LABELS: Record<PaperCategory, string> = {
  COATED: '涂布',
  UNCOATED: '非涂布',
  SPECIALTY: '特种',
};

export default function PaperTypesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PaperCategory | 'ALL'>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, refetch } = trpc.paperType.adminList.useQuery({
    search: search || undefined,
    category: categoryFilter === 'ALL' ? undefined : categoryFilter,
    isActive: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
  });

  const deleteMutation = trpc.paperType.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteTarget(null);
    },
  });

  const restoreMutation = trpc.paperType.restore.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate({ id: deleteTarget.id });
    }
  };

  const handleRestore = (id: string) => {
    restoreMutation.mutate({ id });
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">总纸型数</div>
          <div className="text-2xl font-bold">{data?.items.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">激活</div>
          <div className="text-2xl font-bold text-green-600">
            {data?.items.filter((p) => p.isActive).length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">已停用</div>
          <div className="text-2xl font-bold text-gray-400">
            {data?.items.filter((p) => !p.isActive).length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">供应商关联</div>
          <div className="text-2xl font-bold text-blue-600">
            {data?.items.filter((p) => p.suppliers.length > 0).length || 0}
          </div>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索纸型名称或代码..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as PaperCategory | 'ALL')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部分类</SelectItem>
              <SelectItem value="COATED">涂布</SelectItem>
              <SelectItem value="UNCOATED">非涂布</SelectItem>
              <SelectItem value="SPECIALTY">特种</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v as 'ALL' | 'ACTIVE' | 'INACTIVE')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部状态</SelectItem>
              <SelectItem value="ACTIVE">激活</SelectItem>
              <SelectItem value="INACTIVE">已停用</SelectItem>
            </SelectContent>
          </Select>

          <Button asChild>
            <Link href="/admin/paper-types/new">
              <Plus className="h-4 w-4 mr-2" />
              新增纸型
            </Link>
          </Button>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">排序</TableHead>
              <TableHead>代码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>克重范围</TableHead>
              <TableHead>供应商</TableHead>
              <TableHead>关联数据</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((pt) => (
                <TableRow key={pt.id} className={!pt.isActive ? 'opacity-50' : ''}>
                  <TableCell className="font-mono text-sm">{pt.order}</TableCell>
                  <TableCell className="font-mono text-sm">{pt.code}</TableCell>
                  <TableCell className="font-medium">{pt.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{CATEGORY_LABELS[pt.category]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {pt.gramWeightMin && pt.gramWeightMax
                      ? `${pt.gramWeightMin}-${pt.gramWeightMax}g`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {pt.suppliers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {pt.suppliers.slice(0, 2).map((s) => (
                          <Badge key={s.id} variant="secondary" className="text-xs">
                            {s.shortName || s.name}
                          </Badge>
                        ))}
                        {pt.suppliers.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{pt.suppliers.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {pt._count.paperProfiles}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {pt._count.proofingPacks}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pt.isActive ? (
                      <Badge className="bg-green-100 text-green-800">激活</Badge>
                    ) : (
                      <Badge variant="secondary">已停用</Badge>
                    )}
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
                          <Link href={`/admin/paper-types/${pt.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            编辑
                          </Link>
                        </DropdownMenuItem>
                        {pt.isActive ? (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteTarget({ id: pt.id, name: pt.name })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRestore(pt.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            恢复
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除纸型「{deleteTarget?.name}」吗？
              {deleteTarget && (
                <span className="block mt-2 text-amber-600">
                  如果该纸型有关联的纸张表现数据或打样包，将执行软删除（停用）。
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
