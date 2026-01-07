/**
 * 后台管理布局
 * 
 * 包含侧边栏导航和权限检查
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/sidebar';

interface Props {
    children: React.ReactNode;
}

export default async function AdminLayout({ children }: Props) {
    const session = await auth();

    // 权限检查：仅 ADMIN 和 OPERATOR 可访问
    if (!session?.user) {
        redirect('/login?callbackUrl=/admin');
    }

    const allowedRoles = ['ADMIN', 'OPERATOR'];
    const userRole = (session.user as { role?: string })?.role || 'USER';

    if (!allowedRoles.includes(userRole)) {
        redirect('/?error=unauthorized');
    }

    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 bg-muted/30">
                {children}
            </main>
        </div>
    );
}

