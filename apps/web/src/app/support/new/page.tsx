'use client';

/**
 * 提交工单页面
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronRight,
  Send,
  BookOpen,
  Loader2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ticketCreateSchema,
  ticketPriorityLabels,
  type TicketCreate,
} from '@/lib/validations/support';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';

export default function NewTicketPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取工单分类
  const { data: categories } = trpc.ticket.categoryList.useQuery();

  const form = useForm<TicketCreate>({
    resolver: zodResolver(ticketCreateSchema),
    defaultValues: {
      subject: '',
      description: '',
      categoryId: '',
      priority: 'NORMAL',
      attachments: [],
    },
  });

  // 提交工单
  const createMutation = trpc.ticket.create.useMutation({
    onSuccess: (data) => {
      toast.success('工单已提交');
      router.push(`/support/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || '提交失败，请重试');
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: TicketCreate) => {
    console.log('[Ticket] Submitting:', data);
    setIsSubmitting(true);
    createMutation.mutate(data);
  };

  // 表单验证错误时的处理
  const onError = (errors: any) => {
    console.log('[Ticket] Validation errors:', errors);
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

  // 未登录提示
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="h-px bg-foreground/5 mt-16" />
        <main className="max-w-[800px] mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-6">
              <LogIn className="w-8 h-8 text-foreground/30" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              请先登录
            </h2>
            <p className="text-foreground/50 text-sm mb-6">
              登录后即可提交工单并跟踪处理进度
            </p>
            <Link href="/login?callbackUrl=/support/new">
              <Button className="rounded-full px-6">
                <LogIn className="w-4 h-4 mr-2" />
                去登录
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 加载中
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="h-px bg-foreground/5 mt-16" />
        <main className="max-w-[800px] mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* 顶部分割线 */}
      <div className="h-px bg-foreground/5 mt-16" />

      <main className="max-w-[800px] mx-auto px-6 py-8">
        {/* 面包屑 */}
        <nav className="flex items-center gap-1.5 text-[13px] text-foreground/40 mb-6">
          <Link href="/docs" className="hover:text-foreground/60 transition-colors">
            支持
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/support" className="hover:text-foreground/60 transition-colors">
            我的工单
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground/70">提交工单</span>
        </nav>

        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            提交工单
          </h1>
          <p className="text-foreground/50 text-sm">
            请详细描述您遇到的问题，我们会尽快为您处理
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
          {/* 分类选择 */}
          <div className="space-y-2">
            <Label htmlFor="categoryId" className="text-sm text-foreground/70">
              问题分类 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.watch('categoryId')}
              onValueChange={(v) => form.setValue('categoryId', v)}
            >
              <SelectTrigger className="h-11 rounded-xl bg-foreground/[0.03] border-foreground/10">
                <SelectValue placeholder="请选择问题分类" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categories?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.categoryId && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {form.formState.errors.categoryId.message}
              </p>
            )}
          </div>

          {/* 主题 */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm text-foreground/70">
              主题 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="简要描述您的问题"
              className="h-11 rounded-xl bg-foreground/[0.03] border-foreground/10 placeholder:text-foreground/30"
              {...form.register('subject')}
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {form.formState.errors.subject.message}
              </p>
            )}
          </div>

          {/* 优先级 */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm text-foreground/70">
              优先级
            </Label>
            <Select
              value={form.watch('priority')}
              onValueChange={(v: any) => form.setValue('priority', v)}
            >
              <SelectTrigger className="h-11 rounded-xl bg-foreground/[0.03] border-foreground/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {Object.entries(ticketPriorityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-foreground/40">
              请根据问题的紧急程度选择优先级
            </p>
          </div>

          {/* 详细描述 */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-foreground/70">
              详细描述 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="请详细描述您遇到的问题，包括：&#10;1. 问题出现的场景&#10;2. 您期望的结果&#10;3. 实际发生的情况&#10;4. 已尝试的解决方法"
              rows={8}
              className="rounded-xl bg-foreground/[0.03] border-foreground/10 placeholder:text-foreground/30 resize-none"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* 附件上传 */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground/70">
              附件（可选）
            </Label>
            <FileUpload
              value={form.watch('attachments') || []}
              onChange={(urls) => form.setValue('attachments', urls)}
              maxFiles={5}
              disabled={isSubmitting}
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/docs/center"
              className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              查看文档中心
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="h-10 px-6 rounded-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  提交工单
                </>
              )}
            </Button>
          </div>
        </form>

        {/* 提示信息 */}
        <div className="mt-10 p-5 rounded-2xl bg-foreground/[0.02] border border-foreground/5">
          <h3 className="font-medium text-foreground/70 mb-3 text-sm">温馨提示</h3>
          <ul className="text-sm text-foreground/50 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-foreground/30">•</span>
              提交工单后，我们会在 1-2 个工作日内回复
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground/30">•</span>
              请提供尽可能详细的信息，以便我们更快地解决问题
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground/30">•</span>
              您可以在"我的工单"中查看处理进度
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground/30">•</span>
              紧急问题请选择"紧急"优先级
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
