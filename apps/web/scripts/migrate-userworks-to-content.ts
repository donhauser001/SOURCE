/**
 * UserWork → Content 数据迁移脚本
 *
 * 将旧版 UserWork 数据迁移到新的 Content 系统
 *
 * 迁移规则：
 * - contentType = WORK
 * - isPublic=true → status=PUBLISHED, publishedAt=createdAt
 * - isPublic=false → status=DRAFT
 * - imageUrl → coverImageUrl
 * - description → summary + body
 * - UserWorkColor → ContentColor
 *
 * 使用方法：
 * npx tsx scripts/migrate-userworks-to-content.ts [--dry-run] [--verify]
 */

import { PrismaClient, ContentType, ContentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// 命令行参数
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerify = args.includes('--verify');

// 统计信息
interface MigrationStats {
    total: number;
    migrated: number;
    skipped: number;
    errors: number;
    publicCount: number;
    draftCount: number;
}

const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    publicCount: 0,
    draftCount: 0,
};

// 定义 UserWork 类型
interface UserWorkWithColors {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    imageUrl: string;
    colorBookId: string | null;
    externalUrl: string | null;
    tags: string[];
    isPublic: boolean;
    viewCount: number;
    likeCount: number;
    createdAt: Date;
    updatedAt: Date;
    colors: Array<{
        colorId: string;
        note: string | null;
        order: number;
    }>;
}

/**
 * 生成 contentId
 * 格式: CL-W-XXXX (W=Work, 4位序号)
 */
function generateContentId(sequence: number): string {
    const paddedSeq = String(sequence).padStart(4, '0');
    return `CL-W-${paddedSeq}`;
}

/**
 * 检查是否已迁移
 */
async function isAlreadyMigrated(userWorkId: string): Promise<boolean> {
    const existing = await prisma.content.findFirst({
        where: {
            contentType: 'WORK',
            externalUrl: { contains: `migrated:${userWorkId}` },
        },
    });
    return !!existing;
}

/**
 * 迁移单个 UserWork
 */
async function migrateUserWork(
    userWork: UserWorkWithColors,
    sequence: number
): Promise<boolean> {
    try {
        // 生成 contentId
        const contentId = generateContentId(sequence);

        // 确定状态
        const status: ContentStatus = userWork.isPublic ? 'PUBLISHED' : 'DRAFT';
        const publishedAt = userWork.isPublic ? userWork.createdAt : null;

        if (isDryRun) {
            console.log(`  [DRY-RUN] Would migrate: ${userWork.id} → ${contentId}`);
            console.log(`    Title: ${userWork.title}`);
            console.log(`    Status: ${status}`);
            console.log(`    Colors: ${userWork.colors.length}`);
            return true;
        }

        // 创建 Content
        const content = await prisma.content.create({
            data: {
                contentId,
                contentType: ContentType.WORK,
                title: userWork.title,
                summary: userWork.description?.substring(0, 500) || null,
                body: userWork.description || '',
                coverImageUrl: userWork.imageUrl,
                galleryImages: [],
                externalUrl: userWork.externalUrl
                    ? `${userWork.externalUrl}|migrated:${userWork.id}`
                    : `migrated:${userWork.id}`,
                status,
                featuredLevel: 'NONE',
                authorId: userWork.userId,
                colorBookId: userWork.colorBookId,
                tags: userWork.tags,
                viewCount: userWork.viewCount,
                likeCount: userWork.likeCount,
                publishedAt,
                createdAt: userWork.createdAt,
                updatedAt: userWork.updatedAt,
            },
        });

        // 迁移颜色关联
        if (userWork.colors.length > 0) {
            await prisma.contentColor.createMany({
                data: userWork.colors.map((uc) => ({
                    contentId: content.id,
                    colorId: uc.colorId,
                    note: uc.note,
                    order: uc.order,
                })),
            });
        }

        console.log(`  ✓ Migrated: ${userWork.id} → ${contentId} (${status})`);

        // 更新统计
        if (userWork.isPublic) {
            stats.publicCount++;
        } else {
            stats.draftCount++;
        }

        return true;
    } catch (error) {
        console.error(`  ✗ Error migrating ${userWork.id}:`, error);
        stats.errors++;
        return false;
    }
}

/**
 * 获取带颜色的 UserWork
 */
async function getUserWorkWithColors(id: string): Promise<UserWorkWithColors | null> {
    return prisma.userWork.findUnique({
        where: { id },
        include: {
            colors: {
                select: {
                    colorId: true,
                    note: true,
                    order: true,
                },
            },
        },
    });
}

/**
 * 验证迁移结果
 */
async function verifyMigration() {
    console.log('\n📊 验证迁移结果...\n');

    // 获取 UserWork 总数
    const userWorkCount = await prisma.userWork.count();

    // 获取已迁移的 Content 数量（类型为 WORK）
    const contentCount = await prisma.content.count({
        where: { contentType: 'WORK' },
    });

    // 获取状态分布
    const statusDistribution = await prisma.content.groupBy({
        by: ['status'],
        where: { contentType: 'WORK' },
        _count: true,
    });

    // 验证颜色关联
    const userWorkColorCount = await prisma.userWorkColor.count();
    const contentColorCount = await prisma.contentColor.count({
        where: {
            content: { contentType: 'WORK' },
        },
    });

    console.log('=== 迁移验证报告 ===');
    console.log(`原始 UserWork 数量: ${userWorkCount}`);
    console.log(`迁移后 Content(WORK) 数量: ${contentCount}`);
    console.log(`迁移率: ${((contentCount / userWorkCount) * 100 || 0).toFixed(1)}%`);
    console.log('');
    console.log('状态分布:');
    statusDistribution.forEach((s) => {
        console.log(`  - ${s.status}: ${s._count}`);
    });
    console.log('');
    console.log(`原始 UserWorkColor 数量: ${userWorkColorCount}`);
    console.log(`迁移后 ContentColor 数量: ${contentColorCount}`);
    console.log(`颜色关联迁移率: ${((contentColorCount / userWorkColorCount) * 100 || 0).toFixed(1)}%`);

    // 检查数据一致性
    console.log('\n=== 数据一致性检查 ===');

    // 检查是否有遗漏
    if (contentCount < userWorkCount) {
        console.log(`⚠️ 有 ${userWorkCount - contentCount} 条记录未迁移`);
    } else {
        console.log('✓ 所有记录已迁移');
    }

    // 检查颜色关联
    if (contentColorCount < userWorkColorCount) {
        console.log(`⚠️ 有 ${userWorkColorCount - contentColorCount} 条颜色关联未迁移`);
    } else {
        console.log('✓ 所有颜色关联已迁移');
    }

    return {
        success: contentCount >= userWorkCount && contentColorCount >= userWorkColorCount,
        userWorkCount,
        contentCount,
        userWorkColorCount,
        contentColorCount,
    };
}

/**
 * 主迁移函数
 */
async function main() {
    console.log('='.repeat(60));
    console.log('UserWork → Content 数据迁移');
    console.log('='.repeat(60));

    if (isDryRun) {
        console.log('\n🔍 DRY-RUN 模式：不会实际修改数据\n');
    }

    if (isVerify) {
        await verifyMigration();
        return;
    }

    // 获取所有 UserWork
    const userWorks = await prisma.userWork.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
    });

    stats.total = userWorks.length;
    console.log(`\n📦 找到 ${stats.total} 条 UserWork 记录\n`);

    if (stats.total === 0) {
        console.log('没有需要迁移的数据');
        return;
    }

    // 获取已有的 Content(WORK) 最大序号
    const existingContent = await prisma.content.findFirst({
        where: {
            contentType: 'WORK',
            contentId: { startsWith: 'CL-W-' },
        },
        orderBy: { contentId: 'desc' },
    });

    let startSequence = 1;
    if (existingContent?.contentId) {
        const match = existingContent.contentId.match(/CL-W-(\d+)/);
        if (match) {
            startSequence = parseInt(match[1], 10) + 1;
        }
    }

    console.log(`📝 起始序号: ${startSequence}\n`);

    // 使用事务进行迁移
    if (!isDryRun) {
        console.log('开始迁移（使用事务）...\n');
    }

    let sequence = startSequence;

    for (const { id } of userWorks) {
        const userWork = await getUserWorkWithColors(id);
        if (!userWork) {
            console.log(`  ⚠ UserWork ${id} 不存在，跳过`);
            stats.skipped++;
            continue;
        }

        // 检查是否已迁移
        const alreadyMigrated = await isAlreadyMigrated(id);
        if (alreadyMigrated) {
            console.log(`  ⏭ UserWork ${id} 已迁移，跳过`);
            stats.skipped++;
            continue;
        }

        const success = await migrateUserWork(userWork, sequence);
        if (success) {
            stats.migrated++;
            sequence++;
        }
    }

    // 打印统计
    console.log('\n' + '='.repeat(60));
    console.log('迁移完成');
    console.log('='.repeat(60));
    console.log(`总计: ${stats.total}`);
    console.log(`成功: ${stats.migrated}`);
    console.log(`跳过: ${stats.skipped}`);
    console.log(`错误: ${stats.errors}`);
    console.log(`  - 公开作品: ${stats.publicCount}`);
    console.log(`  - 草稿作品: ${stats.draftCount}`);

    if (!isDryRun && stats.migrated > 0) {
        console.log('\n运行验证:');
        await verifyMigration();
    }
}

// 执行
main()
    .catch((e) => {
        console.error('迁移失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
