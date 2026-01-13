'use client';

/**
 * 文档中心页面
 * 
 * 左侧：分类目录导航
 * 右侧：文章内容阅读器
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search,
  ChevronRight,
  FileText,
  ArrowLeft,
  Menu,
  X,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  Eye,
  BookOpen,
  List,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SiteHeader } from '@/components/site-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TableOfContents, extractHeadings, addHeadingIds } from '@/components/docs/table-of-contents';
import { estimateReadingTime, formatReadingTime } from '@/lib/reading-time';
import { HighlightText } from '@/components/ui/highlight-text';
import { useKeyboardNavigation, KEYBOARD_SHORTCUTS } from '@/hooks/use-keyboard-navigation';

export default function DocsCenterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleSlug = searchParams.get('article');
  
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not-helpful' | null>(null);

  // 获取帮助分类（缓存5分钟）
  const { data: categories, isLoading: categoriesLoading } = trpc.help.categoryTree.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,    // 5分钟内不重新请求
    gcTime: 30 * 60 * 1000,      // 缓存30分钟
  });

  // 获取所有文章（用于侧边栏显示，缓存3分钟）
  const { data: allArticles } = trpc.help.articleList.useQuery({
    status: 'PUBLISHED',
    page: 1,
    limit: 100,
  }, {
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // 获取当前文章详情（缓存2分钟）
  const { data: currentArticle, isLoading: articleLoading } = trpc.help.articleGetBySlug.useQuery(
    { slug: articleSlug || '' },
    { 
      enabled: !!articleSlug,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );

  // 搜索结果（缓存2分钟）
  const { data: searchResults } = trpc.help.articleList.useQuery({
    search: search || undefined,
    status: 'PUBLISHED',
    page: 1,
    limit: 20,
  }, {
    enabled: search.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // 相关文章推荐
  const { data: relatedArticles } = trpc.help.articleRelated.useQuery({
    articleId: currentArticle?.id || '',
    limit: 3,
  }, {
    enabled: !!currentArticle?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // 反馈 mutation
  const feedbackMutation = trpc.help.articleFeedback.useMutation({
    onSuccess: () => {
      toast.success('感谢您的反馈！');
    },
  });

  // 搜索框引用
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // 获取文章列表（用于键盘导航）
  const articleList = useMemo(() => {
    return allArticles?.items || [];
  }, [allArticles]);

  // 当前文章索引
  const currentArticleIndex = useMemo(() => {
    if (!articleSlug) return -1;
    return articleList.findIndex((a: any) => a.slug === articleSlug);
  }, [articleSlug, articleList]);

  // 键盘导航处理
  const handleNavigateNext = useCallback(() => {
    if (articleList.length === 0) return;
    const nextIndex = currentArticleIndex < articleList.length - 1 
      ? currentArticleIndex + 1 
      : 0;
    const nextArticle = articleList[nextIndex];
    if (nextArticle) {
      router.push(`/docs/center?article=${nextArticle.slug}`);
    }
  }, [articleList, currentArticleIndex, router]);

  const handleNavigatePrev = useCallback(() => {
    if (articleList.length === 0) return;
    const prevIndex = currentArticleIndex > 0 
      ? currentArticleIndex - 1 
      : articleList.length - 1;
    const prevArticle = articleList[prevIndex];
    if (prevArticle) {
      router.push(`/docs/center?article=${prevArticle.slug}`);
    }
  }, [articleList, currentArticleIndex, router]);

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleEscape = useCallback(() => {
    if (search) {
      setSearch('');
    } else {
      searchInputRef.current?.blur();
    }
    setShowShortcuts(false);
  }, [search]);

  const handleShowHelp = useCallback(() => {
    setShowShortcuts(prev => !prev);
  }, []);

  // 启用键盘导航
  useKeyboardNavigation({
    onNext: handleNavigateNext,
    onPrev: handleNavigatePrev,
    onSearch: handleFocusSearch,
    onEscape: handleEscape,
    onHelp: handleShowHelp,
    enabled: true,
  });

  // 自动展开当前文章所在的分类
  useEffect(() => {
    if (currentArticle?.categoryId) {
      setExpandedCategories(prev => new Set([...prev, currentArticle.categoryId]));
    }
  }, [currentArticle?.categoryId]);

  // 默认展开所有分类
  useEffect(() => {
    if (categories) {
      setExpandedCategories(new Set(categories.map((c: any) => c.id)));
    }
  }, [categories]);

  // 如果没有选中文章，默认选择第一篇
  useEffect(() => {
    if (!articleSlug && allArticles?.items?.length > 0) {
      const firstArticle = allArticles.items[0];
      router.replace(`/docs/center?article=${firstArticle.slug}`);
    }
  }, [articleSlug, allArticles, router]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleFeedback = (helpful: boolean) => {
    if (feedbackGiven || !currentArticle) return;
    setFeedbackGiven(helpful ? 'helpful' : 'not-helpful');
    feedbackMutation.mutate({ id: currentArticle.id, helpful });
  };

  const selectArticle = (slug: string) => {
    router.push(`/docs/center?article=${slug}`);
    setSidebarOpen(false);
    setFeedbackGiven(null);
  };

  // 按分类组织文章
  const articlesByCategory = allArticles?.items?.reduce((acc: any, article: any) => {
    const catId = article.categoryId || 'uncategorized';
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(article);
    return acc;
  }, {}) || {};

  const showSearchResults = search.length >= 2;

  // 计算总文档数
  const totalDocs = allArticles?.total || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* 顶部分割线 */}
      <div className="h-px bg-foreground/5 mt-16" />

      <div className="flex-1 flex">
        {/* 移动端侧边栏遮罩 */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 侧边栏 */}
        <aside className={cn(
          "fixed lg:sticky top-[calc(4rem+1px)] left-0 z-50 lg:z-auto w-72 h-[calc(100vh-4rem-1px)] bg-background flex flex-col transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* 侧边栏头部 */}
          <div className="flex-shrink-0 p-5 border-b border-foreground/5">
            {/* 标题行 */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-foreground/60" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground/90">文档中心</h2>
                  <p className="text-[11px] text-foreground/40">{totalDocs} 篇文档</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-md text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* 搜索框 - 圆角药丸风格 */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="搜索文档... (按 / 聚焦)"
                className="w-full pl-10 pr-4 h-10 text-sm bg-foreground/[0.06] border-0 rounded-full placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 目录树 */}
          <nav className="flex-1 overflow-y-auto">
            <div className="p-3">
              {showSearchResults ? (
                // 搜索结果
                <div>
                  <div className="px-2 py-1.5 text-[11px] font-medium text-foreground/40 uppercase tracking-wider">
                    搜索结果 · {searchResults?.total || 0}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {searchResults?.items?.map((article: any) => (
                      <button
                        key={article.id}
                        onClick={() => selectArticle(article.slug)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-full text-[13px] transition-all flex items-center gap-2.5 group",
                          articleSlug === article.slug
                            ? "bg-foreground text-background"
                            : "text-foreground/70 hover:bg-foreground/[0.06]"
                        )}
                      >
                        <FileText className={cn(
                          "w-4 h-4 flex-shrink-0 transition-colors",
                          articleSlug === article.slug ? "text-background/70" : "text-foreground/40 group-hover:text-foreground/60"
                        )} />
                        <span className="truncate">
                          <HighlightText 
                            text={article.title} 
                            query={search}
                            highlightClassName={articleSlug === article.slug 
                              ? "bg-background/30 text-background rounded px-0.5"
                              : "bg-yellow-200 dark:bg-yellow-800/50 text-foreground px-0.5 rounded"
                            }
                          />
                        </span>
                      </button>
                    ))}
                    {searchResults?.items?.length === 0 && (
                      <div className="text-center py-10 text-foreground/40 text-sm">
                        <Search className="w-8 h-8 mx-auto mb-2 text-foreground/20" />
                        未找到相关文档
                      </div>
                    )}
                  </div>
                </div>
              ) : categoriesLoading ? (
                // 加载中
                <div className="space-y-3 p-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-24 rounded bg-foreground/5 animate-pulse" />
                      <div className="pl-4 space-y-1.5">
                        <div className="h-8 rounded bg-foreground/[0.03] animate-pulse" />
                        <div className="h-8 rounded bg-foreground/[0.03] animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // 分类目录
                <div className="space-y-4">
                  {categories?.map((category: any) => {
                    const isExpanded = expandedCategories.has(category.id);
                    const articles = articlesByCategory[category.id] || [];
                    const hasCurrentArticle = articles.some((a: any) => a.slug === articleSlug);
                    
                    return (
                      <div key={category.id}>
                        {/* 分类标题 */}
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors",
                            hasCurrentArticle 
                              ? "text-foreground/80 bg-foreground/[0.04]" 
                              : "text-foreground/50 hover:text-foreground/70 hover:bg-foreground/[0.03]"
                          )}
                        >
                          <ChevronRight className={cn(
                            "w-3.5 h-3.5 transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                          <span className="flex-1 text-left">{category.name}</span>
                          <span className="text-[10px] font-normal text-foreground/30 tabular-nums">
                            {articles.length}
                          </span>
                        </button>
                        
                        {/* 文章列表 */}
                        {isExpanded && articles.length > 0 && (
                          <div className="mt-1 ml-2 pl-3 border-l border-foreground/[0.08] space-y-0.5">
                            {articles.map((article: any) => {
                              const isActive = articleSlug === article.slug;
                              return (
                                <button
                                  key={article.id}
                                  onClick={() => selectArticle(article.slug)}
                                  className={cn(
                                    "w-full text-left px-3 py-1.5 rounded-full text-[13px] transition-all",
                                    isActive
                                      ? "bg-foreground text-background font-medium"
                                      : "text-foreground/60 hover:text-foreground/90 hover:bg-foreground/[0.04]"
                                  )}
                                >
                                  <span className="truncate block">{article.title}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* 侧边栏底部 */}
          <div className="flex-shrink-0 p-4 border-t border-foreground/5">
            <Link
              href="/docs"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.04] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回支持中心
            </Link>
          </div>
        </aside>

        {/* 分隔线 */}
        <div className="hidden lg:block w-px bg-foreground/5" />

        {/* 主内容区 */}
        <main className="flex-1 min-w-0 relative">
          {/* 移动端顶部栏 */}
          <div className="lg:hidden sticky top-[calc(4rem+1px)] z-30 bg-background border-b border-foreground/5 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-foreground/60 hover:text-foreground rounded-md hover:bg-foreground/5 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-foreground/60 truncate block">
                {currentArticle?.category?.name}
              </span>
            </div>
          </div>

          {/* 文章内容 */}
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
            {articleLoading ? (
              // 加载中
              <div className="space-y-4">
                <div className="h-10 w-3/4 rounded bg-foreground/5 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-foreground/5 animate-pulse" />
                <div className="space-y-3 mt-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-4 rounded bg-foreground/5 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : currentArticle ? (
              <>
                {/* 文章头部 */}
                <header className="mb-8 pb-8 border-b border-foreground/5">
                  {/* 面包屑 */}
                  <nav className="flex items-center gap-1.5 text-[13px] text-foreground/40 mb-6">
                    <Link href="/docs" className="hover:text-foreground/60 transition-colors">
                      支持
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>文档中心</span>
                    {currentArticle.category && (
                      <>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span>{currentArticle.category.name}</span>
                      </>
                    )}
                  </nav>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
                    {currentArticle.title}
                  </h1>
                  
                  {currentArticle.summary && (
                    <p className="text-base text-foreground/50 mb-4 leading-relaxed">
                      {currentArticle.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[13px] text-foreground/40">
                    {currentArticle.publishedAt && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(currentArticle.publishedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{currentArticle.viewCount} 次阅读</span>
                    </div>
                    {currentArticle.content && (
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{formatReadingTime(estimateReadingTime(currentArticle.content))}</span>
                      </div>
                    )}
                  </div>
                </header>

                {/* 文章正文 + 目录 */}
                <div className="flex gap-8">
                  {/* 主内容 */}
                  <article className="prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none mb-12 flex-1 min-w-0">
                    <ArticleContent content={currentArticle.content} />
                  </article>
                  
                  {/* 右侧目录（桌面端） */}
                  {currentArticle.content && (
                    <aside className="hidden lg:block w-56 flex-shrink-0">
                      <div className="sticky top-[calc(4rem+1px+2rem)]">
                        <TableOfContents 
                          content={currentArticle.content}
                          className="p-4 bg-foreground/[0.02] rounded-2xl border border-foreground/5"
                        />
                      </div>
                    </aside>
                  )}
                </div>

                {/* 反馈区域 */}
                <div className="border-t border-foreground/5 pt-8">
                  <h3 className="text-sm font-medium text-foreground/70 mb-4">
                    这篇文档对您有帮助吗？
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={feedbackGiven === 'helpful' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFeedback(true)}
                      disabled={!!feedbackGiven}
                      className="h-8 text-xs"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                      有帮助
                    </Button>
                    <Button
                      variant={feedbackGiven === 'not-helpful' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFeedback(false)}
                      disabled={!!feedbackGiven}
                      className="h-8 text-xs"
                    >
                      <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
                      没帮助
                    </Button>
                    
                    <div className="flex-1" />
                    
                    <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-foreground/50">
                      <Link href="/support/new">
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        联系客服
                      </Link>
                    </Button>
                  </div>
                  
                  {feedbackGiven === 'not-helpful' && (
                    <div className="mt-4 p-4 bg-foreground/[0.03] rounded-lg">
                      <p className="text-sm text-foreground/60">
                        抱歉这篇文档没能帮到您。如需进一步帮助，请
                        <Link href="/support/new" className="text-foreground hover:underline mx-1">
                          提交工单
                        </Link>
                        联系我们的支持团队。
                      </p>
                    </div>
                  )}
                </div>

                {/* 相关文章推荐 */}
                {relatedArticles && relatedArticles.length > 0 && (
                  <div className="border-t border-foreground/5 pt-8 mt-8">
                    <h3 className="text-sm font-medium text-foreground/70 mb-4">
                      相关文章
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {relatedArticles.map((article: any) => (
                        <button
                          key={article.id}
                          onClick={() => selectArticle(article.slug)}
                          className="group text-left p-4 rounded-xl border border-foreground/5 hover:bg-foreground/[0.02] hover:border-foreground/10 transition-all"
                        >
                          <h4 className="text-sm font-medium text-foreground/80 group-hover:text-foreground mb-1 line-clamp-2">
                            {article.title}
                          </h4>
                          {article.summary && (
                            <p className="text-xs text-foreground/50 line-clamp-2">
                              {article.summary}
                            </p>
                          )}
                          {article.category && (
                            <span className="inline-block mt-2 text-[10px] text-foreground/40 bg-foreground/[0.04] px-2 py-0.5 rounded-full">
                              {article.category.name}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // 无文章
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-foreground/[0.04] flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-foreground/30" />
                </div>
                <h2 className="text-lg font-medium text-foreground/70 mb-2">
                  选择一篇文档开始阅读
                </h2>
                <p className="text-sm text-foreground/40">
                  从左侧目录中选择您想要查看的文档
                </p>
              </div>
            )}
          </div>

          {/* 右侧固定漂浮面板 */}
          <div className="hidden xl:block fixed right-8 top-[calc(4rem+1px+3rem)] z-40">
            <div className="bg-background border border-foreground/10 rounded-2xl shadow-lg p-4 w-56">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-foreground/60" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground/90">需要帮助？</h3>
                </div>
              </div>
              <p className="text-xs text-foreground/50 mb-4 leading-relaxed">
                找不到答案？提交工单，我们的支持团队将尽快回复。
              </p>
              <Link
                href="/support/new"
                className="flex items-center justify-center gap-2 w-full h-9 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
              >
                提交工单
              </Link>
              <Link
                href="/support"
                className="flex items-center justify-center gap-2 w-full h-9 rounded-full text-foreground/60 text-sm hover:text-foreground/90 hover:bg-foreground/[0.04] transition-colors mt-2"
              >
                查看我的工单
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* 键盘快捷键帮助 */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="bg-background border border-foreground/10 rounded-2xl shadow-2xl p-6 w-80 max-w-[90vw]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">键盘快捷键</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1 rounded-md text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-foreground/70">{shortcut.description}</span>
                  <kbd className="px-2 py-0.5 rounded bg-foreground/[0.06] text-xs font-mono text-foreground/60">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="mt-4 pt-4 border-t border-foreground/5 text-xs text-foreground/40 text-center">
              按 Esc 关闭此对话框
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 文章内容渲染组件
 * 将 Markdown 转换为带有 ID 的 HTML
 */
function ArticleContent({ content }: { content: string }) {
  const headings = extractHeadings(content);
  
  // 简单的 Markdown 转 HTML
  let html = content
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-8 mb-3 text-foreground/90 scroll-mt-24">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-10 mb-4 text-foreground scroll-mt-24">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-12 mb-5 text-foreground scroll-mt-24">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-foreground/90">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="bg-foreground/[0.06] px-1.5 py-0.5 rounded text-[13px] text-foreground/80">$1</code>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 text-foreground/70">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-foreground/70">$1</li>')
    .replace(/\n\n/gim, '</p><p class="mb-4 text-foreground/70 leading-relaxed">')
    .replace(/\n/gim, '<br />');
  
  // 为标题添加 ID
  let headingIndex = 0;
  html = html.replace(
    /<h([1-3]) class="([^"]*)">(.*?)<\/h\1>/gi,
    (match, level, classes, text) => {
      if (headingIndex < headings.length) {
        const id = headings[headingIndex].id;
        headingIndex++;
        return `<h${level} id="${id}" class="${classes}">${text}</h${level}>`;
      }
      return match;
    }
  );
  
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
