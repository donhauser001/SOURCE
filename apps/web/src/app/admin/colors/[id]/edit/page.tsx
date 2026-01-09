/**
 * 编辑色彩页面
 */

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ColorForm } from '@/components/admin/color-form';

interface Props {
    params: Promise<{ id: string }>;
}

async function getColor(id: string) {
    return prisma.color.findUnique({
        where: { id },
    });
}

export default async function EditColorPage({ params }: Props) {
    const { id } = await params;
    const color = await getColor(id);

    if (!color) {
        notFound();
    }

    const initialData = {
        id: color.id,
        colorId: color.colorId,
        name: color.name,
        slug: color.slug,
        labL: color.labL,
        labA: color.labA,
        labB: color.labB,
        deltaETolerance: color.deltaETolerance,
        measurementDevice: color.measurementDevice,
        measurementStandard: color.measurementStandard,
        measurementCondition: color.measurementCondition || '',
        trueSourceNote: color.trueSourceNote || '',
        status: color.status,
        auditStatus: color.auditStatus,
        auditors: color.auditors,
        auditNotes: color.auditNotes || '',
        version: color.version,
    };

    return (
        <div className="max-w-4xl">
            <ColorForm mode="edit" initialData={initialData} />
        </div>
    );
}

