/**
 * 创建批次页面
 */

import { BatchForm } from '@/components/admin/batch-form';

export default function NewBatchPage() {
    return (
        <div className="p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">创建批次</h1>
                <p className="text-muted-foreground mt-1">创建新的验证批次</p>
            </header>

            <BatchForm mode="create" />
        </div>
    );
}
