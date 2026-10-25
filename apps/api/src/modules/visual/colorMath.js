/**
 * Standard WCAG 2.2 Relative Luminance and Contrast Calculation
 * https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */

export function parseHexColor(hex) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r, g, b };
}

export function sRgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function calculateLuminance(r, g, b) {
  const rLin = sRgbToLinear(r);
  const gLin = sRgbToLinear(g);
  const bLin = sRgbToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

export function calculateContrastRatio(hex1, hex2) {
  const c1 = parseHexColor(hex1);
  const c2 = parseHexColor(hex2);

  const l1 = calculateLuminance(c1.r, c1.g, c1.b);
  const l2 = calculateLuminance(c2.r, c2.g, c2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return parseFloat(ratio.toFixed(2));
}

/**
 * Converts sRGB to CIELAB
 */
export function sRgbToLab(rNorm, gNorm, bNorm) {
  // sRGB to XYZ (D65)
  const r = sRgbToLinear(rNorm);
  const g = sRgbToLinear(gNorm);
  const b = sRgbToLinear(bNorm);

  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return { L, a, b: bVal };
}

/**
 * CIEDE2000 color difference formula (Delta E 2000)
 */
export function calculateDeltaE2000(hex1, hex2) {
  const c1 = parseHexColor(hex1);
  const c2 = parseHexColor(hex2);

  const lab1 = sRgbToLab(c1.r, c1.g, c1.b);
  const lab2 = sRgbToLab(c2.r, c2.g, c2.b);

  const degToRad = Math.PI / 180;
  const radToDeg = 180 / Math.PI;

  const L1 = lab1.L, a1 = lab1.a, b1 = lab1.b;
  const L2 = lab2.L, a2 = lab2.a, b2 = lab2.b;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cbar = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));
  const a1Prime = a1 * (1 + G);
  const a2Prime = a2 * (1 + G);

  const C1Prime = Math.sqrt(a1Prime * a1Prime + b1 * b1);
  const C2Prime = Math.sqrt(a2Prime * a2Prime + b2 * b2);

  const h1Prime = (Math.atan2(b1, a1Prime) * radToDeg + 360) % 360;
  const h2Prime = (Math.atan2(b2, a2Prime) * radToDeg + 360) % 360;

  const deltaLPrime = L2 - L1;
  const deltaCPrime = C2Prime - C1Prime;

  let deltahPrime = 0;
  if (C1Prime * C2Prime !== 0) {
    if (Math.abs(h1Prime - h2Prime) <= 180) {
      deltahPrime = h2Prime - h1Prime;
    } else if (h2Prime <= h1Prime) {
      deltahPrime = h2Prime - h1Prime + 360;
    } else {
      deltahPrime = h2Prime - h1Prime - 360;
    }
  }

  const deltaHPrime = 2 * Math.sqrt(C1Prime * C2Prime) * Math.sin((deltahPrime / 2) * degToRad);

  const LbarPrime = (L1 + L2) / 2;
  const CbarPrime = (C1Prime + C2Prime) / 2;

  let hbarPrime = 0;
  if (C1Prime * C2Prime !== 0) {
    if (Math.abs(h1Prime - h2Prime) <= 180) {
      hbarPrime = (h1Prime + h2Prime) / 2;
    } else if (h1Prime + h2Prime < 360) {
      hbarPrime = (h1Prime + h2Prime + 360) / 2;
    } else {
      hbarPrime = (h1Prime + h2Prime - 360) / 2;
    }
  }

  const T =
    1 -
    0.17 * Math.cos((hbarPrime - 30) * degToRad) +
    0.24 * Math.cos(2 * hbarPrime * degToRad) +
    0.32 * Math.cos((3 * hbarPrime + 6) * degToRad) -
    0.2 * Math.cos((4 * hbarPrime - 63) * degToRad);

  const deltaTheta = 30 * Math.exp(-Math.pow((hbarPrime - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(CbarPrime, 7) / (Math.pow(CbarPrime, 7) + Math.pow(25, 7)));

  const SL = 1 + (0.015 * Math.pow(LbarPrime - 50, 2)) / Math.sqrt(20 + Math.pow(LbarPrime - 50, 2));
  const SC = 1 + 0.045 * CbarPrime;
  const SH = 1 + 0.015 * CbarPrime * T;
  const RT = -Math.sin(2 * deltaTheta * degToRad) * RC;

  const deltaE = Math.sqrt(
    Math.pow(deltaLPrime / SL, 2) +
    Math.pow(deltaCPrime / SC, 2) +
    Math.pow(deltaHPrime / SH, 2) +
    RT * (deltaCPrime / SC) * (deltaHPrime / SH)
  );

  return parseFloat(deltaE.toFixed(2));
}
