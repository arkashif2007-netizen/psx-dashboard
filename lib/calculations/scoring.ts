export interface ScoringData {
  pe?: number | null;
  pb?: number | null;
  evToEbitda?: number | null;
  roe?: number | null;
  roa?: number | null;
  netMargin?: number | null;
  debtToEquity?: number | null;
  currentRatio?: number | null;
  grahamStatus?: string | null;
  dcfStatus?: string | null;
}

export interface ScoreResult {
  overall: number; // 0-100
  valuation: number;
  profitability: number;
  health: number;
  intrinsic: number;
  verdict: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL';
}

export function calculateFundamentalScore(data: ScoringData): ScoreResult {
  let valuation = 0;
  let profitability = 0;
  let health = 0;
  let intrinsic = 0;

  // Valuation (Max 30)
  if (data.pe !== null && data.pe !== undefined) {
    if (data.pe < 0) valuation -= 10; // Penalty for negative earnings
    else if (data.pe > 50) valuation -= 5; // Penalty for massive overvaluation
    else if (data.pe < 10) valuation += 10;
    else if (data.pe <= 15) valuation += 7;
    else if (data.pe <= 20) valuation += 4;
  } else {
    valuation += 5; // Neutral fallback
  }

  if (data.pb !== null && data.pb !== undefined) {
    if (data.pb < 0) valuation -= 10; // Negative equity
    else if (data.pb < 1.2) valuation += 10;
    else if (data.pb <= 2) valuation += 7;
    else if (data.pb <= 4) valuation += 4;
  } else {
    valuation += 5;
  }

  if (data.evToEbitda !== null && data.evToEbitda !== undefined) {
    if (data.evToEbitda < 0) valuation -= 10;
    else if (data.evToEbitda < 8) valuation += 10;
    else if (data.evToEbitda <= 12) valuation += 7;
    else if (data.evToEbitda <= 15) valuation += 4;
  } else {
    valuation += 5;
  }

  // Profitability (Max 40 - Increased Weight)
  if (data.roe !== null && data.roe !== undefined) {
    if (data.roe < 0) profitability -= 15; // Heavy penalty for bleeding equity
    else if (data.roe > 20) profitability += 15;
    else if (data.roe >= 15) profitability += 10;
    else if (data.roe >= 10) profitability += 5;
  } else {
    profitability += 5;
  }

  if (data.roa !== null && data.roa !== undefined) {
    if (data.roa < 0) profitability -= 10;
    else if (data.roa > 10) profitability += 10;
    else if (data.roa >= 5) profitability += 7;
    else if (data.roa >= 2) profitability += 4;
  } else {
    profitability += 5;
  }

  if (data.netMargin !== null && data.netMargin !== undefined) {
    if (data.netMargin < 0) profitability -= 15; // Heavy penalty for losing money on sales
    else if (data.netMargin > 15) profitability += 15;
    else if (data.netMargin >= 10) profitability += 10;
    else if (data.netMargin >= 5) profitability += 5;
  } else {
    profitability += 5;
  }

  // Health (Max 30 - Increased Weight)
  if (data.debtToEquity !== null && data.debtToEquity !== undefined) {
    if (data.debtToEquity > 3) health -= 15; // Penalty for dangerous debt levels
    else if (data.debtToEquity < 0.5) health += 15;
    else if (data.debtToEquity <= 1) health += 10;
    else if (data.debtToEquity <= 2) health += 5;
  } else {
    health += 5;
  }

  if (data.currentRatio !== null && data.currentRatio !== undefined) {
    if (data.currentRatio < 0.5) health -= 10; // Penalty for liquidity crisis
    else if (data.currentRatio > 2) health += 15;
    else if (data.currentRatio >= 1.5) health += 10;
    else if (data.currentRatio >= 1) health += 5;
  } else {
    health += 5;
  }

  // Intrinsic Value (Bonus up to 20 pts)
  if (data.grahamStatus === 'UNDERVALUED') intrinsic += 10;
  else if (data.grahamStatus === 'FAIR') intrinsic += 5;

  if (data.dcfStatus === 'UNDERVALUED') intrinsic += 10;
  else if (data.dcfStatus === 'FAIR') intrinsic += 5;

  let rawOverall = valuation + profitability + health + intrinsic;
  
  // Cap between 0 and 100
  let overall = Math.max(0, Math.min(100, rawOverall));

  let verdict: ScoreResult['verdict'] = 'HOLD';
  if (overall >= 80) verdict = 'STRONG BUY';
  else if (overall >= 60) verdict = 'BUY';
  else if (overall >= 40) verdict = 'HOLD';
  else if (overall >= 20) verdict = 'SELL';
  else verdict = 'STRONG SELL';

  return {
    overall,
    valuation,
    profitability,
    health,
    intrinsic,
    verdict
  };
}
