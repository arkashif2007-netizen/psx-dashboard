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
  let earnedProfitability = 0;
  let possibleProfitability = 0;
  
  let earnedHealth = 0;
  let possibleHealth = 0;

  let earnedValuation = 0;
  let possibleValuation = 0;

  // Helpers for relative scoring
  const scoreHigherIsBetter = (val: number | null | undefined, median: number | undefined, maxPts: number, absoluteGoodLevel?: number) => {
    if (val === null || val === undefined) return { earned: 0, possible: 0 }; // Exclude from evaluation
    
    let earned = 0;
    if (val < 0) {
      earned = 0;
    } else if (!median) {
      earned = maxPts * 0.5; // If median missing but value exists
    } else if (val >= median * 1.2) {
      earned = maxPts;
    } else if (val >= median) {
      earned = maxPts * 0.75;
    } else if (val >= median * 0.8) {
      earned = maxPts * 0.3;
    }

    // Absolute fallback for highly profitable companies that just happen to have a crazy high sector median
    if (absoluteGoodLevel && val >= absoluteGoodLevel && earned < maxPts * 0.5) {
      earned = maxPts * 0.5;
    }
    
    return { earned, possible: maxPts };
  };

  const scoreLowerIsBetter = (val: number | null | undefined, median: number | undefined, maxPts: number, absoluteGoodLevel?: number) => {
    if (val === null || val === undefined) return { earned: 0, possible: 0 };
    
    let earned = 0;
    if (val < 0) {
      earned = 0; // Negative values handled by penalties
    } else if (!median) {
      earned = maxPts * 0.5;
    } else if (val <= median * 0.8) {
      earned = maxPts;
    } else if (val <= median) {
      earned = maxPts * 0.75;
    } else if (val <= median * 1.2) {
      earned = maxPts * 0.3;
    }

    // Absolute fallback: if the stock has a fundamentally safe value but sector is just dirt cheap
    if (absoluteGoodLevel && val <= absoluteGoodLevel && val > 0 && earned < maxPts * 0.5) {
      earned = maxPts * 0.5;
    }
    
    return { earned, possible: maxPts };
  };

  const addScore = (target: 'prof' | 'health' | 'val', result: { earned: number, possible: number }) => {
    if (target === 'prof') {
      earnedProfitability += result.earned;
      possibleProfitability += result.possible;
    } else if (target === 'health') {
      earnedHealth += result.earned;
      possibleHealth += result.possible;
    } else {
      earnedValuation += result.earned;
      possibleValuation += result.possible;
    }
  };

  // --- PILLAR 1: PROFITABILITY (Max 40) ---
  addScore('prof', scoreHigherIsBetter(data.roe, medians?.roe, 15, 20)); // Absolute good ROE: 20%
  addScore('prof', scoreHigherIsBetter(data.roce, medians?.roce, 10, 15)); // Absolute good ROCE: 15%
  addScore('prof', scoreHigherIsBetter(data.netMargin, medians?.netMargin, 10, 15)); // Absolute good Net Margin: 15%
  addScore('prof', scoreHigherIsBetter(data.operatingMargin, medians?.operatingMargin, 5, 15));

  // Profitability Penalties
  let profPenalty = 0;
  if (data.roe !== null && data.roe !== undefined && data.roe < 0) profPenalty += 10;
  if (data.netMargin !== null && data.netMargin !== undefined && data.netMargin < 0) profPenalty += 10;
  earnedProfitability = Math.max(0, earnedProfitability - profPenalty);

  // --- PILLAR 2: HEALTH & SOLVENCY (Max 30) ---
  addScore('health', scoreLowerIsBetter(data.debtToEquity, medians?.debtToEquity, 12, 1.5)); // Absolute good D/E: < 1.5
  addScore('health', scoreHigherIsBetter(data.currentRatio, medians?.currentRatio, 9, 1.2)); // Absolute good CR: > 1.2
  
  if (data.altmanZ !== null && data.altmanZ !== undefined) {
    possibleHealth += 9;
    if (data.altmanZ > 2.99) earnedHealth += 9;
    else if (data.altmanZ > 1.81) earnedHealth += 4.5;
  }

  // Health Penalties
  let healthPenalty = 0;
  if (data.debtToEquity !== null && data.debtToEquity !== undefined && data.debtToEquity > 3) healthPenalty += 10;
  earnedHealth = Math.max(0, earnedHealth - healthPenalty);

  // --- PILLAR 3: VALUATION (Max 30) ---
  addScore('val', scoreLowerIsBetter(data.pe, medians?.pe, 10, 12)); // Absolute good PE: < 12
  addScore('val', scoreLowerIsBetter(data.pb, medians?.pb, 8, 1.5)); // Absolute good PB: < 1.5
  addScore('val', scoreLowerIsBetter(data.evToEbitda, medians?.evToEbitda, 8, 8)); // Absolute good EV/EBITDA: < 8

  if (data.dividendYield !== null && data.dividendYield !== undefined) {
    possibleValuation += 4;
    if (data.dividendYield > 8) earnedValuation += 4;
    else if (data.dividendYield > 4) earnedValuation += 2;
  }

  // Valuation Penalties
  let valPenalty = 0;
  if (data.pe !== null && data.pe !== undefined && data.pe < 0) valPenalty += 10;
  if (data.pb !== null && data.pb !== undefined && data.pb < 0) valPenalty += 10;
  earnedValuation = Math.max(0, earnedValuation - valPenalty);

  // Normalize scores to their original maximum weights (Prof: 40, Health: 30, Val: 30)
  const profitability = possibleProfitability > 0 ? (earnedProfitability / possibleProfitability) * 40 : 0;
  const health = possibleHealth > 0 ? (earnedHealth / possibleHealth) * 30 : 0;
  const valuation = possibleValuation > 0 ? (earnedValuation / possibleValuation) * 30 : 0;

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
