/**
 * 帮助文章页面（SEO 优化版本）
 * 
 * 该页面使用 Server Component 生成静态元数据
 * 用于搜索引擎索引和社交分享
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 生成静态元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const article = await prisma.helpArticle.findUnique({
    where: { slug },
    select: {
      title: true,
      summary: true,
      content: true,
      category: { select: { name: true } },
      publishedAt: true,
      updatedAt: true,
    },
  });

  if (!article || article.publishedAt === null) {
    return {
      title: '文章未找到 | SOURCE 帮助中心',
    };
  }

  const description = article.summary || article.content.slice(0, 160).replace(/[#*`\n]/g, '');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://source-col.com';

  return {
    title: `${article.title} | SOURCE 帮助中心`,
    description,
    keywords: [article.category?.name, '帮助', 'SOURCE', '色彩'].filter(Boolean),
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      url: `${appUrl}/docs/article/${slug}`,
      siteName: 'SOURCE',
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      section: article.category?.name,
    },
    twitter: {
      card: 'summary',
      title: article.title,
      description,
    },
    alternates: {
      canonical: `${appUrl}/docs/article/${slug}`,
    },
  };
}

// 生成静态路径（可选，用于构建时预渲染热门文章）
export async function generateStaticParams() {
  const articles = await prisma.helpArticle.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
    take: 50, // 只预渲染前 50 篇
    orderBy: { viewCount: 'desc' },
  });

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// 页面组件 - 重定向到文档中心
export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  
  // 验证文章存在
  const article = await prisma.helpArticle.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });

  if (!article || article.status !== 'PUBLISHED') {
    notFound();
  }

  // 重定向到文档中心（保留文章上下文）
  redirect(`/docs/center?article=${slug}`);
}
