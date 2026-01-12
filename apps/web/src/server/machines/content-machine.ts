/**
 * ColLab 内容状态机
 * 
 * 管理内容生命周期的状态流转
 * 
 * 状态流转图：
 * 
 *   DRAFT ──submit──> PENDING ──approve──> PUBLISHED
 *     ↑                  │                    │
 *     │                  │ reject             │ archive
 *     │                  ↓                    ↓
 *     └──edit────── REJECTED             ARCHIVED
 *                       │                    │
 *                       │ edit               │ restore
 *                       └────> DRAFT <───────┘
 */

import type { ContentStatus } from '@prisma/client';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 状态机事件类型
 */
export type ContentEvent =
    | { type: 'SAVE_DRAFT' }
    | { type: 'SUBMIT' }
    | { type: 'APPROVE'; reviewerId: string }
    | { type: 'REJECT'; reviewerId: string; reason: string }
    | { type: 'REQUEST_CHANGE'; reviewerId: string; reason: string }
    | { type: 'EDIT' }
    | { type: 'ARCHIVE'; reviewerId: string }
    | { type: 'RESTORE'; reviewerId: string };

/**
 * 状态转换结果
 */
export interface TransitionResult {
    success: boolean;
    newStatus?: ContentStatus;
    error?: string;
}

/**
 * 状态机上下文
 */
export interface ContentMachineContext {
    contentId: string;
    authorId: string;
    currentStatus: ContentStatus;
    featuredLevel?: string;
    rejectReason?: string;
}

// ============================================================================
// 状态转换规则
// ============================================================================

/**
 * 定义每个状态允许的转换
 */
const stateTransitions: Record<ContentStatus, Record<string, ContentStatus | null>> = {
    DRAFT: {
        SAVE_DRAFT: 'DRAFT',
        SUBMIT: 'PENDING',
    },
    PENDING: {
        APPROVE: 'PUBLISHED',
        REJECT: 'REJECTED',
        REQUEST_CHANGE: 'DRAFT',
    },
    PUBLISHED: {
        ARCHIVE: 'ARCHIVED',
    },
    REJECTED: {
        EDIT: 'DRAFT',
    },
    ARCHIVED: {
        RESTORE: 'PUBLISHED',
    },
};

/**
 * 状态中文名称
 */
export const statusLabels: Record<ContentStatus, string> = {
    DRAFT: '草稿',
    PENDING: '待审核',
    PUBLISHED: '已发布',
    REJECTED: '已拒绝',
    ARCHIVED: '已归档',
};

// ============================================================================
// 状态机函数
// ============================================================================

/**
 * 检查是否可以执行状态转换
 */
export function canTransition(
    currentStatus: ContentStatus,
    eventType: ContentEvent['type']
): boolean {
    const transitions = stateTransitions[currentStatus];
    return transitions ? eventType in transitions : false;
}

/**
 * 获取状态转换后的新状态
 */
export function getNextStatus(
    currentStatus: ContentStatus,
    eventType: ContentEvent['type']
): ContentStatus | null {
    const transitions = stateTransitions[currentStatus];
    if (!transitions || !(eventType in transitions)) {
        return null;
    }
    return transitions[eventType] ?? null;
}

/**
 * 执行状态转换
 */
export function transition(
    currentStatus: ContentStatus,
    event: ContentEvent
): TransitionResult {
    const newStatus = getNextStatus(currentStatus, event.type);

    if (!newStatus) {
        return {
            success: false,
            error: `无法从状态「${statusLabels[currentStatus]}」执行「${event.type}」操作`,
        };
    }

    return {
        success: true,
        newStatus,
    };
}

/**
 * 获取当前状态允许的所有操作
 */
export function getAllowedActions(currentStatus: ContentStatus): ContentEvent['type'][] {
    const transitions = stateTransitions[currentStatus];
    return transitions ? (Object.keys(transitions) as ContentEvent['type'][]) : [];
}

/**
 * 检查是否可以编辑内容
 * 只有草稿和被拒绝状态可以编辑
 */
export function canEdit(status: ContentStatus): boolean {
    return status === 'DRAFT' || status === 'REJECTED';
}

/**
 * 检查是否可以删除内容
 * 只有草稿和被拒绝状态可以删除
 */
export function canDelete(status: ContentStatus): boolean {
    return status === 'DRAFT' || status === 'REJECTED';
}

/**
 * 检查是否可以提交审核
 */
export function canSubmit(status: ContentStatus): boolean {
    return status === 'DRAFT';
}

/**
 * 检查内容是否公开可见
 */
export function isPubliclyVisible(status: ContentStatus): boolean {
    return status === 'PUBLISHED';
}

/**
 * 检查是否需要审核权限
 */
export function requiresReviewPermission(eventType: ContentEvent['type']): boolean {
    return ['APPROVE', 'REJECT', 'REQUEST_CHANGE', 'ARCHIVE', 'RESTORE'].includes(eventType);
}

// ============================================================================
// 状态机类（可选，提供面向对象接口）
// ============================================================================

/**
 * 内容状态机类
 */
export class ContentStateMachine {
    private context: ContentMachineContext;

    constructor(context: ContentMachineContext) {
        this.context = context;
    }

    /**
     * 获取当前状态
     */
    get currentStatus(): ContentStatus {
        return this.context.currentStatus;
    }

    /**
     * 获取上下文
     */
    get ctx(): ContentMachineContext {
        return { ...this.context };
    }

    /**
     * 检查是否可以执行事件
     */
    can(eventType: ContentEvent['type']): boolean {
        return canTransition(this.context.currentStatus, eventType);
    }

    /**
     * 执行状态转换
     */
    send(event: ContentEvent): TransitionResult {
        const result = transition(this.context.currentStatus, event);

        if (result.success && result.newStatus) {
            this.context.currentStatus = result.newStatus;

            // 处理特殊事件的副作用
            if (event.type === 'REJECT' || event.type === 'REQUEST_CHANGE') {
                this.context.rejectReason = event.reason;
            } else if (event.type === 'APPROVE') {
                this.context.rejectReason = undefined;
            }
        }

        return result;
    }

    /**
     * 获取允许的操作
     */
    getAllowedActions(): ContentEvent['type'][] {
        return getAllowedActions(this.context.currentStatus);
    }

    /**
     * 检查是否可以编辑
     */
    canEdit(): boolean {
        return canEdit(this.context.currentStatus);
    }

    /**
     * 检查是否可以删除
     */
    canDelete(): boolean {
        return canDelete(this.context.currentStatus);
    }

    /**
     * 检查是否公开可见
     */
    isPubliclyVisible(): boolean {
        return isPubliclyVisible(this.context.currentStatus);
    }
}

/**
 * 创建状态机实例
 */
export function createContentMachine(context: ContentMachineContext): ContentStateMachine {
    return new ContentStateMachine(context);
}

// ============================================================================
// 导出默认状态
// ============================================================================

/**
 * 新内容的默认状态
 */
export const DEFAULT_CONTENT_STATUS: ContentStatus = 'DRAFT';

/**
 * 状态优先级（用于排序）
 */
export const statusPriority: Record<ContentStatus, number> = {
    PENDING: 0,    // 最高优先级（待处理）
    DRAFT: 1,
    REJECTED: 2,
    PUBLISHED: 3,
    ARCHIVED: 4,
};
