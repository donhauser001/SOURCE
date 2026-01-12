'use client';

/**
 * Markdown 渲染组件
 *
 * 基于 react-markdown + remark-gfm
 * 支持 GitHub Flavored Markdown
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
    content: string;
    className?: string;
}

/**
 * Markdown 渲染组件
 *
 * @param content - Markdown 内容
 * @param className - 额外的 CSS 类名
 */
export function Markdown({ content, className }: MarkdownProps) {
    return (
        <div
            className={cn(
                'prose prose-neutral dark:prose-invert max-w-none',
                // 标题样式
                'prose-headings:font-bold prose-headings:tracking-tight',
                'prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
                // 链接样式
                'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
                // 代码样式
                'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
                'prose-code:before:content-none prose-code:after:content-none',
                'prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg',
                // 引用样式
                'prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:rounded-r-lg prose-blockquote:py-1',
                // 图片样式
                'prose-img:rounded-lg prose-img:shadow-md',
                // 列表样式
                'prose-ul:list-disc prose-ol:list-decimal',
                // 表格样式
                'prose-table:border prose-table:rounded-lg prose-th:bg-muted prose-th:p-2 prose-td:p-2',
                className
            )}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    );
}
