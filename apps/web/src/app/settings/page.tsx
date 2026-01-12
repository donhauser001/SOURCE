import { redirect } from 'next/navigation';

/**
 * 旧的设置页面，重定向到新的个人中心
 */
export default function SettingsPage() {
    redirect('/account');
}
