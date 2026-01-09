'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { PaperTypeForm } from '@/components/admin/paper-type-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditPaperTypePage({ params }: Props) {
  const { id } = use(params);
  const { data: paperType, isLoading } = trpc.paperType.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!paperType) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PaperTypeForm
        initialData={{
          ...paperType,
          suitableFor: paperType.suitableFor as string[] | null,
        }}
      />
    </div>
  );
}
