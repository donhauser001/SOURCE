'use client';

/**
 * 文章目录组件 (Table of Contents)
 * 
 * 功能：
 * 1. 从 Markdown 内容提取标题
 * 2. 滚动监听高亮当前章节
 * 3. 点击快速跳转
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

/**
 * 将文本转换为 URL 友好的 slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 从 Markdown 内容提取标题
 */
export function extractHeadings(markdown: string): TocHeading[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;
  
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    
    // 跳过重复的 id
    if (headings.some(h => h.id === id)) {
      headings.push({
        level,
        text,
        id: `${id}-${headings.filter(h => h.id.startsWith(id)).length}`,
      });
    } else {
      headings.push({ level, text, id });
    }
  }
  
  return headings;
}

/**
 * 文章目录组件
 */
export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  
  const headings = useMemo(() => extractHeadings(content), [content]);
  
  // 滚动监听
  useEffect(() => {
    if (headings.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -80% 0px',
        threshold: 0,
      }
    );
    
    // 观察所有标题元素
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });
    
    return () => observer.disconnect();
  }, [headings]);
  
  // 点击跳转
  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
    }
  }, []);
  
  if (headings.length === 0) {
    return null;
  }
  
  // 计算最小层级（用于缩进）
  const minLevel = Math.min(...headings.map(h => h.level));
  
  return (
    <nav className={cn('text-sm', className)}>
      <div className="flex items-center gap-2 mb-3 text-foreground/60">
        <List className="w-4 h-4" />
        <span className="font-medium text-xs uppercase tracking-wider">目录</span>
      </div>
      
      <ul className="space-y-1">
        {headings.map(({ id, text, level }) => {
          const indent = (level - minLevel) * 12;
          const isActive = activeId === id;
          
          return (
            <li key={id}>
              <button
                onClick={() => handleClick(id)}
                className={cn(
                  'w-full text-left py-1.5 px-2 rounded-lg text-[13px] transition-all leading-snug',
                  isActive
                    ? 'bg-foreground/[0.08] text-foreground font-medium'
                    : 'text-foreground/50 hover:text-foreground/70 hover:bg-foreground/[0.04]'
                )}
                style={{ paddingLeft: `${8 + indent}px` }}
              >
                {text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * 为 HTML 内容添加 id 属性到标题
 */
export function addHeadingIds(html: string, headings: TocHeading[]): string {
  let result = html;
  let headingIndex = 0;
  
  // 匹配 h1, h2, h3 标签
  result = result.replace(
    /<h([1-3])[^>]*>([^<]+)<\/h\1>/gi,
    (match, level, text) => {
      if (headingIndex < headings.length) {
        const heading = headings[headingIndex];
        headingIndex++;
        return `<h${level} id="${heading.id}" class="scroll-mt-24">${text}</h${level}>`;
      }
      return match;
    }
  );
  
  return result;
}
