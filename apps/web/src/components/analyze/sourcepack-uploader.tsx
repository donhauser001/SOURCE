'use client';

/**
 * SourcePack 上传组件
 *
 * 支持：
 * - 文件拖放上传
 * - 点击选择文件
 * - JSON 格式验证预览
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, FileJson, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SourcePackUploaderProps {
    onUpload: (content: string, fileName: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
    buttonText?: string;
}

export function SourcePackUploader({ onUpload, isLoading, disabled, buttonText = '开始解析' }: SourcePackUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateAndRead = useCallback(
        (file: File) => {
            setError(null);
            setSelectedFile(null);

            // 文件类型检查
            if (!file.name.endsWith('.json') && !file.name.endsWith('.sourcepack.json')) {
                setError('请上传 .json 或 .sourcepack.json 格式的文件');
                return;
            }

            // 文件大小检查（最大 5MB）
            if (file.size > 5 * 1024 * 1024) {
                setError('文件大小不能超过 5MB');
                return;
            }

            // 读取文件内容
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;

                // 尝试解析 JSON
                try {
                    JSON.parse(content);
                    setSelectedFile({ name: file.name, size: file.size });
                    onUpload(content, file.name);
                } catch {
                    setError('JSON 格式无效，请检查文件内容');
                }
            };
            reader.onerror = () => {
                setError('文件读取失败，请重试');
            };
            reader.readAsText(file);
        },
        [onUpload]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (disabled || isLoading) return;

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                validateAndRead(files[0]);
            }
        },
        [disabled, isLoading, validateAndRead]
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                validateAndRead(files[0]);
            }
            // 重置 input 以便可以重新选择相同文件
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        [validateAndRead]
    );

    const handleClick = () => {
        if (!disabled && !isLoading) {
            fileInputRef.current?.click();
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setError(null);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                {/* 已选择文件时的显示 */}
                {selectedFile && !error && (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-emerald-900 dark:text-emerald-100">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                        {formatFileSize(selectedFile.size)} · JSON 格式有效
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearFile}
                                disabled={isLoading}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* 错误提示 */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* 上传区域 */}
                <div
                    className={cn(
                        'p-8 transition-colors cursor-pointer',
                        isDragging
                            ? 'bg-primary/5 border-2 border-dashed border-primary'
                            : 'border-2 border-dashed border-transparent hover:border-muted-foreground/20 hover:bg-muted/30',
                        (disabled || isLoading) && 'opacity-50 cursor-not-allowed'
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleClick}
                >
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div
                            className={cn(
                                'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                                isDragging ? 'bg-primary/10' : 'bg-muted'
                            )}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : isDragging ? (
                                <Upload className="w-8 h-8 text-primary" />
                            ) : (
                                <FileJson className="w-8 h-8 text-muted-foreground" />
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className="font-medium">
                                {isLoading ? '正在分析中...' : isDragging ? '释放以上传文件' : '拖放 SourcePack 文件到这里'}
                            </p>
                            <p className="text-sm text-muted-foreground">或点击选择文件（支持 .json / .sourcepack.json）</p>
                        </div>

                        {!isLoading && (
                            <Button variant="outline" size="sm" className="mt-2" disabled={disabled}>
                                {buttonText}
                            </Button>
                        )}
                    </div>
                </div>

                {/* 隐藏的文件输入 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.sourcepack.json"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled || isLoading}
                />
            </CardContent>
        </Card>
    );
}
