/**
 * 色彩转换工具函数
 */

/**
 * Lab 转 RGB（简化版）
 * 注意：这只是近似转换，真实印刷效果需以实体打样为准
 */
export function labToRgb(L: number, a: number, b: number): { r: number; g: number; b: number } {
    // Lab to XYZ
    let y = (L + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    const fn = (t: number) => {
        return t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787;
    };

    // D65 白点
    x = 95.047 * fn(x);
    y = 100.0 * fn(y);
    z = 108.883 * fn(z);

    // XYZ to RGB (sRGB)
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let bVal = x * 0.0557 + y * -0.204 + z * 1.057;

    // 线性 RGB 到 sRGB
    const gammaCorrect = (c: number) => {
        c = c / 100;
        return c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
    };

    r = Math.round(Math.max(0, Math.min(255, gammaCorrect(r) * 255)));
    g = Math.round(Math.max(0, Math.min(255, gammaCorrect(g) * 255)));
    bVal = Math.round(Math.max(0, Math.min(255, gammaCorrect(bVal) * 255)));

    return { r, g, b: bVal };
}

/**
 * Lab 转 HEX
 */
export function labToHex(L: number, a: number, b: number): string {
    const rgb = labToRgb(L, a, b);
    return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
}

/**
 * 计算 ΔE2000 色差
 * 参考：http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE2000.html
 */
export function deltaE2000(
    L1: number, a1: number, b1: number,
    L2: number, a2: number, b2: number
): number {
    const rad = Math.PI / 180;
    const deg = 180 / Math.PI;

    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const Cb = (C1 + C2) / 2;
    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));

    const a1p = a1 * (1 + G);
    const a2p = a2 * (1 + G);
    const C1p = Math.sqrt(a1p * a1p + b1 * b1);
    const C2p = Math.sqrt(a2p * a2p + b2 * b2);

    let h1p = Math.atan2(b1, a1p) * deg;
    if (h1p < 0) h1p += 360;
    let h2p = Math.atan2(b2, a2p) * deg;
    if (h2p < 0) h2p += 360;

    const dLp = L2 - L1;
    const dCp = C2p - C1p;

    let dhp = 0;
    if (C1p * C2p !== 0) {
        dhp = h2p - h1p;
        if (dhp > 180) dhp -= 360;
        else if (dhp < -180) dhp += 360;
    }

    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);

    const Lbp = (L1 + L2) / 2;
    const Cbp = (C1p + C2p) / 2;

    let hbp = (h1p + h2p) / 2;
    if (Math.abs(h1p - h2p) > 180) {
        hbp += 180;
    }
    if (C1p * C2p === 0) hbp = h1p + h2p;

    const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.20 * Math.cos((4 * hbp - 63) * rad);

    const dTheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
    const Rc = 2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7)));
    const Sl = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
    const Sc = 1 + 0.045 * Cbp;
    const Sh = 1 + 0.015 * Cbp * T;
    const Rt = -Math.sin(2 * dTheta * rad) * Rc;

    const dE = Math.sqrt(
        Math.pow(dLp / Sl, 2) +
        Math.pow(dCp / Sc, 2) +
        Math.pow(dHp / Sh, 2) +
        Rt * (dCp / Sc) * (dHp / Sh)
    );

    return dE;
}
