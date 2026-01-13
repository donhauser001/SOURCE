'use client';

/**
 * 文件上传组件
 * 
 * 支持拖拽上传、多文件上传、上传进度显示
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, File, Image, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface FileUploadProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function FileUpload({
  value = [],
  onChange,
  maxFiles = 5,
  accept = 'image/*,.pdf,.doc,.docx,.txt',
  disabled = false,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const id = Math.random().toString(36).substring(2);
    
    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      setUploading(prev => [...prev, { id, name: file.name, progress: 0, error: '文件大小不能超过 10MB' }]);
      return null;
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploading(prev => [...prev, { id, name: file.name, progress: 0, error: '不支持的文件类型' }]);
      return null;
    }

    setUploading(prev => [...prev, { id, name: file.name, progress: 10 }]);

    try {
      // 构建 FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'tickets');

      setUploading(prev => prev.map(f => f.id === id ? { ...f, progress: 30 } : f));

      // 上传文件
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '上传失败');
      }

      const { fileUrl } = await response.json();
      
      setUploading(prev => prev.map(f => f.id === id ? { ...f, progress: 100 } : f));

      // 延迟移除上传中状态
      setTimeout(() => {
        setUploading(prev => prev.filter(f => f.id !== id));
      }, 500);

      return fileUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传失败';
      setUploading(prev => prev.map(f => f.id === id ? { ...f, progress: 0, error: message } : f));
      return null;
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (disabled) return;

    const remaining = maxFiles - value.length;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);
    const uploadPromises = filesToUpload.map(uploadFile);
    const results = await Promise.all(uploadPromises);
    const successUrls = results.filter((url): url is string => url !== null);

    if (successUrls.length > 0 && onChange) {
      onChange([...value, ...successUrls]);
    }
  }, [value, maxFiles, disabled, uploadFile, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeFile = useCallback((url: string) => {
    if (onChange) {
      onChange(value.filter(v => v !== url));
    }
  }, [value, onChange]);

  const removeUploadingFile = useCallback((id: string) => {
    setUploading(prev => prev.filter(f => f.id !== id));
  }, []);

  const getFileIcon = (url: string) => {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <Image className="w-4 h-4" />;
    }
    if (url.match(/\.pdf$/i)) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1];
    } catch {
      return '未知文件';
    }
  };

  const canUploadMore = value.length < maxFiles;

  return (
    <div className={cn('space-y-3', className)}>
      {/* 上传区域 */}
      {canUploadMore && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-xl p-6 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted hover:border-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            拖拽文件到这里，或{' '}
            <span className="text-primary font-medium">点击上传</span>
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            支持图片、PDF、Word、文本文件，单个不超过 10MB
          </p>
        </div>
      )}

      {/* 上传中的文件 */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((file) => (
            <div
              key={file.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                file.error ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/30'
              )}
            >
              {file.error ? (
                <File className="w-4 h-4 text-destructive" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{file.name}</p>
                {file.error ? (
                  <p className="text-xs text-destructive">{file.error}</p>
                ) : (
                  <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeUploadingFile(file.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 已上传的文件 */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((url) => (
            <div
              key={url}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
            >
              {getFileIcon(url)}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm truncate hover:underline"
              >
                {getFileName(url)}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeFile(url)}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 文件数量限制提示 */}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          已上传 {value.length}/{maxFiles} 个文件
        </p>
      )}
    </div>
  );
}
