/**
 * 工具注册表 API
 *
 * 返回 AI/CLI 可用的工具清单
 */

import { NextResponse } from 'next/server';
import { SCOPES } from '@/lib/scopes';

/**
 * 工具定义
 */
const TOOLS = [
    {
        name: 'color.get',
        description: '获取色彩身份证',
        endpoint: 'GET /api/v1/colors/{colorId}',
        scope: 'read:color',
        input: {
            type: 'object',
            properties: {
                colorId: { type: 'string', description: '色彩编号，如 CN-Song-04' },
            },
            required: ['colorId'],
        },
        output: {
            type: 'object',
            properties: {
                colorId: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                trueSource: {
                    type: 'object',
                    properties: {
                        labL: { type: 'number' },
                        labA: { type: 'number' },
                        labB: { type: 'number' },
                        measuredAt: { type: 'string', format: 'date-time' },
                        measurementDevice: { type: 'string' },
                        measurementStandard: { type: 'string' },
                        measurementCondition: { type: 'string' },
                        deltaETolerance: { type: 'number' },
                        trueSourceNote: { type: 'string' },
                    },
                },
                status: { type: 'string' },
                auditStatus: { type: 'string' },
                paperProfiles: { type: 'array' },
            },
        },
    },
    {
        name: 'color.list',
        description: '获取色彩列表',
        endpoint: 'GET /api/v1/colors',
        scope: 'read:color',
        input: {
            type: 'object',
            properties: {
                limit: { type: 'number', default: 20, maximum: 100 },
            },
        },
        output: {
            type: 'object',
            properties: {
                items: { type: 'array' },
                count: { type: 'number' },
            },
        },
    },
    {
        name: 'color.search',
        description: '搜索色彩',
        endpoint: 'GET /api/v1/colors?q={query}',
        scope: 'search:color',
        input: {
            type: 'object',
            properties: {
                q: { type: 'string', description: '搜索关键词' },
                limit: { type: 'number', default: 20, maximum: 100 },
            },
            required: ['q'],
        },
        output: {
            type: 'object',
            properties: {
                items: { type: 'array' },
                count: { type: 'number' },
            },
        },
    },
    {
        name: 'color.recommend',
        description: '获取纸张推荐',
        endpoint: 'GET /api/v1/colors/{colorId}/recommend?goal={goal}',
        scope: 'recommend:paper',
        input: {
            type: 'object',
            properties: {
                colorId: { type: 'string' },
                goal: { type: 'string', enum: ['fidelity', 'cost', 'texture'], default: 'fidelity' },
            },
            required: ['colorId'],
        },
        output: {
            type: 'object',
            properties: {
                recommendations: { type: 'array' },
                avoid: { type: 'array' },
                citations: { type: 'array' },
            },
        },
    },
    {
        name: 'cite.generate',
        description: '生成引用字符串',
        endpoint: 'GET /api/v1/cite?colorId={colorId}&paperType={paperType}',
        scope: 'cite:generate',
        input: {
            type: 'object',
            properties: {
                colorId: { type: 'string' },
                paperType: { type: 'string' },
            },
            required: ['colorId'],
        },
        output: {
            type: 'object',
            properties: {
                citation: { type: 'string' },
                format: { type: 'string', enum: ['standard', 'short', 'full'] },
            },
        },
    },
];

export async function GET() {
    return NextResponse.json({
        version: '1.0',
        tools: TOOLS,
        scopes: SCOPES,
        documentation: 'https://source.ink/docs/api',
    });
}

