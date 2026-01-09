'use client';

/**
 * 工程分析页面
 *
 * v0.6.0 - SourcePack 解析
 * v0.6.2 - 完整分析流程
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileSearch, Download, HelpCircle, ArrowRight, BookOpen, Sparkles, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SiteHeader } from '@/components/site-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourcePackUploader } from '@/components/analyze/sourcepack-uploader';
import { ParseResultView } from '@/components/analyze/parse-result-view';
import { exampleSourcePack } from '@/lib/validations/sourcepack';
import type { MappedColorItem } from '@/lib/analyze/parser';
import type { DocInfo, PrintIntent } from '@/lib/validations/sourcepack';

// =============================================================================
// 类型定义
// =============================================================================

type AnalysisMode = 'quick' | 'full';

interface ParseResultData {
    docInfo: DocInfo;
    printIntent?: PrintIntent;
    colors: MappedColorItem[];
    summary: {
        totalColors: number;
        verifiedCount: number;
        partialMatchCount: number;
        unmappedCount: number;
        riskColorsCount: number;
    };
}

// =============================================================================
// 页面组件
// =============================================================================

export default function AnalyzePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parseResult, setParseResult] = useState<ParseResultData | null>(null);
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('full');

    // 快速解析（仅查看颜色映射，不生成报告）
    const handleQuickParse = useCallback(async (content: string, _fileName: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/analyze/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: content,
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.error?.message || '解析失败');
                return;
            }

            setParseResult(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '网络错误，请重试');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 完整分析（生成报告并跳转）
    const handleFullAnalysis = useCallback(async (content: string, _fileName: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: content,
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.error?.message || '分析失败');
                return;
            }

            // 跳转到报告页面
            router.push(`/analyze/${result.data.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : '网络错误，请重试');
            setIsLoading(false);
        }
    }, [router]);

    const handleUpload = useCallback(
        (content: string, fileName: string) => {
            if (analysisMode === 'full') {
                return handleFullAnalysis(content, fileName);
            }
            return handleQuickParse(content, fileName);
        },
        [analysisMode, handleFullAnalysis, handleQuickParse]
    );

    const handleReset = useCallback(() => {
        setParseResult(null);
        setError(null);
    }, []);

    const handleDownloadExample = useCallback(() => {
        const blob = new Blob([JSON.stringify(exampleSourcePack, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'example.sourcepack.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    // 已有解析结果时，显示结果视图
    if (parseResult) {
        return (
            <>
                <SiteHeader />
                <main className="min-h-screen pt-16 bg-background">
                    <div className="container mx-auto px-4 py-8 max-w-5xl">
                        {/* 页面标题 */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <FileSearch className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">SourcePack 解析结果</h1>
                                    <p className="text-muted-foreground text-sm">{parseResult.docInfo.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* 解析结果 */}
                        <ParseResultView data={parseResult} onReset={handleReset} />
                    </div>
                </main>
            </>
        );
    }

    // 默认上传视图
    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    {/* 页面标题 */}
                    <div className="text-center space-y-4 mb-8">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <FileSearch className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <Badge variant="secondary" className="gap-1">
                                v0.6.0
                            </Badge>
                            <h1 className="text-3xl font-bold tracking-tight">工程色彩分析</h1>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                上传 .sourcepack.json 工程色彩包，自动识别颜色、映射 SOURCE 数据库、标注风险点
                            </p>
                        </div>
                    </div>

                    {/* 主要内容区 */}
                    <Tabs defaultValue="upload" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                            <TabsTrigger value="upload">上传分析</TabsTrigger>
                            <TabsTrigger value="about">格式说明</TabsTrigger>
                        </TabsList>

                        {/* 上传区 */}
                        <TabsContent value="upload" className="space-y-6">
                            {/* 分析模式选择 */}
                            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                <Card
                                    className={`cursor-pointer transition-all ${analysisMode === 'full'
                                        ? 'border-primary ring-2 ring-primary/20'
                                        : 'hover:border-primary/50'
                                        }`}
                                    onClick={() => setAnalysisMode('full')}
                                >
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-primary" />
                                            完整分析
                                            <Badge className="ml-auto">推荐</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        颜色映射 + 风险识别 + 纸张推荐 + 生成报告
                                    </CardContent>
                                </Card>

                                <Card
                                    className={`cursor-pointer transition-all ${analysisMode === 'quick'
                                        ? 'border-primary ring-2 ring-primary/20'
                                        : 'hover:border-primary/50'
                                        }`}
                                    onClick={() => setAnalysisMode('quick')}
                                >
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <History className="w-4 h-4" />
                                            快速解析
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        仅解析颜色映射，不生成报告，不保存记录
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 上传组件 */}
                            <SourcePackUploader
                                onUpload={handleUpload}
                                isLoading={isLoading}
                                buttonText={analysisMode === 'full' ? '开始完整分析' : '快速解析'}
                            />

                            {/* 错误提示 */}
                            {error && (
                                <Card className="border-red-200 dark:border-red-900">
                                    <CardContent className="pt-6">
                                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 功能预览卡片 */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">颜色解析</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        自动识别工程中使用的颜色，匹配 SOURCE 数据库，标注验证状态
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">纸张推荐</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        四维评分模型，推荐最适合的纸张，避坑提醒
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">风险识别</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        识别大色块、渐变、叠印等潜在风险，提供缓解建议
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 快捷入口 */}
                            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                                <Button variant="outline" onClick={handleDownloadExample} className="gap-2">
                                    <Download className="w-4 h-4" />
                                    下载示例文件
                                </Button>
                                <Button asChild variant="ghost" className="gap-2">
                                    <Link href="/colors">
                                        浏览色彩库
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </Button>
                            </div>
                        </TabsContent>

                        {/* 格式说明 */}
                        <TabsContent value="about" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" />
                                        SourcePack 格式规范
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* 什么是 SourcePack */}
                                    <div className="space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <HelpCircle className="w-4 h-4" />
                                            什么是 SourcePack？
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            SourcePack
                                            是一种标准化的工程色彩描述格式，用于记录设计文件中使用的颜色信息。设计师可以从
                                            Adobe 插件或其他工具导出 .sourcepack.json 文件，用于印前分析和风险评估。
                                        </p>
                                    </div>

                                    {/* 基本结构 */}
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">基本结构</h3>
                                        <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs">
                                            {`{
  "version": "1.0",
  "docInfo": {
    "name": "文档名称",
    "source": "Adobe InDesign",
    "pageCount": 24
  },
  "printIntent": {
    "printType": "offset",
    "quantity": 5000
  },
  "colors": [
    {
      "colorId": "CN-Song-04",
      "name": "烟雨青",
      "lab": { "L": 65.2, "a": -12.3, "b": -8.5 },
      "usage": ["fill", "background"],
      "riskTags": ["large_area"]
    }
  ]
}`}
                                        </pre>
                                    </div>

                                    {/* 颜色项字段 */}
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">颜色项字段说明</h3>
                                        <div className="grid gap-2 text-sm">
                                            <div className="flex gap-4">
                                                <code className="text-primary font-mono w-32 shrink-0">colorId</code>
                                                <span className="text-muted-foreground">
                                                    SOURCE 颜色编号（如已知）
                                                </span>
                                            </div>
                                            <div className="flex gap-4">
                                                <code className="text-primary font-mono w-32 shrink-0">name</code>
                                                <span className="text-muted-foreground">颜色名称</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <code className="text-primary font-mono w-32 shrink-0">lab</code>
                                                <span className="text-muted-foreground">Lab 色值（优先使用）</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <code className="text-primary font-mono w-32 shrink-0">rgb / cmyk</code>
                                                <span className="text-muted-foreground">
                                                    RGB / CMYK 色值（备选）
                                                </span>
                                            </div>
                                            <div className="flex gap-4">
                                                <code className="text-primary font-mono w-32 shrink-0">usage</code>
                                                <span className="text-muted-foreground">
                                                    使用方式：fill / stroke / text / background
                                                </span>
                                            </div>
                                            <div className="flex gap-4">
                                                <code className="text-primary font-mono w-32 shrink-0">riskTags</code>
                                                <span className="text-muted-foreground">
                                                    风险标签：large_area / gradient / overprint 等
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 映射规则 */}
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">颜色映射规则</h3>
                                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                            <li>
                                                <strong>精确匹配：</strong>如果提供 colorId，优先精确匹配
                                            </li>
                                            <li>
                                                <strong>Lab 匹配：</strong>基于 Lab 值计算 ΔE 色差
                                            </li>
                                            <li>
                                                <strong>ΔE &le; 1.0：</strong>精确匹配，视为已验证
                                            </li>
                                            <li>
                                                <strong>ΔE &le; 3.0：</strong>接近匹配，视为已验证
                                            </li>
                                            <li>
                                                <strong>ΔE &le; 6.0：</strong>部分匹配，建议确认
                                            </li>
                                            <li>
                                                <strong>ΔE &gt; 6.0：</strong>视为未映射
                                            </li>
                                        </ul>
                                    </div>

                                    {/* 下载示例 */}
                                    <Button onClick={handleDownloadExample} className="gap-2">
                                        <Download className="w-4 h-4" />
                                        下载完整示例文件
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </>
    );
}
