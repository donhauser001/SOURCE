/**
 * cite 命令
 *
 * 生成色彩引用文献
 *
 * 用法:
 *   source cite <colorId> [--format json|apa|bibtex]
 */

import { Command } from 'commander';
import { api } from '../lib/api.js';
import { output } from '../lib/output.js';

// 引用格式类型
type CiteFormat = 'json' | 'apa' | 'bibtex';

// 色彩数据接口
interface ColorData {
    id: string;
    colorId: string;
    name: string;
    slug: string;
    labL: number;
    labA: number;
    labB: number;
    version: string;
    status: string;
    auditStatus: string;
    createdAt: string;
    updatedAt: string;
}

// 引用数据接口
interface CitationData {
    colorId: string;
    name: string;
    version: string;
    url: string;
    accessedAt: string;
    year: number;
    auditStatus: string;
}

/**
 * 生成 APA 格式引用
 */
function formatApa(data: CitationData): string {
    // SOURCE. (2026). CN-Song-04: 烟雨青 [Color Identity]. Retrieved from https://source.ink/color/CN-Song-04
    const year = data.year;
    return `SOURCE. (${year}). ${data.colorId}: ${data.name} [Color Identity]. Retrieved from ${data.url}`;
}

/**
 * 生成 BibTeX 格式引用
 */
function formatBibtex(data: CitationData): string {
    const key = data.colorId.replace(/-/g, '_').toLowerCase();
    return `@misc{source_${key},
  author = {{SOURCE}},
  title = {{${data.colorId}: ${data.name}}},
  year = {${data.year}},
  howpublished = {\\url{${data.url}}},
  note = {Color Identity, v${data.version}, ${data.auditStatus === 'VERIFIED' ? 'Verified' : 'Under Review'}}
}`;
}

export const citeCommand = new Command('cite')
    .description('生成色彩引用文献')
    .argument('<colorId>', '色彩编号 (如 CN-Song-04)')
    .option('-f, --format <format>', '输出格式: json, apa, bibtex', 'json')
    .action(async (colorId: string, options: { format: string }) => {
        const format = options.format.toLowerCase() as CiteFormat;

        // 验证格式
        if (!['json', 'apa', 'bibtex'].includes(format)) {
            output.error('ERR_INVALID_FORMAT', `不支持的格式: ${format}，可选: json, apa, bibtex`);
            process.exit(1);
        }

        try {
            // 获取色彩数据
            const response = await api.get<ColorData>(`/colors/${encodeURIComponent(colorId)}`);

            if (!response.ok || !response.data) {
                output.error(
                    response.error?.code || 'ERR_NOT_FOUND',
                    response.error?.message || `未找到色彩: ${colorId}`
                );
                process.exit(1);
            }

            const color = response.data;
            const now = new Date();

            // 构建引用数据
            const citationData: CitationData = {
                colorId: color.colorId,
                name: color.name,
                version: color.version,
                url: `https://source.ink/color/${color.colorId}`,
                accessedAt: now.toISOString(),
                year: now.getFullYear(),
                auditStatus: color.auditStatus,
            };

            // 根据格式输出
            switch (format) {
                case 'json':
                    output.success({
                        citation: {
                            ...citationData,
                            format: 'structured',
                            apa: formatApa(citationData),
                            bibtex: formatBibtex(citationData),
                        },
                        source: {
                            colorId: color.colorId,
                            name: color.name,
                            labL: color.labL,
                            labA: color.labA,
                            labB: color.labB,
                            status: color.status,
                            auditStatus: color.auditStatus,
                        },
                    });
                    break;

                case 'apa':
                    if (output.isJsonMode()) {
                        output.success({ citation: formatApa(citationData) });
                    } else {
                        console.log('\n' + formatApa(citationData) + '\n');
                    }
                    break;

                case 'bibtex':
                    if (output.isJsonMode()) {
                        output.success({ citation: formatBibtex(citationData) });
                    } else {
                        console.log('\n' + formatBibtex(citationData) + '\n');
                    }
                    break;
            }

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '未知错误';
            output.error('ERR_CITE_FAILED', `生成引用失败: ${message}`);
            process.exit(1);
        }
    });

