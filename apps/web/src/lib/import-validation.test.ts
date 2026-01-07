/**
 * 导入数据验证逻辑测试
 * 
 * 测试 CSV/JSON 数据解析和验证
 */

import { describe, it, expect } from 'vitest';

// 验证错误类型
interface ValidationError {
    row: number;
    field: string;
    message: string;
    value?: unknown;
}

// 色彩数据记录
interface ColorRecord {
    colorId: string;
    name: string;
    slug?: string;
    labL: number;
    labA: number;
    labB: number;
    status?: string;
}

// 纸张数据记录
interface PaperProfileRecord {
    colorId: string;
    paperType: string;
    labL: number;
    labA: number;
    labB: number;
    glossiness: number;
    inkAbsorption: number;
    gamutCoverage: number;
    recommendation: string;
}

// 有效的枚举值
const VALID_PAPER_TYPES = ['PREMIUM_MATTE', 'UNCOATED', 'COATED', 'OFFSET', 'LIGHTWEIGHT'];
const VALID_RECOMMENDATIONS = ['BEST', 'GOOD', 'CAUTION', 'AVOID'];
const VALID_STATUSES = ['ACTIVE', 'EXPERIMENTAL', 'DEPRECATED', 'DRAFT'];

/**
 * 验证色彩数据
 */
function validateColorRecord(
    record: Record<string, unknown>,
    rowNum: number
): { data: ColorRecord | null; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // 必填字段检查
    if (!record.colorId) {
        errors.push({ row: rowNum, field: 'colorId', message: 'colorId 是必填字段' });
    }
    if (!record.name) {
        errors.push({ row: rowNum, field: 'name', message: 'name 是必填字段' });
    }

    // 数值解析和验证
    const labL = parseFloat(String(record.labL));
    const labA = parseFloat(String(record.labA));
    const labB = parseFloat(String(record.labB));

    if (isNaN(labL) || labL < 0 || labL > 100) {
        errors.push({ row: rowNum, field: 'labL', message: 'labL 必须在 0-100 之间', value: record.labL });
    }
    if (isNaN(labA) || labA < -128 || labA > 127) {
        errors.push({ row: rowNum, field: 'labA', message: 'labA 必须在 -128 到 127 之间', value: record.labA });
    }
    if (isNaN(labB) || labB < -128 || labB > 127) {
        errors.push({ row: rowNum, field: 'labB', message: 'labB 必须在 -128 到 127 之间', value: record.labB });
    }

    // 状态验证
    if (record.status && !VALID_STATUSES.includes(String(record.status))) {
        errors.push({ row: rowNum, field: 'status', message: '无效的状态值', value: record.status });
    }

    if (errors.length > 0) {
        return { data: null, errors };
    }

    return {
        data: {
            colorId: String(record.colorId),
            name: String(record.name),
            slug: record.slug ? String(record.slug) : undefined,
            labL,
            labA,
            labB,
            status: record.status ? String(record.status) : 'EXPERIMENTAL',
        },
        errors: [],
    };
}

/**
 * 验证纸张数据
 */
function validatePaperProfileRecord(
    record: Record<string, unknown>,
    rowNum: number
): { data: PaperProfileRecord | null; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // 必填字段检查
    if (!record.colorId) {
        errors.push({ row: rowNum, field: 'colorId', message: 'colorId 是必填字段' });
    }
    if (!record.paperType) {
        errors.push({ row: rowNum, field: 'paperType', message: 'paperType 是必填字段' });
    } else if (!VALID_PAPER_TYPES.includes(String(record.paperType))) {
        errors.push({ row: rowNum, field: 'paperType', message: '无效的纸张类型', value: record.paperType });
    }
    if (!record.recommendation) {
        errors.push({ row: rowNum, field: 'recommendation', message: 'recommendation 是必填字段' });
    } else if (!VALID_RECOMMENDATIONS.includes(String(record.recommendation))) {
        errors.push({ row: rowNum, field: 'recommendation', message: '无效的推荐等级', value: record.recommendation });
    }

    // 数值字段验证
    const labL = parseFloat(String(record.labL));
    const labA = parseFloat(String(record.labA));
    const labB = parseFloat(String(record.labB));
    const glossiness = parseFloat(String(record.glossiness));
    const inkAbsorption = parseFloat(String(record.inkAbsorption));
    const gamutCoverage = parseFloat(String(record.gamutCoverage));

    if (isNaN(labL) || labL < 0 || labL > 100) {
        errors.push({ row: rowNum, field: 'labL', message: 'labL 必须在 0-100 之间', value: record.labL });
    }
    if (isNaN(labA) || labA < -128 || labA > 127) {
        errors.push({ row: rowNum, field: 'labA', message: 'labA 必须在 -128 到 127 之间', value: record.labA });
    }
    if (isNaN(labB) || labB < -128 || labB > 127) {
        errors.push({ row: rowNum, field: 'labB', message: 'labB 必须在 -128 到 127 之间', value: record.labB });
    }
    if (isNaN(glossiness) || glossiness < 0 || glossiness > 100) {
        errors.push({ row: rowNum, field: 'glossiness', message: 'glossiness 必须在 0-100 之间', value: record.glossiness });
    }
    if (isNaN(inkAbsorption) || inkAbsorption < 0 || inkAbsorption > 100) {
        errors.push({ row: rowNum, field: 'inkAbsorption', message: 'inkAbsorption 必须在 0-100 之间', value: record.inkAbsorption });
    }
    if (isNaN(gamutCoverage) || gamutCoverage < 0 || gamutCoverage > 100) {
        errors.push({ row: rowNum, field: 'gamutCoverage', message: 'gamutCoverage 必须在 0-100 之间', value: record.gamutCoverage });
    }

    if (errors.length > 0) {
        return { data: null, errors };
    }

    return {
        data: {
            colorId: String(record.colorId),
            paperType: String(record.paperType),
            labL,
            labA,
            labB,
            glossiness,
            inkAbsorption,
            gamutCoverage,
            recommendation: String(record.recommendation),
        },
        errors: [],
    };
}

/**
 * 解析简单 CSV（测试用）
 */
function parseCsv(content: string): Record<string, unknown>[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const records: Record<string, unknown>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const record: Record<string, unknown> = {};
        headers.forEach((header, index) => {
            record[header] = values[index] || '';
        });
        records.push(record);
    }
    
    return records;
}

describe('导入数据验证', () => {
    describe('CSV 解析', () => {
        it('应正确解析 CSV 头部和数据', () => {
            const csv = `colorId,name,labL,labA,labB
CN-Song-04,烟雨青,65.2,-8.5,12.3`;
            const records = parseCsv(csv);
            expect(records.length).toBe(1);
            expect(records[0].colorId).toBe('CN-Song-04');
            expect(records[0].name).toBe('烟雨青');
        });

        it('应处理多行数据', () => {
            const csv = `colorId,name,labL,labA,labB
CN-Song-04,烟雨青,65.2,-8.5,12.3
CN-Ming-01,明月白,92.1,0.5,-1.2`;
            const records = parseCsv(csv);
            expect(records.length).toBe(2);
        });

        it('空 CSV 应返回空数组', () => {
            const csv = `colorId,name`;
            const records = parseCsv(csv);
            expect(records.length).toBe(0);
        });
    });

    describe('色彩数据验证', () => {
        it('有效数据应通过验证', () => {
            const record = {
                colorId: 'CN-Song-04',
                name: '烟雨青',
                labL: '65.2',
                labA: '-8.5',
                labB: '12.3',
            };
            const result = validateColorRecord(record, 2);
            expect(result.errors.length).toBe(0);
            expect(result.data).not.toBeNull();
            expect(result.data?.colorId).toBe('CN-Song-04');
        });

        it('缺少 colorId 应报错', () => {
            const record = {
                name: '烟雨青',
                labL: '65.2',
                labA: '-8.5',
                labB: '12.3',
            };
            const result = validateColorRecord(record, 2);
            expect(result.errors.some(e => e.field === 'colorId')).toBe(true);
        });

        it('缺少 name 应报错', () => {
            const record = {
                colorId: 'CN-Song-04',
                labL: '65.2',
                labA: '-8.5',
                labB: '12.3',
            };
            const result = validateColorRecord(record, 2);
            expect(result.errors.some(e => e.field === 'name')).toBe(true);
        });

        it('labL 超出范围应报错', () => {
            const record = {
                colorId: 'CN-Song-04',
                name: '烟雨青',
                labL: '150',  // 超出 0-100
                labA: '-8.5',
                labB: '12.3',
            };
            const result = validateColorRecord(record, 2);
            expect(result.errors.some(e => e.field === 'labL')).toBe(true);
        });

        it('labA 超出范围应报错', () => {
            const record = {
                colorId: 'CN-Song-04',
                name: '烟雨青',
                labL: '65.2',
                labA: '200',  // 超出 -128 到 127
                labB: '12.3',
            };
            const result = validateColorRecord(record, 2);
            expect(result.errors.some(e => e.field === 'labA')).toBe(true);
        });

        it('labB 超出范围应报错', () => {
            const record = {
                colorId: 'CN-Song-04',
                name: '烟雨青',
                labL: '65.2',
                labA: '-8.5',
                labB: '-200',  // 超出 -128 到 127
            };
            const result = validateColorRecord(record, 2);
            expect(result.errors.some(e => e.field === 'labB')).toBe(true);
        });

        it('无效状态值应报错', () => {
            const record = {
                colorId: 'CN-Song-04',
                name: '烟雨青',
                labL: '65.2',
                labA: '-8.5',
                labB: '12.3',
                status: 'INVALID_STATUS',
            };
            const result = validateColorRecord(record, 2);
            expect(result.errors.some(e => e.field === 'status')).toBe(true);
        });

        it('有效状态值应通过', () => {
            const record = {
                colorId: 'CN-Song-04',
                name: '烟雨青',
                labL: '65.2',
                labA: '-8.5',
                labB: '12.3',
                status: 'ACTIVE',
            };
            const result = validateColorRecord(record, 2);
            expect(result.errors.length).toBe(0);
            expect(result.data?.status).toBe('ACTIVE');
        });
    });

    describe('纸张数据验证', () => {
        it('有效数据应通过验证', () => {
            const record = {
                colorId: 'CN-Song-04',
                paperType: 'PREMIUM_MATTE',
                labL: '63.8',
                labA: '-7.2',
                labB: '10.5',
                glossiness: '15',
                inkAbsorption: '72',
                gamutCoverage: '88',
                recommendation: 'BEST',
            };
            const result = validatePaperProfileRecord(record, 2);
            expect(result.errors.length).toBe(0);
            expect(result.data).not.toBeNull();
        });

        it('无效纸张类型应报错', () => {
            const record = {
                colorId: 'CN-Song-04',
                paperType: 'INVALID_TYPE',
                labL: '63.8',
                labA: '-7.2',
                labB: '10.5',
                glossiness: '15',
                inkAbsorption: '72',
                gamutCoverage: '88',
                recommendation: 'BEST',
            };
            const result = validatePaperProfileRecord(record, 2);
            expect(result.errors.some(e => e.field === 'paperType')).toBe(true);
        });

        it('无效推荐等级应报错', () => {
            const record = {
                colorId: 'CN-Song-04',
                paperType: 'PREMIUM_MATTE',
                labL: '63.8',
                labA: '-7.2',
                labB: '10.5',
                glossiness: '15',
                inkAbsorption: '72',
                gamutCoverage: '88',
                recommendation: 'INVALID',
            };
            const result = validatePaperProfileRecord(record, 2);
            expect(result.errors.some(e => e.field === 'recommendation')).toBe(true);
        });

        it('glossiness 超出范围应报错', () => {
            const record = {
                colorId: 'CN-Song-04',
                paperType: 'PREMIUM_MATTE',
                labL: '63.8',
                labA: '-7.2',
                labB: '10.5',
                glossiness: '150',  // 超出 0-100
                inkAbsorption: '72',
                gamutCoverage: '88',
                recommendation: 'BEST',
            };
            const result = validatePaperProfileRecord(record, 2);
            expect(result.errors.some(e => e.field === 'glossiness')).toBe(true);
        });

        it('所有有效纸张类型应通过', () => {
            VALID_PAPER_TYPES.forEach(paperType => {
                const record = {
                    colorId: 'CN-Song-04',
                    paperType,
                    labL: '63.8',
                    labA: '-7.2',
                    labB: '10.5',
                    glossiness: '15',
                    inkAbsorption: '72',
                    gamutCoverage: '88',
                    recommendation: 'BEST',
                };
                const result = validatePaperProfileRecord(record, 2);
                expect(result.errors.length).toBe(0);
            });
        });

        it('所有有效推荐等级应通过', () => {
            VALID_RECOMMENDATIONS.forEach(recommendation => {
                const record = {
                    colorId: 'CN-Song-04',
                    paperType: 'PREMIUM_MATTE',
                    labL: '63.8',
                    labA: '-7.2',
                    labB: '10.5',
                    glossiness: '15',
                    inkAbsorption: '72',
                    gamutCoverage: '88',
                    recommendation,
                };
                const result = validatePaperProfileRecord(record, 2);
                expect(result.errors.length).toBe(0);
            });
        });
    });

    describe('边界值测试', () => {
        it('labL = 0 应通过', () => {
            const record = {
                colorId: 'CN-Test-01',
                name: '测试',
                labL: '0',
                labA: '0',
                labB: '0',
            };
            const result = validateColorRecord(record, 2);
            expect(result.data?.labL).toBe(0);
        });

        it('labL = 100 应通过', () => {
            const record = {
                colorId: 'CN-Test-01',
                name: '测试',
                labL: '100',
                labA: '0',
                labB: '0',
            };
            const result = validateColorRecord(record, 2);
            expect(result.data?.labL).toBe(100);
        });

        it('labA = -128 应通过', () => {
            const record = {
                colorId: 'CN-Test-01',
                name: '测试',
                labL: '50',
                labA: '-128',
                labB: '0',
            };
            const result = validateColorRecord(record, 2);
            expect(result.data?.labA).toBe(-128);
        });

        it('labA = 127 应通过', () => {
            const record = {
                colorId: 'CN-Test-01',
                name: '测试',
                labL: '50',
                labA: '127',
                labB: '0',
            };
            const result = validateColorRecord(record, 2);
            expect(result.data?.labA).toBe(127);
        });
    });
});

