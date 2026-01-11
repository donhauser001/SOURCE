'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { RecipeStatus, CostLevel, InkType } from '@prisma/client';

const RECIPE_STATUS_OPTIONS = [
  { value: 'EXPERIMENTAL', label: '实验中' },
  { value: 'VERIFIED', label: '已验证' },
  { value: 'DEPRECATED', label: '已废弃' },
];

const COST_LEVEL_OPTIONS = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
];

const INK_TYPE_LABELS: Record<InkType, string> = {
  BASE: '基础色',
  SPOT: '专色',
  EXTENDER: '冲淡剂',
};

interface Ingredient {
  inkId: string;
  inkName?: string;
  inkCode?: string;
  inkType?: InkType;
  percentage: number;
  order: number;
}

interface RecipeFormProps {
  initialData?: {
    id: string;
    recipeId: string;
    name: string | null;
    colorId: string;
    color: { id: string; colorId: string; name: string };
    status: RecipeStatus;
    costLevel: CostLevel;
    applicablePapers: string[];
    notes: string | null;
    ingredients: Array<{
      inkId: string;
      percentage: number;
      order: number;
      ink: {
        id: string;
        code: string;
        name: string;
        inkType: InkType;
      };
    }>;
  };
}

export function RecipeForm({ initialData }: RecipeFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    recipeId: initialData?.recipeId || '',
    name: initialData?.name || '',
    colorId: initialData?.colorId || '',
    status: initialData?.status || 'EXPERIMENTAL' as RecipeStatus,
    costLevel: initialData?.costLevel || 'MEDIUM' as CostLevel,
    applicablePapers: initialData?.applicablePapers.join(', ') || '',
    notes: initialData?.notes || '',
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients.map((ing) => ({
      inkId: ing.inkId,
      inkName: ing.ink.name,
      inkCode: ing.ink.code,
      inkType: ing.ink.inkType,
      percentage: ing.percentage,
      order: ing.order,
    })) || []
  );

  const [selectedColorId, setSelectedColorId] = useState(initialData?.color?.colorId || '');

  // 获取颜色列表
  const { data: colors } = trpc.color.adminList.useQuery({
    limit: 200,
  });

  // 获取油墨列表
  const { data: inks } = trpc.ink.list.useQuery({
    includeInactive: false,
  });

  const createMutation = trpc.recipe.create.useMutation({
    onSuccess: () => {
      router.push('/admin/recipes');
    },
  });

  const updateMutation = trpc.recipe.update.useMutation({
    onSuccess: () => {
      router.push('/admin/recipes');
    },
  });

  // 当选择颜色时，更新 colorId
  const handleColorSelect = (colorIdValue: string) => {
    setSelectedColorId(colorIdValue);
    const color = colors?.items.find((c) => c.colorId === colorIdValue);
    if (color) {
      setFormData({ ...formData, colorId: color.id });
    }
  };

  // 添加成分
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { inkId: '', percentage: 0, order: ingredients.length },
    ]);
  };

  // 删除成分
  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // 更新成分
  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    if (field === 'inkId') {
      const ink = inks?.find((i) => i.id === value);
      updated[index] = {
        ...updated[index],
        inkId: value as string,
        inkName: ink?.name,
        inkCode: ink?.code,
        inkType: ink?.inkType,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setIngredients(updated);
  };

  // 计算总百分比
  const totalPercentage = ingredients.reduce((sum, ing) => sum + (ing.percentage || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      recipeId: formData.recipeId,
      name: formData.name || undefined,
      colorId: formData.colorId,
      status: formData.status,
      costLevel: formData.costLevel,
      applicablePapers: formData.applicablePapers
        ? formData.applicablePapers.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      notes: formData.notes || undefined,
      ingredients: ingredients
        .filter((ing) => ing.inkId)
        .map((ing, index) => ({
          inkId: ing.inkId,
          percentage: ing.percentage,
          order: index,
        })),
    };

    if (isEditing && initialData) {
      updateMutation.mutate({ id: initialData.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
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
                <Label htmlFor="recipeId">配方编号 *</Label>
                <Input
                  id="recipeId"
                  value={formData.recipeId}
                  onChange={(e) => setFormData({ ...formData, recipeId: e.target.value.toUpperCase() })}
                  placeholder="如 RECIPE-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">配方名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="内部名称（可选）"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorId">关联颜色 *</Label>
              <Select
                value={selectedColorId}
                onValueChange={handleColorSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择颜色" />
                </SelectTrigger>
                <SelectContent>
                  {colors?.items.map((color) => (
                    <SelectItem key={color.id} value={color.colorId}>
                      {color.colorId} - {color.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">状态 *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as RecipeStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPE_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="costLevel">成本等级 *</Label>
                <Select
                  value={formData.costLevel}
                  onValueChange={(v) => setFormData({ ...formData, costLevel: v as CostLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COST_LEVEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicablePapers">适用纸张（用逗号分隔）</Label>
              <Input
                id="applicablePapers"
                value={formData.applicablePapers}
                onChange={(e) => setFormData({ ...formData, applicablePapers: e.target.value })}
                placeholder="如 COATED, UNCOATED"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="配方说明..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 油墨配比 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>油墨配比</span>
              <div className="flex items-center gap-2">
                <Badge variant={totalPercentage === 100 ? 'default' : 'destructive'}>
                  总计: {totalPercentage.toFixed(1)}%
                </Badge>
                <Button type="button" size="sm" onClick={addIngredient}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ingredients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                点击"添加"按钮添加油墨成分
              </div>
            ) : (
              <div className="space-y-3">
                {ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <Select
                        value={ing.inkId}
                        onValueChange={(v) => updateIngredient(index, 'inkId', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择油墨" />
                        </SelectTrigger>
                        <SelectContent>
                          {inks?.map((ink) => (
                            <SelectItem key={ink.id} value={ink.id}>
                              <span className="flex items-center gap-2">
                                <span>{ink.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {INK_TYPE_LABELS[ink.inkType]}
                                </Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {ing.inkCode && (
                        <div className="text-xs text-muted-foreground mt-1">
                          代码: {ing.inkCode}
                        </div>
                      )}
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={ing.percentage}
                        onChange={(e) =>
                          updateIngredient(index, 'percentage', parseFloat(e.target.value) || 0)
                        }
                        placeholder="%"
                        className="text-right"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">%</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
        <Button type="submit" disabled={isPending || !formData.colorId}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? '保存修改' : '创建配方'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
