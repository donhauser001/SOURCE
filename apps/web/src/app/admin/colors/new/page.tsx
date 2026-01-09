/**
 * 添加新色彩页面
 */

import { ColorForm } from '@/components/admin/color-form';

export default function NewColorPage() {
    return (
        <div className="max-w-4xl">
            <ColorForm mode="create" />
        </div>
    );
}

