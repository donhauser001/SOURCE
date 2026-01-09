/**
 * 报告不存在页面
 */

import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';

export default function ReportNotFound() {
    return (
        <>
            <SiteHeader />
            <main className="min-h-screen pt-16 bg-background">
                <div className="container mx-auto px-4 py-16 max-w-md text-center">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
                        <FileQuestion className="w-10 h-10 text-muted-foreground" />
                    </div>

                    <h1 className="text-2xl font-bold mb-2">报告不存在</h1>
                    <p className="text-muted-foreground mb-8">
                        该分析报告可能已过期、被删除，或链接无效。
                        <br />
                        报告默认保留 30 天。
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button asChild variant="outline">
                            <Link href="/analyze">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                新建分析
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/colors">浏览色彩库</Link>
                        </Button>
                    </div>
                </div>
            </main>
        </>
    );
}
