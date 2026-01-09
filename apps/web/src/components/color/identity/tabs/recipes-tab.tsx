'use client';

import { Beaker } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useViewMode } from '../view-mode-context';
import { getFitResultVariant } from '../utils';
import type { ColorData } from '../types';

interface RecipesTabProps {
    recipes: ColorData['recipes'];
    fitMatrix: ColorData['fitMatrix'];
}

export function RecipesTab({ recipes, fitMatrix }: RecipesTabProps) {
    const { isDark } = useViewMode();

    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none",
        isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
    );

    if (!recipes || recipes.length === 0) {
        return (
            <Card className={cardStyle}>
                <CardContent className="py-12 text-center opacity-50">
                    <Beaker className="h-12 w-12 mx-auto mb-4" />
                    <p>暂无配方数据</p>
                    <p className="text-sm mt-2">配方数据将在验证后发布</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* 配方总览 */}
            <Card className={cardStyle}>
                <CardHeader>
                    <CardTitle className={cn(
                        "flex items-center gap-2",
                        isDark ? "text-white" : "text-black"
                    )}>
                        <Beaker className="h-5 w-5" />
                        配方总览
                    </CardTitle>
                    <CardDescription className={isDark ? "text-white/40" : "text-black/40"}>
                        一个 Color ID 可关联多条 Recipe，每条配方适用于特定纸张组合
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {recipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={recipe} isDark={isDark} />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 适配矩阵 */}
            {fitMatrix && fitMatrix.length > 0 && (
                <FitMatrixCard fitMatrix={fitMatrix} isDark={isDark} />
            )}
        </div>
    );
}

// 配方卡片
function RecipeCard({ recipe, isDark }: { recipe: NonNullable<ColorData['recipes']>[number]; isDark: boolean }) {
    return (
        <Card className={cn(
            "border-0 shadow-none",
            isDark ? "bg-white/5" : "bg-black/5"
        )}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <code className={cn(
                        "text-xs px-2 py-1 rounded",
                        isDark ? "bg-white/10 text-white/70" : "bg-black/5 text-black/70"
                    )}>{recipe.recipeId}</code>
                    <div className="flex gap-2">
                        <Badge variant={recipe.status === 'VERIFIED' ? 'success' : 'warning'}>
                            {recipe.statusLabel}
                        </Badge>
                        <Badge variant="outline" className={isDark ? "border-white/20 text-white/70" : "border-black/20 text-black/70"}>
                            {recipe.costLevelLabel}成本
                        </Badge>
                    </div>
                </div>
                {recipe.name && <CardTitle className={cn(
                    "text-base mt-2",
                    isDark ? "text-white" : "text-black"
                )}>{recipe.name}</CardTitle>}
            </CardHeader>
            <CardContent className="space-y-3">
                {/* 油墨构成 */}
                <div>
                    <div className={cn("text-sm font-medium mb-2", isDark ? "text-white/90" : "text-black/90")}>油墨构成</div>
                    <div className="space-y-1">
                        {recipe.ingredients.map((ing, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className={isDark ? "text-white/80" : "text-black/80"}>
                                    {ing.inkName}
                                    <span className={cn("ml-1", isDark ? "text-white/40" : "text-black/40")}>({ing.inkTypeLabel})</span>
                                </span>
                                <span className={cn("font-mono", isDark ? "text-white/90" : "text-black/90")}>{ing.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* 适用纸张 */}
                <div>
                    <div className={cn("text-sm font-medium mb-1", isDark ? "text-white/90" : "text-black/90")}>适用纸张</div>
                    <div className="flex flex-wrap gap-1">
                        {recipe.applicablePapers.map((paper) => (
                            <Badge key={paper} variant="secondary" className={cn(
                                "text-xs",
                                isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
                            )}>
                                {paper}
                            </Badge>
                        ))}
                    </div>
                </div>
                {recipe.notes && <p className={cn("text-sm", isDark ? "text-white/50" : "text-black/50")}>{recipe.notes}</p>}
            </CardContent>
        </Card>
    );
}

// 适配矩阵卡片
function FitMatrixCard({ fitMatrix, isDark }: { fitMatrix: NonNullable<ColorData['fitMatrix']>; isDark: boolean }) {
    const cardStyle = cn(
        "backdrop-blur-md border-0 shadow-none",
        isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
    );

    return (
        <Card className={cardStyle}>
            <CardHeader>
                <CardTitle className={cn(
                    "text-lg",
                    isDark ? "text-white" : "text-black"
                )}>配方 × 纸张适配矩阵</CardTitle>
                <CardDescription className={isDark ? "text-white/40" : "text-black/40"}>Color Identity 的心脏 — 每条结论都有据可查</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className={cn("border-b", isDark ? "border-white/10" : "border-black/10")}>
                                <th className="text-left py-2 px-3 opacity-50">配方</th>
                                <th className="text-left py-2 px-3 opacity-50">纸张</th>
                                <th className="text-left py-2 px-3 opacity-50">适配结果</th>
                                <th className="text-left py-2 px-3 opacity-50">ΔE</th>
                                <th className="text-left py-2 px-3 opacity-50">稳定性</th>
                                <th className="text-left py-2 px-3 opacity-50">结论</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fitMatrix.map((entry) => (
                                <tr key={entry.id} className={cn("border-b", isDark ? "border-white/5" : "border-black/5")}>
                                    <td className="py-2 px-3">
                                        <code className={cn(
                                            "text-xs px-1 rounded",
                                            isDark ? "bg-white/10 text-white/70" : "bg-black/5 text-black/70"
                                        )}>{entry.recipeId}</code>
                                    </td>
                                    <td className="py-2 px-3">{entry.paperName}</td>
                                    <td className="py-2 px-3">
                                        <Badge variant={getFitResultVariant(entry.fitResult) as 'success' | 'info' | 'destructive' | 'secondary'}>
                                            {entry.fitResultLabel}
                                        </Badge>
                                    </td>
                                    <td className="py-2 px-3 font-mono opacity-80">{entry.deltaEResult?.toFixed(1) || '-'}</td>
                                    <td className="py-2 px-3 opacity-80">{entry.stabilityScore ? `${entry.stabilityScore}/5` : '-'}</td>
                                    <td className="py-2 px-3 max-w-xs opacity-70">{entry.conclusionNote}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
