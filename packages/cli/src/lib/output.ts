/**
 * CLI 输出工具
 *
 * 支持两种模式：
 * - 人类可读（彩色、格式化）
 * - JSON（机器可解析）
 */

import chalk from 'chalk';

interface OutputOptions {
    jsonMode: boolean;
    colorMode: boolean;
}

interface JsonOutput {
    ok: boolean;
    data?: unknown;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    citations?: Citation[];
    timestamp: string;
}

interface Citation {
    type: string;
    id: string;
    label?: string;
}

const options: OutputOptions = {
    jsonMode: false,
    colorMode: true,
};

export const output = {
    /**
     * 设置 JSON 模式
     */
    setJsonMode(enabled: boolean): void {
        options.jsonMode = enabled;
    },

    /**
     * 设置彩色模式
     */
    setColorMode(enabled: boolean): void {
        options.colorMode = enabled;
    },

    /**
     * 检查是否为 JSON 模式
     */
    isJsonMode(): boolean {
        return options.jsonMode;
    },

    /**
     * 输出成功结果
     */
    success<T>(data: T, citations?: Citation[]): void {
        if (options.jsonMode) {
            const output: JsonOutput = {
                ok: true,
                data,
                citations,
                timestamp: new Date().toISOString(),
            };
            console.log(JSON.stringify(output, null, 2));
        } else {
            if (typeof data === 'object' && data !== null) {
                console.log(this.formatObject(data));
            } else {
                console.log(data);
            }
            if (citations && citations.length > 0) {
                console.log();
                console.log(this.dim('引用:'));
                for (const cite of citations) {
                    console.log(this.dim(`  - ${cite.type}: ${cite.id}${cite.label ? ` (${cite.label})` : ''}`));
                }
            }
        }
    },

    /**
     * 输出错误
     */
    error(code: string, message: string, details?: unknown): void {
        if (options.jsonMode) {
            const output: JsonOutput = {
                ok: false,
                error: { code, message, details },
                timestamp: new Date().toISOString(),
            };
            console.error(JSON.stringify(output, null, 2));
        } else {
            console.error(this.red(`错误 [${code}]: ${message}`));
            if (details) {
                console.error(this.dim(JSON.stringify(details, null, 2)));
            }
        }
    },

    /**
     * 输出信息
     */
    info(message: string): void {
        if (!options.jsonMode) {
            console.log(this.cyan(message));
        }
    },

    /**
     * 输出警告
     */
    warn(message: string): void {
        if (!options.jsonMode) {
            console.log(this.yellow(`警告: ${message}`));
        }
    },

    /**
     * 输出表格
     */
    table(headers: string[], rows: string[][]): void {
        if (options.jsonMode) {
            const data = rows.map((row) =>
                headers.reduce(
                    (obj, header, i) => {
                        obj[header] = row[i];
                        return obj;
                    },
                    {} as Record<string, string>
                )
            );
            console.log(JSON.stringify({ ok: true, data, timestamp: new Date().toISOString() }, null, 2));
        } else {
            // 计算列宽
            const colWidths = headers.map((h, i) =>
                Math.max(h.length, ...rows.map((r) => (r[i] || '').length))
            );

            // 输出表头
            const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join('  ');
            console.log(this.bold(headerLine));
            console.log(this.dim('-'.repeat(headerLine.length)));

            // 输出数据行
            for (const row of rows) {
                console.log(row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join('  '));
            }
        }
    },

    /**
     * 格式化对象输出
     */
    formatObject(obj: unknown, indent = 0): string {
        if (typeof obj !== 'object' || obj === null) {
            return String(obj);
        }

        const lines: string[] = [];
        const prefix = '  '.repeat(indent);

        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) continue;

            if (typeof value === 'object' && !Array.isArray(value)) {
                lines.push(`${prefix}${this.bold(key)}:`);
                lines.push(this.formatObject(value, indent + 1));
            } else if (Array.isArray(value)) {
                lines.push(`${prefix}${this.bold(key)}:`);
                for (const item of value) {
                    if (typeof item === 'object') {
                        lines.push(`${prefix}  -`);
                        lines.push(this.formatObject(item, indent + 2));
                    } else {
                        lines.push(`${prefix}  - ${item}`);
                    }
                }
            } else {
                lines.push(`${prefix}${this.bold(key)}: ${value}`);
            }
        }

        return lines.join('\n');
    },

    // 颜色工具
    red(text: string): string {
        return options.colorMode ? chalk.red(text) : text;
    },
    green(text: string): string {
        return options.colorMode ? chalk.green(text) : text;
    },
    yellow(text: string): string {
        return options.colorMode ? chalk.yellow(text) : text;
    },
    cyan(text: string): string {
        return options.colorMode ? chalk.cyan(text) : text;
    },
    dim(text: string): string {
        return options.colorMode ? chalk.dim(text) : text;
    },
    bold(text: string): string {
        return options.colorMode ? chalk.bold(text) : text;
    },
};

