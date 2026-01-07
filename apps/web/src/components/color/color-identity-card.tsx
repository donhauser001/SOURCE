'use client';

/**
 * 色彩身份证卡片组件 v1.0
 *
 * 基于《色彩身份证字段规范 v1.0》
 * 集中呈现某一颜色的真源定义、适用纸张、可行配方、验证证据与风险限制
 */

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Copy,
    Check,
    ExternalLink,
    Info,
    AlertTriangle,
    ShieldCheck,
    Beaker,
    FileText,
    ThumbsUp,
    ThumbsDown,
    Users,
    Building2,
    User,
    Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ColorSwatch } from './color-swatch';
import { PaperProfileCard } from './paper-profile-card';
import { MaterialRadar } from './material-radar';
import { InkRecipeDisplay } from './ink-recipe-display';

// =============================================================================
// 类型定义
// =============================================================================

interface TrueSource {
    labL: number;
    labA: number;
    labB: number;
    deltaETolerance: number;
    measurementDevice: string;
    measurementStandard: string;
    measurementCondition: string | null;
    measuredAt: string;
    trueSourceNote: string | null;
}

interface PaperProfile {
    id: string;
    paperType: string;
    paperTypeLabel: string;
    labL: number;
    labA: number;
    labB: number;
    deltaE: number | null;
    glossiness: number;
    inkAbsorption: number;
    gamutCoverage: number;
    scanImageUrl: string | null;
    recommendation: string;
    recommendationLabel: string;
    cautionNote: string | null;
    batchNo: string | null;
}

interface PaperRecommendation {
    id: string;
    paperId: string;
    paperName: string;
    paperCategory: string;
    recommendationType: 'WHITELIST' | 'BLACKLIST';
    reason: string;
}

interface Recipe {
    id: string;
    recipeId: string;
    name: string | null;
    status: string;
    statusLabel: string;
    costLevel: string;
    costLevelLabel: string;
    applicablePapers: string[];
    notes: string | null;
    ingredients: RecipeIngredient[];
}

interface RecipeIngredient {
    inkName: string;
    inkType: string;
    inkTypeLabel: string;
    percentage: number;
}

interface FitMatrixEntry {
    id: string;
    recipeId: string;
    recipeName: string | null;
    paperId: string;
    paperName: string;
    fitResult: string;
    fitResultLabel: string;
    deltaEResult: number | null;
    stabilityScore: number | null;
    issueTags: string[];
    conclusionNote: string;
}

interface RecipeTestReport {
    id: string;
    reportId: string;
    recipeName: string | null;
    testedPaperIds: string[];
    printerPartner: string;
    pressModel: string | null;
    testDate: string;
    measurementDevice: string;
    conclusionLevel: string;
    conclusionLevelLabel: string;
    summary: string;
    collabLink: string | null;
}

interface ColorRisk {
    id: string;
    riskType: string;
    riskTypeLabel: string;
    affectedPaperIds: string[];
    description: string;
    mitigation: string | null;
}

interface Participation {
    id: string;
    entityType: string;
    roleInColor: string;
    roleInColorLabel: string;
    scope: string;
    scopeLabel: string;
    status: string;
    partnerName: string | null;
    partnerShortName: string | null;
    partnerId: string | null;
    userName: string | null;
    userEmail: string | null;
    externalEntityName: string | null;
    evidenceType: string | null;
    evidenceId: string | null;
    evidenceUrl: string | null;
    note: string | null;
    startAt: string | null;
    endAt: string | null;
}

interface AuditInfo {
    auditStatus: string;
    auditStatusLabel: string;
    auditors: string[];
    auditNotes: string | null;
    lastAuditAt: string | null;
}

interface ProofingPack {
    id: string;
    paperType: string;
    paperTypeLabel: string;
    price: number;
    externalUrl: string | null;
}

interface ColorData {
    colorId: string;
    name: string;
    slug: string;
    status: string;
    statusLabel: string;
    version: string;
    lastVerifiedAt: string | null;
    trueSource: TrueSource;
    audit: AuditInfo;
    batch: {
        batchNo: string;
        type: string;
        instrumentModel: string | null;
        calibratedAt: string | null;
    } | null;
    // 旧模型（向后兼容）
    paperProfiles: PaperProfile[];
    inkRecipe: Record<string, number>;
    proofingPacks: ProofingPack[];
    // 新模型（v1.0 规范）
    paperRecommendations?: PaperRecommendation[];
    recipes?: Recipe[];
    fitMatrix?: FitMatrixEntry[];
    testReports?: RecipeTestReport[];
    risks?: ColorRisk[];
    // v0.2.2 新增：参与者
    participations?: Participation[];
}

interface Props {
    color: ColorData;
}

// =============================================================================
// 组件
// =============================================================================

export function ColorIdentityCard({ color }: Props) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<string | null>(
        color.paperProfiles[0]?.paperType || null
    );
    const [activeTab, setActiveTab] = useState('overview');

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const selectedProfile = color.paperProfiles.find((p) => p.paperType === selectedPaper);

    // 获取推荐状态的 badge variant
    const getRecommendationVariant = (rec: string) => {
        switch (rec) {
            case 'BEST':
                return 'success';
            case 'GOOD':
                return 'info';
            case 'CAUTION':
                return 'warning';
            case 'AVOID':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    // 获取状态的 badge variant
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'VERIFIED':
                return 'success';
            case 'EXPERIMENTAL':
                return 'warning';
            case 'DEPRECATED':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    // 获取审计状态的 badge variant
    const getAuditStatusVariant = (status: string) => {
        return status === 'VERIFIED' ? 'success' : 'warning';
    };

    // 获取适配结果的 badge variant
    const getFitResultVariant = (result: string) => {
        switch (result) {
            case 'RECOMMENDED':
                return 'success';
            case 'USABLE':
                return 'info';
            case 'NOT_RECOMMENDED':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    // 获取结论等级的 badge variant
    const getConclusionVariant = (level: string) => {
        switch (level) {
            case 'PASS':
                return 'success';
            case 'CONDITIONAL':
                return 'warning';
            case 'FAIL':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    // 分离推荐和排除纸张
    const whitelistPapers = color.paperRecommendations?.filter(
        (p) => p.recommendationType === 'WHITELIST'
    ) || [];
    const blacklistPapers = color.paperRecommendations?.filter(
        (p) => p.recommendationType === 'BLACKLIST'
    ) || [];

    return (
        <TooltipProvider>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 顶部导航 */}
                <div className="mb-6">
                    <Link href="/colors">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            返回色彩列表
                        </Button>
                    </Link>
                </div>

                {/* 头部：色彩基本信息 */}
                <header className="mb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* 色块预览 */}
                        <ColorSwatch
                            labL={color.trueSource.labL}
                            labA={color.trueSource.labA}
                            labB={color.trueSource.labB}
                            size="lg"
                            className="shrink-0"
                        />

                        {/* 基本信息 */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h1 className="text-3xl font-bold tracking-tight">{color.name}</h1>
                                <Badge variant={getStatusVariant(color.status)}>
                                    {color.statusLabel}
                                </Badge>
                                <Badge variant={getAuditStatusVariant(color.audit.auditStatus)}>
                                    {color.audit.auditStatusLabel}
                                </Badge>
                                {color.version && (
                                    <Badge variant="outline" className="text-xs">
                                        v{color.version}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                <code className="px-3 py-1.5 bg-muted rounded text-base font-mono font-bold uppercase">
                                    {color.colorId}
                                </code>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => copyToClipboard(color.colorId, 'colorId')}
                                        >
                                            {copiedField === 'colorId' ? (
                                                <Check className="h-3 w-3" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>复制编号</TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Lab 值 */}
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">L*</span>
                                    <span className="font-mono font-medium">
                                        {color.trueSource.labL.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">a*</span>
                                    <span className="font-mono font-medium">
                                        {color.trueSource.labA.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">b*</span>
                                    <span className="font-mono font-medium">
                                        {color.trueSource.labB.toFixed(2)}
                                    </span>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() =>
                                                copyToClipboard(
                                                    `L*${color.trueSource.labL.toFixed(2)} a*${color.trueSource.labA.toFixed(2)} b*${color.trueSource.labB.toFixed(2)}`,
                                                    'lab'
                                                )
                                            }
                                        >
                                            {copiedField === 'lab' ? (
                                                <Check className="h-3 w-3" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>复制 Lab 值</TooltipContent>
                                </Tooltip>
                            </div>

                            {/* 真源说明 */}
                            {color.trueSource.trueSourceNote && (
                                <p className="mt-3 text-sm text-muted-foreground italic">
                                    {color.trueSource.trueSourceNote}
                                </p>
                            )}
                        </div>
                    </div>
                </header>

                {/* 主导航标签 */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
                        <TabsTrigger value="overview">总览</TabsTrigger>
                        <TabsTrigger value="recipes">配方</TabsTrigger>
                        <TabsTrigger value="evidence">验证证据</TabsTrigger>
                        <TabsTrigger value="risks">风险限制</TabsTrigger>
                        <TabsTrigger value="participants">参与者</TabsTrigger>
                    </TabsList>

                    {/* ============================================================= */}
                    {/* 总览标签 */}
                    {/* ============================================================= */}
                    <TabsContent value="overview" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* 左侧：纸张表现 */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* 推荐纸张场景 */}
                                {(whitelistPapers.length > 0 || blacklistPapers.length > 0) && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                推荐纸张场景
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        限定讨论空间的前置条件，帮助您快速判断适用性
                                                    </TooltipContent>
                                                </Tooltip>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {whitelistPapers.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-green-600 dark:text-green-400">
                                                        <ThumbsUp className="h-4 w-4" />
                                                        推荐纸张
                                                    </div>
                                                    <div className="space-y-2">
                                                        {whitelistPapers.map((paper) => (
                                                            <div
                                                                key={paper.id}
                                                                className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900"
                                                            >
                                                                <div className="font-medium">{paper.paperName}</div>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {paper.reason}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {blacklistPapers.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-red-600 dark:text-red-400">
                                                        <ThumbsDown className="h-4 w-4" />
                                                        排除纸张
                                                    </div>
                                                    <div className="space-y-2">
                                                        {blacklistPapers.map((paper) => (
                                                            <div
                                                                key={paper.id}
                                                                className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900"
                                                            >
                                                                <div className="font-medium">{paper.paperName}</div>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {paper.reason}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* 纸张选择标签 */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            实操表现区
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    基于「开放差异」原则，展示该颜色在不同介质上的真实状态
                                                </TooltipContent>
                                            </Tooltip>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {color.paperProfiles.length > 0 ? (
                                            <Tabs
                                                value={selectedPaper || undefined}
                                                onValueChange={setSelectedPaper}
                                            >
                                                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                                                    {color.paperProfiles.map((profile) => (
                                                        <TabsTrigger
                                                            key={profile.paperType}
                                                            value={profile.paperType}
                                                            className="gap-2"
                                                        >
                                                            {profile.paperTypeLabel}
                                                            <Badge
                                                                variant={getRecommendationVariant(profile.recommendation)}
                                                                className="text-[10px] px-1.5 py-0"
                                                            >
                                                                {profile.recommendationLabel}
                                                            </Badge>
                                                        </TabsTrigger>
                                                    ))}
                                                </TabsList>

                                                {color.paperProfiles.map((profile) => (
                                                    <TabsContent key={profile.paperType} value={profile.paperType}>
                                                        <PaperProfileCard profile={profile} />
                                                    </TabsContent>
                                                ))}
                                            </Tabs>
                                        ) : (
                                            <p className="text-muted-foreground text-center py-8">
                                                暂无纸张表现数据
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* 材质雷达图 */}
                                {selectedProfile && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg">材质表现雷达图</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <MaterialRadar
                                                glossiness={selectedProfile.glossiness}
                                                inkAbsorption={selectedProfile.inkAbsorption}
                                                gamutCoverage={selectedProfile.gamutCoverage}
                                                paperType={selectedProfile.paperTypeLabel}
                                            />
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* 右侧：生产技术区 */}
                            <div className="space-y-6">
                                {/* 真源数据 */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            真源数据
                                            <Badge variant="outline" className="text-[10px]">
                                                True Source
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">测量设备</span>
                                            <span>{color.trueSource.measurementDevice}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">测量标准</span>
                                            <span>{color.trueSource.measurementStandard}</span>
                                        </div>
                                        {color.trueSource.measurementCondition && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">测量条件</span>
                                                <span className="text-right max-w-[60%]">
                                                    {color.trueSource.measurementCondition}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">测量时间</span>
                                            <span suppressHydrationWarning>
                                                {new Date(color.trueSource.measuredAt).toLocaleDateString('zh-CN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">生产容差</span>
                                            <span>ΔE ≤ {color.trueSource.deltaETolerance.toFixed(1)}</span>
                                        </div>
                                        {color.batch && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">验证批次</span>
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                    {color.batch.batchNo}
                                                </code>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* 油墨配方（旧模型） */}
                                {Object.keys(color.inkRecipe).length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                油墨配方
                                                <Badge variant="outline" className="text-[10px]">
                                                    Ink Recipe
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <InkRecipeDisplay recipe={color.inkRecipe} />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* 审计与溯源 */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4" />
                                            审计与溯源
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">审计状态</span>
                                            <Badge variant={getAuditStatusVariant(color.audit.auditStatus)}>
                                                {color.audit.auditStatusLabel}
                                            </Badge>
                                        </div>
                                        {color.audit.auditors.length > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">审计人</span>
                                                <span className="text-right max-w-[60%]">
                                                    {color.audit.auditors.join('、')}
                                                </span>
                                            </div>
                                        )}
                                        {color.audit.lastAuditAt && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">审计时间</span>
                                                <span suppressHydrationWarning>
                                                    {new Date(color.audit.lastAuditAt).toLocaleDateString('zh-CN')}
                                                </span>
                                            </div>
                                        )}
                                        {color.lastVerifiedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">最近验证</span>
                                                <span suppressHydrationWarning>
                                                    {new Date(color.lastVerifiedAt).toLocaleDateString('zh-CN')}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* 购买打样包 */}
                                {color.proofingPacks.length > 0 && (
                                    <Card className="border-primary/20 bg-primary/5">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg">单色打样包</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {color.proofingPacks.map((pack) => (
                                                <div
                                                    key={pack.id}
                                                    className="flex items-center justify-between p-3 bg-background rounded-lg"
                                                >
                                                    <div>
                                                        <div className="font-medium">{pack.paperTypeLabel}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            ¥{(pack.price / 100).toFixed(0)}
                                                        </div>
                                                    </div>
                                                    {pack.externalUrl && (
                                                        <Button size="sm" asChild>
                                                            <a
                                                                href={pack.externalUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="gap-1"
                                                            >
                                                                购买
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ============================================================= */}
                    {/* 配方标签 */}
                    {/* ============================================================= */}
                    <TabsContent value="recipes" className="mt-6">
                        <div className="space-y-6">
                            {/* 配方总览 */}
                            {color.recipes && color.recipes.length > 0 ? (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Beaker className="h-5 w-5" />
                                                配方总览
                                            </CardTitle>
                                            <CardDescription>
                                                一个 Color ID 可关联多条 Recipe，每条配方适用于特定纸张组合
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                {color.recipes.map((recipe) => (
                                                    <Card key={recipe.id} className="bg-muted/30">
                                                        <CardHeader className="pb-2">
                                                            <div className="flex items-center justify-between">
                                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                    {recipe.recipeId}
                                                                </code>
                                                                <div className="flex gap-2">
                                                                    <Badge variant={recipe.status === 'VERIFIED' ? 'success' : 'warning'}>
                                                                        {recipe.statusLabel}
                                                                    </Badge>
                                                                    <Badge variant="outline">{recipe.costLevelLabel}成本</Badge>
                                                                </div>
                                                            </div>
                                                            {recipe.name && (
                                                                <CardTitle className="text-base mt-2">{recipe.name}</CardTitle>
                                                            )}
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            {/* 油墨构成 */}
                                                            <div>
                                                                <div className="text-sm font-medium mb-2">油墨构成</div>
                                                                <div className="space-y-1">
                                                                    {recipe.ingredients.map((ing, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="flex justify-between text-sm"
                                                                        >
                                                                            <span>
                                                                                {ing.inkName}
                                                                                <span className="text-muted-foreground ml-1">
                                                                                    ({ing.inkTypeLabel})
                                                                                </span>
                                                                            </span>
                                                                            <span className="font-mono">{ing.percentage}%</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {/* 适用纸张 */}
                                                            <div>
                                                                <div className="text-sm font-medium mb-1">适用纸张</div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {recipe.applicablePapers.map((paper) => (
                                                                        <Badge key={paper} variant="secondary" className="text-xs">
                                                                            {paper}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {recipe.notes && (
                                                                <p className="text-sm text-muted-foreground">{recipe.notes}</p>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* 适配矩阵 */}
                                    {color.fitMatrix && color.fitMatrix.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">配方 × 纸张适配矩阵</CardTitle>
                                                <CardDescription>
                                                    Color Identity 的心脏 — 每条结论都有据可查
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b">
                                                                <th className="text-left py-2 px-3">配方</th>
                                                                <th className="text-left py-2 px-3">纸张</th>
                                                                <th className="text-left py-2 px-3">适配结果</th>
                                                                <th className="text-left py-2 px-3">ΔE</th>
                                                                <th className="text-left py-2 px-3">稳定性</th>
                                                                <th className="text-left py-2 px-3">结论</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {color.fitMatrix.map((entry) => (
                                                                <tr key={entry.id} className="border-b">
                                                                    <td className="py-2 px-3">
                                                                        <code className="text-xs bg-muted px-1 rounded">
                                                                            {entry.recipeId}
                                                                        </code>
                                                                    </td>
                                                                    <td className="py-2 px-3">{entry.paperName}</td>
                                                                    <td className="py-2 px-3">
                                                                        <Badge variant={getFitResultVariant(entry.fitResult)}>
                                                                            {entry.fitResultLabel}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="py-2 px-3 font-mono">
                                                                        {entry.deltaEResult?.toFixed(1) || '-'}
                                                                    </td>
                                                                    <td className="py-2 px-3">
                                                                        {entry.stabilityScore ? `${entry.stabilityScore}/5` : '-'}
                                                                    </td>
                                                                    <td className="py-2 px-3 max-w-xs">
                                                                        {entry.conclusionNote}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center text-muted-foreground">
                                        <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>暂无配方数据</p>
                                        <p className="text-sm mt-2">配方数据将在验证后发布</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* ============================================================= */}
                    {/* 验证证据标签 */}
                    {/* ============================================================= */}
                    <TabsContent value="evidence" className="mt-6">
                        <div className="space-y-6">
                            {/* 测试报告 */}
                            {color.testReports && color.testReports.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            配方测试报告
                                        </CardTitle>
                                        <CardDescription>
                                            摘要展示，每条结论都有实体验证支撑
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {color.testReports.map((report) => (
                                                <Card key={report.id} className="bg-muted/30">
                                                    <CardHeader className="pb-2">
                                                        <div className="flex items-center justify-between">
                                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                {report.reportId}
                                                            </code>
                                                            <Badge variant={getConclusionVariant(report.conclusionLevel)}>
                                                                {report.conclusionLevelLabel}
                                                            </Badge>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-2 text-sm">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <span className="text-muted-foreground">测试机构</span>
                                                                <div>{report.printerPartner}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">测试日期</span>
                                                                <div suppressHydrationWarning>
                                                                    {new Date(report.testDate).toLocaleDateString('zh-CN')}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">测量设备</span>
                                                                <div>{report.measurementDevice}</div>
                                                            </div>
                                                            {report.pressModel && (
                                                                <div>
                                                                    <span className="text-muted-foreground">印刷机型</span>
                                                                    <div>{report.pressModel}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Separator />
                                                        <div>
                                                            <span className="text-muted-foreground">结论摘要</span>
                                                            <p className="mt-1">{report.summary}</p>
                                                        </div>
                                                        {report.collabLink && (
                                                            <div className="pt-2">
                                                                <a
                                                                    href={report.collabLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                                                >
                                                                    查看完整报告
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>暂无测试报告</p>
                                        <p className="text-sm mt-2">测试报告将在验证后发布</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* ============================================================= */}
                    {/* 风险限制标签 */}
                    {/* ============================================================= */}
                    <TabsContent value="risks" className="mt-6">
                        <div className="space-y-6">
                            {color.risks && color.risks.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-warning" />
                                            风险与限制
                                        </CardTitle>
                                        <CardDescription>
                                            使用此颜色时需要注意的风险点和规避建议
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {color.risks.map((risk) => (
                                                <div
                                                    key={risk.id}
                                                    className="p-4 border border-warning/30 bg-warning/5 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="warning">{risk.riskTypeLabel}</Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            影响纸张: {risk.affectedPaperIds.join('、')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{risk.description}</p>
                                                    {risk.mitigation && (
                                                        <div className="mt-2 pt-2 border-t border-warning/20">
                                                            <span className="text-sm font-medium">规避建议：</span>
                                                            <p className="text-sm text-muted-foreground">
                                                                {risk.mitigation}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center text-muted-foreground">
                                        <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>暂无风险记录</p>
                                        <p className="text-sm mt-2">此颜色在已验证范围内表现稳定</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* ============================================================= */}
                    {/* 参与者标签 */}
                    {/* ============================================================= */}
                    <TabsContent value="participants" className="mt-6">
                        <ParticipantsSection participations={color.participations || []} />
                    </TabsContent>
                </Tabs>

                {/* 页面声明 */}
                <Separator className="my-8" />
                <div className="text-center text-sm text-muted-foreground space-y-1">
                    <p>SOURCE 不提供脱离纸张条件的通用配方</p>
                    <p>推荐配方为默认生产条件下的工程最优解</p>
                    <p>所有结论均基于实体验证</p>
                </div>
            </div>
        </TooltipProvider>
    );
}

// =============================================================================
// 参与者区块组件
// =============================================================================

interface ParticipantsSectionProps {
    participations: Participation[];
}

function ParticipantsSection({ participations }: ParticipantsSectionProps) {
    // 按角色分组参与者
    const groupedByRole = participations.reduce((acc, p) => {
        const role = p.roleInColor;
        if (!acc[role]) {
            acc[role] = [];
        }
        acc[role].push(p);
        return acc;
    }, {} as Record<string, Participation[]>);

    // 角色排序顺序
    const roleOrder = ['PRINTER', 'PAPER_SUPPLIER', 'INK_SUPPLIER', 'AUDITOR', 'CO_BUILDER', 'TESTER', 'RESEARCHER'];
    const sortedRoles = Object.keys(groupedByRole).sort(
        (a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b)
    );

    // 获取角色图标
    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'PRINTER':
                return <Building2 className="h-4 w-4" />;
            case 'PAPER_SUPPLIER':
            case 'INK_SUPPLIER':
                return <Building2 className="h-4 w-4" />;
            case 'AUDITOR':
                return <ShieldCheck className="h-4 w-4" />;
            case 'CO_BUILDER':
            case 'TESTER':
            case 'RESEARCHER':
                return <User className="h-4 w-4" />;
            default:
                return <Users className="h-4 w-4" />;
        }
    };

    // 获取角色颜色
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'PRINTER':
                return 'text-blue-600 dark:text-blue-400';
            case 'PAPER_SUPPLIER':
                return 'text-amber-600 dark:text-amber-400';
            case 'INK_SUPPLIER':
                return 'text-purple-600 dark:text-purple-400';
            case 'AUDITOR':
                return 'text-green-600 dark:text-green-400';
            case 'CO_BUILDER':
                return 'text-cyan-600 dark:text-cyan-400';
            case 'TESTER':
                return 'text-orange-600 dark:text-orange-400';
            case 'RESEARCHER':
                return 'text-indigo-600 dark:text-indigo-400';
            default:
                return 'text-muted-foreground';
        }
    };

    // 获取实体名称
    const getEntityName = (p: Participation) => {
        if (p.partnerShortName) return p.partnerShortName;
        if (p.partnerName) return p.partnerName;
        if (p.userName) return p.userName;
        if (p.externalEntityName) return p.externalEntityName;
        return '未知';
    };

    // 获取实体副标题
    const getEntitySubtitle = (p: Participation) => {
        if (p.partnerId) return p.partnerId;
        if (p.userEmail) return p.userEmail;
        return null;
    };

    // 获取实体图标
    const getEntityIcon = (p: Participation) => {
        switch (p.entityType) {
            case 'PARTNER':
                return <Building2 className="h-4 w-4 text-muted-foreground" />;
            case 'USER':
                return <User className="h-4 w-4 text-muted-foreground" />;
            case 'EXTERNAL':
                return <Globe className="h-4 w-4 text-muted-foreground" />;
            default:
                return <Users className="h-4 w-4 text-muted-foreground" />;
        }
    };

    if (participations.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无参与者记录</p>
                    <p className="text-sm mt-2">参与者信息将在合作确认后发布</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        参与者
                    </CardTitle>
                    <CardDescription>
                        参与此颜色验证、配方开发、数据审计的合作者
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        {sortedRoles.map((role) => (
                            <div key={role}>
                                <div className={`flex items-center gap-2 mb-3 font-medium ${getRoleColor(role)}`}>
                                    {getRoleIcon(role)}
                                    {groupedByRole[role][0]?.roleInColorLabel || role}
                                    <Badge variant="outline" className="ml-auto text-xs">
                                        {groupedByRole[role].length}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    {groupedByRole[role].map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border"
                                        >
                                            {getEntityIcon(p)}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">
                                                    {getEntityName(p)}
                                                </div>
                                                {getEntitySubtitle(p) && (
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {getEntitySubtitle(p)}
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {p.scopeLabel}
                                                    </Badge>
                                                    {p.note && (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Badge variant="outline" className="text-[10px]">
                                                                    <Info className="h-2.5 w-2.5 mr-0.5" />
                                                                    备注
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                {p.note}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                                {p.evidenceUrl && (
                                                    <a
                                                        href={p.evidenceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                                                    >
                                                        查看证据
                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
