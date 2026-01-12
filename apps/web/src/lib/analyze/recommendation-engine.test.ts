/**
 * 推荐引擎核心测试
 *
 * 测试风险识别等纯函数逻辑
 */

import { describe, it, expect } from 'vitest';
import { analyzeRisks, type RiskItem } from './recommendation-engine';
import { type MappedColorItem, ColorMappingStatus } from './parser';

// 创建测试用的 MappedColorItem
function createMockColor(
    name: string,
    riskTags: string[] = []
): MappedColorItem {
    return {
        original: {
            colorId: `TEST-${name}`,
            name,
            riskTags: riskTags as MappedColorItem['original']['riskTags'],
            lab: { L: 50, a: 0, b: 0 },
            usage: ['fill'],
        },
        status: ColorMappingStatus.VERIFIED,
        matchedColorId: `TEST-${name}`,
        deltaE: 0,
    };
}

describe('recommendation-engine', () => {
    // ===========================================================================
    // analyzeRisks 测试
    // ===========================================================================

    describe('analyzeRisks', () => {
        it('无风险标签应返回空数组', () => {
            const colors = [
                createMockColor('Color1'),
                createMockColor('Color2'),
            ];

            const risks = analyzeRisks(colors);
            expect(risks).toHaveLength(0);
        });

        it('单个颜色单个风险应正确识别', () => {
            const colors = [createMockColor('Color1', ['large_area'])];

            const risks = analyzeRisks(colors);
            expect(risks).toHaveLength(1);
            expect(risks[0].type).toBe('large_area');
            expect(risks[0].affectedColors).toContain('Color1');
            expect(risks[0].description).toBeTruthy();
            expect(risks[0].mitigation).toBeTruthy();
        });

        it('多个颜色相同风险应合并', () => {
            const colors = [
                createMockColor('Color1', ['gradient']),
                createMockColor('Color2', ['gradient']),
                createMockColor('Color3', ['gradient']),
            ];

            const risks = analyzeRisks(colors);
            expect(risks).toHaveLength(1);
            expect(risks[0].type).toBe('gradient');
            expect(risks[0].affectedColors).toHaveLength(3);
            expect(risks[0].affectedColors).toContain('Color1');
            expect(risks[0].affectedColors).toContain('Color2');
            expect(risks[0].affectedColors).toContain('Color3');
        });

        it('单个颜色多个风险应分别记录', () => {
            const colors = [
                createMockColor('Color1', ['large_area', 'gradient', 'overprint']),
            ];

            const risks = analyzeRisks(colors);
            expect(risks).toHaveLength(3);

            const riskTypes = risks.map((r) => r.type);
            expect(riskTypes).toContain('large_area');
            expect(riskTypes).toContain('gradient');
            expect(riskTypes).toContain('overprint');
        });

        it('高风险标签应标记为 high 严重度', () => {
            const colors = [createMockColor('Color1', ['overprint'])];

            const risks = analyzeRisks(colors);
            expect(risks[0].severity).toBe('high');
        });

        it('中风险标签应标记为 medium 严重度', () => {
            const colors = [createMockColor('Color1', ['critical'])];

            const risks = analyzeRisks(colors);
            expect(risks[0].severity).toBe('medium');
        });

        it('低风险标签应标记为 low 严重度', () => {
            const colors = [createMockColor('Color1', ['bleed'])];

            const risks = analyzeRisks(colors);
            expect(risks[0].severity).toBe('low');
        });

        it('受影响颜色≥3个应提升为 high 严重度', () => {
            const colors = [
                createMockColor('Color1', ['bleed']),
                createMockColor('Color2', ['bleed']),
                createMockColor('Color3', ['bleed']),
            ];

            const risks = analyzeRisks(colors);
            // bleed 本身是低风险，但3个颜色受影响应提升为高
            expect(risks[0].severity).toBe('high');
        });

        it('受影响颜色=2个应提升为 medium 严重度', () => {
            const colors = [
                createMockColor('Color1', ['bleed']),
                createMockColor('Color2', ['bleed']),
            ];

            const risks = analyzeRisks(colors);
            // bleed 本身是低风险，但2个颜色受影响应提升为中
            expect(risks[0].severity).toBe('medium');
        });

        it('风险应按严重度排序（high > medium > low）', () => {
            const colors = [
                createMockColor('Color1', ['bleed']), // low
                createMockColor('Color2', ['critical']), // medium
                createMockColor('Color3', ['overprint']), // high
            ];

            const risks = analyzeRisks(colors);
            expect(risks.length).toBe(3);
            expect(risks[0].severity).toBe('high');
            expect(risks[1].severity).toBe('medium');
            expect(risks[2].severity).toBe('low');
        });

        it('应处理缺少名称的颜色', () => {
            const colors: MappedColorItem[] = [
                {
                    original: {
                        colorId: 'TEST-001',
                        riskTags: ['large_area'] as MappedColorItem['original']['riskTags'],
                        lab: { L: 50, a: 0, b: 0 },
                        usage: ['fill'],
                    },
                    status: ColorMappingStatus.VERIFIED,
                    matchedColorId: 'TEST-001',
                    deltaE: 0,
                },
            ];

            const risks = analyzeRisks(colors);
            expect(risks).toHaveLength(1);
            expect(risks[0].affectedColors[0]).toBe('TEST-001'); // fallback to colorId
        });

        it('应处理空数组输入', () => {
            const risks = analyzeRisks([]);
            expect(risks).toHaveLength(0);
        });

        it('每个风险应包含描述和缓解措施', () => {
            const allRiskTags = [
                'large_area',
                'gradient',
                'overprint',
                'fine_line',
                'small_text',
                'bleed',
                'critical',
            ];

            const colors = [createMockColor('TestColor', allRiskTags)];
            const risks = analyzeRisks(colors);

            for (const risk of risks) {
                expect(risk.description).toBeTruthy();
                expect(risk.description.length).toBeGreaterThan(10);
                expect(risk.mitigation).toBeTruthy();
                expect(risk.mitigation.length).toBeGreaterThan(10);
            }
        });
    });

    // ===========================================================================
    // 集成场景测试
    // ===========================================================================

    describe('集成场景', () => {
        it('复杂印刷场景应正确识别所有风险', () => {
            // 模拟一个复杂的印刷项目：
            // - 大面积色块的品牌色
            // - 带渐变的背景
            // - 叠印效果的设计元素
            // - 细线条的装饰
            const colors = [
                createMockColor('Brand Red', ['large_area', 'critical']),
                createMockColor('Background Gradient', ['gradient']),
                createMockColor('Overlay Blue', ['overprint']),
                createMockColor('Fine Lines Gold', ['fine_line']),
            ];

            const risks = analyzeRisks(colors);

            // 应识别出5种不同风险
            const riskTypes = new Set(risks.map((r) => r.type));
            expect(riskTypes.size).toBe(5);

            // 高风险项应排在前面
            const highRisks = risks.filter((r) => r.severity === 'high');
            expect(highRisks.length).toBeGreaterThan(0);
        });

        it('相同风险在多个颜色中应正确聚合', () => {
            // 多个品牌色都是大面积+关键色
            const colors = [
                createMockColor('Brand Primary', ['large_area', 'critical']),
                createMockColor('Brand Secondary', ['large_area', 'critical']),
                createMockColor('Brand Accent', ['large_area']),
            ];

            const risks = analyzeRisks(colors);

            // large_area 应包含3个颜色
            const largeAreaRisk = risks.find((r) => r.type === 'large_area');
            expect(largeAreaRisk?.affectedColors).toHaveLength(3);

            // critical 应包含2个颜色
            const criticalRisk = risks.find((r) => r.type === 'critical');
            expect(criticalRisk?.affectedColors).toHaveLength(2);
        });
    });
});
