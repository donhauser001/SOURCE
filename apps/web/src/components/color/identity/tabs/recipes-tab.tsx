'use client';

import { Beaker, FlaskConical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ColorData } from '../types';

interface RecipesTabProps {
    recipes: ColorData['recipes'];
    fitMatrix: ColorData['fitMatrix'];
}

export function RecipesTab({ recipes, fitMatrix }: RecipesTabProps) {
    if (!recipes || recipes.length === 0) {
        return (
            <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
                <CardContent className="py-12 text-center">
                    <Beaker className="h-12 w-12 mx-auto mb-4 text-black/30" />
                    <p className="text-black/50">暂无配方数据</p>
                    <p className="text-sm mt-2 text-black/30">配方数据将在验证后发布</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* 配方总览 */}
            <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
                <CardContent className="p-6 space-y-5">
                    {/* 标题区 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Beaker className="h-4 w-4 text-black/70" />
                            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/70">
                                配方总览
                            </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-black/5 text-black/50">
                            {recipes.length} 条配方
                        </span>
                    </div>
                    <p className="text-xs text-black/40">
                        一个 Color ID 可关联多条 Recipe，每条配方适用于特定纸张组合
                    </p>

                    {/* 配方列表 */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {recipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 适配矩阵 */}
            {fitMatrix && fitMatrix.length > 0 && (
                <FitMatrixCard fitMatrix={fitMatrix} />
            )}
        </div>
    );
}

// 配方卡片
function RecipeCard({ recipe }: { recipe: NonNullable<ColorData['recipes']>[number] }) {
    return (
        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5 space-y-4">
            {/* 头部 */}
            <div className="flex items-center justify-between">
                <code className="text-xs px-2 py-1 rounded-full bg-black/5 text-black/70 font-mono">
                    {recipe.recipeId}
                </code>
                <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        recipe.status === 'VERIFIED' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                    }`}>
                        {recipe.statusLabel}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 text-black/50">
                        {recipe.costLevelLabel}成本
                    </span>
                </div>
            </div>
            
            {recipe.name && (
                <div className="font-medium text-black/90">{recipe.name}</div>
            )}

            {/* 油墨构成 */}
            <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider text-black/50">油墨构成</div>
                <div className="space-y-1.5">
                    {recipe.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="text-black/70">
                                {ing.inkName}
                                <span className="ml-1 text-black/40">({ing.inkTypeLabel})</span>
                            </span>
                            <span className="font-mono text-black/90">{ing.percentage}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 适用纸张 */}
            <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider text-black/50">适用纸张</div>
                <div className="flex flex-wrap gap-1">
                    {recipe.applicablePapers.map((paper) => (
                        <span 
                            key={paper} 
                            className="text-xs px-2 py-0.5 rounded-full bg-black/5 text-black/60"
                        >
                            {paper}
                        </span>
                    ))}
                </div>
            </div>

            {recipe.notes && (
                <p className="text-sm text-black/40">{recipe.notes}</p>
            )}
        </div>
    );
}

// 适配矩阵卡片
function FitMatrixCard({ fitMatrix }: { fitMatrix: NonNullable<ColorData['fitMatrix']> }) {
    const getFitResultStyle = (result: string) => {
        switch (result) {
            case 'EXCELLENT': return 'bg-emerald-100 text-emerald-700';
            case 'GOOD': return 'bg-blue-100 text-blue-700';
            case 'ACCEPTABLE': return 'bg-amber-100 text-amber-700';
            case 'POOR': return 'bg-red-100 text-red-700';
            default: return 'bg-black/5 text-black/50';
        }
    };

    return (
        <Card className="backdrop-blur-xl border shadow-none overflow-hidden rounded-3xl bg-white border-black/10">
            <CardContent className="p-6 space-y-5">
                {/* 标题区 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-black/70" />
                        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/70">
                            配方 × 纸张适配矩阵
                        </h3>
                    </div>
                </div>
                <p className="text-xs text-black/40">Color Identity 的心脏 — 每条结论都有据可查</p>

                {/* 表格 */}
                <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-black/10">
                                <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-black/50">配方</th>
                                <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-black/50">纸张</th>
                                <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-black/50">适配结果</th>
                                <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-black/50">ΔE</th>
                                <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-black/50">稳定性</th>
                                <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-black/50">结论</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fitMatrix.map((entry) => (
                                <tr key={entry.id} className="border-b border-black/5">
                                    <td className="py-3 px-3">
                                        <code className="text-xs px-1.5 py-0.5 rounded bg-black/5 text-black/70 font-mono">
                                            {entry.recipeId}
                                        </code>
                                    </td>
                                    <td className="py-3 px-3 text-black/80">{entry.paperName}</td>
                                    <td className="py-3 px-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getFitResultStyle(entry.fitResult)}`}>
                                            {entry.fitResultLabel}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 font-mono text-black/70">{entry.deltaEResult?.toFixed(1) || '-'}</td>
                                    <td className="py-3 px-3 text-black/70">{entry.stabilityScore ? `${entry.stabilityScore}/5` : '-'}</td>
                                    <td className="py-3 px-3 max-w-xs text-black/50 text-xs">{entry.conclusionNote}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
