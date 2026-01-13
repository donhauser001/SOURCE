/**
 * 添加新共建者页面
 */

import { PartnerForm } from '@/components/admin/partner-form';

export default function NewPartnerPage() {
    return (
        <div className="max-w-4xl">
            <PartnerForm mode="create" />
        </div>
    );
}
