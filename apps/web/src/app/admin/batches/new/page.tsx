/**
 * 创建批次页面
 */

import { BatchForm } from '@/components/admin/batch-form';

export default function NewBatchPage() {
    return (
        <div className="max-w-4xl">
            <BatchForm mode="create" />
        </div>
    );
}
