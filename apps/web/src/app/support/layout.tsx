import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | SOURCE 支持',
    default: '我的工单 | SOURCE 支持',
  },
  description: '查看和管理您的支持工单，获取 SOURCE 平台的技术支持和帮助。',
  keywords: ['SOURCE', '支持', '工单', '客服', '技术支持'],
  robots: {
    index: false, // 工单页面不索引
    follow: false,
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
