'use client';

/**
 * 服务条款页面
 */

import Link from 'next/link';
import { ChevronRight, FileText, Calendar, Scale } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SiteHeader } from '@/components/site-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
  const { data: document, isLoading, error } = trpc.help.legalGet.useQuery(
    { type: 'TERMS_OF_SERVICE' },
    { retry: false }
  );

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pt-16 bg-background">
        {/* Hero */}
        <div className="bg-primary/5 border-b">
          <div className="max-w-[1600px] mx-auto px-6 py-12">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/docs" className="hover:text-foreground transition-colors">
                支持中心
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">服务条款</span>
            </nav>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {document?.title || '服务条款'}
                </h1>
                {document?.effectiveDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      生效日期：{new Date(document.effectiveDate).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-6 py-12">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-medium mb-2">暂无内容</h2>
              <p className="text-muted-foreground mb-6">
                服务条款文档正在准备中，请稍后再试
              </p>
              <Button asChild variant="outline">
                <Link href="/docs">返回支持中心</Link>
              </Button>
            </div>
          ) : (
            <article className="prose prose-neutral dark:prose-invert max-w-none">
              <div 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: (document?.content || '')
                    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-8 mb-4">$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-12 mb-6">$1</h1>')
                    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                    .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
                    .replace(/\n\n/gim, '</p><p class="mb-4">')
                    .replace(/\n/gim, '<br />')
                }} 
              />
            </article>
          )}

          {/* 底部导航 */}
          {document && (
            <div className="border-t mt-12 pt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  版本 {document.version}
                  {document.publishedAt && (
                    <span className="ml-2">
                      · 更新于 {new Date(document.publishedAt).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/docs/privacy">隐私政策</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/docs">支持中心</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
