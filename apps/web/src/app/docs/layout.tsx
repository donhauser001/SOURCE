import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | SOURCE 帮助中心',
    default: '帮助中心 | SOURCE',
  },
  description: '查找帮助文档，获取 SOURCE 平台的使用指南、常见问题解答和技术支持。',
  keywords: ['SOURCE', '帮助中心', '常见问题', 'FAQ', '支持', '色彩', '色彩管理'],
  openGraph: {
    title: 'SOURCE 帮助中心',
    description: '查找帮助文档，获取 SOURCE 平台的使用指南、常见问题解答和技术支持。',
    type: 'website',
    siteName: 'SOURCE',
  },
  twitter: {
    card: 'summary',
    title: 'SOURCE 帮助中心',
    description: '查找帮助文档，获取 SOURCE 平台的使用指南、常见问题解答和技术支持。',
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
