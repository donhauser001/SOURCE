/**
 * 推荐引擎评分配置测试
 *
 * 测试纯函数：getDeltaEScore, calculateRiskScore, calculateSuitabilityScore
 */

import { describe, it, expect } from 'vitest';
import {
    getDeltaEScore,
    calculateRiskScore,
    calculateSuitabilityScore,
    DIMENSION_WEIGHTS,
    RECOMMENDATION_THRESHOLDS,
    AVOID_CONDITIONS,
} from './scoring-config';

describe('scoring-config', () => {
    // ===========================================================================
    // getDeltaEScore 测试
    // ===========================================================================

    describe('getDeltaEScore', () => {
        it('ΔE ≤ 1.0 应返回完美还原（100分）', () => {
            expect(getDeltaEScore(0.5)).toEqual({ score: 100, label: '完美还原' });
            expect(getDeltaEScore(1.0)).toEqual({ score: 100, label: '完美还原' });
        });

        it('ΔE ≤ 2.0 应返回极佳还原（95分）', () => {
            expect(getDeltaEScore(1.5)).toEqual({ score: 95, label: '极佳还原' });
            expect(getDeltaEScore(2.0)).toEqual({ score: 95, label: '极佳还原' });
        });

        it('ΔE ≤ 3.0 应返回良好还原（85分）', () => {
            expect(getDeltaEScore(2.5)).toEqual({ score: 85, label: '良好还原' });
            expect(getDeltaEScore(3.0)).toEqual({ score: 85, label: '良好还原' });
        });

        it('ΔE ≤ 5.0 应返回可接受（70分）', () => {
            expect(getDeltaEScore(4.0)).toEqual({ score: 70, label: '可接受' });
            expect(getDeltaEScore(5.0)).toEqual({ score: 70, label: '可接受' });
        });

        it('ΔE ≤ 8.0 应返回明显偏差（50分）', () => {
            expect(getDeltaEScore(6.0)).toEqual({ score: 50, label: '明显偏差' });
            expect(getDeltaEScore(8.0)).toEqual({ score: 50, label: '明显偏差' });
        });

        it('ΔE > 8.0 应返回严重偏差（20分）', () => {
            expect(getDeltaEScore(10)).toEqual({ score: 20, label: '严重偏差' });
            expect(getDeltaEScore(15)).toEqual({ score: 20, label: '严重偏差' });
        });

        it('边界值 ΔE = 0 应返回完美还原', () => {
            expect(getDeltaEScore(0)).toEqual({ score: 100, label: '完美还原' });
        });
    });

    // ===========================================================================
    // calculateRiskScore 测试
    // ===========================================================================

    describe('calculateRiskScore', () => {
        it('无风险标签应返回满分（100分）', () => {
            const result = calculateRiskScore([], 'COATED');
            expect(result.score).toBe(100);
            expect(result.penalties).toHaveLength(0);
        });

        it('单个风险标签应正确扣分', () => {
            const result = calculateRiskScore(['large_area'], 'COATED');
            // COATED 风险系数 1.0，large_area 基础扣分 15
            expect(result.score).toBe(85);
            expect(result.penalties).toEqual([{ tag: 'large_area', penalty: 15 }]);
        });

        it('多个风险标签应累计扣分', () => {
            const result = calculateRiskScore(['large_area', 'gradient'], 'COATED');
            // large_area: 15, gradient: 20，总扣分 35
            expect(result.score).toBe(65);
            expect(result.penalties).toHaveLength(2);
        });

        it('高风险纸张应放大扣分', () => {
            // LIGHTWEIGHT 风险系数 1.3
            const result = calculateRiskScore(['large_area'], 'LIGHTWEIGHT');
            // 15 * 1.3 = 19.5 ≈ 20（四舍五入）
            expect(result.score).toBeLessThan(85);
            expect(result.penalties[0].penalty).toBeGreaterThan(15);
        });

        it('低风险纸张应降低扣分', () => {
            // PREMIUM_MATTE 风险系数 0.9
            const result = calculateRiskScore(['large_area'], 'PREMIUM_MATTE');
            // 15 * 0.9 = 13.5 ≈ 14
            expect(result.score).toBeGreaterThan(85);
            expect(result.penalties[0].penalty).toBeLessThan(15);
        });

        it('得分不应低于 0', () => {
            // 使用所有高扣分标签
            const result = calculateRiskScore(
                ['overprint', 'gradient', 'large_area', 'critical', 'fine_line', 'small_text'],
                'LIGHTWEIGHT'
            );
            expect(result.score).toBeGreaterThanOrEqual(0);
        });

        it('未知标签应被忽略', () => {
            const result = calculateRiskScore(['unknown_tag' as any], 'COATED');
            expect(result.score).toBe(100);
            expect(result.penalties).toHaveLength(0);
        });
    });

    // ===========================================================================
    // calculateSuitabilityScore 测试
    // ===========================================================================

    describe('calculateSuitabilityScore', () => {
        it('胶印+铜版纸应有高适配分', () => {
            const result = calculateSuitabilityScore('offset', 'COATED', []);
            expect(result.score).toBe(95);
            expect(result.incompatibilities).toHaveLength(0);
        });

        it('胶印+高阶映画应有最高适配分', () => {
            const result = calculateSuitabilityScore('offset', 'PREMIUM_MATTE', []);
            expect(result.score).toBe(100);
        });

        it('数码印刷+铜版纸应有高适配分', () => {
            const result = calculateSuitabilityScore('digital', 'COATED', []);
            expect(result.score).toBe(95);
        });

        it('特殊工艺不兼容应扣分', () => {
            // 压纹不兼容轻型纸和双胶纸
            const result = calculateSuitabilityScore('offset', 'LIGHTWEIGHT', ['embossing']);
            expect(result.score).toBeLessThan(60);
            expect(result.incompatibilities).toContain('embossing');
        });

        it('UV工艺不兼容纯质纸应扣分', () => {
            const result = calculateSuitabilityScore('offset', 'UNCOATED', ['uv']);
            expect(result.incompatibilities).toContain('uv');
            expect(result.score).toBe(85 - 35); // 基础85，UV扣35
        });

        it('多个不兼容工艺应累计扣分', () => {
            const result = calculateSuitabilityScore('offset', 'LIGHTWEIGHT', [
                'varnish',
                'lamination',
            ]);
            // 基础60，varnish扣30，lamination扣25
            expect(result.score).toBe(60 - 30 - 25);
            expect(result.incompatibilities).toHaveLength(2);
        });

        it('得分不应低于 0', () => {
            const result = calculateSuitabilityScore('offset', 'LIGHTWEIGHT', [
                'embossing',
                'varnish',
                'lamination',
                'uv',
                'spot_uv',
            ]);
            expect(result.score).toBeGreaterThanOrEqual(0);
        });

        it('兼容的工艺不应扣分', () => {
            // 烫金（foil）和模切（die_cut）兼容所有纸张
            const result = calculateSuitabilityScore('offset', 'LIGHTWEIGHT', [
                'foil',
                'die_cut',
            ]);
            expect(result.score).toBe(60); // 只有基础分，无扣分
            expect(result.incompatibilities).toHaveLength(0);
        });
    });

    // ===========================================================================
    // 配置常量验证
    // ===========================================================================

    describe('配置常量验证', () => {
        it('维度权重总和应为 1.0', () => {
            const total = Object.values(DIMENSION_WEIGHTS).reduce((sum, w) => sum + w, 0);
            expect(total).toBeCloseTo(1.0, 5);
        });

        it('推荐阈值应正确排序', () => {
            expect(RECOMMENDATION_THRESHOLDS.HIGHLY_RECOMMENDED).toBeGreaterThan(
                RECOMMENDATION_THRESHOLDS.RECOMMENDED
            );
            expect(RECOMMENDATION_THRESHOLDS.RECOMMENDED).toBeGreaterThan(
                RECOMMENDATION_THRESHOLDS.USABLE
            );
        });

        it('避坑条件应合理', () => {
            expect(AVOID_CONDITIONS.maxDeltaE).toBeGreaterThan(0);
            expect(AVOID_CONDITIONS.minRiskScore).toBeLessThan(100);
            expect(AVOID_CONDITIONS.minTotalScore).toBeLessThan(RECOMMENDATION_THRESHOLDS.USABLE);
        });
    });
});
