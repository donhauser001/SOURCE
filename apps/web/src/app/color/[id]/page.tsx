/**
 * 色彩身份证页面 v1.0
 *
 * 基于《色彩身份证字段规范 v1.0》
 * 每个 ColorID 的专属展示页面
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ColorIdentityCard } from '@/components/color/color-identity-card';
import { PaperTypeLabels, RecommendationLabels, ColorStatusLabels, AuditStatusLabels } from '@/lib/validations/color';
import { SiteHeader } from '@/components/site-header';

interface Props {
    params: Promise<{ id: string }>;
}

// 生成静态路径
export async function generateStaticParams() {
    const colors = await prisma.color.findMany({
        where: {
            OR: [
                { status: 'ACTIVE' },
                { status: 'VERIFIED' },
            ],
        },
        select: { colorId: true },
    });

    return colors.map((color) => ({
        id: color.colorId,
    }));
}

// 生成元数据
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    const color = await prisma.color.findUnique({
        where: { colorId: id },
        select: {
            colorId: true,
            name: true,
            labL: true,
            labA: true,
            labB: true,
            measurementStandard: true,
        },
    });

    if (!color) {
        return {
            title: '颜色不存在 | SOURCE',
        };
    }

    const title = `${color.colorId} ${color.name} | SOURCE 色彩身份证`;
    const description = `查看 ${color.name} (${color.colorId}) 的真源 Lab 数据、纸张表现、配方与验证证据。Lab: L*${color.labL.toFixed(1)} a*${color.labA.toFixed(1)} b*${color.labB.toFixed(1)} (${color.measurementStandard})`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            siteName: 'SOURCE',
            locale: 'zh_CN',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

// 标签映射
const recipeStatusLabels: Record<string, string> = {
    EXPERIMENTAL: '实验中',
    VERIFIED: '已验证',
    DEPRECATED: '已废弃',
};

const costLevelLabels: Record<string, string> = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
};

const inkTypeLabels: Record<string, string> = {
    BASE: '基础色',
    SPOT: '专色',
    EXTENDER: '冲淡剂',
};

const fitResultLabels: Record<string, string> = {
    RECOMMENDED: '推荐',
    USABLE: '可用',
    NOT_RECOMMENDED: '不推荐',
};

const conclusionLevelLabels: Record<string, string> = {
    PASS: '通过',
    CONDITIONAL: '有条件通过',
    FAIL: '不通过',
};

const riskTypeLabels: Record<string, string> = {
    COLOR_SHIFT: '色偏',
    GRAYING: '发灰',
    DOT_LOSS: '绝网',
    UNSTABLE: '不稳定',
};

const paperCategoryLabels: Record<string, string> = {
    COATED: '涂布',
    UNCOATED: '非涂布',
    SPECIALTY: '特种',
};

// 参与角色标签
const participationRoleLabels: Record<string, string> = {
    PRINTER: '印厂',
    PAPER_SUPPLIER: '纸张供应',
    INK_SUPPLIER: '油墨供应',
    AUDITOR: '审计顾问',
    CO_BUILDER: '共建者',
    TESTER: '测试员',
    RESEARCHER: '研究员',
};

// 参与范围标签
const participationScopeLabels: Record<string, string> = {
    IDENTITY: '色彩身份证',
    RECIPE: '配方验证',
    BATCH: '批次追样',
    COLLAB: '研究合作',
};

export default async function ColorPage({ params }: Props) {
    const { id } = await params;

    // 获取完整的色彩身份证数据（v1.0 规范）
    const color = await prisma.color.findUnique({
        where: { colorId: id },
        include: {
            batch: {
                select: {
                    batchNo: true,
                    type: true,
                    instrumentModel: true,
                    calibratedAt: true,
                    createdBy: true,
                },
            },
            paperProfiles: {
                orderBy: [{ recommendation: 'asc' }, { paperType: 'asc' }],
                include: {
                    batch: {
                        select: { batchNo: true },
                    },
                },
            },
            proofingPacks: {
                where: { isActive: true },
                select: {
                    id: true,
                    paperType: true,
                    price: true,
                    externalUrl: true,
                },
            },
            // v1.0 新增关联
            paperRecommendations: {
                include: {
                    paper: true,
                },
            },
            recipes: {
                include: {
                    ingredients: {
                        orderBy: { order: 'asc' },
                    },
                    fitMatrixEntries: {
                        include: {
                            paper: true,
                        },
                    },
                    testReports: {
                        include: {
                            partner: true,
                        },
                    },
                },
            },
            risks: true,
            // v0.2.2 新增：参与者关联
            participations: {
                where: { status: 'ACTIVE' },
                include: {
                    partner: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: { roleInColor: 'asc' },
            },
        },
    });

    if (!color) {
        notFound();
    }

    // 转换为页面组件需要的格式（v1.0）
    const colorData = {
        colorId: color.colorId,
        name: color.name,
        slug: color.slug,
        status: color.status,
        statusLabel: ColorStatusLabels[color.status] || color.status,
        version: color.version,
        lastVerifiedAt: color.lastVerifiedAt?.toISOString() || null,

        trueSource: {
            labL: color.labL,
            labA: color.labA,
            labB: color.labB,
            deltaETolerance: color.deltaETolerance,
            measurementDevice: color.measurementDevice,
            measurementStandard: color.measurementStandard,
            measurementCondition: color.measurementCondition,
            measuredAt: color.measuredAt.toISOString(),
            trueSourceNote: color.trueSourceNote,
        },

        audit: {
            auditStatus: color.auditStatus,
            auditStatusLabel: AuditStatusLabels[color.auditStatus] || color.auditStatus,
            auditors: color.auditors,
            auditNotes: color.auditNotes,
            lastAuditAt: color.lastAuditAt?.toISOString() || null,
        },

        batch: color.batch
            ? {
                batchNo: color.batch.batchNo,
                type: color.batch.type,
                instrumentModel: color.batch.instrumentModel,
                calibratedAt: color.batch.calibratedAt?.toISOString() || null,
            }
            : null,

        // 旧模型（保持兼容）
        inkRecipe: {},

        paperProfiles: color.paperProfiles.map((p) => ({
            id: p.id,
            paperType: p.paperType,
            paperTypeLabel: PaperTypeLabels[p.paperType],
            labL: p.labL,
            labA: p.labA,
            labB: p.labB,
            deltaE: p.deltaE,
            glossiness: p.glossiness,
            inkAbsorption: p.inkAbsorption,
            gamutCoverage: p.gamutCoverage,
            scanImageUrl: p.scanImageUrl,
            recommendation: p.recommendation,
            recommendationLabel: RecommendationLabels[p.recommendation],
            cautionNote: p.cautionNote,
            batchNo: p.batch?.batchNo || null,
        })),

        proofingPacks: color.proofingPacks.map((p) => ({
            id: p.id,
            paperType: p.paperType,
            paperTypeLabel: PaperTypeLabels[p.paperType],
            price: p.price,
            externalUrl: p.externalUrl,
        })),

        // v1.0 新增数据
        paperRecommendations: color.paperRecommendations.map((rec) => ({
            id: rec.id,
            paperId: rec.paper.paperId,
            paperName: rec.paper.name,
            paperCategory: paperCategoryLabels[rec.paper.paperCategory] || rec.paper.paperCategory,
            recommendationType: rec.recommendationType as 'WHITELIST' | 'BLACKLIST',
            reason: rec.reason,
        })),

        recipes: color.recipes.map((recipe) => ({
            id: recipe.id,
            recipeId: recipe.recipeId,
            name: recipe.name,
            status: recipe.status,
            statusLabel: recipeStatusLabels[recipe.status] || recipe.status,
            costLevel: recipe.costLevel,
            costLevelLabel: costLevelLabels[recipe.costLevel] || recipe.costLevel,
            applicablePapers: recipe.applicablePapers,
            notes: recipe.notes,
            ingredients: recipe.ingredients.map((ing) => ({
                inkName: ing.inkName,
                inkType: ing.inkType,
                inkTypeLabel: inkTypeLabels[ing.inkType] || ing.inkType,
                percentage: ing.percentage,
            })),
        })),

        fitMatrix: color.recipes.flatMap((recipe) =>
            recipe.fitMatrixEntries.map((entry) => ({
                id: entry.id,
                recipeId: recipe.recipeId,
                recipeName: recipe.name,
                paperId: entry.paper.paperId,
                paperName: entry.paper.name,
                fitResult: entry.fitResult,
                fitResultLabel: fitResultLabels[entry.fitResult] || entry.fitResult,
                deltaEResult: entry.deltaEResult,
                stabilityScore: entry.stabilityScore,
                issueTags: entry.issueTags,
                conclusionNote: entry.conclusionNote,
            }))
        ),

        testReports: color.recipes.flatMap((recipe) =>
            recipe.testReports.map((report) => ({
                id: report.id,
                reportId: report.reportId,
                recipeName: recipe.name,
                testedPaperIds: report.testedPaperIds,
                printerPartner: report.printerPartner,
                pressModel: report.pressModel,
                testDate: report.testDate.toISOString(),
                measurementDevice: report.measurementDevice,
                conclusionLevel: report.conclusionLevel,
                conclusionLevelLabel: conclusionLevelLabels[report.conclusionLevel] || report.conclusionLevel,
                summary: report.summary,
                collabLink: report.collabLink,
            }))
        ),

        risks: color.risks.map((risk) => ({
            id: risk.id,
            riskType: risk.riskType,
            riskTypeLabel: riskTypeLabels[risk.riskType] || risk.riskType,
            affectedPaperIds: risk.affectedPaperIds,
            description: risk.description,
            mitigation: risk.mitigation,
        })),

        // v0.2.2 新增：参与者数据
        participations: color.participations.map((p) => ({
            id: p.id,
            entityType: p.entityType,
            roleInColor: p.roleInColor,
            roleInColorLabel: participationRoleLabels[p.roleInColor] || p.roleInColor,
            scope: p.scope,
            scopeLabel: participationScopeLabels[p.scope] || p.scope,
            status: p.status,
            // 实体信息
            partnerName: p.partner?.name || null,
            partnerShortName: p.partner?.shortName || null,
            partnerId: p.partner?.partnerId || null,
            userName: p.user?.name || null,
            userEmail: p.user?.email || null,
            externalEntityName: p.externalEntityName,
            // 证据链
            evidenceType: p.evidenceType,
            evidenceId: p.evidenceId,
            evidenceUrl: p.evidenceUrl,
            note: p.note,
            startAt: p.startAt?.toISOString() || null,
            endAt: p.endAt?.toISOString() || null,
        })),
    };

    const isDark = color.labL < 50;

    return (
        <>
            <SiteHeader isDark={isDark} />
            <main className="min-h-screen">
                <ColorIdentityCard color={colorData} />
            </main>
        </>
    );
}
