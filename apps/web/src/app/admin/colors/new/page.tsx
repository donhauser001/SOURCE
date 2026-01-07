/**
 * 添加新色彩页面
 */

import { ColorForm } from '@/components/admin/color-form';

export default function NewColorPage() {
    return (
        <div className="p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">添加色彩</h1>
                <p className="text-muted-foreground mt-1">创建新的色彩身份证</p>
            </header>

            <ColorForm mode="create" />
        </div>
    );
}

