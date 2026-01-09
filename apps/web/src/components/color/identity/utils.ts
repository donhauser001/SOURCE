/**
 * 色彩身份证工具函数
 */

// 获取推荐状态的 badge variant
export function getRecommendationVariant(rec: string) {
    switch (rec) {
        case 'BEST':
            return 'success';
        case 'GOOD':
            return 'info';
        case 'CAUTION':
            return 'warning';
        case 'AVOID':
            return 'destructive';
        default:
            return 'secondary';
    }
}

// 获取状态的 badge variant
export function getStatusVariant(status: string) {
    switch (status) {
        case 'ACTIVE':
        case 'VERIFIED':
            return 'success';
        case 'EXPERIMENTAL':
            return 'warning';
        case 'DEPRECATED':
            return 'destructive';
        default:
            return 'secondary';
    }
}

// 获取审计状态的 badge variant
export function getAuditStatusVariant(status: string) {
    return status === 'VERIFIED' ? 'success' : 'warning';
}

// 获取适配结果的 badge variant
export function getFitResultVariant(result: string) {
    switch (result) {
        case 'RECOMMENDED':
            return 'success';
        case 'USABLE':
            return 'info';
        case 'NOT_RECOMMENDED':
            return 'destructive';
        default:
            return 'secondary';
    }
}

// 获取结论等级的 badge variant
export function getConclusionVariant(level: string) {
    switch (level) {
        case 'PASS':
            return 'success';
        case 'CONDITIONAL':
            return 'warning';
        case 'FAIL':
            return 'destructive';
        default:
            return 'secondary';
    }
}
