/**
 * search 命令
 *
 * 搜索色彩
 */

import { Command } from 'commander';
import { api } from '../lib/api.js';
import { config } from '../lib/config.js';
import { output } from '../lib/output.js';

export const searchCommand = new Command('search')
    .description('搜索色彩')
    .argument('<query>', '搜索关键词')
    .option('-l, --limit <number>', '返回数量', '10')
    .action(async (query: string, options) => {
        if (!config.hasApiKey()) {
            output.error('ERR_NO_API_KEY', '请先配置 API Key');
            output.info('使用 source config set-key <your-api-key>');
            process.exit(1);
        }

        const response = await api.get<any>('/colors', {
            q: query,
            limit: options.limit,
        });

        if (!response.ok) {
            output.error(
                response.error?.code || 'ERR_UNKNOWN',
                response.error?.message || '搜索失败'
            );
            process.exit(1);
        }

        const items = response.data?.items || [];

        if (items.length === 0) {
            output.info(`未找到匹配 "${query}" 的色彩`);
            return;
        }

        output.table(
            ['编号', '名称', 'L*', 'a*', 'b*'],
            items.map((c: any) => [
                c.colorId,
                c.name,
                c.labL?.toFixed(1) || '-',
                c.labA?.toFixed(1) || '-',
                c.labB?.toFixed(1) || '-',
            ])
        );
    });

