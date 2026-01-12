'use client';

/**
 * 内容表单组件
 *
 * 支持三种内容类型的创建和编辑
 * - 作品（WORK）：必须关联色彩或色彩簿
 * - 教程（TUTORIAL）：正文必填
 * - 文章（ARTICLE）：正文必填
 */

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { ContentTypeLabels } from '@/lib/validations/content';
import { labToRgb } from '@/lib/color';

type ContentType = 'WORK' | 'TUTORIAL' | 'ARTICLE';

interface ContentFormProps {
    type: ContentType;
    initialData?: {
        id: string;
        title: string;
        summary?: string | null;
        body?: string | null;
        coverImageUrl: string;
        galleryImages?: string[];
        externalUrl?: string | null;
        categoryId?: string | null;
        tags?: string[];
        colorIds?: string[];
        colorBookId?: string | null;
    };
    onSuccess?: (data: { id: string }) => void;
}

// 简化的表单 schema
const formSchema = z.object({
    title: z.string().min(1, '标题不能为空').max(200, '标题不能超过 200 字'),
    summary: z.string().max(500, '摘要不能超过 500 字').optional(),
    body: z.string().optional(),
    coverImageUrl: z.string().min(1, '请上传封面图'),
    galleryImages: z.array(z.string()).optional(),
    externalUrl: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
    categoryId: z.string().optional(),
    tags: z.array(z.string()).max(10, '标签不能超过 10 个').optional(),
    colorBookId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SelectedColor {
    id: string;
    colorId: string;
    name: string;
    labL: number;
    labA: number;
    labB: number;
}

export function ContentForm({ type, initialData, onSuccess }: ContentFormProps) {
    const [selectedColors, setSelectedColors] = useState<SelectedColor[]>([]);
    const [colorSearchOpen, setColorSearchOpen] = useState(false);
    const [colorSearchQuery, setColorSearchQuery] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 获取分类列表
    const { data: categories } = trpc.contentCategory.list.useQuery({
        contentType: type,
    });

    // 获取色彩簿列表
    const { data: colorBooks } = trpc.colorBook.list.useQuery({
        limit: 100,
    });

    // 搜索色彩
    const { data: searchedColors, isLoading: isSearching } = trpc.color.search.useQuery(
        { q: colorSearchQuery, limit: 10 },
        { enabled: colorSearchQuery.length >= 1 }
    );

    // 创建/更新 mutation
    const createMutation = trpc.content.create.useMutation();
    const updateMutation = trpc.content.update.useMutation();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialData?.title || '',
            summary: initialData?.summary || '',
            body: initialData?.body || '',
            coverImageUrl: initialData?.coverImageUrl || '',
            galleryImages: initialData?.galleryImages || [],
            externalUrl: initialData?.externalUrl || '',
            categoryId: initialData?.categoryId || undefined,
            tags: initialData?.tags || [],
            colorBookId: initialData?.colorBookId || undefined,
        },
    });

    // 添加色彩
    const addColor = useCallback((color: SelectedColor) => {
        if (selectedColors.find(c => c.id === color.id)) {
            toast.error('该色彩已添加');
            return;
        }
        setSelectedColors(prev => [...prev, color]);
        setColorSearchOpen(false);
        setColorSearchQuery('');
    }, [selectedColors]);

    // 移除色彩
    const removeColor = useCallback((colorId: string) => {
        setSelectedColors(prev => prev.filter(c => c.id !== colorId));
    }, []);

    // 添加标签
    const addTag = useCallback(() => {
        const tag = tagInput.trim();
        if (!tag) return;

        const currentTags = form.getValues('tags') || [];
        if (currentTags.includes(tag)) {
            toast.error('该标签已存在');
            return;
        }
        if (currentTags.length >= 10) {
            toast.error('最多添加 10 个标签');
            return;
        }

        form.setValue('tags', [...currentTags, tag]);
        setTagInput('');
    }, [tagInput, form]);

    // 移除标签
    const removeTag = useCallback((tag: string) => {
        const currentTags = form.getValues('tags') || [];
        form.setValue('tags', currentTags.filter(t => t !== tag));
    }, [form]);

    // 提交表单
    const onSubmit = async (values: FormValues, action: 'draft' | 'submit') => {
        setIsSubmitting(true);

        try {
            // 作品类型验证
            if (type === 'WORK') {
                const hasColors = selectedColors.length > 0;
                const hasColorBook = !!values.colorBookId;
                if (!hasColors && !hasColorBook) {
                    toast.error('作品必须关联至少一个色彩或色彩簿');
                    setIsSubmitting(false);
                    return;
                }
            }

            // 教程和文章类型验证
            if ((type === 'TUTORIAL' || type === 'ARTICLE') && (!values.body || values.body.trim().length === 0)) {
                toast.error(`${ContentTypeLabels[type]}必须有正文内容`);
                setIsSubmitting(false);
                return;
            }

            const submitData = {
                contentType: type,
                title: values.title,
                summary: values.summary || undefined,
                body: values.body || '',
                coverImageUrl: values.coverImageUrl,
                galleryImages: values.galleryImages,
                externalUrl: values.externalUrl || undefined,
                categoryId: values.categoryId || undefined,
                tags: values.tags,
                colorIds: selectedColors.map(c => c.id),
                colorBookId: values.colorBookId || undefined,
            };

            let result;
            if (initialData?.id) {
                result = await updateMutation.mutateAsync({
                    id: initialData.id,
                    ...submitData,
                });
            } else {
                result = await createMutation.mutateAsync(submitData);
            }

            toast.success(action === 'draft' ? '草稿已保存' : '内容已保存');
            onSuccess?.({ id: result.id });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '操作失败';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 根据类型获取字段配置
    const fieldConfig = {
        WORK: {
            bodyRequired: false,
            bodyLabel: '作品描述',
            showGallery: true,
            colorRequired: true,
        },
        TUTORIAL: {
            bodyRequired: true,
            bodyLabel: '教程内容',
            showGallery: true,
            colorRequired: false,
        },
        ARTICLE: {
            bodyRequired: true,
            bodyLabel: '文章内容',
            showGallery: false,
            colorRequired: false,
        },
    }[type];

    const currentTags = form.watch('tags') || [];

    return (
        <Form {...form}>
            <form className="space-y-6">
                {/* 基本信息 */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>标题 *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入标题..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>摘要</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="简短描述内容..."
                                            className="resize-none"
                                            rows={2}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>最多 500 字</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="coverImageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>封面图 *</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <Input placeholder="输入图片 URL..." {...field} />
                                            {field.value && (
                                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                                    <img
                                                        src={field.value}
                                                        alt="封面预览"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* 正文 */}
                <Card>
                    <CardContent className="pt-6">
                        <FormField
                            control={form.control}
                            name="body"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{fieldConfig.bodyLabel} {fieldConfig.bodyRequired && '*'}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="输入内容... 支持 Markdown 格式"
                                            className="min-h-[200px] resize-y"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>支持 Markdown 格式</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* 分类和标签 */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>分类</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择分类..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories?.items.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {'　'.repeat(cat.level)}{cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormItem>
                            <FormLabel>标签</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="输入标签后回车添加..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={addTag}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {currentTags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="gap-1">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <FormDescription>最多 10 个标签</FormDescription>
                        </FormItem>
                    </CardContent>
                </Card>

                {/* 色彩关联 */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <FormLabel>
                                关联色彩 {fieldConfig.colorRequired && '*'}
                            </FormLabel>
                            <FormDescription className="mt-1">
                                {type === 'WORK'
                                    ? '作品必须关联至少一个色彩或选择一个色彩簿'
                                    : '可选择关联相关的色彩'}
                            </FormDescription>
                        </div>

                        {/* 已选择的色彩 */}
                        <div className="flex flex-wrap gap-2">
                            {selectedColors.map((color) => {
                                const rgb = labToRgb(color.labL, color.labA, color.labB);
                                return (
                                    <Badge
                                        key={color.id}
                                        variant="outline"
                                        className="gap-2 pr-1 py-1"
                                    >
                                        <span
                                            className="w-4 h-4 rounded-full border"
                                            style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
                                        />
                                        <span>{color.colorId}</span>
                                        <span className="text-muted-foreground">{color.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeColor(color.id)}
                                            className="ml-1 p-0.5 hover:bg-destructive/10 rounded"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                );
                            })}
                        </div>

                        {/* 搜索色彩按钮 */}
                        <Dialog open={colorSearchOpen} onOpenChange={setColorSearchOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline" className="gap-2">
                                    <Search className="h-4 w-4" />
                                    搜索色彩
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>搜索色彩</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <Input
                                        placeholder="输入色彩编号或名称..."
                                        value={colorSearchQuery}
                                        onChange={(e) => setColorSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="max-h-60 overflow-y-auto space-y-1">
                                        {isSearching && (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                        {searchedColors?.map((color) => {
                                            const rgb = labToRgb(color.labL, color.labA, color.labB);
                                            const isSelected = selectedColors.some(c => c.id === color.id);
                                            return (
                                                <button
                                                    key={color.id}
                                                    type="button"
                                                    disabled={isSelected}
                                                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                                    onClick={() => addColor({
                                                        id: color.id,
                                                        colorId: color.colorId,
                                                        name: color.name,
                                                        labL: color.labL,
                                                        labA: color.labA,
                                                        labB: color.labB,
                                                    })}
                                                >
                                                    <span
                                                        className="w-6 h-6 rounded-full border flex-shrink-0"
                                                        style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
                                                    />
                                                    <span className="font-mono text-sm">{color.colorId}</span>
                                                    <span className="text-muted-foreground text-sm truncate">{color.name}</span>
                                                    {isSelected && <Badge variant="secondary">已添加</Badge>}
                                                </button>
                                            );
                                        })}
                                        {colorSearchQuery && !isSearching && searchedColors?.length === 0 && (
                                            <p className="text-center text-muted-foreground py-4">未找到匹配的色彩</p>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* 色彩簿选择 */}
                        <FormField
                            control={form.control}
                            name="colorBookId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        关联色彩簿 {type === 'WORK' && selectedColors.length === 0 && '*'}
                                    </FormLabel>
                                    <Select onValueChange={(v) => field.onChange(v === 'none' ? '' : v)} value={field.value || 'none'}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择色彩簿..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">不关联色彩簿</SelectItem>
                                            {colorBooks?.items.map((book) => (
                                                <SelectItem key={book.id} value={book.id}>
                                                    {book.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        {type === 'WORK'
                                            ? '若未关联色彩，必须选择一个色彩簿'
                                            : '可选择关联相关的色彩簿'}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* 外部链接 */}
                <Card>
                    <CardContent className="pt-6">
                        <FormField
                            control={form.control}
                            name="externalUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>外部链接</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <FormDescription>可添加相关的外部链接</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* 操作按钮 */}
                <div className="flex gap-3 justify-end pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => form.handleSubmit((values) => onSubmit(values, 'draft'))()}
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        保存草稿
                    </Button>
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => form.handleSubmit((values) => onSubmit(values, 'submit'))()}
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {initialData?.id ? '保存' : '创建'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
