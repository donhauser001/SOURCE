/**
 * 分析报告服务
 *
 * 负责：
 * 1. 生成完整分析报告
 * 2. 存储报告到数据库
 * 3. 管理报告生命周期
 */

import { prisma } from '@/lib/db';
import type { SourcePack, PrintIntent, DocInfo } from '@/lib/validations/sourcepack';
import type { MappedColorItem, ParseResult } from './parser';
import { mapSourcePack } from './parser';
import { runRecommendationEngine, type RecommendationResult, type RiskItem, type PaperRecommendationItem, type AvoidItem } from './recommendation-engine';

// =============================================================================
// 类型定义
// =============================================================================

/**
 * 完整分析报告
 */
export interface AnalysisReportData {
    /** 报告 ID */
    id: string;
    /** 文档摘要 */
    summary: {
        docInfo: DocInfo;
        colorStats: {
            total: number;
            verified: number;
            partialMatch: number;
            unmapped: number;
            withRisks: number;
        };
    };
    /** 印刷意图 */
    printIntent?: PrintIntent;
    /** 颜色分析结果 */
    colorAnalysis: MappedColorItem[];
    /** 风险识别结果 */
    risks: RiskItem[];
    /** 纸张推荐 */
    recommendations: PaperRecommendationItem[];
    /** 避坑列表 */
    avoidList: AvoidItem[];
    /** 引用的证据 */
    citations: string[];
    /** 生成时间 */
    createdAt: string;
    /** 过期时间 */
    expiresAt: string;
}

/**
 * 报告生成选项
 */
export interface GenerateReportOptions {
    /** 用户 ID（可选，用于关联报告） */
    userId?: string;
    /** 报告保留天数，默认 30 天 */
    retentionDays?: number;
}

// =============================================================================
// 报告生成
// =============================================================================

/**
 * 从 SourcePack 生成完整分析报告
 */
export async function generateAnalysisReport(
    sourcePack: SourcePack,
    options: GenerateReportOptions = {}
): Promise<AnalysisReportData> {
    const { userId, retentionDays = 30 } = options;

    // 1. 解析和映射颜色
    const parseResult = await mapSourcePack(sourcePack);

    if (!parseResult.success || !parseResult.mappedColors) {
        throw new Error('颜色映射失败');
    }

    const mappedColors = parseResult.mappedColors;

    // 2. 运行推荐引擎
    const recommendationResult = await runRecommendationEngine(mappedColors, sourcePack.printIntent);

    // 3. 构建报告摘要
    const summary = {
        docInfo: sourcePack.docInfo,
        colorStats: {
            total: parseResult.summary?.totalColors || 0,
            verified: parseResult.summary?.verifiedCount || 0,
            partialMatch: parseResult.summary?.partialMatchCount || 0,
            unmapped: parseResult.summary?.unmappedCount || 0,
            withRisks: parseResult.summary?.riskColorsCount || 0,
        },
    };

    // 4. 计算过期时间
    const now = new Date();
    const expiresAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);

    // 5. 存储到数据库
    const report = await prisma.analysisReport.create({
        data: {
            userId: userId || null,
            summary: summary as object,
            printIntent: (sourcePack.printIntent as object) || {},
            colorAnalysis: mappedColors as object[],
            risks: recommendationResult.risks as object[],
            recommendations: recommendationResult.recommendations as object[],
            avoidList: recommendationResult.avoidList as object[],
            citations: recommendationResult.citations,
            expiresAt,
        },
    });

    return {
        id: report.id,
        summary,
        printIntent: sourcePack.printIntent,
        colorAnalysis: mappedColors,
        risks: recommendationResult.risks,
        recommendations: recommendationResult.recommendations,
        avoidList: recommendationResult.avoidList,
        citations: recommendationResult.citations,
        createdAt: report.createdAt.toISOString(),
        expiresAt: report.expiresAt.toISOString(),
    };
}

/**
 * 从已解析的数据生成报告（不重新解析）
 */
export async function generateReportFromParsed(
    parseResult: ParseResult,
    sourcePack: SourcePack,
    options: GenerateReportOptions = {}
): Promise<AnalysisReportData> {
    const { userId, retentionDays = 30 } = options;

    if (!parseResult.success || !parseResult.mappedColors) {
        throw new Error('解析结果无效');
    }

    const mappedColors = parseResult.mappedColors;

    // 运行推荐引擎
    const recommendationResult = await runRecommendationEngine(mappedColors, sourcePack.printIntent);

    // 构建报告摘要
    const summary = {
        docInfo: sourcePack.docInfo,
        colorStats: {
            total: parseResult.summary?.totalColors || 0,
            verified: parseResult.summary?.verifiedCount || 0,
            partialMatch: parseResult.summary?.partialMatchCount || 0,
            unmapped: parseResult.summary?.unmappedCount || 0,
            withRisks: parseResult.summary?.riskColorsCount || 0,
        },
    };

    // 计算过期时间
    const now = new Date();
    const expiresAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);

    // 存储到数据库
    const report = await prisma.analysisReport.create({
        data: {
            userId: userId || null,
            summary: summary as object,
            printIntent: (sourcePack.printIntent as object) || {},
            colorAnalysis: mappedColors as object[],
            risks: recommendationResult.risks as object[],
            recommendations: recommendationResult.recommendations as object[],
            avoidList: recommendationResult.avoidList as object[],
            citations: recommendationResult.citations,
            expiresAt,
        },
    });

    return {
        id: report.id,
        summary,
        printIntent: sourcePack.printIntent,
        colorAnalysis: mappedColors,
        risks: recommendationResult.risks,
        recommendations: recommendationResult.recommendations,
        avoidList: recommendationResult.avoidList,
        citations: recommendationResult.citations,
        createdAt: report.createdAt.toISOString(),
        expiresAt: report.expiresAt.toISOString(),
    };
}

// =============================================================================
// 报告查询
// =============================================================================

/**
 * 获取报告
 */
export async function getReport(reportId: string): Promise<AnalysisReportData | null> {
    const report = await prisma.analysisReport.findUnique({
        where: { id: reportId },
    });

    if (!report || report.deletedAt) {
        return null;
    }

    // 检查是否过期
    if (report.expiresAt < new Date()) {
        return null;
    }

    return {
        id: report.id,
        summary: report.summary as AnalysisReportData['summary'],
        printIntent: report.printIntent as PrintIntent | undefined,
        colorAnalysis: report.colorAnalysis as MappedColorItem[],
        risks: report.risks as RiskItem[],
        recommendations: report.recommendations as PaperRecommendationItem[],
        avoidList: report.avoidList as AvoidItem[],
        citations: report.citations,
        createdAt: report.createdAt.toISOString(),
        expiresAt: report.expiresAt.toISOString(),
    };
}

/**
 * 获取用户的报告列表
 */
export async function getUserReports(
    userId: string,
    options: { limit?: number; offset?: number } = {}
): Promise<{ reports: AnalysisReportData[]; total: number }> {
    const { limit = 10, offset = 0 } = options;

    const [reports, total] = await Promise.all([
        prisma.analysisReport.findMany({
            where: {
                userId,
                deletedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.analysisReport.count({
            where: {
                userId,
                deletedAt: null,
                expiresAt: { gt: new Date() },
            },
        }),
    ]);

    return {
        reports: reports.map((report) => ({
            id: report.id,
            summary: report.summary as AnalysisReportData['summary'],
            printIntent: report.printIntent as PrintIntent | undefined,
            colorAnalysis: report.colorAnalysis as MappedColorItem[],
            risks: report.risks as RiskItem[],
            recommendations: report.recommendations as PaperRecommendationItem[],
            avoidList: report.avoidList as AvoidItem[],
            citations: report.citations,
            createdAt: report.createdAt.toISOString(),
            expiresAt: report.expiresAt.toISOString(),
        })),
        total,
    };
}

/**
 * 删除报告（软删除）
 */
export async function deleteReport(reportId: string, userId?: string): Promise<boolean> {
    const where: { id: string; userId?: string } = { id: reportId };
    if (userId) {
        where.userId = userId;
    }

    const result = await prisma.analysisReport.updateMany({
        where,
        data: { deletedAt: new Date() },
    });

    return result.count > 0;
}

// =============================================================================
// 证据链查询
// =============================================================================

/**
 * 获取报告的完整证据链
 */
export async function getReportEvidence(reportId: string): Promise<{
    paperProfiles: Array<{
        id: string;
        colorId: string;
        colorName: string;
        paperType: string;
        deltaE: number | null;
        recommendation: string;
    }>;
    batches: Array<{
        id: string;
        batchNo: string;
        type: string;
        createdAt: string;
    }>;
    auditNotes: Array<{
        id: string;
        advisorName: string;
        verdict: string;
        note: string;
    }>;
}> {
    const report = await prisma.analysisReport.findUnique({
        where: { id: reportId },
    });

    if (!report) {
        return { paperProfiles: [], batches: [], auditNotes: [] };
    }

    const citations = report.citations;

    // 查询 PaperProfile
    const paperProfiles = await prisma.paperProfile.findMany({
        where: { id: { in: citations } },
        include: { color: true },
    });

    // 查询 Batch
    const batches = await prisma.batch.findMany({
        where: { id: { in: citations } },
    });

    // 查询 AuditNote
    const auditNotes = await prisma.auditNote.findMany({
        where: { id: { in: citations } },
    });

    return {
        paperProfiles: paperProfiles.map((p) => ({
            id: p.id,
            colorId: p.color.colorId,
            colorName: p.color.name,
            paperType: p.paperType,
            deltaE: p.deltaE,
            recommendation: p.recommendation,
        })),
        batches: batches.map((b) => ({
            id: b.id,
            batchNo: b.batchNo,
            type: b.type,
            createdAt: b.createdAt.toISOString(),
        })),
        auditNotes: auditNotes.map((n) => ({
            id: n.id,
            advisorName: n.advisorName,
            verdict: n.verdict,
            note: n.note,
        })),
    };
}
