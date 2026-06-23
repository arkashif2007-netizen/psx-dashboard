export interface ScoringData {
  pe?: number | null;
  pb?: number | null;
  evToEbitda?: number | null;
  roe?: number | null;
  roa?: number | null; // not used in new 3-pillar, but keeping for compatibility
  roce?: number | null;
  netMargin?: number | null;
  operatingMargin?: number | null;
  debtToEquity?: number | null;
  currentRatio?: number | null;
  dividendYield?: number | null;
  altmanZ?: number | null;
  sector?: string | null;
}

export interface SectorMedians {
  pe: number;
  pb: number;
  evToEbitda: number;
  roe: number;
  roce: number;
  netMargin: number;
  operatingMargin: number;
  debtToEquity: number;
  currentRatio: number;
}

export interface ScoreResult {
  overall: number; // 0-100
  profitability: number; // 0-40
  health: number; // 0-30
  valuation: number; // 0-30
  verdict: 'STRONG BUY' | 'BUY' | 'HOLD / WATCH' | 'UNDERPERFORM' | 'AVOID / SELL';
}

export function calculateFundamentalScore(data: ScoringData, medians?: SectorMedians): ScoreResult {
  let profitability = 0;
  let health = 0;
  let valuation = 0;

  // Helpers for relative scoring
  const scoreHigherIsBetter = (val: number | null | undefined, median: number | undefined, maxPts: number) => {
    if (val === null || val === undefined) return maxPts * 0.5; // Missing data (e.g. Banks lacking EV/EBITDA) gets neutral points so blue chips aren't destroyed
    if (val < 0) return 0; 
    if (!median) return maxPts * 0.5; // If no median exists, but it's positive
    if (val >= median * 1.2) return maxPts; // Beats median by 20%+
    if (val >= median) return maxPts * 0.75; // Above median
    if (val >= median * 0.8) return maxPts * 0.3; // Just below median
    return 0; // Significantly below median = 0 pts
  };

  const scoreLowerIsBetter = (val: number | null | undefined, median: number | undefined, maxPts: number) => {
    if (val === null || val === undefined) return maxPts * 0.5; // Missing data = neutral pts
    if (val < 0) return 0; // Negative values (e.g. negative PE) handled by explicit penalties later
    if (!median) return maxPts * 0.5;
    if (val <= median * 0.8) return maxPts; // Beats median by 20%+
    if (val <= median) return maxPts * 0.75; // Above median
    if (val <= median * 1.2) return maxPts * 0.3; // Just below median
    return 0; // Significantly worse than median = 0 pts
  };

  // --- PILLAR 1: PROFITABILITY (Max 40) ---
  // ROE (15), ROCE (10), Net Margin (10), Operating Margin (5)
  profitability += scoreHigherIsBetter(data.roe, medians?.roe, 15);
  profitability += scoreHigherIsBetter(data.roce, medians?.roce, 10);
  profitability += scoreHigherIsBetter(data.netMargin, medians?.netMargin, 10);
  profitability += scoreHigherIsBetter(data.operatingMargin, medians?.operatingMargin, 5);

  // Profitability Penalties
  if (data.roe !== null && data.roe !== undefined && data.roe < 0) profitability -= 10;
  if (data.netMargin !== null && data.netMargin !== undefined && data.netMargin < 0) profitability -= 10;

  // --- PILLAR 2: HEALTH & SOLVENCY (Max 30) ---
  // Debt to Equity (12), Current Ratio (9), Altman Z-Score (9)
  health += scoreLowerIsBetter(data.debtToEquity, medians?.debtToEquity, 12);
  health += scoreHigherIsBetter(data.currentRatio, medians?.currentRatio, 9);
  
  if (data.altmanZ !== null && data.altmanZ !== undefined) {
    if (data.altmanZ > 2.99) health += 9;
    else if (data.altmanZ > 1.81) health += 4.5;
    else health += 0;
  } else {
    health += 4.5;
  }

  // Health Penalties
  if (data.debtToEquity !== null && data.debtToEquity !== undefined && data.debtToEquity > 3) health -= 10;

  // --- PILLAR 3: VALUATION (Max 30) ---
  // PE (10), PB (8), EV/EBITDA (8), Div Yield (4)
  valuation += scoreLowerIsBetter(data.pe, medians?.pe, 10);
  valuation += scoreLowerIsBetter(data.pb, medians?.pb, 8);
  valuation += scoreLowerIsBetter(data.evToEbitda, medians?.evToEbitda, 8);

  if (data.dividendYield !== null && data.dividendYield !== undefined) {
    if (data.dividendYield > 8) valuation += 4;
    else if (data.dividendYield > 4) valuation += 2;
  }

  // Valuation Penalties
  if (data.pe !== null && data.pe !== undefined && data.pe < 0) valuation -= 10;
  if (data.pb !== null && data.pb !== undefined && data.pb < 0) valuation -= 10;

  let rawOverall = profitability + health + valuation;
  let overall = Math.max(0, Math.min(100, Math.round(rawOverall)));

  let verdict: ScoreResult['verdict'] = 'HOLD / WATCH';
  if (overall >= 80) verdict = 'STRONG BUY';
  else if (overall >= 65) verdict = 'BUY';
  else if (overall >= 50) verdict = 'HOLD / WATCH';
  else if (overall >= 35) verdict = 'UNDERPERFORM';
  else verdict = 'AVOID / SELL';

  return {
    overall,
    profitability,
    health,
    valuation,
    verdict
  };
}
