/**
 * 数据导入管理页面
 * 
 * 功能：
 * - 色彩数据批量导入
 * - 纸张数据批量导入
 * - 支持 CSV 和 JSON 格式
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileJson, Palette, FileText, ArrowRight } from 'lucide-react';

export default function ImportPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">数据导入</h1>
                <p className="text-muted-foreground mt-2">
                    批量导入色彩数据和纸张表现数据
                </p>
            </div>

            {/* 导入类型选择 */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* 色彩导入 */}
                <Card className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Palette className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>色彩数据导入</CardTitle>
                                <CardDescription>
                                    批量导入色彩基础信息
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>支持字段：</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>colorId, name, slug</li>
                                <li>labL, labA, labB</li>
                                <li>status, auditStatus</li>
                                <li>measurementDevice, measurementStandard</li>
                            </ul>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/admin/import/colors">
                                <Button className="gap-2">
                                    开始导入
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* 纸张数据导入 */}
                <Card className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <FileText className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <CardTitle>纸张数据导入</CardTitle>
                                <CardDescription>
                                    批量导入纸张表现数据
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>支持字段：</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>colorId, paperType</li>
                                <li>labL, labA, labB, deltaE</li>
                                <li>glossiness, inkAbsorption, gamutCoverage</li>
                                <li>recommendation, cautionNote</li>
                            </ul>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/admin/import/paper-profiles">
                                <Button variant="outline" className="gap-2">
                                    开始导入
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 支持的格式说明 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">支持的格式</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex gap-3">
                            <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
                            <div>
                                <h3 className="font-medium">CSV 格式</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    标准 CSV 文件，首行为字段名。支持字段映射和数据预览。
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <FileJson className="h-8 w-8 text-blue-600 shrink-0" />
                            <div>
                                <h3 className="font-medium">JSON 格式</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    JSON 数组格式，自动进行 Schema 校验。支持嵌套数据结构。
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 注意事项 */}
            <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                    <CardTitle className="text-lg text-amber-800">导入注意事项</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-700 space-y-2">
                    <ul className="list-disc list-inside space-y-1">
                        <li>导入前请确保数据格式正确，系统会在导入前进行校验</li>
                        <li>colorId 必须唯一，重复的 colorId 会导致导入失败</li>
                        <li>纸张数据导入前，需确保对应的色彩已存在</li>
                        <li>建议先使用小批量数据测试，确认无误后再批量导入</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

