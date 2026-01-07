/**
 * color 命令
 *
 * 色彩相关操作
 */

import { Command } from 'commander';
import { api } from '../lib/api.js';
import { config } from '../lib/config.js';
import { output } from '../lib/output.js';

export const colorCommand = new Command('color')
    .description('色彩身份证相关命令');

/**
 * source color get <colorId>
 * 获取色彩身份证
 */
colorCommand
    .command('get <colorId>')
    .description('获取色彩身份证')
    .action(async (colorId: string) => {
        // 检查 API Key
        if (!config.hasApiKey()) {
            output.error('ERR_NO_API_KEY', '请先配置 API Key');
            output.info('使用 source config set-key <your-api-key>');
            process.exit(1);
        }

        const response = await api.get<any>(`/colors/${colorId}`);

        if (!response.ok) {
            output.error(
                response.error?.code || 'ERR_UNKNOWN',
                response.error?.message || '获取失败'
            );
            process.exit(1);
        }

        output.success(response.data, response.citations);
    });

/**
 * source color list
 * 获取色彩列表
 */
colorCommand
    .command('list')
    .description('获取色彩列表')
    .option('-l, --limit <number>', '返回数量', '20')
    .action(async (options) => {
        if (!config.hasApiKey()) {
            output.error('ERR_NO_API_KEY', '请先配置 API Key');
            output.info('使用 source config set-key <your-api-key>');
            process.exit(1);
        }

        const response = await api.get<any>('/colors', {
            limit: options.limit,
        });

        if (!response.ok) {
            output.error(
                response.error?.code || 'ERR_UNKNOWN',
                response.error?.message || '获取失败'
            );
            process.exit(1);
        }

        const items = response.data?.items || [];

        if (items.length === 0) {
            output.info('暂无色彩数据');
            return;
        }

        output.table(
            ['编号', '名称', 'L*', 'a*', 'b*', '状态'],
            items.map((c: any) => [
                c.colorId,
                c.name,
                c.labL?.toFixed(1) || '-',
                c.labA?.toFixed(1) || '-',
                c.labB?.toFixed(1) || '-',
                c.status,
            ])
        );
    });

/**
 * source color paper <colorId>
 * 获取色彩在各纸张上的表现
 */
colorCommand
    .command('paper <colorId>')
    .description('获取色彩在各纸张上的表现')
    .option('-p, --paper <type>', '指定纸张类型')
    .action(async (colorId: string, options) => {
        if (!config.hasApiKey()) {
            output.error('ERR_NO_API_KEY', '请先配置 API Key');
            output.info('使用 source config set-key <your-api-key>');
            process.exit(1);
        }

        const response = await api.get<any>(`/colors/${colorId}`);

        if (!response.ok) {
            output.error(
                response.error?.code || 'ERR_UNKNOWN',
                response.error?.message || '获取失败'
            );
            process.exit(1);
        }

        const profiles = response.data?.paperProfiles || [];

        if (profiles.length === 0) {
            output.info('暂无纸张表现数据');
            return;
        }

        // 筛选纸张类型
        const filtered = options.paper
            ? profiles.filter((p: any) => p.paperType === options.paper)
            : profiles;

        output.table(
            ['纸张类型', 'ΔE', '色域覆盖', '推荐等级', '风险标签'],
            filtered.map((p: any) => [
                p.paperType,
                p.deltaE?.toFixed(2) || '-',
                p.gamutCoverage ? `${p.gamutCoverage}%` : '-',
                p.recommendation,
                (p.riskTags || []).join(', ') || '-',
            ])
        );
    });

/**
 * source color recommend <colorId>
 * 获取纸张推荐
 */
colorCommand
    .command('recommend <colorId>')
    .description('获取纸张推荐')
    .option('-g, --goal <goal>', '优化目标: fidelity|cost|texture', 'fidelity')
    .action(async (colorId: string, options) => {
        if (!config.hasApiKey()) {
            output.error('ERR_NO_API_KEY', '请先配置 API Key');
            output.info('使用 source config set-key <your-api-key>');
            process.exit(1);
        }

        // 这里需要后端实现 recommend 端点
        // 暂时使用 color get 的数据模拟
        const response = await api.get<any>(`/colors/${colorId}`);

        if (!response.ok) {
            output.error(
                response.error?.code || 'ERR_UNKNOWN',
                response.error?.message || '获取失败'
            );
            process.exit(1);
        }

        const profiles = response.data?.paperProfiles || [];

        // 简单排序推荐
        const sorted = [...profiles].sort((a: any, b: any) => {
            if (options.goal === 'fidelity') {
                return (a.deltaE || 99) - (b.deltaE || 99);
            }
            // 其他目标暂时用同样的排序
            return (a.deltaE || 99) - (b.deltaE || 99);
        });

        const recommendations = sorted.slice(0, 3);
        const avoid = profiles.filter((p: any) => p.recommendation === 'AVOID');

        output.success({
            colorId,
            goal: options.goal,
            recommendations: recommendations.map((p: any) => ({
                paperType: p.paperType,
                deltaE: p.deltaE,
                recommendation: p.recommendation,
            })),
            avoid: avoid.map((p: any) => ({
                paperType: p.paperType,
                reason: p.cautionNote || '不建议使用',
            })),
        }, [
            { type: 'color', id: colorId },
        ]);
    });

