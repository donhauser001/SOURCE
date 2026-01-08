'use client';

/**
 * 审计注记管理页面
 * 
 * v0.5.1 - Admin 阶段
 */

import { useState } from 'react';
import { 
    Plus, Search, Filter, CheckCircle, XCircle, 
    AlertTriangle, MoreHorizontal, Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';

// 标签映射（与 Prisma schema 匹配）
const TARGET_TYPE_LABELS: Record<string, string> = {
    COLOR: '色彩',
    PAPER_PROFILE: '纸张表现',
    BATCH: '批次',
    INK_RECIPE: '油墨配方',
};

const VERDICT_LABELS: Record<string, string> = {
    APPROVED: '通过',
    FLAGGED: '存疑',
    REJECTED: '驳回',
};

const VISIBILITY_LABELS: Record<string, string> = {
    PUBLIC: '公开',
    PAID: '付费可见',
    INTERNAL: '内部',
};

const ADVISOR_TYPE_LABELS: Record<string, string> = {
    INDIVIDUAL: '个人顾问',
    INSTITUTION: '机构',
};

type TargetType = 'COLOR' | 'PAPER_PROFILE' | 'BATCH' | 'INK_RECIPE';
type Verdict = 'APPROVED' | 'FLAGGED' | 'REJECTED';
type AdvisorType = 'INDIVIDUAL' | 'INSTITUTION';
type VisibilityType = 'PUBLIC' | 'PAID' | 'INTERNAL';

export default function AuditNotesPage() {
    const [search, setSearch] = useState('');
    const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
    const [verdictFilter, setVerdictFilter] = useState<string>('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // 查询
    const { data, isLoading, refetch } = trpc.auditNote.list.useQuery({
        targetType: targetTypeFilter !== 'all' ? targetTypeFilter as TargetType : undefined,
        verdict: verdictFilter !== 'all' ? verdictFilter as Verdict : undefined,
        limit: 100,
    });

    const { data: stats } = trpc.auditNote.stats.useQuery();

    // 删除
    const deleteMutation = trpc.auditNote.delete.useMutation({
        onSuccess: () => refetch(),
    });

    // 创建
    const createMutation = trpc.auditNote.create.useMutation({
        onSuccess: () => {
            setIsCreateOpen(false);
            refetch();
        },
    });

    // 表单状态
    const [formData, setFormData] = useState({
        targetType: 'COLOR' as TargetType,
        targetId: '',
        advisorType: 'INDIVIDUAL' as AdvisorType,
        advisorId: '',
        advisorName: '',
        note: '',
        verdict: 'APPROVED' as Verdict,
        visibility: 'PUBLIC' as VisibilityType,
    });

    const handleCreate = () => {
        createMutation.mutate(formData);
    };

    // verdict badge 样式
    const getVerdictVariant = (verdict: string) => {
        switch (verdict) {
            case 'APPROVED': return 'default';
            case 'FLAGGED': return 'secondary';
            case 'REJECTED': return 'destructive';
            default: return 'outline';
        }
    };

    const getVerdictIcon = (verdict: string) => {
        switch (verdict) {
            case 'APPROVED': return <CheckCircle className="h-3 w-3" />;
            case 'FLAGGED': return <AlertTriangle className="h-3 w-3" />;
            case 'REJECTED': return <XCircle className="h-3 w-3" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">审计注记</h1>
                    <p className="text-muted-foreground">管理顾问团的审计注记</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            添加注记
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>添加审计注记</DialogTitle>
                            <DialogDescription>
                                为色彩、纸张表现或配方添加审计注记
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>目标类型</Label>
                                    <Select
                                        value={formData.targetType}
                                        onValueChange={(v) => setFormData({ ...formData, targetType: v as TargetType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="COLOR">色彩</SelectItem>
                                            <SelectItem value="PAPER_PROFILE">纸张表现</SelectItem>
                                            <SelectItem value="BATCH">批次</SelectItem>
                                            <SelectItem value="INK_RECIPE">油墨配方</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>目标 ID</Label>
                                    <Input
                                        placeholder="如: CN-Song-04"
                                        value={formData.targetId}
                                        onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>审计人类型</Label>
                                    <Select
                                        value={formData.advisorType}
                                        onValueChange={(v) => setFormData({ ...formData, advisorType: v as AdvisorType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INDIVIDUAL">个人顾问</SelectItem>
                                            <SelectItem value="INSTITUTION">机构</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>审计人名称</Label>
                                    <Input
                                        placeholder="审计人名称"
                                        value={formData.advisorName}
                                        onChange={(e) => setFormData({ ...formData, advisorName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>审计人 ID</Label>
                                <Input
                                    placeholder="审计人 ID"
                                    value={formData.advisorId}
                                    onChange={(e) => setFormData({ ...formData, advisorId: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>结论</Label>
                                    <Select
                                        value={formData.verdict}
                                        onValueChange={(v) => setFormData({ ...formData, verdict: v as Verdict })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="APPROVED">通过</SelectItem>
                                            <SelectItem value="FLAGGED">存疑</SelectItem>
                                            <SelectItem value="REJECTED">驳回</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>可见性</Label>
                                    <Select
                                        value={formData.visibility}
                                        onValueChange={(v) => setFormData({ ...formData, visibility: v as VisibilityType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PUBLIC">公开</SelectItem>
                                            <SelectItem value="PAID">付费可见</SelectItem>
                                            <SelectItem value="INTERNAL">内部</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>注记内容</Label>
                                <Textarea
                                    placeholder="输入审计注记内容..."
                                    rows={4}
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                取消
                            </Button>
                            <Button 
                                onClick={handleCreate}
                                disabled={createMutation.isPending || !formData.targetId || !formData.note}
                            >
                                创建
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* 统计卡片 */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                总计
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                通过
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {stats.byVerdict.approved}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" />
                                存疑
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {stats.byVerdict.flagged}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                                <XCircle className="h-4 w-4" />
                                驳回
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats.byVerdict.rejected}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 筛选 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                            <SelectTrigger className="w-36">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="目标类型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部类型</SelectItem>
                                <SelectItem value="COLOR">色彩</SelectItem>
                                <SelectItem value="PAPER_PROFILE">纸张表现</SelectItem>
                                <SelectItem value="BATCH">批次</SelectItem>
                                <SelectItem value="INK_RECIPE">油墨配方</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={verdictFilter} onValueChange={setVerdictFilter}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="结论" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部结论</SelectItem>
                                <SelectItem value="APPROVED">通过</SelectItem>
                                <SelectItem value="FLAGGED">存疑</SelectItem>
                                <SelectItem value="REJECTED">驳回</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>注记列表</CardTitle>
                    <CardDescription>
                        {isLoading ? '加载中...' : `共 ${data?.items.length || 0} 条记录`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data?.items.map((note) => (
                            <div
                                key={note.id}
                                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline">
                                                {TARGET_TYPE_LABELS[note.targetType] || note.targetType}
                                            </Badge>
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                {note.targetId}
                                            </code>
                                            <Badge variant={getVerdictVariant(note.verdict)} className="gap-1">
                                                {getVerdictIcon(note.verdict)}
                                                {VERDICT_LABELS[note.verdict] || note.verdict}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {VISIBILITY_LABELS[note.visibility] || note.visibility}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {note.note}
                                        </p>
                                        <div className="text-xs text-muted-foreground">
                                            <span>{ADVISOR_TYPE_LABELS[note.advisorType]} - {note.advisorName}</span>
                                            <span className="mx-2">|</span>
                                            <span>{new Date(note.createdAt).toLocaleString('zh-CN')}</span>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => {
                                                    if (confirm('确定要删除此注记吗？')) {
                                                        deleteMutation.mutate({ id: note.id });
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                删除
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                        {(!data?.items || data.items.length === 0) && !isLoading && (
                            <div className="py-8 text-center text-muted-foreground">
                                暂无审计注记
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
