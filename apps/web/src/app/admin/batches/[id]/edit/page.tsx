/**
 * 编辑批次页面
 */

import { notFound } from 'next/navigation';
import { BatchForm } from '@/components/admin/batch-form';
import { prisma } from '@/lib/db';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditBatchPage({ params }: PageProps) {
    const { id } = await params;

    const batch = await prisma.batch.findUnique({
        where: { id },
    });

    if (!batch) {
        notFound();
    }

    return (
        <div className="p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">编辑批次</h1>
                <p className="text-muted-foreground mt-1">更新批次信息</p>
            </header>

            <BatchForm
                mode="edit"
                initialData={{
                    id: batch.id,
                    batchNo: batch.batchNo,
                    type: batch.type,
                    partnerId: batch.partnerId || '',
                    instrumentModel: batch.instrumentModel || '',
                    calibratedAt: batch.calibratedAt ? batch.calibratedAt.toISOString().split('T')[0] : '',
                    notes: batch.notes || '',
                    createdBy: batch.createdBy,
                }}
            />
        </div>
    );
}
