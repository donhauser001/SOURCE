'use client';

/**
 * JSON 文件上传组件
 * 
 * 功能：
 * - 文件拖拽上传
 * - JSON 解析和校验
 * - 数据回调
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, FileJson, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    onDataParsed: (data: unknown[]) => void;
    disabled?: boolean;
}

export function JsonUploader({ onDataParsed, disabled }: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 处理文件
    const handleFile = useCallback((file: File) => {
        setError(null);
        
        if (!file.name.endsWith('.json')) {
            setError('请上传 JSON 格式的文件');
            return;
        }

        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                
                // 确保是数组
                if (!Array.isArray(data)) {
                    setError('JSON 文件必须包含一个数组');
                    return;
                }
                
                if (data.length === 0) {
                    setError('JSON 数组不能为空');
                    return;
                }

                onDataParsed(data);
            } catch (err) {
                if (err instanceof SyntaxError) {
                    setError('JSON 格式无效');
                } else {
                    setError(err instanceof Error ? err.message : '解析 JSON 失败');
                }
            }
        };
        reader.onerror = () => {
            setError('读取文件失败');
        };
        reader.readAsText(file);
    }, [onDataParsed]);

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
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled}
                />
                
                <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-muted">
                        {fileName ? (
                            <FileJson className="h-8 w-8 text-blue-600" />
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
                                支持 .json 格式（数组）
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

            {/* JSON 格式说明 */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">JSON 格式要求：</p>
                <pre className="bg-background p-2 rounded text-[10px] overflow-x-auto">
{`[
  {
    "colorId": "CN-Song-04",
    "name": "烟雨青",
    "labL": 65.2,
    "labA": -8.5,
    "labB": 12.3
  },
  ...
]`}
                </pre>
            </div>
        </div>
    );
}

