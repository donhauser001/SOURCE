/**
 * 编辑合作者页面
 */

import { notFound } from 'next/navigation';
import { PartnerForm } from '@/components/admin/partner-form';
import { prisma } from '@/lib/db';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditPartnerPage({ params }: PageProps) {
    const { id } = await params;

    const partner = await prisma.partner.findUnique({
        where: { id },
    });

    if (!partner) {
        notFound();
    }

    return (
        <div className="p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">编辑合作者</h1>
                <p className="text-muted-foreground mt-1">更新合作者档案信息</p>
            </header>

            <PartnerForm
                mode="edit"
                initialData={{
                    id: partner.id,
                    partnerId: partner.partnerId,
                    name: partner.name,
                    shortName: partner.shortName || '',
                    types: partner.types,
                    description: partner.description || '',
                    logoUrl: partner.logoUrl || '',
                    websiteUrl: partner.websiteUrl || '',
                    contactEmail: partner.contactEmail || '',
                    contactPhone: partner.contactPhone || '',
                    address: partner.address || '',
                    region: partner.region || '',
                    certifications: partner.certifications || [],
                    establishedYear: partner.establishedYear,
                    status: partner.status,
                }}
            />
        </div>
    );
}
