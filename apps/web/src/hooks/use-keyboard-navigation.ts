'use client';

/**
 * 键盘导航 Hook
 * 
 * 支持的快捷键：
 * - j / ↓: 下一篇文章
 * - k / ↑: 上一篇文章
 * - /: 聚焦搜索框
 * - Esc: 关闭搜索/清空搜索
 * - ?: 显示快捷键帮助
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  onNext?: () => void;
  onPrev?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  onHelp?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onNext,
  onPrev,
  onSearch,
  onEscape,
  onHelp,
  enabled = true,
}: KeyboardNavigationOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // 忽略输入框内的按键
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;

    // Escape 键始终生效
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape?.();
      return;
    }

    // 在输入框内只响应 Escape
    if (isInput) return;

    switch (event.key) {
      case 'j':
      case 'ArrowDown':
        event.preventDefault();
        onNext?.();
        break;

      case 'k':
      case 'ArrowUp':
        event.preventDefault();
        onPrev?.();
        break;

      case '/':
        event.preventDefault();
        onSearch?.();
        break;

      case '?':
        event.preventDefault();
        onHelp?.();
        break;
    }
  }, [enabled, onNext, onPrev, onSearch, onEscape, onHelp]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * 快捷键列表（用于显示帮助）
 */
export const KEYBOARD_SHORTCUTS = [
  { key: 'j / ↓', description: '下一篇文章' },
  { key: 'k / ↑', description: '上一篇文章' },
  { key: '/', description: '聚焦搜索框' },
  { key: 'Esc', description: '关闭/清空搜索' },
  { key: '?', description: '显示快捷键帮助' },
];
