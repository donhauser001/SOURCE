/**
 * analyze 命令
 *
 * 工程色彩分析
 *
 * 使用方法：
 *   source analyze --file <path>     从本地文件分析
 *   source analyze --stdin           从标准输入读取
 *
 * 输出内容：
 *   - 颜色映射结果
 *   - 风险识别
 *   - 纸张推荐（Top 3）
 *   - 避坑列表
 *   - 证据链引用
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { config } from '../lib/config.js';
import { output } from '../lib/output.js';
import { api } from '../lib/api.js';

// 纸张类型名称映射
const PAPER_TYPE_NAMES: Record<string, string> = {
    PREMIUM_MATTE: '高阶映画',
    COATED: '铜版纸',
    UNCOATED: '纯质纸',
    OFFSET: '双胶纸',
    LIGHTWEIGHT: '轻型纸',
};

// 风险标签名称映射
const RISK_TAG_NAMES: Record<string, string> = {
    large_area: '大色块',
    gradient: '渐变',
    overprint: '叠印',
    fine_line: '细线条',
    small_text: '小字',
    bleed: '出血区',
    critical: '关键色',
};

export const analyzeCommand = new Command('analyze')
    .description('分析工程色彩包（SourcePack）')
    .option('-f, --file <path>', 'SourcePack 文件路径（.sourcepack.json 或 .json）')
    .option('--stdin', '从标准输入读取 JSON')
    .option('--summary', '仅输出摘要信息')
    .option('--no-recommendations', '不输出纸张推荐')
    .option('--no-risks', '不输出风险识别')
    .action(async (options) => {
        // 设置当前命令（用于审计）
        api.setCurrentCommand('analyze');

        // API Key 是可选的（分析 API 允许匿名访问，但有 API Key 可以关联用户）
        if (!config.hasApiKey()) {
            output.warn('未配置 API Key，报告将不会关联到您的账户');
        }

        // 读取输入
        let sourcePackContent: string;

        if (options.stdin) {
            // 从标准输入读取
            sourcePackContent = await readStdin();
        } else if (options.file) {
            // 从文件读取
            const filePath = resolve(process.cwd(), options.file);

            if (!existsSync(filePath)) {
                output.error('ERR_FILE_NOT_FOUND', `文件不存在: ${filePath}`);
                process.exit(1);
            }

            try {
                sourcePackContent = readFileSync(filePath, 'utf-8');
            } catch (err) {
                output.error('ERR_FILE_READ', `无法读取文件: ${err instanceof Error ? err.message : '未知错误'}`);
                process.exit(1);
            }
        } else {
            output.error('ERR_NO_INPUT', '请指定输入源');
            output.info('使用 --file <path> 指定文件，或使用 --stdin 从标准输入读取');
            process.exit(1);
        }

        // 验证 JSON 格式
        let sourcePack: unknown;
        try {
            sourcePack = JSON.parse(sourcePackContent);
        } catch {
            output.error('ERR_INVALID_JSON', 'JSON 格式无效');
            process.exit(1);
        }

        // 调用分析 API
        output.info('正在分析...');

        const response = await analyzeSourcePack(sourcePack);

        if (!response.success) {
            output.error(
                response.error?.code || 'ERR_ANALYSIS_FAILED',
                response.error?.message || '分析失败'
            );
            if (response.error?.details) {
                output.error('ERR_DETAILS', JSON.stringify(response.error.details, null, 2));
            }
            process.exit(1);
        }

        const report = response.data;

        // 输出结果
        if (options.summary) {
            // 仅输出摘要
            outputSummary(report);
        } else {
            // 输出完整报告
            outputFullReport(report, {
                showRecommendations: options.recommendations !== false,
                showRisks: options.risks !== false,
            });
        }
    });

/**
 * 从标准输入读取内容
 */
async function readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.setEncoding('utf-8');

        process.stdin.on('data', (chunk) => {
            data += chunk;
        });

        process.stdin.on('end', () => {
            resolve(data);
        });

        process.stdin.on('error', reject);

        // 设置超时
        setTimeout(() => {
            if (data === '') {
                reject(new Error('标准输入超时'));
            }
        }, 5000);
    });
}

/**
 * 调用分析 API
 */
async function analyzeSourcePack(sourcePack: unknown): Promise<{
    success: boolean;
    data?: any;
    error?: { code: string; message: string; details?: unknown };
}> {
    const serverUrl = config.getServerUrl();
    const apiKey = config.getApiKey();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-CLI-Version': '0.6.3',
        'X-CLI-Command': 'analyze',
    };

    // API Key 是可选的
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
        const response = await fetch(`${serverUrl}/api/analyze`, {
            method: 'POST',
            headers,
            body: JSON.stringify(sourcePack),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'ERR_NETWORK',
                message: error instanceof Error ? error.message : '网络请求失败',
            },
        };
    }
}

/**
 * 输出摘要信息
 */
function outputSummary(report: any): void {
    const summary = {
        reportId: report.id,
        docName: report.summary?.docInfo?.name,
        colorStats: report.summary?.colorStats,
        riskCount: report.risks?.length || 0,
        recommendationCount: report.recommendations?.length || 0,
        topRecommendation: report.recommendations?.[0] ? {
            paperType: PAPER_TYPE_NAMES[report.recommendations[0].paperType] || report.recommendations[0].paperType,
            score: report.recommendations[0].totalScore,
        } : null,
        expiresAt: report.expiresAt,
    };

    output.success(summary, generateCitations(report));
}

/**
 * 输出完整报告
 */
function outputFullReport(report: any, options: { showRecommendations: boolean; showRisks: boolean }): void {
    if (output.isJsonMode()) {
        // JSON 模式：输出完整结构
        const result: any = {
            reportId: report.id,
            summary: report.summary,
            printIntent: report.printIntent,
            colorAnalysis: formatColorAnalysis(report.colorAnalysis),
        };

        if (options.showRisks) {
            result.risks = formatRisks(report.risks);
        }

        if (options.showRecommendations) {
            result.recommendations = formatRecommendations(report.recommendations);
            result.avoidList = report.avoidList;
        }

        result.expiresAt = report.expiresAt;

        output.success(result, generateCitations(report));
    } else {
        // 人类可读模式
        printHumanReadableReport(report, options);
    }
}

/**
 * 格式化颜色分析结果
 */
function formatColorAnalysis(colors: any[]): any[] {
    return colors?.map((c) => ({
        name: c.original?.name || c.original?.colorId || '未命名',
        colorId: c.original?.colorId,
        lab: c.original?.lab,
        status: c.status,
        matchedColorId: c.matchedColorId,
        deltaE: c.deltaE ? parseFloat(c.deltaE.toFixed(2)) : undefined,
        riskTags: c.original?.riskTags,
    })) || [];
}

/**
 * 格式化风险列表
 */
function formatRisks(risks: any[]): any[] {
    return risks?.map((r) => ({
        type: r.type,
        typeName: RISK_TAG_NAMES[r.type] || r.type,
        severity: r.severity,
        affectedColors: r.affectedColors,
        description: r.description,
        mitigation: r.mitigation,
    })) || [];
}

/**
 * 格式化推荐列表
 */
function formatRecommendations(recommendations: any[]): any[] {
    return recommendations?.map((rec, index) => ({
        rank: index + 1,
        paperType: rec.paperType,
        paperTypeName: PAPER_TYPE_NAMES[rec.paperType] || rec.paperType,
        totalScore: rec.totalScore,
        level: rec.recommendationLevel,
        scores: rec.dimensionScores,
        reasons: rec.reasons,
        cautions: rec.cautions,
        evidence: {
            profileCount: rec.evidence?.paperProfileCount || 0,
            batchCount: rec.evidence?.batchIds?.length || 0,
        },
    })) || [];
}

/**
 * 生成引用列表
 */
function generateCitations(report: any): Array<{ type: string; id: string; label?: string }> {
    const citations: Array<{ type: string; id: string; label?: string }> = [];

    // 添加报告引用
    if (report.id) {
        citations.push({ type: 'report', id: report.id });
    }

    // 添加颜色引用
    const matchedColors = report.colorAnalysis?.filter((c: any) => c.matchedColorId) || [];
    for (const color of matchedColors) {
        citations.push({
            type: 'color',
            id: color.matchedColorId,
            label: color.matchedColorName,
        });
    }

    return citations;
}

/**
 * 打印人类可读报告
 */
function printHumanReadableReport(
    report: any,
    options: { showRecommendations: boolean; showRisks: boolean }
): void {
    const { summary, colorAnalysis, risks, recommendations, avoidList } = report;

    // 标题
    console.log();
    console.log(output.bold('═══════════════════════════════════════════════════════════════'));
    console.log(output.bold('                    SOURCE 工程色彩分析报告'));
    console.log(output.bold('═══════════════════════════════════════════════════════════════'));
    console.log();

    // 文档信息
    console.log(output.cyan(`文档名称: ${summary?.docInfo?.name || '未知'}`));
    console.log(output.dim(`报告 ID: ${report.id}`));
    console.log();

    // 颜色统计
    console.log(output.bold('── 颜色统计 ──'));
    const stats = summary?.colorStats || {};
    console.log(`总颜色: ${stats.total || 0}`);
    console.log(`已验证: ${output.green(String(stats.verified || 0))}`);
    console.log(`未映射: ${output.red(String(stats.unmapped || 0))}`);
    console.log(`有风险: ${output.yellow(String(stats.withRisks || 0))}`);
    console.log();

    // 颜色列表
    console.log(output.bold('── 颜色清单 ──'));
    const colorRows = (colorAnalysis || []).map((c: any) => {
        const statusIcon = c.status === 'verified' ? '✓' : c.status === 'partial_match' ? '?' : '✗';
        return [
            c.original?.name || '未命名',
            c.matchedColorId || '-',
            c.deltaE ? c.deltaE.toFixed(2) : '-',
            statusIcon,
        ];
    });
    output.table(['颜色名称', '匹配 ID', 'ΔE', '状态'], colorRows);
    console.log();

    // 风险识别
    if (options.showRisks && risks && risks.length > 0) {
        console.log(output.bold('── 风险识别 ──'));
        for (const risk of risks) {
            const severityIcon = risk.severity === 'high' ? '⚠️' : risk.severity === 'medium' ? '⚡' : 'ℹ️';
            console.log(`${severityIcon} ${output.yellow(RISK_TAG_NAMES[risk.type] || risk.type)} (${risk.severity})`);
            console.log(output.dim(`   ${risk.description}`));
            console.log(output.dim(`   建议: ${risk.mitigation}`));
            console.log();
        }
    }

    // 纸张推荐
    if (options.showRecommendations && recommendations && recommendations.length > 0) {
        console.log(output.bold('── 纸张推荐 ──'));
        for (let i = 0; i < recommendations.length; i++) {
            const rec = recommendations[i];
            const paperName = PAPER_TYPE_NAMES[rec.paperType] || rec.paperType;
            console.log(`#${i + 1} ${output.cyan(paperName)} - ${rec.totalScore}分`);
            console.log(output.dim(`   还原: ${rec.dimensionScores?.fidelity} | 风险: ${rec.dimensionScores?.risk} | 成本: ${rec.dimensionScores?.cost} | 适用: ${rec.dimensionScores?.suitability}`));
            if (rec.reasons?.length > 0) {
                console.log(output.green(`   + ${rec.reasons.join('; ')}`));
            }
            console.log();
        }
    }

    // 避坑提醒
    if (avoidList && avoidList.length > 0) {
        console.log(output.bold('── 避坑提醒 ──'));
        for (const item of avoidList) {
            const paperName = PAPER_TYPE_NAMES[item.paperType] || item.paperType;
            console.log(output.red(`✗ ${paperName}: ${item.reasons?.join('; ')}`));
        }
        console.log();
    }

    // 底部信息
    console.log(output.dim('───────────────────────────────────────────────────────────────'));
    console.log(output.dim(`报告有效期至: ${new Date(report.expiresAt).toLocaleString('zh-CN')}`));
    console.log(output.dim('由 SOURCE CLI 生成'));
}
