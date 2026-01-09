/**
 * 色彩身份证类型定义
 */

export interface TrueSource {
    labL: number;
    labA: number;
    labB: number;
    deltaETolerance: number;
    measurementDevice: string;
    measurementStandard: string;
    measurementCondition: string | null;
    measuredAt: string;
    trueSourceNote: string | null;
}

export interface PaperProfile {
    id: string;
    paperType: string;
    paperTypeLabel: string;
    labL: number;
    labA: number;
    labB: number;
    deltaE: number | null;
    glossiness: number;
    inkAbsorption: number;
    gamutCoverage: number;
    scanImageUrl: string | null;
    recommendation: string;
    recommendationLabel: string;
    cautionNote: string | null;
    batchNo: string | null;
}

export interface PaperRecommendation {
    id: string;
    paperId: string;
    paperName: string;
    paperCategory: string;
    recommendationType: 'WHITELIST' | 'BLACKLIST';
    reason: string;
}

export interface Recipe {
    id: string;
    recipeId: string;
    name: string | null;
    status: string;
    statusLabel: string;
    costLevel: string;
    costLevelLabel: string;
    applicablePapers: string[];
    notes: string | null;
    ingredients: RecipeIngredient[];
}

export interface RecipeIngredient {
    inkName: string;
    inkType: string;
    inkTypeLabel: string;
    percentage: number;
}

export interface FitMatrixEntry {
    id: string;
    recipeId: string;
    recipeName: string | null;
    paperId: string;
    paperName: string;
    fitResult: string;
    fitResultLabel: string;
    deltaEResult: number | null;
    stabilityScore: number | null;
    issueTags: string[];
    conclusionNote: string;
}

export interface RecipeTestReport {
    id: string;
    reportId: string;
    recipeName: string | null;
    testedPaperIds: string[];
    printerPartner: string;
    pressModel: string | null;
    testDate: string;
    measurementDevice: string;
    conclusionLevel: string;
    conclusionLevelLabel: string;
    summary: string;
    collabLink: string | null;
}

export interface ColorRisk {
    id: string;
    riskType: string;
    riskTypeLabel: string;
    affectedPaperIds: string[];
    description: string;
    mitigation: string | null;
}

export interface Participation {
    id: string;
    entityType: string;
    roleInColor: string;
    roleInColorLabel: string;
    scope: string;
    scopeLabel: string;
    status: string;
    partnerName: string | null;
    partnerShortName: string | null;
    partnerId: string | null;
    userName: string | null;
    userEmail: string | null;
    externalEntityName: string | null;
    evidenceType: string | null;
    evidenceId: string | null;
    evidenceUrl: string | null;
    note: string | null;
    startAt: string | null;
    endAt: string | null;
}

export interface AuditInfo {
    auditStatus: string;
    auditStatusLabel: string;
    auditors: string[];
    auditNotes: string | null;
    lastAuditAt: string | null;
}

export interface ProofingPack {
    id: string;
    paperType: string;
    paperTypeLabel: string;
    price: number;
    externalUrl: string | null;
}

export interface ColorData {
    colorId: string;
    name: string;
    slug: string;
    status: string;
    statusLabel: string;
    version: string;
    lastVerifiedAt: string | null;
    trueSource: TrueSource;
    audit: AuditInfo;
    batch: {
        batchNo: string;
        type: string;
        instrumentModel: string | null;
        calibratedAt: string | null;
    } | null;
    paperProfiles: PaperProfile[];
    inkRecipe: Record<string, number>;
    proofingPacks: ProofingPack[];
    paperRecommendations?: PaperRecommendation[];
    recipes?: Recipe[];
    fitMatrix?: FitMatrixEntry[];
    testReports?: RecipeTestReport[];
    risks?: ColorRisk[];
    participations?: Participation[];
}
