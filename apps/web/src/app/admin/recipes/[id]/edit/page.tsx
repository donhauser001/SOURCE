'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { RecipeForm } from '@/components/admin/recipe-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditRecipePage({ params }: Props) {
  const { id } = use(params);

  const { data: recipe, isLoading, error } = trpc.recipe.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error || !recipe) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <RecipeForm initialData={recipe} />
    </div>
  );
}
