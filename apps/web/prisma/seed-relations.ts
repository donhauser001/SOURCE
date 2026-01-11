/**
 * 生成完整关联数据
 * 
 * 为所有色彩生成：
 * - PaperProfile 纸张表现
 * - Recipe 配方
 * - RecipeIngredient 配方成分
 * - ProofingPack 打样包
 * - ColorParticipation 参与者
 * - FitMatrix 适配矩阵
 * - ColorBookEntry 色彩簿关联
 */

import {
    PrismaClient,
    Recommendation,
    RecipeStatus,
    CostLevel,
    InkType,
    FitResult,
    ParticipantEntityType,
    ParticipationRole,
    ParticipationScope,
    ParticipationStatus,
    ColorStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// 工具函数：生成伪随机数（基于字符串种子）
function seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return (Math.abs(hash) % 1000) / 1000;
}

// 工具函数：从数组中随机选择
function randomPick<T>(arr: T[], seed: string): T {
    const index = Math.floor(seededRandom(seed) * arr.length);
    return arr[index];
}

// 工具函数：从数组中随机选择多个
function randomPickMultiple<T>(arr: T[], count: number, seed: string): T[] {
    const shuffled = [...arr].sort((a, b) => seededRandom(seed + String(arr.indexOf(a))) - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
}

// 根据 Lab 值计算在不同纸张上的偏移
function calculatePaperLabOffset(
    labL: number,
    labA: number,
    labB: number,
    paperCode: string,
    colorId: string
): { labL: number; labA: number; labB: number; deltaE: number } {
    const seed = colorId + paperCode;
    const random = seededRandom(seed);

    // 不同纸张类型的偏移规则
    const offsets: Record<string, { l: number; a: number; b: number; variance: number }> = {
        'PREMIUM_MATTE': { l: -0.3, a: -0.2, b: -0.1, variance: 0.5 },
        'UNCOATED': { l: -1.5, a: -0.8, b: -0.5, variance: 2.0 },
        'COATED': { l: 0.2, a: 0.1, b: 0.1, variance: 0.3 },
        'OFFSET': { l: -2.5, a: -1.2, b: -0.8, variance: 3.0 },
        'LIGHTWEIGHT': { l: -4.0, a: -2.0, b: -1.5, variance: 5.0 },
    };

    const offset = offsets[paperCode] || { l: 0, a: 0, b: 0, variance: 1.0 };

    const newLabL = Math.max(0, Math.min(100, labL + offset.l + (random - 0.5) * offset.variance));
    const newLabA = labA + offset.a + (random - 0.5) * offset.variance * 0.5;
    const newLabB = labB + offset.b + (random - 0.5) * offset.variance * 0.5;

    // 计算 Delta E (CIE76 简化版)
    const deltaE = Math.sqrt(
        Math.pow(newLabL - labL, 2) +
        Math.pow(newLabA - labA, 2) +
        Math.pow(newLabB - labB, 2)
    );

    return {
        labL: Number(newLabL.toFixed(2)),
        labA: Number(newLabA.toFixed(2)),
        labB: Number(newLabB.toFixed(2)),
        deltaE: Number(deltaE.toFixed(2)),
    };
}

// 根据 Delta E 确定推荐等级
function getRecommendation(deltaE: number): Recommendation {
    if (deltaE <= 1.0) return Recommendation.BEST;
    if (deltaE <= 2.5) return Recommendation.GOOD;
    if (deltaE <= 5.0) return Recommendation.CAUTION;
    return Recommendation.AVOID;
}

async function main() {
    console.log('🔗 开始生成关联数据...\n');

    // 获取所有必要的基础数据
    const colors = await prisma.color.findMany({
        select: {
            id: true,
            colorId: true,
            name: true,
            labL: true,
            labA: true,
            labB: true,
            status: true,
        },
    });

    const paperTypes = await prisma.paperTypeOption.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
    });

    const inks = await prisma.inkOption.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
    });

    const partners = await prisma.partner.findMany({
        where: { status: 'ACTIVE' },
    });

    const batches = await prisma.batch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    const colorBooks = await prisma.colorBook.findMany({
        where: { status: 'ACTIVE' },
    });

    const papers = await prisma.paper.findMany();

    console.log(`📊 基础数据加载完成:`);
    console.log(`   - 色彩: ${colors.length} 个`);
    console.log(`   - 纸型: ${paperTypes.length} 种`);
    console.log(`   - 油墨: ${inks.length} 种`);
    console.log(`   - 合作者: ${partners.length} 个`);
    console.log(`   - 批次: ${batches.length} 个`);
    console.log(`   - 色彩簿: ${colorBooks.length} 本`);
    console.log(`   - 纸张: ${papers.length} 种\n`);

    if (paperTypes.length === 0 || inks.length === 0) {
        console.log('⚠️ 缺少必要的基础数据，请先运行 seed-materials.ts');
        return;
    }

    // 分类油墨
    const baseInks = inks.filter(i => i.inkType === InkType.BASE);
    const spotInks = inks.filter(i => i.inkType === InkType.SPOT);
    const extenderInks = inks.filter(i => i.inkType === InkType.EXTENDER);

    // 分类合作者
    const printers = partners.filter(p => p.types.includes('PRINTER'));
    const paperVendors = partners.filter(p => p.types.includes('PAPER_VENDOR'));
    const inkVendors = partners.filter(p => p.types.includes('INK_VENDOR'));
    const labs = partners.filter(p => p.types.includes('LAB'));

    let stats = {
        paperProfiles: { created: 0, skipped: 0 },
        recipes: { created: 0, skipped: 0 },
        ingredients: { created: 0 },
        proofingPacks: { created: 0, skipped: 0 },
        participations: { created: 0, skipped: 0 },
        fitMatrix: { created: 0, skipped: 0 },
        colorBookEntries: { created: 0, skipped: 0 },
    };

    // 处理每个色彩
    for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        const progress = `[${i + 1}/${colors.length}]`;
        console.log(`\n${progress} 处理: ${color.colorId} ${color.name}`);

        // 1. 创建纸张表现数据 (每个色彩 3-5 种纸型)
        const paperCount = 3 + Math.floor(seededRandom(color.colorId + 'paper') * 3);
        const selectedPapers = randomPickMultiple(paperTypes, paperCount, color.colorId + 'papers');

        for (const paperType of selectedPapers) {
            const existing = await prisma.paperProfile.findUnique({
                where: {
                    colorId_paperTypeId: {
                        colorId: color.id,
                        paperTypeId: paperType.id,
                    },
                },
            });

            if (existing) {
                stats.paperProfiles.skipped++;
                continue;
            }

            const labValues = calculatePaperLabOffset(
                color.labL,
                color.labA,
                color.labB,
                paperType.code,
                color.colorId
            );

            await prisma.paperProfile.create({
                data: {
                    colorId: color.id,
                    paperTypeId: paperType.id,
                    labL: labValues.labL,
                    labA: labValues.labA,
                    labB: labValues.labB,
                    deltaE: labValues.deltaE,
                    glossiness: 20 + seededRandom(color.colorId + paperType.code + 'gloss') * 60,
                    inkAbsorption: 30 + seededRandom(color.colorId + paperType.code + 'ink') * 50,
                    gamutCoverage: 70 + seededRandom(color.colorId + paperType.code + 'gamut') * 28,
                    recommendation: getRecommendation(labValues.deltaE),
                    cautionNote: labValues.deltaE > 3 ? `ΔE ${labValues.deltaE}，注意色差` : null,
                    batchId: randomPick(batches, color.colorId + 'batch')?.id,
                },
            });
            stats.paperProfiles.created++;
        }

        // 2. 创建配方 (ACTIVE/VERIFIED 色彩 1-2 个配方)
        if (color.status === ColorStatus.ACTIVE || color.status === ColorStatus.VERIFIED) {
            const recipeCount = 1 + Math.floor(seededRandom(color.colorId + 'recipe') * 2);

            for (let r = 0; r < recipeCount; r++) {
                const recipeId = `RECIPE-${color.colorId}-${String(r + 1).padStart(2, '0')}`;

                const existingRecipe = await prisma.recipe.findUnique({
                    where: { recipeId },
                });

                if (existingRecipe) {
                    stats.recipes.skipped++;
                    continue;
                }

                const recipe = await prisma.recipe.create({
                    data: {
                        recipeId,
                        name: `${color.name}配方${r + 1}`,
                        colorId: color.id,
                        status: r === 0 ? RecipeStatus.VERIFIED : RecipeStatus.EXPERIMENTAL,
                        costLevel: randomPick([CostLevel.LOW, CostLevel.MEDIUM, CostLevel.HIGH], recipeId),
                        applicablePapers: selectedPapers.slice(0, 3).map(p => p.code),
                        notes: `${color.name}的标准配方，适用于常见纸张`,
                    },
                });
                stats.recipes.created++;

                // 3. 创建配方成分 (每个配方 2-4 种油墨)
                const ingredientCount = 2 + Math.floor(seededRandom(recipeId + 'ing') * 3);

                // 确保至少有一个冲淡剂
                const selectedInks: typeof inks = [];
                if (extenderInks.length > 0) {
                    selectedInks.push(randomPick(extenderInks, recipeId + 'ext'));
                }

                // 添加基础色或专色
                const colorInks = [...baseInks, ...spotInks];
                const additionalInks = randomPickMultiple(
                    colorInks.filter(i => !selectedInks.includes(i)),
                    ingredientCount - selectedInks.length,
                    recipeId + 'color'
                );
                selectedInks.push(...additionalInks);

                // 分配百分比（总计 100%）
                let remaining = 100;
                for (let idx = 0; idx < selectedInks.length; idx++) {
                    const ink = selectedInks[idx];
                    const isLast = idx === selectedInks.length - 1;
                    const percentage = isLast
                        ? remaining
                        : Math.floor(remaining * (0.3 + seededRandom(recipeId + ink.code) * 0.4));

                    await prisma.recipeIngredient.create({
                        data: {
                            recipeId: recipe.id,
                            inkId: ink.id,
                            percentage,
                            order: idx,
                        },
                    });
                    stats.ingredients.created++;
                    remaining -= percentage;
                }

                // 4. 创建适配矩阵
                if (papers.length > 0) {
                    const fitPapers = randomPickMultiple(papers, Math.min(3, papers.length), recipeId + 'fit');
                    for (const paper of fitPapers) {
                        const existing = await prisma.fitMatrix.findUnique({
                            where: {
                                recipeId_paperId: {
                                    recipeId: recipe.id,
                                    paperId: paper.id,
                                },
                            },
                        });

                        if (existing) {
                            stats.fitMatrix.skipped++;
                            continue;
                        }

                        const deltaE = 0.5 + seededRandom(recipeId + paper.paperId) * 4;
                        await prisma.fitMatrix.create({
                            data: {
                                recipeId: recipe.id,
                                paperId: paper.id,
                                fitResult: deltaE < 1.5 ? FitResult.RECOMMENDED : deltaE < 3 ? FitResult.USABLE : FitResult.NOT_RECOMMENDED,
                                deltaEResult: Number(deltaE.toFixed(2)),
                                stabilityScore: Math.floor(3 + seededRandom(recipeId + paper.paperId + 'stab') * 3),
                                issueTags: deltaE > 2.5 ? ['色差较大'] : [],
                                conclusionNote: deltaE < 1.5 ? '推荐使用，色彩还原度高' : deltaE < 3 ? '可用，需注意色差' : '不推荐，色差超标',
                                reportIds: [],
                            },
                        });
                        stats.fitMatrix.created++;
                    }
                }
            }
        }

        // 5. 创建打样包 (ACTIVE 色彩 2-3 个 SKU)
        if (color.status === ColorStatus.ACTIVE) {
            const packCount = 2 + Math.floor(seededRandom(color.colorId + 'pack') * 2);
            const packPapers = randomPickMultiple(paperTypes, packCount, color.colorId + 'packs');

            for (const paperType of packPapers) {
                const existing = await prisma.proofingPack.findUnique({
                    where: {
                        colorId_paperTypeId: {
                            colorId: color.id,
                            paperTypeId: paperType.id,
                        },
                    },
                });

                if (existing) {
                    stats.proofingPacks.skipped++;
                    continue;
                }

                await prisma.proofingPack.create({
                    data: {
                        colorId: color.id,
                        paperTypeId: paperType.id,
                        price: 800 + Math.floor(seededRandom(color.colorId + paperType.code + 'price') * 400),
                        externalUrl: `https://item.taobao.com/example-${color.colorId}-${paperType.code}`,
                        isActive: true,
                    },
                });
                stats.proofingPacks.created++;
            }
        }

        // 6. 创建参与者关联 (每个色彩 2-4 个参与者)
        if (partners.length > 0) {
            const participantCount = 2 + Math.floor(seededRandom(color.colorId + 'part') * 3);

            // 尝试添加印厂
            if (printers.length > 0) {
                const printer = randomPick(printers, color.colorId + 'printer');
                try {
                    await prisma.colorParticipation.create({
                        data: {
                            colorId: color.id,
                            entityType: ParticipantEntityType.PARTNER,
                            partnerId: printer.id,
                            roleInColor: ParticipationRole.PRINTER,
                            scope: ParticipationScope.RECIPE,
                            status: ParticipationStatus.ACTIVE,
                            note: `负责${color.name}的印刷验证`,
                            createdBy: 'system',
                        },
                    });
                    stats.participations.created++;
                } catch {
                    stats.participations.skipped++;
                }
            }

            // 尝试添加纸商
            if (paperVendors.length > 0) {
                const vendor = randomPick(paperVendors, color.colorId + 'paper-vendor');
                try {
                    await prisma.colorParticipation.create({
                        data: {
                            colorId: color.id,
                            entityType: ParticipantEntityType.PARTNER,
                            partnerId: vendor.id,
                            roleInColor: ParticipationRole.PAPER_SUPPLIER,
                            scope: ParticipationScope.IDENTITY,
                            status: ParticipationStatus.ACTIVE,
                            note: `提供${color.name}测试用纸`,
                            createdBy: 'system',
                        },
                    });
                    stats.participations.created++;
                } catch {
                    stats.participations.skipped++;
                }
            }

            // 尝试添加油墨商
            if (inkVendors.length > 0 && participantCount > 2) {
                const vendor = randomPick(inkVendors, color.colorId + 'ink-vendor');
                try {
                    await prisma.colorParticipation.create({
                        data: {
                            colorId: color.id,
                            entityType: ParticipantEntityType.PARTNER,
                            partnerId: vendor.id,
                            roleInColor: ParticipationRole.INK_SUPPLIER,
                            scope: ParticipationScope.RECIPE,
                            status: ParticipationStatus.ACTIVE,
                            note: `提供${color.name}配方油墨`,
                            createdBy: 'system',
                        },
                    });
                    stats.participations.created++;
                } catch {
                    stats.participations.skipped++;
                }
            }

            // 尝试添加实验室
            if (labs.length > 0 && participantCount > 3) {
                const lab = randomPick(labs, color.colorId + 'lab');
                try {
                    await prisma.colorParticipation.create({
                        data: {
                            colorId: color.id,
                            entityType: ParticipantEntityType.PARTNER,
                            partnerId: lab.id,
                            roleInColor: ParticipationRole.AUDITOR,
                            scope: ParticipationScope.IDENTITY,
                            status: ParticipationStatus.ACTIVE,
                            note: `${color.name}的审计验证`,
                            createdBy: 'system',
                        },
                    });
                    stats.participations.created++;
                } catch {
                    stats.participations.skipped++;
                }
            }
        }

        // 7. 创建色彩簿关联 (将色彩分配到色彩簿)
        if (colorBooks.length > 0) {
            // 每个色彩可能属于 1-2 个色彩簿
            const bookCount = Math.floor(seededRandom(color.colorId + 'book') * 2) + 1;
            const selectedBooks = randomPickMultiple(colorBooks, bookCount, color.colorId + 'books');

            for (const book of selectedBooks) {
                const existing = await prisma.colorBookEntry.findUnique({
                    where: {
                        colorBookId_colorId: {
                            colorBookId: book.id,
                            colorId: color.id,
                        },
                    },
                });

                if (existing) {
                    stats.colorBookEntries.skipped++;
                    continue;
                }

                // 计算排序（基于 colorId 的数字部分或随机）
                const order = Math.floor(seededRandom(color.colorId + book.bookId) * 100);

                await prisma.colorBookEntry.create({
                    data: {
                        colorBookId: book.id,
                        colorId: color.id,
                        order,
                        pageNumber: String(order + 1),
                        sectionName: color.colorId.includes('Chi') || color.colorId.includes('Zhu') || color.colorId.includes('Hong')
                            ? '红色系'
                            : color.colorId.includes('Lan') || color.colorId.includes('Qing')
                                ? '蓝青色系'
                                : color.colorId.includes('Lu') || color.colorId.includes('Cui')
                                    ? '绿色系'
                                    : '其他',
                    },
                });
                stats.colorBookEntries.created++;
            }
        }
    }

    // 更新色彩簿的色彩计数
    console.log('\n📊 更新色彩簿统计...');
    for (const book of colorBooks) {
        const count = await prisma.colorBookEntry.count({
            where: { colorBookId: book.id },
        });
        await prisma.colorBook.update({
            where: { id: book.id },
            data: { totalColors: count },
        });
    }

    // 打印统计
    console.log('\n' + '='.repeat(60));
    console.log('🎉 关联数据生成完成！');
    console.log('');
    console.log('📊 统计:');
    console.log(`   纸张表现: +${stats.paperProfiles.created} (跳过 ${stats.paperProfiles.skipped})`);
    console.log(`   配方:     +${stats.recipes.created} (跳过 ${stats.recipes.skipped})`);
    console.log(`   配方成分: +${stats.ingredients.created}`);
    console.log(`   打样包:   +${stats.proofingPacks.created} (跳过 ${stats.proofingPacks.skipped})`);
    console.log(`   参与者:   +${stats.participations.created} (跳过 ${stats.participations.skipped})`);
    console.log(`   适配矩阵: +${stats.fitMatrix.created} (跳过 ${stats.fitMatrix.skipped})`);
    console.log(`   色彩簿:   +${stats.colorBookEntries.created} (跳过 ${stats.colorBookEntries.skipped})`);
    console.log('='.repeat(60));
}

main()
    .catch((e) => {
        console.error('❌ 执行失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
