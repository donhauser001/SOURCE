'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { InkForm } from '@/components/admin/ink-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditInkPage({ params }: Props) {
  const { id } = use(params);
  const { data: ink, isLoading } = trpc.ink.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!ink) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <InkForm initialData={ink} />
    </div>
  );
}
