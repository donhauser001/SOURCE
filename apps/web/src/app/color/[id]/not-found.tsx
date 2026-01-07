/**
 * 颜色不存在页面
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft } from 'lucide-react';

export default function ColorNotFound() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <div className="text-center space-y-6 px-4">
                <div className="w-24 h-24 mx-auto bg-muted rounded-2xl flex items-center justify-center">
                    <Search className="w-12 h-12 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">颜色不存在</h1>
                    <p className="text-muted-foreground max-w-md">
                        找不到您请求的颜色。它可能已被移除，或者编号输入有误。
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild variant="outline">
                        <Link href="/colors" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            浏览所有颜色
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/">返回首页</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}

