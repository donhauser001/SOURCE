'use client';

/**
 * 打样包 SKU 卡片组件
 * 
 * v0.3.0 - Bridge 阶段
 * 
 * 用于色彩身份证页面展示可购买的打样包
 * 
 * 设计原则：
 * - 清晰展示纸张类型和价格
 * - 点击跳转外部平台（淘宝等）
 * - 记录购买意图用于统计
 */

import { useState } from 'react';
import { ExternalLink, ShoppingBag, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

// 纸张类型标签
const PAPER_TYPE_LABELS: Record<string, string> = {
    PREMIUM_MATTE: '高阶映画',
    UNCOATED: '纯质纸',
    COATED: '铜版纸',
    OFFSET: '双胶纸',
    LIGHTWEIGHT: '轻型纸',
};

// 纸张类型描述
const PAPER_TYPE_DESCRIPTIONS: Record<string, string> = {
    PREMIUM_MATTE: '高端艺术印刷首选，色彩还原度极佳',
    UNCOATED: '书籍内页常用，手感温润自然',
    COATED: '商业印刷主流，光泽度高',
    OFFSET: '经济实惠，日常印刷适用',
    LIGHTWEIGHT: '轻便易携，适合大批量',
};

interface ProofingPack {
    id: string;
    paperType: string;
    price: number;
    externalUrl: string | null;
    isActive: boolean;
}

interface Props {
    colorId: string;
    colorName: string;
    proofingPacks: ProofingPack[];
}

/**
 * 格式化价格（分 → 元）
 */
function formatPrice(priceInCents: number): string {
    return `¥${(priceInCents / 100).toFixed(2)}`;
}

export function ProofingPackCard({ colorId, colorName, proofingPacks }: Props) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // 没有可用的打样包
    if (proofingPacks.length === 0) {
        return null;
    }

    // 处理购买点击
    const handleBuyClick = async (pack: ProofingPack) => {
        if (!pack.externalUrl) return;

        setLoadingId(pack.id);

        try {
            // 记录购买意图
            await fetch('/api/buy-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proofingPackId: pack.id,
                    referrer: window.location.href,
                }),
            });
        } catch (error) {
            // 即使记录失败也继续跳转
            console.error('记录购买意图失败:', error);
        }

        // 跳转到外部平台
        window.open(pack.externalUrl, '_blank', 'noopener,noreferrer');
        setLoadingId(null);
    };

    return (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-lg">打样包</CardTitle>
                </div>
                <CardDescription>
                    获取 {colorName} 在不同纸张上的实物打样
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                    {proofingPacks.map((pack) => (
                        <div
                            key={pack.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/80 border border-amber-100 hover:border-amber-200 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {PAPER_TYPE_LABELS[pack.paperType] || pack.paperType}
                                    </span>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant="secondary" className="text-xs">
                                                ?
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            {PAPER_TYPE_DESCRIPTIONS[pack.paperType] || '标准印刷纸张'}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="text-lg font-bold text-amber-700 mt-1">
                                    {formatPrice(pack.price)}
                                </div>
                            </div>

                            <div>
                                {pack.externalUrl ? (
                                    <Button
                                        size="sm"
                                        className="gap-1.5 bg-amber-500 hover:bg-amber-600"
                                        onClick={() => handleBuyClick(pack)}
                                        disabled={loadingId === pack.id}
                                    >
                                        {loadingId === pack.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <ShoppingBag className="h-4 w-4" />
                                                购买
                                                <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground">
                                        暂无链接
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 说明文字 */}
                <p className="text-xs text-muted-foreground mt-4 text-center">
                    点击购买将跳转至外部平台完成交易
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * 简化版打样包列表（用于内嵌展示）
 */
export function ProofingPackList({ colorId, colorName, proofingPacks }: Props) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    if (proofingPacks.length === 0) {
        return null;
    }

    const handleBuyClick = async (pack: ProofingPack) => {
        if (!pack.externalUrl) return;

        setLoadingId(pack.id);

        try {
            await fetch('/api/buy-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proofingPackId: pack.id,
                    referrer: window.location.href,
                }),
            });
        } catch (error) {
            console.error('记录购买意图失败:', error);
        }

        window.open(pack.externalUrl, '_blank', 'noopener,noreferrer');
        setLoadingId(null);
    };

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
                <Package className="h-4 w-4 text-amber-600" />
                打样包
            </h4>
            <div className="flex flex-wrap gap-2">
                {proofingPacks.map((pack) => (
                    <Button
                        key={pack.id}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
                        onClick={() => handleBuyClick(pack)}
                        disabled={loadingId === pack.id || !pack.externalUrl}
                    >
                        {loadingId === pack.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <>
                                <span className="text-xs">
                                    {PAPER_TYPE_LABELS[pack.paperType] || pack.paperType}
                                </span>
                                <span className="font-bold text-amber-700">
                                    {formatPrice(pack.price)}
                                </span>
                                {pack.externalUrl && (
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                )}
                            </>
                        )}
                    </Button>
                ))}
            </div>
        </div>
    );
}

