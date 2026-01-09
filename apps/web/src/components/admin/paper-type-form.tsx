'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Save, Loader2 } from 'lucide-react';
import { PaperCategory } from '@prisma/client';

const CATEGORY_OPTIONS = [
  { value: 'COATED', label: '涂布' },
  { value: 'UNCOATED', label: '非涂布' },
  { value: 'SPECIALTY', label: '特种' },
];

interface PaperTypeFormProps {
  initialData?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: PaperCategory;
    gramWeightMin: number | null;
    gramWeightMax: number | null;
    surfaceFinish: string | null;
    suitableFor: string[] | null;
    order: number;
    isActive: boolean;
    suppliers: Array<{ id: string; name: string }>;
  };
}

export function PaperTypeForm({ initialData }: PaperTypeFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'UNCOATED' as PaperCategory,
    gramWeightMin: initialData?.gramWeightMin?.toString() || '',
    gramWeightMax: initialData?.gramWeightMax?.toString() || '',
    surfaceFinish: initialData?.surfaceFinish || '',
    suitableFor: initialData?.suitableFor || [],
    order: initialData?.order?.toString() || '0',
    supplierIds: initialData?.suppliers.map((s) => s.id) || [],
  });

  const [newSuitableFor, setNewSuitableFor] = useState('');

  // 获取纸商列表
  const { data: partners } = trpc.partner.adminList.useQuery({
    types: ['PAPER_VENDOR'],
    status: 'ACTIVE',
    limit: 100,
  });

  const createMutation = trpc.paperType.create.useMutation({
    onSuccess: () => {
      router.push('/admin/paper-types');
    },
  });

  const updateMutation = trpc.paperType.update.useMutation({
    onSuccess: () => {
      router.push('/admin/paper-types');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      gramWeightMin: formData.gramWeightMin ? parseInt(formData.gramWeightMin) : undefined,
      gramWeightMax: formData.gramWeightMax ? parseInt(formData.gramWeightMax) : undefined,
      surfaceFinish: formData.surfaceFinish || undefined,
      suitableFor: formData.suitableFor.length > 0 ? formData.suitableFor : undefined,
      order: parseInt(formData.order) || 0,
      supplierIds: formData.supplierIds.length > 0 ? formData.supplierIds : undefined,
    };

    if (isEditing && initialData) {
      updateMutation.mutate({ id: initialData.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const addSuitableFor = () => {
    if (newSuitableFor.trim() && !formData.suitableFor.includes(newSuitableFor.trim())) {
      setFormData({
        ...formData,
        suitableFor: [...formData.suitableFor, newSuitableFor.trim()],
      });
      setNewSuitableFor('');
    }
  };

  const removeSuitableFor = (item: string) => {
    setFormData({
      ...formData,
      suitableFor: formData.suitableFor.filter((s) => s !== item),
    });
  };

  const toggleSupplier = (supplierId: string) => {
    setFormData({
      ...formData,
      supplierIds: formData.supplierIds.includes(supplierId)
        ? formData.supplierIds.filter((id) => id !== supplierId)
        : [...formData.supplierIds, supplierId],
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">代码 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="如 PREMIUM_MATTE"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如 高阶映画"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="纸张的详细描述..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">分类 *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as PaperCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">排序</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 纸张特性 */}
        <Card>
          <CardHeader>
            <CardTitle>纸张特性</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gramWeightMin">最小克重 (g/m²)</Label>
                <Input
                  id="gramWeightMin"
                  type="number"
                  value={formData.gramWeightMin}
                  onChange={(e) => setFormData({ ...formData, gramWeightMin: e.target.value })}
                  placeholder="如 80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gramWeightMax">最大克重 (g/m²)</Label>
                <Input
                  id="gramWeightMax"
                  type="number"
                  value={formData.gramWeightMax}
                  onChange={(e) => setFormData({ ...formData, gramWeightMax: e.target.value })}
                  placeholder="如 300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="surfaceFinish">表面处理</Label>
              <Input
                id="surfaceFinish"
                value={formData.surfaceFinish}
                onChange={(e) => setFormData({ ...formData, surfaceFinish: e.target.value })}
                placeholder="如 光面/哑面/压纹"
              />
            </div>

            <div className="space-y-2">
              <Label>适用场景</Label>
              <div className="flex gap-2">
                <Input
                  value={newSuitableFor}
                  onChange={(e) => setNewSuitableFor(e.target.value)}
                  placeholder="输入适用场景"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSuitableFor();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSuitableFor}>
                  添加
                </Button>
              </div>
              {formData.suitableFor.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.suitableFor.map((item) => (
                    <Badge key={item} variant="secondary" className="pr-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeSuitableFor(item)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 供应商关联 */}
      <Card>
        <CardHeader>
          <CardTitle>供应商关联（纸商）</CardTitle>
        </CardHeader>
        <CardContent>
          {partners?.items && partners.items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {partners.items.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleSupplier(partner.id)}
                >
                  <Checkbox
                    checked={formData.supplierIds.includes(partner.id)}
                    onCheckedChange={() => toggleSupplier(partner.id)}
                  />
                  <div>
                    <div className="font-medium text-sm">{partner.name}</div>
                    <div className="text-xs text-muted-foreground">{partner.partnerId}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              暂无纸商合作方，请先在合作方管理中添加
            </div>
          )}
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error.message}
        </div>
      )}

      {/* 提交按钮 */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? '保存修改' : '创建纸型'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
