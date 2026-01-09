'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Loader2 } from 'lucide-react';
import { InkType } from '@prisma/client';

const INK_TYPE_OPTIONS = [
  { value: 'BASE', label: '基础色' },
  { value: 'SPOT', label: '专色' },
  { value: 'EXTENDER', label: '冲淡剂' },
];

interface InkFormProps {
  initialData?: {
    id: string;
    code: string;
    name: string;
    brand: string | null;
    colorSeries: string | null;
    colorCode: string | null;
    inkType: InkType;
    viscosity: number | null;
    dryingTime: number | null;
    colorStrength: number | null;
    lightfastness: number | null;
    priceMin: number | null;
    priceMax: number | null;
    order: number;
    isActive: boolean;
    suppliers: Array<{ id: string; name: string }>;
  };
}

export function InkForm({ initialData }: InkFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    colorSeries: initialData?.colorSeries || '',
    colorCode: initialData?.colorCode || '',
    inkType: initialData?.inkType || 'BASE' as InkType,
    viscosity: initialData?.viscosity?.toString() || '',
    dryingTime: initialData?.dryingTime?.toString() || '',
    colorStrength: initialData?.colorStrength?.toString() || '',
    lightfastness: initialData?.lightfastness?.toString() || '',
    priceMin: initialData?.priceMin?.toString() || '',
    priceMax: initialData?.priceMax?.toString() || '',
    order: initialData?.order?.toString() || '0',
    supplierIds: initialData?.suppliers.map((s) => s.id) || [],
  });

  // 获取油墨商列表
  const { data: partners } = trpc.partner.adminList.useQuery({
    types: ['INK_VENDOR'],
    status: 'ACTIVE',
    limit: 100,
  });

  // 获取现有的颜色系列和品牌（用于建议）
  const { data: existingColorSeries } = trpc.ink.getColorSeries.useQuery();
  const { data: existingBrands } = trpc.ink.getBrands.useQuery();

  const createMutation = trpc.ink.create.useMutation({
    onSuccess: () => {
      router.push('/admin/inks');
    },
  });

  const updateMutation = trpc.ink.update.useMutation({
    onSuccess: () => {
      router.push('/admin/inks');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: formData.code,
      name: formData.name,
      brand: formData.brand || undefined,
      colorSeries: formData.colorSeries || undefined,
      colorCode: formData.colorCode || undefined,
      inkType: formData.inkType,
      viscosity: formData.viscosity ? parseFloat(formData.viscosity) : undefined,
      dryingTime: formData.dryingTime ? parseInt(formData.dryingTime) : undefined,
      colorStrength: formData.colorStrength ? parseFloat(formData.colorStrength) : undefined,
      lightfastness: formData.lightfastness ? parseInt(formData.lightfastness) : undefined,
      priceMin: formData.priceMin ? parseInt(formData.priceMin) : undefined,
      priceMax: formData.priceMax ? parseInt(formData.priceMax) : undefined,
      order: parseInt(formData.order) || 0,
      supplierIds: formData.supplierIds.length > 0 ? formData.supplierIds : undefined,
    };

    if (isEditing && initialData) {
      updateMutation.mutate({ id: initialData.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
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
                  placeholder="如 PANTONE-485-C"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如 潘通 485C"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">品牌</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="如 Pantone、DIC"
                  list="brand-suggestions"
                />
                <datalist id="brand-suggestions">
                  {existingBrands?.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inkType">类型 *</Label>
                <Select
                  value={formData.inkType}
                  onValueChange={(v) => setFormData({ ...formData, inkType: v as InkType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INK_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colorSeries">颜色系列</Label>
                <Input
                  id="colorSeries"
                  value={formData.colorSeries}
                  onChange={(e) => setFormData({ ...formData, colorSeries: e.target.value })}
                  placeholder="如 红色系、蓝色系"
                  list="series-suggestions"
                />
                <datalist id="series-suggestions">
                  {existingColorSeries?.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="colorCode">色号</Label>
                <Input
                  id="colorCode"
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                  placeholder="如 485 C"
                />
              </div>
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
          </CardContent>
        </Card>

        {/* 物理特性 */}
        <Card>
          <CardHeader>
            <CardTitle>物理特性</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="viscosity">粘度 (mPa·s)</Label>
                <Input
                  id="viscosity"
                  type="number"
                  step="0.1"
                  value={formData.viscosity}
                  onChange={(e) => setFormData({ ...formData, viscosity: e.target.value })}
                  placeholder="如 150"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dryingTime">干燥时间 (分钟)</Label>
                <Input
                  id="dryingTime"
                  type="number"
                  value={formData.dryingTime}
                  onChange={(e) => setFormData({ ...formData, dryingTime: e.target.value })}
                  placeholder="如 15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colorStrength">色强度 (%)</Label>
                <Input
                  id="colorStrength"
                  type="number"
                  step="0.1"
                  value={formData.colorStrength}
                  onChange={(e) => setFormData({ ...formData, colorStrength: e.target.value })}
                  placeholder="如 100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lightfastness">耐光性 (1-8)</Label>
                <Input
                  id="lightfastness"
                  type="number"
                  min="1"
                  max="8"
                  value={formData.lightfastness}
                  onChange={(e) => setFormData({ ...formData, lightfastness: e.target.value })}
                  placeholder="如 7"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceMin">最低价格 (分)</Label>
                <Input
                  id="priceMin"
                  type="number"
                  value={formData.priceMin}
                  onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                  placeholder="如 5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMax">最高价格 (分)</Label>
                <Input
                  id="priceMax"
                  type="number"
                  value={formData.priceMax}
                  onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                  placeholder="如 8000"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 供应商关联 */}
      <Card>
        <CardHeader>
          <CardTitle>供应商关联（油墨商）</CardTitle>
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
              暂无油墨商合作方，请先在合作方管理中添加
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
              {isEditing ? '保存修改' : '创建油墨'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
