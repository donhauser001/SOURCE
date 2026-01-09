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
  FlaskConical,
} from 'lucide-react';
import { InkType } from '@prisma/client';

const INK_TYPE_LABELS: Record<InkType, string> = {
  BASE: '基础色',
  SPOT: '专色',
  EXTENDER: '冲淡剂',
};

export default function InksPage() {
  const [search, setSearch] = useState('');
  const [inkTypeFilter, setInkTypeFilter] = useState<InkType | 'ALL'>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, refetch } = trpc.ink.adminList.useQuery({
    search: search || undefined,
    inkType: inkTypeFilter === 'ALL' ? undefined : inkTypeFilter,
    isActive: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
  });

  const { data: colorSeries } = trpc.ink.getColorSeries.useQuery();
  const { data: brands } = trpc.ink.getBrands.useQuery();

  const deleteMutation = trpc.ink.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteTarget(null);
    },
  });

  const restoreMutation = trpc.ink.restore.useMutation({
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">总油墨数</div>
          <div className="text-2xl font-bold">{data?.items.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">基础色</div>
          <div className="text-2xl font-bold text-blue-600">
            {data?.items.filter((i) => i.inkType === 'BASE').length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">专色</div>
          <div className="text-2xl font-bold text-purple-600">
            {data?.items.filter((i) => i.inkType === 'SPOT').length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">冲淡剂</div>
          <div className="text-2xl font-bold text-gray-600">
            {data?.items.filter((i) => i.inkType === 'EXTENDER').length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">品牌数</div>
          <div className="text-2xl font-bold text-green-600">{brands?.length || 0}</div>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索油墨名称、代码或品牌..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select
            value={inkTypeFilter}
            onValueChange={(v) => setInkTypeFilter(v as InkType | 'ALL')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部类型</SelectItem>
              <SelectItem value="BASE">基础色</SelectItem>
              <SelectItem value="SPOT">专色</SelectItem>
              <SelectItem value="EXTENDER">冲淡剂</SelectItem>
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
            <Link href="/admin/inks/new">
              <Plus className="h-4 w-4 mr-2" />
              新增油墨
            </Link>
          </Button>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">排序</TableHead>
              <TableHead>代码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>品牌</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>颜色系列</TableHead>
              <TableHead>供应商</TableHead>
              <TableHead>配方引用</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((ink) => (
                <TableRow key={ink.id} className={!ink.isActive ? 'opacity-50' : ''}>
                  <TableCell className="font-mono text-sm">{ink.order}</TableCell>
                  <TableCell className="font-mono text-sm">{ink.code}</TableCell>
                  <TableCell className="font-medium">{ink.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ink.brand || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ink.inkType === 'BASE'
                          ? 'default'
                          : ink.inkType === 'SPOT'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {INK_TYPE_LABELS[ink.inkType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ink.colorSeries || '-'}
                  </TableCell>
                  <TableCell>
                    {ink.suppliers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ink.suppliers.slice(0, 2).map((s) => (
                          <Badge key={s.id} variant="secondary" className="text-xs">
                            {s.shortName || s.name}
                          </Badge>
                        ))}
                        {ink.suppliers.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{ink.suppliers.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FlaskConical className="h-3 w-3" />
                      {ink._count.recipeIngredients}
                    </span>
                  </TableCell>
                  <TableCell>
                    {ink.isActive ? (
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
                          <Link href={`/admin/inks/${ink.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            编辑
                          </Link>
                        </DropdownMenuItem>
                        {ink.isActive ? (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteTarget({ id: ink.id, name: ink.name })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRestore(ink.id)}>
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
              确定要删除油墨「{deleteTarget?.name}」吗？
              {deleteTarget && (
                <span className="block mt-2 text-amber-600">
                  如果该油墨已被配方使用，将执行软删除（停用）。
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
