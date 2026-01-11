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
  DropdownMenuSeparator,
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
  FlaskConical,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { RecipeStatus, CostLevel } from '@prisma/client';

const RECIPE_STATUS_LABELS: Record<RecipeStatus, string> = {
  EXPERIMENTAL: '实验中',
  VERIFIED: '已验证',
  DEPRECATED: '已废弃',
};

const RECIPE_STATUS_COLORS: Record<RecipeStatus, string> = {
  EXPERIMENTAL: 'bg-yellow-100 text-yellow-800',
  VERIFIED: 'bg-green-100 text-green-800',
  DEPRECATED: 'bg-gray-100 text-gray-800',
};

const COST_LEVEL_LABELS: Record<CostLevel, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
};

const COST_LEVEL_COLORS: Record<CostLevel, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-red-100 text-red-800',
};

export default function RecipesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecipeStatus | 'ALL'>('ALL');
  const [costFilter, setCostFilter] = useState<CostLevel | 'ALL'>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, refetch } = trpc.recipe.adminList.useQuery({
    search: search || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    costLevel: costFilter === 'ALL' ? undefined : costFilter,
  });

  const { data: stats } = trpc.recipe.getStats.useQuery();

  const deleteMutation = trpc.recipe.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteTarget(null);
    },
  });

  const updateStatusMutation = trpc.recipe.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate({ id: deleteTarget.id });
    }
  };

  const handleStatusChange = (id: string, status: RecipeStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">总配方数</div>
          <div className="text-2xl font-bold">{stats?.total || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            实验中
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.byStatus.experimental || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            已验证
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.byStatus.verified || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            已废弃
          </div>
          <div className="text-2xl font-bold text-gray-600">
            {stats?.byStatus.deprecated || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">按成本等级</div>
          <div className="text-sm mt-1">
            <span className="text-green-600">低:{stats?.byCostLevel.LOW || 0}</span>
            {' / '}
            <span className="text-blue-600">中:{stats?.byCostLevel.MEDIUM || 0}</span>
            {' / '}
            <span className="text-red-600">高:{stats?.byCostLevel.HIGH || 0}</span>
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
                placeholder="搜索配方编号、名称或颜色..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as RecipeStatus | 'ALL')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部状态</SelectItem>
              <SelectItem value="EXPERIMENTAL">实验中</SelectItem>
              <SelectItem value="VERIFIED">已验证</SelectItem>
              <SelectItem value="DEPRECATED">已废弃</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={costFilter}
            onValueChange={(v) => setCostFilter(v as CostLevel | 'ALL')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="成本" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部成本</SelectItem>
              <SelectItem value="LOW">低</SelectItem>
              <SelectItem value="MEDIUM">中</SelectItem>
              <SelectItem value="HIGH">高</SelectItem>
            </SelectContent>
          </Select>

          <Button asChild>
            <Link href="/admin/recipes/new">
              <Plus className="h-4 w-4 mr-2" />
              新增配方
            </Link>
          </Button>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>配方编号</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>关联颜色</TableHead>
              <TableHead>油墨成分</TableHead>
              <TableHead>成本</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>适配矩阵</TableHead>
              <TableHead>测试报告</TableHead>
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
              data?.items.map((recipe) => (
                <TableRow
                  key={recipe.id}
                  className={recipe.status === 'DEPRECATED' ? 'opacity-50' : ''}
                >
                  <TableCell className="font-mono text-sm">{recipe.recipeId}</TableCell>
                  <TableCell className="font-medium">
                    {recipe.name || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/color/${recipe.color.colorId}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">{recipe.color.colorId}</div>
                      <div className="text-xs text-muted-foreground">{recipe.color.name}</div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                        <Badge key={`${recipe.id}-ing-${idx}`} variant="outline" className="text-xs">
                          {ing.ink.name} {ing.percentage}%
                        </Badge>
                      ))}
                      {recipe.ingredients.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{recipe.ingredients.length - 3}
                        </Badge>
                      )}
                      {recipe.ingredients.length === 0 && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={COST_LEVEL_COLORS[recipe.costLevel]}>
                      {COST_LEVEL_LABELS[recipe.costLevel]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={RECIPE_STATUS_COLORS[recipe.status]}>
                      {RECIPE_STATUS_LABELS[recipe.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FlaskConical className="h-3 w-3" />
                      {recipe._count.fitMatrixEntries}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {recipe._count.testReports}
                    </span>
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
                          <Link href={`/admin/recipes/${recipe.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            编辑
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {recipe.status !== 'VERIFIED' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(recipe.id, 'VERIFIED')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            标记为已验证
                          </DropdownMenuItem>
                        )}
                        {recipe.status !== 'EXPERIMENTAL' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(recipe.id, 'EXPERIMENTAL')}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            标记为实验中
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() =>
                            setDeleteTarget({
                              id: recipe.id,
                              name: recipe.recipeId,
                            })
                          }
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
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除配方「{deleteTarget?.name}」吗？
              <span className="block mt-2 text-amber-600">
                如果该配方有关联的适配矩阵或测试报告，将标记为已废弃而非删除。
              </span>
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
