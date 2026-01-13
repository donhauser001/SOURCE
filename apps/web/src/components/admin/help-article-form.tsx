/**
 * 帮助文章表单组件
 * 
 * 用于创建和编辑帮助文章
 * 支持分屏预览模式
 */

'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft, Eye, Edit, Columns2 } from 'lucide-react';
import Link from 'next/link';
import { helpArticleCreateSchema, type HelpArticleCreate } from '@/lib/validations/support';
import { cn } from '@/lib/utils';

type EditorMode = 'edit' | 'preview' | 'split';

interface HelpArticleFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    content: string;
    categoryId: string;
    tags: string[];
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    order: number;
    isPinned: boolean;
  };
}

export function HelpArticleForm({ mode, initialData }: HelpArticleFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [editorMode, setEditorMode] = useState<EditorMode>('split');

  // 获取分类列表
  const { data: categories } = trpc.help.categoryList.useQuery();

  const form = useForm<HelpArticleCreate>({
    resolver: zodResolver(helpArticleCreateSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      summary: initialData?.summary || '',
      content: initialData?.content || '',
      categoryId: initialData?.categoryId || '',
      tags: initialData?.tags || [],
      status: initialData?.status || 'DRAFT',
      order: initialData?.order || 0,
      isPinned: initialData?.isPinned || false,
    },
  });

  const createMutation = trpc.help.articleCreate.useMutation({
    onSuccess: () => {
      utils.help.articleListAdmin.invalidate();
      router.push('/admin/docs/help');
    },
  });

  const updateMutation = trpc.help.articleUpdate.useMutation({
    onSuccess: () => {
      utils.help.articleListAdmin.invalidate();
      router.push('/admin/docs/help');
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: HelpArticleCreate) => {
    if (mode === 'create') {
      createMutation.mutate(data);
    } else if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        data,
      });
    }
  };

  // 自动生成 slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/docs/help">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {mode === 'create' ? '新建帮助文章' : '编辑帮助文章'}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.setValue('status', 'DRAFT');
                form.handleSubmit(onSubmit)();
              }}
              disabled={isLoading}
            >
              保存草稿
            </Button>
            <Button
              type="button"
              onClick={() => {
                form.setValue('status', 'PUBLISHED');
                form.handleSubmit(onSubmit)();
              }}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              发布
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>文章内容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标题</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="输入文章标题"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            // 如果是新建且 slug 为空，自动生成
                            if (mode === 'create' && !form.getValues('slug')) {
                              form.setValue('slug', generateSlug(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL 标识</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">/help/</span>
                          <Input placeholder="article-slug" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        用于生成访问链接，只能包含小写字母、数字和连字符
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>摘要</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="简短描述文章内容（可选）"
                          rows={2}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>正文内容</FormLabel>
                        {/* 编辑模式切换 */}
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setEditorMode('edit')}
                            className={cn(
                              'p-1.5 rounded-md transition-colors',
                              editorMode === 'edit'
                                ? 'bg-background shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                            title="编辑模式"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorMode('split')}
                            className={cn(
                              'p-1.5 rounded-md transition-colors',
                              editorMode === 'split'
                                ? 'bg-background shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                            title="分屏模式"
                          >
                            <Columns2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorMode('preview')}
                            className={cn(
                              'p-1.5 rounded-md transition-colors',
                              editorMode === 'preview'
                                ? 'bg-background shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                            title="预览模式"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className={cn(
                        'grid gap-4',
                        editorMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'
                      )}>
                        {/* 编辑器 */}
                        {editorMode !== 'preview' && (
                          <FormControl>
                            <Textarea
                              placeholder="支持 Markdown 格式..."
                              rows={20}
                              className="font-mono text-sm resize-none"
                              {...field}
                            />
                          </FormControl>
                        )}
                        
                        {/* 预览 */}
                        {editorMode !== 'edit' && (
                          <div className="rounded-md border bg-muted/30 p-4 overflow-auto h-[480px]">
                            <MarkdownPreview content={field.value || ''} />
                          </div>
                        )}
                      </div>
                      
                      <FormDescription>
                        支持 Markdown 语法：# 标题、**粗体**、*斜体*、`代码`、- 列表
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧：设置 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>发布设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>分类</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择分类" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.parent ? `└ ${cat.name}` : cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>状态</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">草稿</SelectItem>
                          <SelectItem value="PUBLISHED">已发布</SelectItem>
                          <SelectItem value="ARCHIVED">已归档</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>排序</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>数字越小越靠前</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPinned"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>置顶</FormLabel>
                        <FormDescription>在列表中优先显示</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>标签</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="输入标签，用逗号分隔"
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => {
                            const tags = e.target.value
                              .split(',')
                              .map((t) => t.trim())
                              .filter(Boolean);
                            field.onChange(tags);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        便于搜索，如：插件,安装,常见问题
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 错误提示 */}
            {(createMutation.error || updateMutation.error) && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">
                    {createMutation.error?.message || updateMutation.error?.message}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

/**
 * Markdown 预览组件
 */
function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => {
    if (!content) {
      return '<p class="text-muted-foreground">预览将在这里显示...</p>';
    }
    
    return content
      // 标题
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2 text-foreground/90">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3 text-foreground">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-foreground">$1</h1>')
      // 粗体和斜体
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // 代码
      .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      // 列表
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-foreground/80">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-foreground/80">$1</li>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary underline">$1</a>')
      // 段落
      .replace(/\n\n/gim, '</p><p class="mb-4 text-foreground/80 leading-relaxed">')
      .replace(/\n/gim, '<br />');
  }, [content]);
  
  return (
    <div 
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-4 text-foreground/80 leading-relaxed">${html}</p>` }}
    />
  );
}
