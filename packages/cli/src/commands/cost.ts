/**
 * 成本估算命令
 * 
 * v0.3.2 - Bridge 阶段
 * 
 * 用法：
 *   source cost estimate [options]
 * 
 * 注意：
 * - 所有估算均为参考值
 * - 输出包含假设条件
 * - 不作为实际报价依据
 */

import { Command } from 'commander';
import { output } from '../lib/output.js';

// 成本模型配置
const COST_MODEL = {
    // 基础印刷成本（元/色/千印）
    basePrintCost: {
        PREMIUM_MATTE: 180,   // 高阶映画
        UNCOATED: 120,        // 纯质纸
        COATED: 100,          // 铜版纸
        OFFSET: 80,           // 双胶纸
        LIGHTWEIGHT: 60,      // 轻型纸
    },

    // 纸张类型标签
    paperTypeLabels: {
        PREMIUM_MATTE: '高阶映画',
        UNCOATED: '纯质纸',
        COATED: '铜版纸',
        OFFSET: '双胶纸',
        LIGHTWEIGHT: '轻型纸',
    } as Record<string, string>,

    // 开版费
    plateSetupCost: 500, // 元/版

    // 尺寸系数（基准为 A4）
    sizeFactor: {
        A5: 0.5,
        A4: 1.0,
        A3: 2.0,
        B5: 0.7,
        B4: 1.4,
    } as Record<string, number>,

    // 最小起订量
    minQuantity: 500,

    // 假设条件
    assumptions: [
        '基于标准四色胶印工艺',
        '纸张为该类型的中档品质',
        '不含后加工（覆膜、UV等）',
        '运费另计',
        '价格仅供参考，实际报价以印厂为准',
    ],
};

interface EstimateInput {
    paperType: string;
    quantity: number;
    size: string;
    colors: number;
    colorIds?: string[];
}

interface EstimateResult {
    input: {
        paperType: string;
        paperTypeLabel: string;
        quantity: number;
        size: string;
        colors: number;
        colorIds: string[];
    };
    estimate: {
        baseCost: number;
        setupCost: number;
        subtotal: number;
        unitCost: number;
        range: {
            low: number;
            high: number;
        };
    };
    assumptions: string[];
    disclaimer: string;
}

function calculateEstimate(input: EstimateInput): EstimateResult {
    const { paperType, quantity, size, colors, colorIds = [] } = input;

    // 获取基础成本
    const baseCostPerThousand = COST_MODEL.basePrintCost[paperType as keyof typeof COST_MODEL.basePrintCost] || 100;
    const sizeFactor = COST_MODEL.sizeFactor[size] || 1.0;
    const paperTypeLabel = COST_MODEL.paperTypeLabels[paperType] || paperType;

    // 计算
    const adjustedQuantity = Math.max(quantity, COST_MODEL.minQuantity);
    const baseCost = (adjustedQuantity / 1000) * baseCostPerThousand * sizeFactor * colors;
    const setupCost = COST_MODEL.plateSetupCost * colors;
    const subtotal = baseCost + setupCost;
    const unitCost = subtotal / adjustedQuantity;

    // 估算范围（±20%）
    const range = {
        low: Math.round(subtotal * 0.8),
        high: Math.round(subtotal * 1.2),
    };

    return {
        input: {
            paperType,
            paperTypeLabel,
            quantity: adjustedQuantity,
            size,
            colors,
            colorIds,
        },
        estimate: {
            baseCost: Math.round(baseCost),
            setupCost,
            subtotal: Math.round(subtotal),
            unitCost: Math.round(unitCost * 100) / 100,
            range,
        },
        assumptions: COST_MODEL.assumptions,
        disclaimer: '此估算仅供参考，不构成实际报价。实际成本受多种因素影响，请以印厂报价为准。',
    };
}

export const costCommand = new Command('cost')
    .description('成本估算工具');

// 子命令：estimate
costCommand
    .command('estimate')
    .description('估算印刷成本')
    .requiredOption('-p, --paper <type>', '纸张类型 (PREMIUM_MATTE, UNCOATED, COATED, OFFSET, LIGHTWEIGHT)')
    .requiredOption('-q, --quantity <number>', '印刷数量', parseInt)
    .option('-s, --size <size>', '尺寸 (A5, A4, A3, B5, B4)', 'A4')
    .option('-c, --colors <number>', '色彩数量', parseInt, 1)
    .option('--color-ids <ids>', '色彩 ID 列表（逗号分隔）')
    .action((options) => {
        // 验证纸张类型
        const validPaperTypes = Object.keys(COST_MODEL.basePrintCost);
        if (!validPaperTypes.includes(options.paper)) {
            output.error('INVALID_PAPER_TYPE', `无效的纸张类型: ${options.paper}`);
            output.info(`可选类型: ${validPaperTypes.join(', ')}`);
            process.exit(1);
        }

        // 验证数量
        if (options.quantity < 1) {
            output.error('INVALID_QUANTITY', '数量必须大于 0');
            process.exit(1);
        }

        // 验证尺寸
        const validSizes = Object.keys(COST_MODEL.sizeFactor);
        if (!validSizes.includes(options.size)) {
            output.error('INVALID_SIZE', `无效的尺寸: ${options.size}`);
            output.info(`可选尺寸: ${validSizes.join(', ')}`);
            process.exit(1);
        }

        // 解析色彩 ID
        const colorIds = options.colorIds
            ? options.colorIds.split(',').map((id: string) => id.trim())
            : [];

        // 计算估算
        const result = calculateEstimate({
            paperType: options.paper,
            quantity: options.quantity,
            size: options.size,
            colors: options.colors,
            colorIds,
        });

        // 输出
        if (output.isJsonMode()) {
            output.success(result);
        } else {
            output.success('成本估算结果\n');

            // 输入参数
            output.info('输入参数:');
            console.log(`  纸张类型: ${result.input.paperTypeLabel}`);
            console.log(`  数量: ${result.input.quantity.toLocaleString()}`);
            console.log(`  尺寸: ${result.input.size}`);
            console.log(`  色彩数: ${result.input.colors}`);
            if (colorIds.length > 0) {
                console.log(`  色彩 ID: ${colorIds.join(', ')}`);
            }
            console.log();

            // 估算结果
            output.info('估算结果:');
            console.log(`  基础印刷费: ¥${result.estimate.baseCost.toLocaleString()}`);
            console.log(`  开版费: ¥${result.estimate.setupCost.toLocaleString()}`);
            console.log(`  小计: ¥${result.estimate.subtotal.toLocaleString()}`);
            console.log(`  单价: ¥${result.estimate.unitCost.toFixed(2)}/份`);
            console.log();

            output.info('估算范围:');
            console.log(`  ¥${result.estimate.range.low.toLocaleString()} ~ ¥${result.estimate.range.high.toLocaleString()}`);
            console.log();

            // 假设条件
            output.warn('假设条件:');
            result.assumptions.forEach(a => {
                console.log(`  • ${a}`);
            });
            console.log();

            // 免责声明
            output.warn(`⚠️  ${result.disclaimer}`);
        }
    });

// 子命令：paper-types
costCommand
    .command('paper-types')
    .description('查看支持的纸张类型')
    .action(() => {
        const types = Object.entries(COST_MODEL.basePrintCost).map(([type, cost]) => ({
            type,
            label: COST_MODEL.paperTypeLabels[type] || type,
            baseCostPerThousand: cost,
        }));

        if (output.isJsonMode()) {
            output.success(types);
        } else {
            console.log(output.bold('支持的纸张类型\n'));
            console.log('类型代码'.padEnd(16) + '名称'.padEnd(12) + '基础成本（元/千印/色）');
            console.log('-'.repeat(50));
            types.forEach(t => {
                console.log(
                    t.type.padEnd(16) +
                    t.label.padEnd(12) +
                    `¥${t.baseCostPerThousand}`
                );
            });
        }
    });

// 子命令：sizes
costCommand
    .command('sizes')
    .description('查看支持的尺寸及系数')
    .action(() => {
        const sizes = Object.entries(COST_MODEL.sizeFactor).map(([size, factor]) => ({
            size,
            factor,
        }));

        if (output.isJsonMode()) {
            output.success(sizes);
        } else {
            console.log(output.bold('支持的尺寸\n'));
            console.log('尺寸'.padEnd(10) + '系数（相对于 A4）');
            console.log('-'.repeat(30));
            sizes.forEach(s => {
                console.log(s.size.padEnd(10) + `×${s.factor}`);
            });
        }
    });

