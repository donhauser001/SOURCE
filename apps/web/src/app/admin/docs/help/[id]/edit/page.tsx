/**
 * 编辑帮助文章页面
 */

'use client';

import { use } from 'react';
import { trpc } from '@/lib/trpc';
import { HelpArticleForm } from '@/components/admin/help-article-form';
import { Loader2 } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditHelpArticlePage({ params }: Props) {
  const { id } = use(params);
  const { data: article, isLoading } = trpc.help.articleGet.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">文章不存在</p>
      </div>
    );
  }

  return (
    <HelpArticleForm
      mode="edit"
      initialData={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        categoryId: article.categoryId,
        tags: article.tags,
        status: article.status,
        order: article.order,
        isPinned: article.isPinned,
      }}
    />
  );
}
