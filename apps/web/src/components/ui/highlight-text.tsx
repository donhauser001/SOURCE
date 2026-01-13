/**
 * 搜索关键词高亮组件
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 高亮显示搜索关键词
 */
export function HighlightText({
  text,
  query,
  className,
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800/50 text-foreground px-0.5 rounded',
}: HighlightTextProps) {
  const parts = useMemo(() => {
    if (!query || query.length < 2) {
      return [{ text, highlighted: false }];
    }

    try {
      const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
      const parts: { text: string; highlighted: boolean }[] = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        // 添加匹配前的文本
        if (match.index > lastIndex) {
          parts.push({
            text: text.slice(lastIndex, match.index),
            highlighted: false,
          });
        }
        // 添加匹配的文本
        parts.push({
          text: match[1],
          highlighted: true,
        });
        lastIndex = match.index + match[1].length;
      }

      // 添加剩余文本
      if (lastIndex < text.length) {
        parts.push({
          text: text.slice(lastIndex),
          highlighted: false,
        });
      }

      return parts.length > 0 ? parts : [{ text, highlighted: false }];
    } catch {
      return [{ text, highlighted: false }];
    }
  }, [text, query]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.highlighted ? (
          <mark key={i} className={cn('font-normal', highlightClassName)}>
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}
