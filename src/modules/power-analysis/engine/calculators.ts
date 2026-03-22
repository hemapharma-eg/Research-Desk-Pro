import * as jStatModule from 'jstat';

// Aggressive fallback to penetrate Vite's CommonJS/ESM interop wrappers
const jStat = (jStatModule as any).jStat || (jStatModule as any).default || jStatModule;

/**
 * Calculates required sample size for an independent two-sample t-test (Superiority).
 * Returns N per group.
 */
export function calculateTwoSampleTTest(d: number, alpha: number, power: number, tails: 1 | 2 = 2, allocationRatio: number = 1): { n1: number, n2: number, totalN: number } {
  const zAlpha = Math.abs(jStat.normal.inv(tails === 2 ? alpha / 2 : alpha, 0, 1));
  const zPower = Math.abs(jStat.normal.inv(1 - power, 0, 1));
  
  if (allocationRatio === 1) {
    const nPerGroup = Math.ceil(2 * Math.pow((zAlpha + zPower) / d, 2));
    return { n1: nPerGroup, n2: nPerGroup, totalN: nPerGroup * 2 };
  } else {
    // Unequal allocation ratio (k = n2/n1)
    const k = allocationRatio;
    const n1 = Math.ceil((1 + 1/k) * Math.pow((zAlpha + zPower) / d, 2));
    const n2 = Math.ceil(k * n1);
    return { n1, n2, totalN: n1 + n2 };
  }
}

/**
 * Calculates sample size for a Non-Inferiority independent two-sample test.
 * Effect 'd' is the true difference (often assumed 0). 'delta' is the non-inferiority margin.
 * N per group = 2 * ((Z_alpha + Z_power) / (d - delta))^2
 */
export function calculateNonInferiorityTTest(d: number, delta: number, alpha: number, power: number, allocationRatio: number = 1): { n1: number, n2: number, totalN: number } {
  // Non-inferiority is fundamentally a 1-tailed test against the margin
  const zAlpha = Math.abs(jStat.normal.inv(alpha, 0, 1)); 
  const zPower = Math.abs(jStat.normal.inv(1 - power, 0, 1));
  
  // The standardized signal is the distance from the margin
  const effectiveDifference = Math.abs(d - delta);
  // Guard against division by zero if true effect = margin
  const adjustedD = Math.max(0.001, effectiveDifference);

  if (allocationRatio === 1) {
    const nPerGroup = Math.ceil(2 * Math.pow((zAlpha + zPower) / adjustedD, 2));
    return { n1: nPerGroup, n2: nPerGroup, totalN: nPerGroup * 2 };
  } else {
    const k = allocationRatio;
    const n1 = Math.ceil((1 + 1/k) * Math.pow((zAlpha + zPower) / adjustedD, 2));
    const n2 = Math.ceil(k * n1);
    return { n1, n2, totalN: n1 + n2 };
  }
}

/**
 * Calculates sample size for an Equivalence independent two-sample test (TOST).
 */
export function calculateEquivalenceTTest(d: number, delta: number, alpha: number, power: number, allocationRatio: number = 1): { n1: number, n2: number, totalN: number } {
  // TOST (Two One-Sided Tests)
  const zAlpha = Math.abs(jStat.normal.inv(alpha, 0, 1));
  // Power is split across two boundaries approx:
  const zPower = Math.abs(jStat.normal.inv(1 - (power / 2), 0, 1));
  
  const effectiveDifference = Math.max(0.001, Math.abs(delta) - Math.abs(d));

  if (allocationRatio === 1) {
    const nPerGroup = Math.ceil(2 * Math.pow((zAlpha + zPower) / effectiveDifference, 2));
    return { n1: nPerGroup, n2: nPerGroup, totalN: nPerGroup * 2 };
  } else {
    const k = allocationRatio;
    const n1 = Math.ceil((1 + 1/k) * Math.pow((zAlpha + zPower) / effectiveDifference, 2));
    const n2 = Math.ceil(k * n1);
    return { n1, n2, totalN: n1 + n2 };
  }
}

/**
 * Calculates required sample size for a paired or one-sample t-test.
 * Returns total N.
 */
export function calculateOneSampleTTest(d: number, alpha: number, power: number, tails: 1 | 2 = 2): number {
  const zAlpha = Math.abs(jStat.normal.inv(tails === 2 ? alpha / 2 : alpha, 0, 1));
  const zPower = Math.abs(jStat.normal.inv(1 - power, 0, 1));
  
  const n = Math.ceil(Math.pow((zAlpha + zPower) / d, 2));
  return n;
}

/**
 * Calculates sample size for One-Way ANOVA.
 * Cohen's f is the effect size.
 * Returns total N.
 */
export function calculateAnova(f: number, alpha: number, power: number, numGroups: number): number {
  // Approximate using non-central F-distribution or simply lambda approximation
  const zAlpha = Math.abs(jStat.normal.inv(alpha, 0, 1));
  const zPower = Math.abs(jStat.normal.inv(1 - power, 0, 1));
  
  // Rule of thumb for ANOVA total N:
  const lambda = Math.pow(zAlpha + zPower, 2);
  let totalN = Math.ceil(lambda / (f * f));
  
  // Ensure evenly divided by groups
  const rem = totalN % numGroups;
  if (rem !== 0) totalN += (numGroups - rem);
  
  return totalN;
}

/**
 * Power for a Pearson correlation
 */
export function calculateCorrelation(r: number, alpha: number, power: number, tails: 1 | 2 = 2): number {
  const zAlpha = Math.abs(jStat.normal.inv(tails === 2 ? alpha / 2 : alpha, 0, 1));
  const zPower = Math.abs(jStat.normal.inv(1 - power, 0, 1));
  
  const zr = 0.5 * Math.log((1 + r) / (1 - r)); // Fisher's Z
  const n = Math.ceil(Math.pow((zAlpha + zPower) / zr, 2) + 3);
  return n;
}

/**
 * Power for two independent proportions
 * arcsine transformation approach (Cohen's h)
 */
export function calculateTwoProportions(p1: number, p2: number, alpha: number, power: number, tails: 1 | 2 = 2): { n1: number, n2: number, totalN: number } {
  const zAlpha = Math.abs(jStat.normal.inv(tails === 2 ? alpha / 2 : alpha, 0, 1));
  const zPower = Math.abs(jStat.normal.inv(1 - power, 0, 1));
  
  const h = 2 * Math.asin(Math.sqrt(p1)) - 2 * Math.asin(Math.sqrt(p2));
  const nPerGroup = Math.ceil(2 * Math.pow((zAlpha + zPower) / Math.abs(h), 2));
  
  return { n1: nPerGroup, n2: nPerGroup, totalN: nPerGroup * 2 };
}

/**
 * Generates data for a Power Curve (X=Sample Size, Y=Power)
 */
export function generatePowerCurve(targetN: number, calculatorFunc: (n: number) => number, rangeN: [number, number] = [10, 200]): Array<{n: number, power: number}> {
  const curve = [];
  const minN = Math.max(2, Math.floor(targetN * 0.2));
  const maxN = Math.max(rangeN[1], Math.ceil(targetN * 1.5));
  const step = Math.max(1, Math.floor((maxN - minN) / 20));
  
  for(let n = minN; n <= maxN; n += step) {
     curve.push({ n, power: calculatorFunc(n) });
  }
  return curve;
}

// Evaluators to calculate ACTUAL power given N (used for heatmaps / curves)
export function getActualPowerTTestTwoSample(nPerGroup: number, d: number, alpha: number, tails: 1 | 2 = 2): number {
  const df = 2 * nPerGroup - 2;
  
  const nonCentrality = d * Math.sqrt(nPerGroup / 2);
  // Approximation using normal for simplicity, or shifted T
  const zAlpha = jStat.studentt.inv(1 - (tails === 2 ? alpha / 2 : alpha), df);
  const power = jStat.normal.cdf(nonCentrality - zAlpha, 0, 1);
  return power;
}

export function adjustForAttrition(requiredN: number, attritionRate: number): number {
  if (attritionRate >= 1 || attritionRate < 0) return requiredN;
  return Math.ceil(requiredN / (1 - attritionRate));
}

// Effect Size Converters
export function calculateCohenD(mean1: number, mean2: number, sd1: number, sd2: number): number {
  const pooledVar = (Math.pow(sd1, 2) + Math.pow(sd2, 2)) / 2;
  const pooledSd = Math.sqrt(pooledVar);
  return Math.abs(mean1 - mean2) / pooledSd;
}

export function calculateCohensH(p1: number, p2: number): number {
  return 2 * Math.asin(Math.sqrt(p1)) - 2 * Math.asin(Math.sqrt(p2));
}

export function calculateCohensF(means: number[], commonSd: number): number {
  if (!means || means.length === 0 || commonSd <= 0) return 0;
  const grandMean = means.reduce((sum, m) => sum + m, 0) / means.length;
  // Variance of means
  let sumSq = 0;
  for (const m of means) {
    sumSq += Math.pow(m - grandMean, 2);
  }
  const varianceOfMeans = sumSq / means.length;
  return Math.sqrt(varianceOfMeans) / commonSd;
}
