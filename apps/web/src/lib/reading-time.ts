/**
 * 阅读时间估算工具
 * 
 * 中文约 400 字/分钟
 * 英文约 200 词/分钟
 */

/**
 * 估算阅读时间（分钟）
 */
export function estimateReadingTime(content: string): number {
  if (!content) return 0;
  
  // 移除 Markdown 标记
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // 代码块
    .replace(/`[^`]+`/g, '')        // 行内代码
    .replace(/!\[.*?\]\(.*?\)/g, '') // 图片
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
    .replace(/^#+\s+/gm, '')        // 标题标记
    .replace(/[*_~`#>-]/g, '');     // 其他标记
  
  // 计算中文字符数
  const chineseChars = (cleanContent.match(/[\u4e00-\u9fff]/g) || []).length;
  
  // 计算英文单词数
  const englishWords = cleanContent
    .replace(/[\u4e00-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0).length;
  
  // 中文 400 字/分钟，英文 200 词/分钟
  const chineseMinutes = chineseChars / 400;
  const englishMinutes = englishWords / 200;
  
  // 至少 1 分钟
  return Math.max(1, Math.ceil(chineseMinutes + englishMinutes));
}

/**
 * 格式化阅读时间
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return '< 1 分钟';
  if (minutes === 1) return '约 1 分钟';
  return `约 ${minutes} 分钟`;
}
