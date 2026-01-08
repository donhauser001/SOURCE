/**
 * 审计日志命令
 * 
 * v0.4.2 - Access 阶段
 * 
 * 用法：
 *   source audit list [options]      查看审计日志
 *   source audit stats               查看统计信息
 * 
 * 注意：需要管理员权限
 */

import { Command } from 'commander';
import { api } from '../lib/api.js';
import { output } from '../lib/output.js';

// 审计日志响应类型
interface AuditLog {
    id: string;
    command: string;
    args: Record<string, unknown>;
    result: string;
    errorCode?: string;
    duration: number;
    citations: string[];
    createdAt: string;
}

interface AuditListResponse {
    items: AuditLog[];
    total: number;
    nextCursor?: string;
}

interface AuditStatsResponse {
    totalLogs: number;
    successCount: number;
    errorCount: number;
    topCommands: Array<{ command: string; count: number }>;
    recentActivity: Array<{ date: string; count: number }>;
}

export const auditCommand = new Command('audit')
    .description('查看 CLI 审计日志（需要管理员权限）');

// 子命令：list
auditCommand
    .command('list')
    .description('查看审计日志列表')
    .option('-l, --limit <number>', '返回数量', '20')
    .option('-c, --command <command>', '筛选命令')
    .option('--status <status>', '筛选状态 (success/error)')
    .action(async (options) => {
        api.setCurrentCommand('audit list');
        
        const params: Record<string, string> = {
            limit: options.limit,
        };
        
        if (options.command) {
            params.command = options.command;
        }
        
        if (options.status) {
            params.status = options.status;
        }
        
        const response = await api.get<AuditListResponse>('/audit/logs', params);
        
        if (!response.ok) {
            output.error(
                response.error?.code || 'ERR_UNKNOWN',
                response.error?.message || '获取审计日志失败'
            );
            process.exit(1);
        }
        
        const data = response.data!;
        
        if (output.isJsonMode()) {
            output.success(data);
        } else {
            if (data.items.length === 0) {
                output.info('暂无审计日志');
                return;
            }
            
            console.log(output.bold(`审计日志 (共 ${data.total} 条)\n`));
            
            // 表格格式输出
            const headers = ['时间', '命令', '状态', '耗时'];
            const rows = data.items.map(log => [
                new Date(log.createdAt).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                log.command,
                log.result === 'success' ? output.green('成功') : output.red(`失败: ${log.errorCode}`),
                `${log.duration}ms`,
            ]);
            
            output.table(headers, rows);
        }
    });

// 子命令：stats
auditCommand
    .command('stats')
    .description('查看审计统计信息')
    .option('-d, --days <number>', '统计天数', '7')
    .action(async (options) => {
        api.setCurrentCommand('audit stats');
        
        const response = await api.get<AuditStatsResponse>('/audit/stats', {
            days: options.days,
        });
        
        if (!response.ok) {
            output.error(
                response.error?.code || 'ERR_UNKNOWN',
                response.error?.message || '获取统计信息失败'
            );
            process.exit(1);
        }
        
        const data = response.data!;
        
        if (output.isJsonMode()) {
            output.success(data);
        } else {
            console.log(output.bold('审计统计\n'));
            
            console.log(`总调用次数: ${data.totalLogs}`);
            console.log(`成功: ${output.green(String(data.successCount))}`);
            console.log(`失败: ${output.red(String(data.errorCount))}`);
            console.log();
            
            if (data.topCommands.length > 0) {
                console.log(output.bold('热门命令:'));
                data.topCommands.forEach((cmd, i) => {
                    console.log(`  ${i + 1}. ${cmd.command} (${cmd.count} 次)`);
                });
            }
        }
    });

// 子命令：my（查看自己的调用记录）
auditCommand
    .command('my')
    .description('查看我的调用记录')
    .option('-l, --limit <number>', '返回数量', '10')
    .action(async (options) => {
        api.setCurrentCommand('audit my');
        
        const response = await api.get<AuditListResponse>('/audit/my', {
            limit: options.limit,
        });
        
        if (!response.ok) {
            output.error(
                response.error?.code || 'ERR_UNKNOWN',
                response.error?.message || '获取调用记录失败'
            );
            process.exit(1);
        }
        
        const data = response.data!;
        
        if (output.isJsonMode()) {
            output.success(data);
        } else {
            if (data.items.length === 0) {
                output.info('暂无调用记录');
                return;
            }
            
            console.log(output.bold('我的调用记录\n'));
            
            const headers = ['时间', '命令', '状态', '耗时'];
            const rows = data.items.map(log => [
                new Date(log.createdAt).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                log.command,
                log.result === 'success' ? output.green('成功') : output.red('失败'),
                `${log.duration}ms`,
            ]);
            
            output.table(headers, rows);
        }
    });

