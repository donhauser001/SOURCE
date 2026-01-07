'use client';

/**
 * 材质表现雷达图组件
 *
 * 使用 SVG 绘制简单的雷达图
 */

interface Props {
    glossiness: number;
    inkAbsorption: number;
    gamutCoverage: number;
    paperType: string;
}

export function MaterialRadar({ glossiness, inkAbsorption, gamutCoverage, paperType }: Props) {
    // 雷达图尺寸
    const size = 240;
    const center = size / 2;
    const maxRadius = size / 2 - 40;

    // 三个维度
    const dimensions = [
        { label: '光泽度', value: glossiness, angle: -90 },
        { label: '吸墨率', value: inkAbsorption, angle: 30 },
        { label: '色域覆盖', value: gamutCoverage, angle: 150 },
    ];

    // 角度转弧度
    const toRadians = (angle: number) => (angle * Math.PI) / 180;

    // 计算点坐标
    const getPoint = (angle: number, radius: number) => {
        const rad = toRadians(angle);
        return {
            x: center + radius * Math.cos(rad),
            y: center + radius * Math.sin(rad),
        };
    };

    // 生成网格线（同心圆）
    const gridLevels = [25, 50, 75, 100];

    // 生成数据区域路径
    const dataPath = dimensions
        .map((d, i) => {
            const radius = (d.value / 100) * maxRadius;
            const point = getPoint(d.angle, radius);
            return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
        })
        .join(' ') + ' Z';

    // 生成背景区域路径
    const bgPath = dimensions
        .map((d, i) => {
            const point = getPoint(d.angle, maxRadius);
            return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
        })
        .join(' ') + ' Z';

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="overflow-visible">
                {/* 背景网格 */}
                {gridLevels.map((level) => {
                    const gridPath = dimensions
                        .map((d, i) => {
                            const radius = (level / 100) * maxRadius;
                            const point = getPoint(d.angle, radius);
                            return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
                        })
                        .join(' ') + ' Z';

                    return (
                        <path
                            key={level}
                            d={gridPath}
                            fill="none"
                            stroke="currentColor"
                            strokeOpacity={0.1}
                            strokeWidth={1}
                        />
                    );
                })}

                {/* 轴线 */}
                {dimensions.map((d) => {
                    const endPoint = getPoint(d.angle, maxRadius);
                    return (
                        <line
                            key={d.label}
                            x1={center}
                            y1={center}
                            x2={endPoint.x}
                            y2={endPoint.y}
                            stroke="currentColor"
                            strokeOpacity={0.2}
                            strokeWidth={1}
                        />
                    );
                })}

                {/* 数据区域 */}
                <path
                    d={dataPath}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                />

                {/* 数据点 */}
                {dimensions.map((d) => {
                    const radius = (d.value / 100) * maxRadius;
                    const point = getPoint(d.angle, radius);
                    return (
                        <circle
                            key={d.label}
                            cx={point.x}
                            cy={point.y}
                            r={4}
                            fill="hsl(var(--primary))"
                        />
                    );
                })}

                {/* 标签 */}
                {dimensions.map((d) => {
                    const labelRadius = maxRadius + 25;
                    const point = getPoint(d.angle, labelRadius);
                    return (
                        <g key={d.label}>
                            <text
                                x={point.x}
                                y={point.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-xs fill-muted-foreground"
                            >
                                {d.label}
                            </text>
                            <text
                                x={point.x}
                                y={point.y + 14}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-sm font-medium fill-foreground"
                            >
                                {d.value}%
                            </text>
                        </g>
                    );
                })}
            </svg>

            <p className="text-sm text-muted-foreground mt-4">
                {paperType} 材质特性分析
            </p>
        </div>
    );
}

