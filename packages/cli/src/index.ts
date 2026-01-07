#!/usr/bin/env node
/**
 * SOURCE CLI
 *
 * 实体印刷色彩实操体系命令行工具
 *
 * 设计原则：
 * - AI = 一个普通客户端（但权限更严格）
 * - 每个命令的输入输出都是结构化 JSON
 * - 每次调用都留下审计日志
 */

import { Command } from 'commander';
import { config } from './lib/config.js';
import { output } from './lib/output.js';

// 导入命令
import { colorCommand } from './commands/color.js';
import { searchCommand } from './commands/search.js';
import { configCommand } from './commands/config.js';
import { citeCommand } from './commands/cite.js';
import { costCommand } from './commands/cost.js';

const VERSION = '0.3.2';

const program = new Command();

program
    .name('source')
    .description('SOURCE CLI - 实体印刷色彩实操体系')
    .version(VERSION, '-v, --version', '显示版本号')
    .option('--json', '以 JSON 格式输出')
    .option('--no-color', '禁用彩色输出')
    .hook('preAction', (thisCommand) => {
        // 设置全局输出模式
        const opts = thisCommand.opts();
        output.setJsonMode(opts.json || false);
        output.setColorMode(opts.color !== false);
    });

// 注册命令
program.addCommand(colorCommand);
program.addCommand(searchCommand);
program.addCommand(configCommand);
program.addCommand(citeCommand);
program.addCommand(costCommand);

// 全局错误处理
program.exitOverride((err) => {
    if (err.code === 'commander.help' || err.code === 'commander.helpDisplayed') {
        process.exit(0);
    }
    if (err.code === 'commander.version') {
        process.exit(0);
    }
    // 不在 JSON 模式下才输出错误
    if (!program.opts().json) {
        output.error('ERR_COMMAND', err.message);
    }
    process.exit(1);
});

// 未知命令处理
program.on('command:*', () => {
    output.error('ERR_UNKNOWN_COMMAND', `未知命令: ${program.args.join(' ')}`);
    output.info('使用 source --help 查看可用命令');
    process.exit(1);
});

// 解析命令行参数
program.parse(process.argv);

// 无参数时显示帮助
if (process.argv.length === 2) {
    program.outputHelp();
}

