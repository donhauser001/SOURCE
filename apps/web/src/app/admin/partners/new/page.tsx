/**
 * 添加新合作者页面
 */

import { PartnerForm } from '@/components/admin/partner-form';

export default function NewPartnerPage() {
    return (
        <div className="p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">添加合作者</h1>
                <p className="text-muted-foreground mt-1">创建新的合作者档案</p>
            </header>

            <PartnerForm mode="create" />
        </div>
    );
}
