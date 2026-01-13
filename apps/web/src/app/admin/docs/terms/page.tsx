/**
 * 服务条款管理页面
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Eye, History } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().min(1, '内容不能为空'),
  version: z.string().default('1.0'),
  effectiveDate: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});

type FormData = z.infer<typeof formSchema>;

export default function TermsOfServicePage() {
  const utils = trpc.useUtils();

  // 获取现有文档
  const { data: document, isLoading } = trpc.help.legalGetAdmin.useQuery({
    type: 'TERMS_OF_SERVICE',
  });

  // 获取历史版本
  const { data: history } = trpc.help.legalHistory.useQuery({
    type: 'TERMS_OF_SERVICE',
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '服务条款',
      content: '',
      version: '1.0',
      effectiveDate: '',
      status: 'DRAFT',
    },
  });

  // 当文档数据加载后，填充表单
  useEffect(() => {
    if (document) {
      form.reset({
        title: document.title,
        content: document.content,
        version: document.version,
        effectiveDate: document.effectiveDate
          ? format(new Date(document.effectiveDate), 'yyyy-MM-dd')
          : '',
        status: document.status,
      });
    }
  }, [document, form]);

  // 保存文档
  const upsertMutation = trpc.help.legalUpsert.useMutation({
    onSuccess: () => {
      utils.help.legalGetAdmin.invalidate();
      utils.help.legalHistory.invalidate();
    },
  });

  const onSubmit = (data: FormData) => {
    upsertMutation.mutate({
      type: 'TERMS_OF_SERVICE',
      title: data.title,
      content: data.content,
      version: data.version,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
      status: data.status,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">服务条款</h1>
          <p className="text-muted-foreground">编辑网站的服务条款文档</p>
        </div>
        <div className="flex items-center gap-2">
          {document?.status === 'PUBLISHED' && (
            <Button variant="outline" asChild>
              <a href="/terms" target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                预览
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：编辑器 */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>文档内容</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>标题</FormLabel>
                        <FormControl>
                          <Input placeholder="服务条款" {...field} />
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
                        <FormLabel>正文内容</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="支持 Markdown 格式..."
                            rows={25}
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          支持 Markdown 语法
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>发布设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="version"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>版本号</FormLabel>
                          <FormControl>
                            <Input placeholder="1.0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="effectiveDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>生效日期</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.setValue('status', 'DRAFT');
                        form.handleSubmit(onSubmit)();
                      }}
                      disabled={upsertMutation.isPending}
                    >
                      保存草稿
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        form.setValue('status', 'PUBLISHED');
                        form.handleSubmit(onSubmit)();
                      }}
                      disabled={upsertMutation.isPending}
                    >
                      {upsertMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <Save className="h-4 w-4 mr-2" />
                      发布
                    </Button>
                  </div>

                  {upsertMutation.error && (
                    <p className="text-sm text-destructive">
                      {upsertMutation.error.message}
                    </p>
                  )}

                  {upsertMutation.isSuccess && (
                    <p className="text-sm text-green-600">保存成功</p>
                  )}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* 右侧：信息和历史 */}
        <div className="space-y-6">
          {/* 文档信息 */}
          <Card>
            <CardHeader>
              <CardTitle>文档信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">状态</span>
                <Badge variant={document?.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                  {document?.status === 'PUBLISHED' ? '已发布' : '草稿'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">版本</span>
                <span>{document?.version || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">生效日期</span>
                <span>
                  {document?.effectiveDate
                    ? format(new Date(document.effectiveDate), 'yyyy-MM-dd', { locale: zhCN })
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">发布时间</span>
                <span>
                  {document?.publishedAt
                    ? format(new Date(document.publishedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })
                    : '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 历史版本 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                历史版本
              </CardTitle>
              <CardDescription>最近 10 个版本</CardDescription>
            </CardHeader>
            <CardContent>
              {history?.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无历史版本</p>
              ) : (
                <div className="space-y-2">
                  {history?.map((h) => (
                    <div
                      key={h.id}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">v{h.version}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(h.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
