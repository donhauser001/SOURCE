/**
 * 色彩身份证文档
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: '色彩身份证 | 文档 | SOURCE',
    description: '了解 SOURCE 色彩身份证的数据结构、真源定义、纸张表现模型。',
};

export default function ColorIdentityDocPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <article className="container mx-auto px-4 py-12 max-w-3xl prose prose-slate dark:prose-invert">
                <Link href="/docs">
                    <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
                        <ArrowLeft className="h-4 w-4" />
                        返回文档
                    </Button>
                </Link>

                <h1>色彩身份证</h1>

                <p className="lead">
                    每个固定色号（Color ID）拥有一页专属的「色彩身份证」，连接数字设计与实体印刷。
                </p>

                <h2>核心概念</h2>

                <h3>真源数据 (The True Source)</h3>
                <p>
                    基于分光光度仪对实体样张采集的绝对 Lab 数值。这是跨设备、跨材质的最高物理标准。
                </p>
                <ul>
                    <li><strong>L*</strong>: 明度，范围 0-100</li>
                    <li><strong>a*</strong>: 红绿轴，范围 -128 ~ +127</li>
                    <li><strong>b*</strong>: 黄蓝轴，范围 -128 ~ +127</li>
                </ul>

                <h3>开放差异原则</h3>
                <p>
                    同一颜色在不同纸张上会呈现不同的实际效果。SOURCE 不回避这种差异，而是将其结构化记录：
                </p>
                <ul>
                    <li>每种纸张类型都有独立的 Lab 测量值</li>
                    <li>计算与真源的色差 ΔE</li>
                    <li>给出推荐等级：最佳拍档 / 表现良好 / 需注意 / 建议慎用</li>
                </ul>

                <h2>数据模型</h2>

                <h3>Color（颜色）</h3>
                <pre><code>{`{
  "colorId": "CN-Song-04",
  "name": "烟雨青",
  "slug": "yanyu-qing",
  "labL": 65.2,
  "labA": -12.5,
  "labB": -8.3,
  "measuredAt": "2026-01-01T00:00:00Z",
  "measurementDevice": "X-Rite i1Pro 3",
  "measurementStandard": "D50/2°",
  "measurementCondition": "标准实验室环境",
  "deltaETolerance": 2.0,
  "trueSourceNote": "基于宋代青瓷典型色彩",
  "status": "ACTIVE",
  "auditStatus": "VERIFIED"
}`}</code></pre>

                <h3>PaperProfile（纸张表现）</h3>
                <pre><code>{`{
  "paperType": "PREMIUM_MATTE",
  "labL": 64.8,
  "labA": -12.3,
  "labB": -8.1,
  "deltaE": 0.5,
  "glossiness": 25,
  "inkAbsorption": 45,
  "gamutCoverage": 95,
  "recommendation": "BEST",
  "cautionNote": null
}`}</code></pre>

                <h2>纸张类型</h2>
                <table>
                    <thead>
                        <tr>
                            <th>代码</th>
                            <th>名称</th>
                            <th>特点</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>PREMIUM_MATTE</code></td>
                            <td>高阶映画</td>
                            <td>色彩还原度高，适合精细印刷</td>
                        </tr>
                        <tr>
                            <td><code>UNCOATED</code></td>
                            <td>纯质纸</td>
                            <td>自然纹理，吸墨率较高</td>
                        </tr>
                        <tr>
                            <td><code>COATED</code></td>
                            <td>铜版纸</td>
                            <td>光滑表面，色彩鲜艳</td>
                        </tr>
                        <tr>
                            <td><code>OFFSET</code></td>
                            <td>双胶纸</td>
                            <td>经济实用，色彩可能发灰</td>
                        </tr>
                        <tr>
                            <td><code>LIGHTWEIGHT</code></td>
                            <td>轻型纸</td>
                            <td>纹理明显，需注意绝网风险</td>
                        </tr>
                    </tbody>
                </table>

                <h2>推荐等级</h2>
                <table>
                    <thead>
                        <tr>
                            <th>等级</th>
                            <th>代码</th>
                            <th>说明</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>🟢 最佳拍档</td>
                            <td><code>BEST</code></td>
                            <td>色彩还原度极高，强烈推荐</td>
                        </tr>
                        <tr>
                            <td>🔵 表现良好</td>
                            <td><code>GOOD</code></td>
                            <td>色彩表现可接受</td>
                        </tr>
                        <tr>
                            <td>🟡 需注意</td>
                            <td><code>CAUTION</code></td>
                            <td>有轻微问题，建议打样确认</td>
                        </tr>
                        <tr>
                            <td>🔴 建议慎用</td>
                            <td><code>AVOID</code></td>
                            <td>色彩偏差较大，不推荐使用</td>
                        </tr>
                    </tbody>
                </table>
            </article>
        </main>
    );
}

