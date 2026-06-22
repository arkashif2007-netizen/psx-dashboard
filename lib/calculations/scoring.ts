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
  valuation: number; // 0-30
  profitability: number; // 0-30
  health: number; // 0-20
  intrinsic: number; // 0-20
  verdict: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL';
}

export function calculateFundamentalScore(data: ScoringData): ScoreResult {
  let valuation = 0;
  let profitability = 0;
  let health = 0;
  let intrinsic = 0;

  // Valuation (30 pts)
  if (data.pe !== null && data.pe !== undefined && data.pe > 0) {
    if (data.pe < 10) valuation += 10;
    else if (data.pe <= 15) valuation += 7;
    else if (data.pe <= 20) valuation += 4;
  } else if (data.pe === null) {
    valuation += 5; // Neutral fallback
  }

  if (data.pb !== null && data.pb !== undefined && data.pb > 0) {
    if (data.pb < 1.2) valuation += 10;
    else if (data.pb <= 2) valuation += 7;
    else if (data.pb <= 4) valuation += 4;
  } else if (data.pb === null) {
    valuation += 5;
  }

  if (data.evToEbitda !== null && data.evToEbitda !== undefined && data.evToEbitda > 0) {
    if (data.evToEbitda < 8) valuation += 10;
    else if (data.evToEbitda <= 12) valuation += 7;
    else if (data.evToEbitda <= 15) valuation += 4;
  } else if (data.evToEbitda === null) {
    valuation += 5;
  }

  // Profitability (30 pts)
  if (data.roe !== null && data.roe !== undefined) {
    if (data.roe > 20) profitability += 10;
    else if (data.roe >= 15) profitability += 7;
    else if (data.roe >= 10) profitability += 4;
  } else if (data.roe === null) {
    profitability += 5;
  }

  if (data.roa !== null && data.roa !== undefined) {
    if (data.roa > 10) profitability += 10;
    else if (data.roa >= 5) profitability += 7;
    else if (data.roa >= 2) profitability += 4;
  } else if (data.roa === null) {
    profitability += 5;
  }

  if (data.netMargin !== null && data.netMargin !== undefined) {
    if (data.netMargin > 15) profitability += 10;
    else if (data.netMargin >= 10) profitability += 7;
    else if (data.netMargin >= 5) profitability += 4;
  } else if (data.netMargin === null) {
    profitability += 5;
  }

  // Health (20 pts)
  if (data.debtToEquity !== null && data.debtToEquity !== undefined) {
    if (data.debtToEquity < 0.5) health += 10;
    else if (data.debtToEquity <= 1) health += 7;
    else if (data.debtToEquity <= 2) health += 4;
  } else if (data.debtToEquity === null) {
    health += 5;
  }

  if (data.currentRatio !== null && data.currentRatio !== undefined) {
    if (data.currentRatio > 2) health += 10;
    else if (data.currentRatio >= 1.5) health += 7;
    else if (data.currentRatio >= 1) health += 4;
  } else if (data.currentRatio === null) {
    health += 5;
  }

  // Intrinsic Value (20 pts)
  if (data.grahamStatus === 'UNDERVALUED') intrinsic += 10;
  else if (data.grahamStatus === 'FAIR') intrinsic += 5;

  if (data.dcfStatus === 'UNDERVALUED') intrinsic += 10;
  else if (data.dcfStatus === 'FAIR') intrinsic += 5;

  const overall = valuation + profitability + health + intrinsic;

  let verdict: ScoreResult['verdict'] = 'HOLD';
  if (overall >= 80) verdict = 'STRONG BUY';
  else if (overall >= 65) verdict = 'BUY';
  else if (overall >= 45) verdict = 'HOLD';
  else if (overall >= 30) verdict = 'SELL';
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
