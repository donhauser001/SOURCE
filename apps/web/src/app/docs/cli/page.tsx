/**
 * CLI 文档
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'CLI 命令参考 | 文档 | SOURCE',
    description: 'SOURCE CLI 完整命令列表，支持 AI/脚本调用。',
};

export default function CliDocPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <article className="container mx-auto px-4 py-12 max-w-3xl prose prose-slate dark:prose-invert">
                <Link href="/docs">
                    <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
                        <ArrowLeft className="h-4 w-4" />
                        返回文档
                    </Button>
                </Link>

                <h1>CLI 命令参考</h1>

                <p className="lead">
                    SOURCE CLI 是系统接口，设计为 AI/脚本可调用。每个命令都有结构化的 JSON 输出。
                </p>

                <h2>安装与配置</h2>

                <h3>配置 API Key</h3>
                <pre><code>{`# 设置服务器地址
source config set-server https://source.ink

# 设置 API Key
source config set-key sk_xxx_your_api_key

# 验证连接
source config test`}</code></pre>

                <h2>命令列表</h2>

                <h3>color get</h3>
                <p>获取单个颜色的完整身份证数据。</p>
                <pre><code>{`source color get --id CN-Song-04 --json`}</code></pre>
                <p><strong>参数：</strong></p>
                <ul>
                    <li><code>--id</code>: 颜色编号（必填）</li>
                    <li><code>--json</code>: JSON 格式输出</li>
                </ul>

                <h3>color list</h3>
                <p>列出所有颜色。</p>
                <pre><code>{`source color list --limit 20 --json`}</code></pre>
                <p><strong>参数：</strong></p>
                <ul>
                    <li><code>--limit</code>: 返回数量限制</li>
                    <li><code>--status</code>: 筛选状态（VERIFIED/DRAFT）</li>
                </ul>

                <h3>color paper</h3>
                <p>获取颜色在指定纸张上的表现数据。</p>
                <pre><code>{`source color paper --id CN-Song-04 --paper PREMIUM_MATTE --json`}</code></pre>
                <p><strong>参数：</strong></p>
                <ul>
                    <li><code>--id</code>: 颜色编号（必填）</li>
                    <li><code>--paper</code>: 纸张类型（必填）</li>
                </ul>

                <h3>color recommend</h3>
                <p>获取颜色的纸张推荐。</p>
                <pre><code>{`source color recommend --id CN-Song-04 --goal fidelity --json`}</code></pre>
                <p><strong>参数：</strong></p>
                <ul>
                    <li><code>--id</code>: 颜色编号（必填）</li>
                    <li><code>--goal</code>: 优化目标（fidelity/cost/texture）</li>
                </ul>

                <h3>search</h3>
                <p>搜索颜色。</p>
                <pre><code>{`source search --q "烟雨" --json`}</code></pre>

                <h3>config</h3>
                <p>管理 CLI 配置。</p>
                <pre><code>{`# 显示当前配置
source config show

# 设置 API Key
source config set-key sk_xxx

# 设置服务器地址
source config set-server https://source.ink

# 清除配置
source config clear

# 测试连接
source config test

# 查看可用工具
source config tools`}</code></pre>

                <h2>全局选项</h2>
                <ul>
                    <li><code>--json</code>: 输出 JSON 格式（推荐 AI/脚本使用）</li>
                    <li><code>--no-color</code>: 禁用彩色输出</li>
                    <li><code>--version</code>: 显示版本号</li>
                    <li><code>--help</code>: 显示帮助信息</li>
                </ul>

                <h2>错误码</h2>
                <table>
                    <thead>
                        <tr>
                            <th>代码</th>
                            <th>说明</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>ERR_UNAUTHORIZED</code></td>
                            <td>API Key 无效或未配置</td>
                        </tr>
                        <tr>
                            <td><code>ERR_FORBIDDEN</code></td>
                            <td>权限不足</td>
                        </tr>
                        <tr>
                            <td><code>ERR_NOT_FOUND</code></td>
                            <td>资源不存在</td>
                        </tr>
                        <tr>
                            <td><code>ERR_RATE_LIMIT</code></td>
                            <td>请求频率超限</td>
                        </tr>
                        <tr>
                            <td><code>ERR_VALIDATION</code></td>
                            <td>参数验证失败</td>
                        </tr>
                    </tbody>
                </table>

                <h2>审计日志</h2>
                <p>
                    每次 CLI 调用都会在服务端记录审计日志，包含：
                </p>
                <ul>
                    <li>调用时间</li>
                    <li>API Key ID</li>
                    <li>命令及参数（脱敏）</li>
                    <li>执行结果</li>
                    <li>引用的颜色/批次 ID</li>
                </ul>
            </article>
        </main>
    );
}

