'use client';

/**
 * 支持中心页面
 * 
 * 简洁现代的帮助中心布局，包含：
 * 1. Hero + 搜索
 * 2. 快捷入口
 * 3. 帮助分类
 * 4. 热门文章
 * 5. 法律条款
 */

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search,
  MessageSquare,
  ChevronRight,
  FileText,
  Shield,
  Scale,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Mail,
  Clock,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SiteHeader } from '@/components/site-header';
import { Input } from '@/components/ui/input';
import { HighlightText } from '@/components/ui/highlight-text';

export default function DocsPage() {
  const [search, setSearch] = useState('');

  // 获取帮助分类（缓存5分钟）
  const { data: categories, isLoading: categoriesLoading } = trpc.help.categoryTree.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,    // 5分钟内不重新请求
    gcTime: 30 * 60 * 1000,      // 缓存30分钟
  });

  // 获取推荐文章（缓存5分钟）
  const { data: featuredArticles } = trpc.help.articleFeatured.useQuery({ limit: 6 }, {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // 搜索结果（缓存2分钟）
  const { data: searchResults, isLoading: searchLoading } = trpc.help.articleList.useQuery({
    search: search || undefined,
    status: 'PUBLISHED',
    page: 1,
    limit: 10,
  }, {
    enabled: search.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const showSearchResults = search.length >= 2;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="relative">
        {/* ============================================================= */}
        {/* Hero + 搜索 */}
        {/* ============================================================= */}
        <section className="relative pt-24 pb-16 px-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
                有什么可以帮您？
              </h1>
              <p className="text-foreground/50 mb-8">
                搜索帮助文章，或浏览下方分类
              </p>

            {/* 搜索框 - 圆角药丸风格 */}
            <div className="relative max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  type="search"
                  placeholder="搜索问题或关键词..."
                  className="w-full pl-14 pr-5 h-12 text-base bg-foreground/[0.06] border-0 rounded-full placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-0"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* 搜索结果下拉 */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-foreground/10 rounded-2xl shadow-lg overflow-hidden z-50">
                    {searchLoading ? (
                      <div className="p-4 text-center text-foreground/40">
                        搜索中...
                      </div>
                    ) : searchResults?.items?.length === 0 ? (
                      <div className="p-6 text-center">
                        <HelpCircle className="w-8 h-8 mx-auto text-foreground/20 mb-2" />
                        <p className="text-foreground/50">未找到相关文章</p>
                        <Link 
                          href="/support/new"
                          className="inline-flex items-center gap-1 mt-3 text-sm text-foreground/60 hover:text-foreground transition-colors"
                        >
                          联系客服
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-foreground/5">
                        {searchResults?.items?.slice(0, 5).map((article: any) => (
                          <Link
                            key={article.id}
                            href={`/docs/center?article=${article.slug}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.03] transition-colors"
                          >
                            <FileText className="w-4 h-4 text-foreground/30 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground/80 truncate">
                                <HighlightText text={article.title} query={search} />
                              </div>
                              {article.category && (
                                <div className="text-xs text-foreground/40">
                                  {article.category.name}
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-foreground/20" />
                          </Link>
                        ))}
                        {(searchResults?.total || 0) > 5 && (
                          <div className="px-4 py-3 text-center">
                            <span className="text-xs text-foreground/40">
                              共 {searchResults?.total} 个结果
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* 快捷入口 */}
        {/* ============================================================= */}
        <section className="px-6 pb-16">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid sm:grid-cols-3 gap-4">
              <Link
                href="/support/new"
                className="group flex items-center gap-4 p-5 rounded-2xl border border-foreground/5 bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-foreground/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                  <MessageSquare className="w-5 h-5 text-foreground/50" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground/80">提交工单</div>
                  <div className="text-xs text-foreground/40">获取专属支持</div>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/20 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/support"
                className="group flex items-center gap-4 p-5 rounded-2xl border border-foreground/5 bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-foreground/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                  <Clock className="w-5 h-5 text-foreground/50" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground/80">我的工单</div>
                  <div className="text-xs text-foreground/40">查看处理进度</div>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/20 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="mailto:support@source-col.com"
                className="group flex items-center gap-4 p-5 rounded-2xl border border-foreground/5 bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-foreground/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                  <Mail className="w-5 h-5 text-foreground/50" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground/80">邮件联系</div>
                  <div className="text-xs text-foreground/40">support@source-col.com</div>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/20 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* 文档中心 */}
        {/* ============================================================= */}
        <section className="px-6 py-16 bg-foreground/[0.02] border-y border-foreground/5">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-foreground/40" />
                <h2 className="text-lg font-medium text-foreground/80">文档中心</h2>
              </div>
              <Link 
                href="/docs/center"
                className="group inline-flex items-center gap-1.5 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                查看全部文档
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {categoriesLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-foreground/5 animate-pulse" />
                ))}
              </div>
            ) : categories?.length === 0 ? (
              <div className="text-center py-12 text-foreground/40">
                暂无帮助分类
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {categories?.map((category: any) => (
                  <Link
                    key={category.id}
                    href={`/docs/center`}
                    className="group p-6 rounded-2xl border border-foreground/5 bg-background hover:bg-foreground/[0.02] hover:border-foreground/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                        <FileText className="w-5 h-5 text-foreground/40" />
                      </div>
                      <span className="text-xs text-foreground/30 bg-foreground/5 px-2 py-0.5 rounded-full">
                        {category._count?.articles || 0} 篇
                      </span>
                    </div>
                    <h3 className="text-base font-medium text-foreground/80 mb-1">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-foreground/40 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================= */}
        {/* 常见问题（推荐文章） */}
        {/* ============================================================= */}
        {featuredArticles && featuredArticles.length > 0 && (
          <section className="px-6 py-16">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-foreground/40" />
                  <h2 className="text-lg font-medium text-foreground/80">常见问题</h2>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {featuredArticles.map((article: any) => (
                  <Link
                    key={article.id}
                    href={`/docs/center?article=${article.slug}`}
                    className="group flex items-center gap-3 p-4 rounded-xl border border-foreground/5 hover:bg-foreground/[0.02] hover:border-foreground/10 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-foreground/40 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground/70 group-hover:text-foreground/90 transition-colors truncate">
                        {article.title}
                      </div>
                    </div>
                    {article.category && (
                      <span className="text-xs text-foreground/30 flex-shrink-0">
                        {article.category.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* 法律条款 */}
        {/* ============================================================= */}
        <section className="px-6 py-16 border-t border-foreground/5">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Scale className="w-5 h-5 text-foreground/40" />
              <h2 className="text-lg font-medium text-foreground/80">法律条款</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/docs/privacy"
                className="group flex items-center gap-4 p-5 rounded-2xl border border-foreground/5 hover:bg-foreground/[0.02] hover:border-foreground/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                  <Shield className="w-5 h-5 text-foreground/40" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground/80">隐私政策</div>
                  <div className="text-xs text-foreground/40">了解我们如何保护您的数据</div>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/docs/terms"
                className="group flex items-center gap-4 p-5 rounded-2xl border border-foreground/5 hover:bg-foreground/[0.02] hover:border-foreground/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                  <Scale className="w-5 h-5 text-foreground/40" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground/80">服务条款</div>
                  <div className="text-xs text-foreground/40">使用条款和协议</div>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
