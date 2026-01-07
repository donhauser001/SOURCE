/**
 * cite 命令测试
 * 
 * 测试引用格式生成逻辑
 */

import { describe, it, expect } from 'vitest';

// 引用数据接口
interface CitationData {
    colorId: string;
    name: string;
    version: string;
    url: string;
    accessedAt: string;
    year: number;
    auditStatus: string;
}

/**
 * 生成 APA 格式引用
 */
function formatApa(data: CitationData): string {
    return `SOURCE. (${data.year}). ${data.colorId}: ${data.name} [Color Identity]. Retrieved from ${data.url}`;
}

/**
 * 生成 BibTeX 格式引用
 */
function formatBibtex(data: CitationData): string {
    const key = data.colorId.replace(/-/g, '_').toLowerCase();
    return `@misc{source_${key},
  author = {{SOURCE}},
  title = {{${data.colorId}: ${data.name}}},
  year = {${data.year}},
  howpublished = {\\url{${data.url}}},
  note = {Color Identity, v${data.version}, ${data.auditStatus === 'VERIFIED' ? 'Verified' : 'Under Review'}}
}`;
}

describe('cite 命令', () => {
    const mockCitationData: CitationData = {
        colorId: 'CN-Song-04',
        name: '烟雨青',
        version: '1.0',
        url: 'https://source.ink/color/CN-Song-04',
        accessedAt: '2026-01-08T12:00:00.000Z',
        year: 2026,
        auditStatus: 'VERIFIED',
    };

    describe('formatApa()', () => {
        it('应生成正确的 APA 格式', () => {
            const result = formatApa(mockCitationData);
            expect(result).toBe(
                'SOURCE. (2026). CN-Song-04: 烟雨青 [Color Identity]. Retrieved from https://source.ink/color/CN-Song-04'
            );
        });

        it('应包含年份', () => {
            const result = formatApa(mockCitationData);
            expect(result).toContain('(2026)');
        });

        it('应包含 colorId 和名称', () => {
            const result = formatApa(mockCitationData);
            expect(result).toContain('CN-Song-04: 烟雨青');
        });

        it('应包含 URL', () => {
            const result = formatApa(mockCitationData);
            expect(result).toContain('https://source.ink/color/CN-Song-04');
        });
    });

    describe('formatBibtex()', () => {
        it('应生成正确的 BibTeX 格式', () => {
            const result = formatBibtex(mockCitationData);
            expect(result).toContain('@misc{source_cn_song_04,');
        });

        it('应将 colorId 转换为小写下划线格式作为 key', () => {
            const result = formatBibtex(mockCitationData);
            expect(result).toContain('source_cn_song_04');
        });

        it('应包含作者字段', () => {
            const result = formatBibtex(mockCitationData);
            expect(result).toContain('author = {{SOURCE}}');
        });

        it('应包含标题字段', () => {
            const result = formatBibtex(mockCitationData);
            expect(result).toContain('title = {{CN-Song-04: 烟雨青}}');
        });

        it('应包含年份字段', () => {
            const result = formatBibtex(mockCitationData);
            expect(result).toContain('year = {2026}');
        });

        it('应包含 URL', () => {
            const result = formatBibtex(mockCitationData);
            expect(result).toContain('\\url{https://source.ink/color/CN-Song-04}');
        });

        it('已验证状态应显示 Verified', () => {
            const result = formatBibtex(mockCitationData);
            expect(result).toContain('Verified');
        });

        it('未验证状态应显示 Under Review', () => {
            const unverified = { ...mockCitationData, auditStatus: 'UNDER_REVIEW' };
            const result = formatBibtex(unverified);
            expect(result).toContain('Under Review');
        });

        it('应包含版本号', () => {
            const result = formatBibtex(mockCitationData);
            expect(result).toContain('v1.0');
        });
    });

    describe('colorId 转换', () => {
        it('应正确处理连字符', () => {
            const key = 'CN-Song-04'.replace(/-/g, '_').toLowerCase();
            expect(key).toBe('cn_song_04');
        });

        it('应处理多个连字符', () => {
            const key = 'JP-Ukiyo-E-01'.replace(/-/g, '_').toLowerCase();
            expect(key).toBe('jp_ukiyo_e_01');
        });
    });
});

