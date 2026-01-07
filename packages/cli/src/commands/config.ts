/**
 * config 命令
 *
 * 配置管理
 */

import { Command } from 'commander';
import { config } from '../lib/config.js';
import { api } from '../lib/api.js';
import { output } from '../lib/output.js';

export const configCommand = new Command('config')
    .description('配置管理');

/**
 * source config show
 * 显示当前配置
 */
configCommand
    .command('show')
    .description('显示当前配置')
    .action(() => {
        const currentConfig = config.getAll();
        output.success(currentConfig);
    });

/**
 * source config set-key <apiKey>
 * 设置 API Key
 */
configCommand
    .command('set-key <apiKey>')
    .description('设置 API Key')
    .action(async (apiKey: string) => {
        if (!apiKey.startsWith('sk_source_')) {
            output.error('ERR_INVALID_KEY', 'API Key 格式不正确，应以 sk_source_ 开头');
            process.exit(1);
        }

        // 临时设置 key 测试
        config.setApiKey(apiKey);

        output.info('正在验证 API Key...');

        // 验证 key 是否有效
        const response = await api.get<any>('/colors', { limit: '1' });

        if (!response.ok && response.error?.code === 'ERR_UNAUTHORIZED') {
            config.clearApiKey();
            output.error('ERR_INVALID_KEY', 'API Key 无效或已过期');
            process.exit(1);
        }

        output.success({ message: 'API Key 已保存', keyPrefix: apiKey.substring(0, 12) + '...' });
    });

/**
 * source config set-server <url>
 * 设置服务器地址
 */
configCommand
    .command('set-server <url>')
    .description('设置服务器地址')
    .action(async (url: string) => {
        // 验证 URL 格式
        try {
            new URL(url);
        } catch {
            output.error('ERR_INVALID_URL', 'URL 格式不正确');
            process.exit(1);
        }

        config.setServerUrl(url);
        output.success({ message: '服务器地址已更新', serverUrl: url });
    });

/**
 * source config clear
 * 清除配置
 */
configCommand
    .command('clear')
    .description('清除所有配置')
    .option('-k, --key-only', '仅清除 API Key')
    .action((options) => {
        if (options.keyOnly) {
            config.clearApiKey();
            output.success({ message: 'API Key 已清除' });
        } else {
            config.reset();
            output.success({ message: '所有配置已清除' });
        }
    });

/**
 * source config test
 * 测试连接
 */
configCommand
    .command('test')
    .description('测试服务器连接')
    .action(async () => {
        const serverUrl = config.getServerUrl();
        output.info(`正在测试连接: ${serverUrl}`);

        const connected = await api.checkConnection();

        if (connected) {
            output.success({
                status: 'connected',
                serverUrl,
                hasApiKey: config.hasApiKey(),
            });
        } else {
            output.error('ERR_CONNECTION', `无法连接到服务器: ${serverUrl}`);
            process.exit(1);
        }
    });

/**
 * source config tools
 * 查看可用工具列表
 */
configCommand
    .command('tools')
    .description('查看可用工具列表')
    .action(async () => {
        const response = await api.getTools();

        if (!response.ok) {
            output.error(
                response.error?.code || 'ERR_UNKNOWN',
                response.error?.message || '获取失败'
            );
            process.exit(1);
        }

        const data = response.data as { tools?: Array<{ name: string; description: string; scope: string }> } | undefined;
        const tools = data?.tools || [];

        output.table(
            ['命令', '说明', '权限'],
            tools.map((t) => [t.name, t.description, t.scope])
        );
    });

