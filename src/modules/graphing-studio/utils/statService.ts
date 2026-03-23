import { jStat } from 'jstat';

export interface DescriptiveStats {
  group: string;
  n: number;
  mean: number;
  median: number;
  sd: number;
  sem: number;
  min: number;
  max: number;
  iqr: number;
  ci95_lower: number;
  ci95_upper: number;
}

export interface PairwiseComparison {
  group1: string;
  group2: string;
  pValue: number;
  tValue?: number;
  isSignificant: boolean;
  significanceLevel: string; // 'ns', '*', '**', '***', '****'
  effectSize?: string;
}

export interface StatTestResult {
  testName: string;
  mainPValue: number;
  statisticType: string; // 't', 'F', 'Chi-square', 'U', 'H'
  statisticValue: number;
  df1?: number;
  df2?: number;
  isSignificant: boolean;
  postHoc?: PairwiseComparison[];
  descriptives: DescriptiveStats[];
  notes?: string[];
}

export const cleanData = (data: number[]) => data.filter(v => typeof v === 'number' && !isNaN(v));

export function getDescriptives(groupName: string, rawData: number[]): DescriptiveStats {
  const data = cleanData(rawData);
  const n = data.length;
  
  if (n === 0) {
    return { group: groupName, n: 0, mean: 0, median: 0, sd: 0, sem: 0, min: 0, max: 0, iqr: 0, ci95_lower: 0, ci95_upper: 0 };
  }

  const mean = jStat.mean(data);
  const median = jStat.median(data);
  const sd = n > 1 ? jStat.stdev(data, true) : 0;
  const sem = n > 1 ? sd / Math.sqrt(n) : 0;
  const min = jStat.min(data);
  const max = jStat.max(data);
  
  let iqr = 0;
  if (n > 3) {
    const quantiles = jStat.quartiles(data);
    iqr = quantiles[2] - quantiles[0];
  }

  let marginError = 0;
  if (n > 1) {
    const tCritical = Math.abs(jStat.studentt.inv(0.025, n - 1)) || 1.96;
    marginError = tCritical * sem;
  }

  return {
    group: groupName, n, mean, median, sd, sem, min, max, iqr,
    ci95_lower: mean - marginError,
    ci95_upper: mean + marginError
  };
}

export function getSignificanceStars(p: number): string {
  if (p > 0.05) return 'ns';
  if (p <= 0.0001) return '****';
  if (p <= 0.001) return '***';
  if (p <= 0.01) return '**';
  return '*';
}

// ==========================================
// T-Test Family
// ==========================================
export function runTTest(name1: string, data1: number[], name2: string, data2: number[], isPaired: boolean = false): StatTestResult {
  const d1 = cleanData(data1);
  const d2 = cleanData(data2);
  const desc1 = getDescriptives(name1, d1);
  const desc2 = getDescriptives(name2, d2);

  if (d1.length < 2 || d2.length < 2) throw new Error('Not enough data to run a t-test.');

  let tStat = 0;
  let df = 0;
  let pValue = 1;

  if (isPaired) {
    if (d1.length !== d2.length) throw new Error("Paired t-test requires equal sample sizes.");
    const diffs = d1.map((val, i) => val - d2[i]);
    const meanDiff = jStat.mean(diffs);
    const sdDiff = jStat.stdev(diffs, true);
    tStat = meanDiff / (sdDiff / Math.sqrt(d1.length));
    df = d1.length - 1;
    pValue = (1 - jStat.studentt.cdf(Math.abs(tStat), df)) * 2;
  } else {
    // Independent Student's t-test (Equal Variances Assumed for simplicity, Welch's would be a good upgrade)
    const v1 = Math.pow(desc1.sd, 2);
    const v2 = Math.pow(desc2.sd, 2);
    const n1 = d1.length;
    const n2 = d2.length;
    df = n1 + n2 - 2;
    const pooledVar = ((n1 - 1) * v1 + (n2 - 1) * v2) / df;
    const se = Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
    tStat = (desc1.mean - desc2.mean) / se;
    pValue = (1 - jStat.studentt.cdf(Math.abs(tStat), df)) * 2;
  }

  const pairwise: PairwiseComparison = {
    group1: name1, group2: name2, pValue, tValue: tStat,
    isSignificant: pValue <= 0.05, significanceLevel: getSignificanceStars(pValue)
  };

  return {
    testName: isPaired ? "Paired t-test" : "Independent t-test",
    mainPValue: pValue, statisticType: "t", statisticValue: tStat, df1: df,
    isSignificant: pValue <= 0.05, postHoc: [pairwise], descriptives: [desc1, desc2]
  };
}

// ==========================================
// Non-Parametric Family
// ==========================================
// Calculate ties and ranks
function getRanks(values: number[]): number[] {
  const sorted = [...values].sort((a,b)=>a-b);
  return values.map(v => {
    const firstRank = sorted.indexOf(v) + 1;
    const lastRank = sorted.lastIndexOf(v) + 1;
    return (firstRank + lastRank) / 2;
  });
}

export function runMannWhitneyU(name1: string, data1: number[], name2: string, data2: number[]): StatTestResult {
  const d1 = cleanData(data1);
  const d2 = cleanData(data2);
  const n1 = d1.length;
  const n2 = d2.length;

  if (n1 < 2 || n2 < 2) throw new Error('Not enough data to run Mann-Whitney.');

  const combined = d1.concat(d2);
  const ranks = getRanks(combined);
  const ranks1 = ranks.slice(0, n1);
  const R1 = jStat.sum(ranks1);
  
  const U1 = R1 - (n1 * (n1 + 1)) / 2;
  const U2 = (n1 * n2) - U1;
  const U = Math.min(U1, U2);

  // Normal approximation
  const mu_U = (n1 * n2) / 2;
  const sigma_U = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = Math.abs((U - mu_U) / sigma_U);
  
  // Two-tailed p-value calculation via z
  const pValue = (1 - jStat.normal.cdf(z, 0, 1)) * 2;

  const pairwise: PairwiseComparison = {
    group1: name1, group2: name2, pValue, tValue: z,
    isSignificant: pValue <= 0.05, significanceLevel: getSignificanceStars(pValue)
  };

  return {
    testName: "Mann-Whitney test", mainPValue: pValue, statisticType: "U", statisticValue: U,
    isSignificant: pValue <= 0.05, postHoc: [pairwise], descriptives: [getDescriptives(name1, d1), getDescriptives(name2, d2)]
  };
}

export function runKruskalWallis(groups: { name: string, data: number[] }[]): StatTestResult {
  const cleanedGroups = groups.map(g => ({ name: g.name, data: cleanData(g.data) })).filter(g => g.data.length > 1);
  if (cleanedGroups.length < 3) throw new Error('Kruskal-Wallis requires at least 3 groups.');

  const allData: number[] = [];
  cleanedGroups.forEach(g => allData.push(...g.data));
  const ranks = getRanks(allData);
  
  let currentIndex = 0;
  let H_sum = 0;
  const N = allData.length;

  const groupRanks = cleanedGroups.map(g => {
    const n = g.data.length;
    const r = ranks.slice(currentIndex, currentIndex + n);
    currentIndex += n;
    const R = jStat.sum(r);
    H_sum += Math.pow(R, 2) / n;
    return { name: g.name, R, meanRank: R/n, n };
  });

  const H = (12 / (N * (N + 1))) * H_sum - 3 * (N + 1);
  const df = cleanedGroups.length - 1;
  
  const pValue = 1 - jStat.chisquare.cdf(H, df);

  // Dunn's test post-hoc approximation
  const postHoc: PairwiseComparison[] = [];
  const comparisonsCount = (cleanedGroups.length * (cleanedGroups.length - 1)) / 2;

  for (let i = 0; i < cleanedGroups.length; i++) {
    for (let j = i + 1; j < cleanedGroups.length; j++) {
      const g1 = groupRanks[i];
      const g2 = groupRanks[j];
      const se = Math.sqrt((N * (N + 1) / 12) * (1/g1.n + 1/g2.n));
      const z = Math.abs(g1.meanRank - g2.meanRank) / se;
      const rawP = (1 - jStat.normal.cdf(z, 0, 1)) * 2;
      const correctedP = Math.min(1.0, rawP * comparisonsCount); // Bonferroni multiplier
      postHoc.push({
        group1: g1.name, group2: g2.name, pValue: correctedP, isSignificant: correctedP <= 0.05,
        significanceLevel: getSignificanceStars(correctedP)
      });
    }
  }

  return {
    testName: "Kruskal-Wallis", mainPValue: pValue, statisticType: "H", statisticValue: H, df1: df,
    isSignificant: pValue <= 0.05, postHoc, descriptives: cleanedGroups.map(g => getDescriptives(g.name, g.data))
  };
}

// ==========================================
// ANOVA Family
// ==========================================
export function runOneWayANOVA(groups: { name: string, data: number[] }[]): StatTestResult {
  const cleanedGroups = groups.map(g => ({ name: g.name, data: cleanData(g.data) })).filter(g => g.data.length > 1);
  
  if (cleanedGroups.length < 2) {
    throw new Error('ANOVA requires at least 2 valid groups.');
  }

  const descriptives = cleanedGroups.map(g => getDescriptives(g.name, g.data));
  const k = cleanedGroups.length; 
  
  let N = 0;
  let grandSum = 0;
  cleanedGroups.forEach(g => {
    N += g.data.length;
    grandSum += jStat.sum(g.data);
  });
  const grandMean = grandSum / N;

  let SSB = 0;
  let SSW = 0;

  cleanedGroups.forEach(g => {
    const mean = jStat.mean(g.data);
    SSB += g.data.length * Math.pow(mean - grandMean, 2);
    g.data.forEach(val => {
      SSW += Math.pow(val - mean, 2);
    });
  });

  const dfB = k - 1;
  const dfW = N - k;
  const MSB = SSB / dfB;
  const MSW = SSW / dfW;
  const F = MSB / MSW;
  const pValue = 1 - jStat.centralF.cdf(F, dfB, dfW);

  // Tukey HSD Approximation Post-hoc (using simplified q-stat via studentized range if we had it, but substituting unpooled t w/ Bonferroni for speed/simplicity without external robust q-tables)
  const comparisonsCount = (k * (k - 1)) / 2;
  const postHoc: PairwiseComparison[] = [];

  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const g1 = cleanedGroups[i];
      const g2 = cleanedGroups[j];
      const d1 = g1.data;
      const d2 = g2.data;
      const n1 = d1.length;
      const n2 = d2.length;
      // Using MSW as pooled variance estimate
      const se = Math.sqrt(MSW * (1 / n1 + 1 / n2));
      const t = Math.abs(jStat.mean(d1) - jStat.mean(d2)) / se;
      const rawP = (1 - jStat.studentt.cdf(t, dfW)) * 2;
      
      // Bonferroni correction
      const correctedP = Math.min(1.0, rawP * comparisonsCount);
      
      postHoc.push({
        group1: g1.name, group2: g2.name, pValue: correctedP, tValue: t,
        isSignificant: correctedP <= 0.05, significanceLevel: getSignificanceStars(correctedP)
      });
    }
  }

  return {
    testName: "One-Way ANOVA (with Bonferroni Post-Hoc)",
    mainPValue: pValue, statisticType: "F", statisticValue: F, df1: dfB, df2: dfW,
    isSignificant: pValue <= 0.05, postHoc, descriptives,
    notes: ["Post-hoc uses Bonferroni-corrected t-tests utilizing pooled variance (MSW)."]
  };
}
