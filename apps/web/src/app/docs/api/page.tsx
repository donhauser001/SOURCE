/**
 * API 文档
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'API 参考 | 文档 | SOURCE',
    description: 'SOURCE REST API 端点、认证、速率限制、错误码说明。',
};

export default function ApiDocPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <article className="container mx-auto px-4 py-12 max-w-3xl prose prose-slate dark:prose-invert">
                <Link href="/docs">
                    <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
                        <ArrowLeft className="h-4 w-4" />
                        返回文档
                    </Button>
                </Link>

                <h1>API 参考</h1>

                <p className="lead">
                    SOURCE 提供 REST API 用于 CLI/插件/AI 访问色彩数据。
                </p>

                <h2>基础信息</h2>
                <ul>
                    <li><strong>Base URL</strong>: <code>https://source.ink/api/v1</code></li>
                    <li><strong>认证方式</strong>: Bearer Token (API Key)</li>
                    <li><strong>响应格式</strong>: JSON</li>
                </ul>

                <h2>认证</h2>
                <p>所有 API 请求都需要在 Header 中携带 API Key：</p>
                <pre><code>{`Authorization: Bearer sk_xxx_your_api_key`}</code></pre>

                <h3>获取 API Key</h3>
                <ol>
                    <li>登录 SOURCE 网站</li>
                    <li>进入「设置」页面</li>
                    <li>在「API 密钥」区域创建新密钥</li>
                </ol>

                <h2>端点</h2>

                <h3>GET /api/v1/tools</h3>
                <p>
                    获取工具注册表（公开，无需认证）。
                </p>
                <pre><code>{`curl https://source.ink/api/v1/tools`}</code></pre>

                <h3>GET /api/v1/colors</h3>
                <p>获取颜色列表。</p>
                <pre><code>{`curl -H "Authorization: Bearer sk_xxx" \\
  "https://source.ink/api/v1/colors?limit=10"`}</code></pre>
                <p><strong>查询参数：</strong></p>
                <ul>
                    <li><code>limit</code>: 返回数量（默认 20，最大 100）</li>
                    <li><code>cursor</code>: 分页游标</li>
                    <li><code>status</code>: 筛选状态</li>
                    <li><code>search</code>: 搜索关键词</li>
                </ul>

                <h3>GET /api/v1/colors/:colorId</h3>
                <p>获取单个颜色详情。</p>
                <pre><code>{`curl -H "Authorization: Bearer sk_xxx" \\
  "https://source.ink/api/v1/colors/CN-Song-04"`}</code></pre>

                <h2>响应格式</h2>

                <h3>成功响应</h3>
                <pre><code>{`{
  "ok": true,
  "data": { ... },
  "citations": [
    { "type": "color", "id": "CN-Song-04", "label": "烟雨青" },
    { "type": "batch", "id": "BATCH-2026-001" }
  ]
}`}</code></pre>

                <h3>错误响应</h3>
                <pre><code>{`{
  "ok": false,
  "error": {
    "code": "ERR_NOT_FOUND",
    "message": "颜色不存在: CN-XXX-99"
  }
}`}</code></pre>

                <h2>错误码</h2>
                <table>
                    <thead>
                        <tr>
                            <th>HTTP 状态</th>
                            <th>错误码</th>
                            <th>说明</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>400</td>
                            <td><code>ERR_VALIDATION</code></td>
                            <td>参数验证失败</td>
                        </tr>
                        <tr>
                            <td>401</td>
                            <td><code>ERR_UNAUTHORIZED</code></td>
                            <td>未认证或 API Key 无效</td>
                        </tr>
                        <tr>
                            <td>403</td>
                            <td><code>ERR_FORBIDDEN</code></td>
                            <td>权限不足</td>
                        </tr>
                        <tr>
                            <td>404</td>
                            <td><code>ERR_NOT_FOUND</code></td>
                            <td>资源不存在</td>
                        </tr>
                        <tr>
                            <td>429</td>
                            <td><code>ERR_RATE_LIMIT</code></td>
                            <td>请求频率超限</td>
                        </tr>
                        <tr>
                            <td>500</td>
                            <td><code>ERR_INTERNAL</code></td>
                            <td>服务器内部错误</td>
                        </tr>
                    </tbody>
                </table>

                <h2>速率限制</h2>
                <p>默认限制：</p>
                <ul>
                    <li><strong>每分钟</strong>: 60 次请求</li>
                    <li><strong>每天</strong>: 10,000 次请求</li>
                </ul>
                <p>超出限制时返回 <code>429 Too Many Requests</code>，响应头包含：</p>
                <ul>
                    <li><code>X-RateLimit-Limit</code>: 限制次数</li>
                    <li><code>X-RateLimit-Remaining</code>: 剩余次数</li>
                    <li><code>X-RateLimit-Reset</code>: 重置时间戳</li>
                </ul>

                <h2>权限范围 (Scopes)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Scope</th>
                            <th>说明</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>read:color</code></td>
                            <td>读取颜色数据</td>
                        </tr>
                        <tr>
                            <td><code>read:recipe</code></td>
                            <td>读取油墨配方</td>
                        </tr>
                        <tr>
                            <td><code>read:paper</code></td>
                            <td>读取纸张表现</td>
                        </tr>
                        <tr>
                            <td><code>search:color</code></td>
                            <td>搜索颜色</td>
                        </tr>
                        <tr>
                            <td><code>recommend:paper</code></td>
                            <td>获取纸张推荐</td>
                        </tr>
                        <tr>
                            <td><code>estimate:cost</code></td>
                            <td>成本估算</td>
                        </tr>
                    </tbody>
                </table>

                <div className="not-prose mt-8">
                    <Button asChild variant="outline">
                        <Link href="/api/v1/tools" className="gap-2">
                            <ExternalLink className="w-4 h-4" />
                            查看工具注册表 (JSON)
                        </Link>
                    </Button>
                </div>
            </article>
        </main>
    );
}

