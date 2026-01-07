'use client';

/**
 * CSV 文件上传组件
 * 
 * 功能：
 * - 文件拖拽上传
 * - CSV 解析
 * - 数据回调
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    onDataParsed: (data: Record<string, unknown>[]) => void;
    disabled?: boolean;
}

export function CsvUploader({ onDataParsed, disabled }: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 解析 CSV 内容
    const parseCsv = useCallback((content: string): Record<string, unknown>[] => {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV 文件至少需要包含头部行和一行数据');
        }

        // 解析头部
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        // 解析数据行
        const records: Record<string, unknown>[] = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // 简单 CSV 解析（不处理复杂的引号内逗号情况）
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));

            const record: Record<string, unknown> = {};
            headers.forEach((header, index) => {
                record[header] = values[index] || '';
            });
            records.push(record);
        }

        return records;
    }, []);

    // 处理文件
    const handleFile = useCallback((file: File) => {
        setError(null);

        if (!file.name.endsWith('.csv')) {
            setError('请上传 CSV 格式的文件');
            return;
        }

        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = parseCsv(content);
                if (data.length === 0) {
                    setError('CSV 文件中没有有效数据');
                    return;
                }
                onDataParsed(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : '解析 CSV 失败');
            }
        };
        reader.onerror = () => {
            setError('读取文件失败');
        };
        reader.readAsText(file);
    }, [parseCsv, onDataParsed]);

    // 拖拽事件
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, [disabled, handleFile]);

    // 点击选择文件
    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    // 清除选择
    const handleClear = () => {
        setFileName(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled}
                />

                <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-muted">
                        {fileName ? (
                            <FileSpreadsheet className="h-8 w-8 text-green-600" />
                        ) : (
                            <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>

                    {fileName ? (
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{fileName}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <p className="text-muted-foreground">
                                拖拽文件到此处，或 <span className="text-primary font-medium">点击选择</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                支持 .csv 格式
                            </p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}

