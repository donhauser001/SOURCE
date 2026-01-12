'use client';

/**
 * 系统设置管理页面
 * 
 * v0.6.0 - Phase 4: 系统设置模块
 */

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Globe, Mail, Shield, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';

// 配置键常量
const CONFIG_KEYS = {
    SITE_NAME: 'site.name',
    SITE_LOGO_URL: 'site.logoUrl',
    CONTACT_EMAIL: 'site.contactEmail',
    MAINTENANCE_MODE: 'site.maintenanceMode',
    API_RATE_LIMIT_PER_MINUTE: 'rateLimit.defaultPerMinute',
    API_RATE_LIMIT_PER_DAY: 'rateLimit.defaultPerDay',
    IMPORT_MAX_FILE_SIZE_MB: 'storage.importMaxFileSizeMB',
    EXPORT_MAX_RECORDS: 'storage.exportMaxRecords',
};

// 配置分类
const CONFIG_CATEGORIES = {
    GENERAL: 'general',
    RATE_LIMIT: 'rate-limit',
    STORAGE: 'storage',
};

export default function SettingsPage() {
    // 表单状态
    const [siteName, setSiteName] = useState('');
    const [siteLogoUrl, setSiteLogoUrl] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [rateLimitPerMinute, setRateLimitPerMinute] = useState('60');
    const [rateLimitPerDay, setRateLimitPerDay] = useState('10000');
    const [importMaxFileSizeMB, setImportMaxFileSizeMB] = useState('5');
    const [exportMaxRecords, setExportMaxRecords] = useState('10000');
    
    const [hasChanges, setHasChanges] = useState(false);

    // 获取所有配置
    const { data: configs, isLoading, refetch } = trpc.systemConfig.list.useQuery();

    // 保存配置
    const saveMutation = trpc.systemConfig.setMany.useMutation({
        onSuccess: () => {
            setHasChanges(false);
            refetch();
        },
    });

    // 初始化表单
    useEffect(() => {
        if (configs) {
            const configMap = new Map(configs.map(c => [c.key, c.value]));
            
            setSiteName((configMap.get(CONFIG_KEYS.SITE_NAME) as string) || 'SOURCE');
            setSiteLogoUrl((configMap.get(CONFIG_KEYS.SITE_LOGO_URL) as string) || '');
            setContactEmail((configMap.get(CONFIG_KEYS.CONTACT_EMAIL) as string) || '');
            setMaintenanceMode(Boolean(configMap.get(CONFIG_KEYS.MAINTENANCE_MODE)));
            setRateLimitPerMinute(String(configMap.get(CONFIG_KEYS.API_RATE_LIMIT_PER_MINUTE) || 60));
            setRateLimitPerDay(String(configMap.get(CONFIG_KEYS.API_RATE_LIMIT_PER_DAY) || 10000));
            setImportMaxFileSizeMB(String(configMap.get(CONFIG_KEYS.IMPORT_MAX_FILE_SIZE_MB) || 5));
            setExportMaxRecords(String(configMap.get(CONFIG_KEYS.EXPORT_MAX_RECORDS) || 10000));
        }
    }, [configs]);

    // 保存所有配置
    const handleSave = () => {
        saveMutation.mutate({
            configs: [
                { key: CONFIG_KEYS.SITE_NAME, value: siteName, category: CONFIG_CATEGORIES.GENERAL },
                { key: CONFIG_KEYS.SITE_LOGO_URL, value: siteLogoUrl, category: CONFIG_CATEGORIES.GENERAL },
                { key: CONFIG_KEYS.CONTACT_EMAIL, value: contactEmail, category: CONFIG_CATEGORIES.GENERAL },
                { key: CONFIG_KEYS.MAINTENANCE_MODE, value: maintenanceMode, category: CONFIG_CATEGORIES.GENERAL },
                { key: CONFIG_KEYS.API_RATE_LIMIT_PER_MINUTE, value: parseInt(rateLimitPerMinute) || 60, category: CONFIG_CATEGORIES.RATE_LIMIT },
                { key: CONFIG_KEYS.API_RATE_LIMIT_PER_DAY, value: parseInt(rateLimitPerDay) || 10000, category: CONFIG_CATEGORIES.RATE_LIMIT },
                { key: CONFIG_KEYS.IMPORT_MAX_FILE_SIZE_MB, value: parseInt(importMaxFileSizeMB) || 5, category: CONFIG_CATEGORIES.STORAGE },
                { key: CONFIG_KEYS.EXPORT_MAX_RECORDS, value: parseInt(exportMaxRecords) || 10000, category: CONFIG_CATEGORIES.STORAGE },
            ],
        });
    };

    // 监听变化
    const handleChange = () => {
        setHasChanges(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 页头 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        系统设置
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        管理系统级配置参数
                    </p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={!hasChanges || saveMutation.isPending}
                >
                    {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    保存更改
                </Button>
            </div>

            {/* 配置选项卡 */}
            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general" className="gap-2">
                        <Globe className="h-4 w-4" />
                        通用设置
                    </TabsTrigger>
                    <TabsTrigger value="rate-limit" className="gap-2">
                        <Shield className="h-4 w-4" />
                        API 限流
                    </TabsTrigger>
                    <TabsTrigger value="storage" className="gap-2">
                        <Database className="h-4 w-4" />
                        存储配置
                    </TabsTrigger>
                </TabsList>

                {/* 通用设置 */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>通用设置</CardTitle>
                            <CardDescription>
                                站点基本信息和全局配置
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="siteName">站点名称</Label>
                                    <Input
                                        id="siteName"
                                        value={siteName}
                                        onChange={(e) => {
                                            setSiteName(e.target.value);
                                            handleChange();
                                        }}
                                        placeholder="SOURCE"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="siteLogoUrl">Logo URL</Label>
                                    <Input
                                        id="siteLogoUrl"
                                        value={siteLogoUrl}
                                        onChange={(e) => {
                                            setSiteLogoUrl(e.target.value);
                                            handleChange();
                                        }}
                                        placeholder="https://example.com/logo.png"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">联系邮箱</Label>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="contactEmail"
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => {
                                            setContactEmail(e.target.value);
                                            handleChange();
                                        }}
                                        placeholder="contact@example.com"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="maintenanceMode">维护模式</Label>
                                    <p className="text-sm text-muted-foreground">
                                        开启后，非管理员用户将无法访问系统
                                    </p>
                                </div>
                                <Switch
                                    id="maintenanceMode"
                                    checked={maintenanceMode}
                                    onCheckedChange={(checked) => {
                                        setMaintenanceMode(checked);
                                        handleChange();
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API 限流 */}
                <TabsContent value="rate-limit">
                    <Card>
                        <CardHeader>
                            <CardTitle>API 限流配置</CardTitle>
                            <CardDescription>
                                控制 API 请求频率限制
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="rateLimitPerMinute">每分钟请求限制</Label>
                                    <Input
                                        id="rateLimitPerMinute"
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={rateLimitPerMinute}
                                        onChange={(e) => {
                                            setRateLimitPerMinute(e.target.value);
                                            handleChange();
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        单个 API 密钥每分钟最多可发起的请求数
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rateLimitPerDay">每日请求限制</Label>
                                    <Input
                                        id="rateLimitPerDay"
                                        type="number"
                                        min="100"
                                        max="1000000"
                                        value={rateLimitPerDay}
                                        onChange={(e) => {
                                            setRateLimitPerDay(e.target.value);
                                            handleChange();
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        单个 API 密钥每日最多可发起的请求数
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 存储配置 */}
                <TabsContent value="storage">
                    <Card>
                        <CardHeader>
                            <CardTitle>存储配置</CardTitle>
                            <CardDescription>
                                文件上传和数据导出限制
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="importMaxFileSizeMB">导入文件大小限制 (MB)</Label>
                                    <Input
                                        id="importMaxFileSizeMB"
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={importMaxFileSizeMB}
                                        onChange={(e) => {
                                            setImportMaxFileSizeMB(e.target.value);
                                            handleChange();
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        CSV/JSON 导入文件的最大大小
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="exportMaxRecords">导出记录数限制</Label>
                                    <Input
                                        id="exportMaxRecords"
                                        type="number"
                                        min="100"
                                        max="100000"
                                        value={exportMaxRecords}
                                        onChange={(e) => {
                                            setExportMaxRecords(e.target.value);
                                            handleChange();
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        单次导出的最大记录数
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
