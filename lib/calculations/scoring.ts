export interface ScoringData {
  sector?: string | null;
  marketCap?: number | null;
  price?: number | null;
  
  // Pillar 1: Business Quality
  roic?: number | null;
  grossMargin?: number | null;
  fcfMargin?: number | null; // or calculate from FCF / Rev
  operatingMargin?: number | null;
  capitalExpenditures?: number | null;
  totalRevenue?: number | null;
  
  // Pillar 2: Financial Strength
  debtToEquity?: number | null;
  ebitda?: number | null;
  totalDebt?: number | null;
  currentRatio?: number | null;
  altmanZ?: number | null;
  freeCashFlow?: number | null;
  netIncome?: number | null;
  
  // Pillar 3: Earnings & Growth Quality
  eps?: number | null;
  roa?: number | null;
  
  // Pillar 4: Valuation
  pe?: number | null;
  pb?: number | null;
  evToEbitda?: number | null;
  dividendYield?: number | null;
}

export interface SectorMedians {
  pe: number;
  pb: number;
  evToEbitda: number;
  roic: number;
  grossMargin: number;
  operatingMargin: number;
  debtToEquity: number;
  currentRatio: number;
  eps: number;
}

export interface ScoreResult {
  overall: number; // 0-100
  businessQuality: number; // 0-35
  financialStrength: number; // 0-25
  earningsQuality: number; // 0-20
  valuation: number; // 0-20
  verdict: 'STRONG BUY' | 'BUY' | 'HOLD / WATCH' | 'UNDERPERFORM' | 'AVOID / SELL';
  buyRate: number | null;
  flags: string[]; // Warning flags
}

export function calculateFundamentalScore(data: ScoringData, medians?: SectorMedians): ScoreResult {
  const flags: string[] = [];
  
  let earnedQuality = 0;
  let possibleQuality = 0;
  
  let earnedStrength = 0;
  let possibleStrength = 0;

  let earnedEarnings = 0;
  let possibleEarnings = 0;

  let earnedValuation = 0;
  let possibleValuation = 0;

  // Helpers for relative scoring
  const scoreHigherIsBetter = (val: number | null | undefined, median: number | undefined, maxPts: number, absoluteGoodLevel?: number) => {
    if (val === null || val === undefined) return { earned: 0, possible: 0 };
    
    let earned = 0;
    if (val < 0) {
      earned = 0;
    } else if (!median) {
      earned = maxPts * 0.5;
    } else if (val >= median * 1.2) {
      earned = maxPts;
    } else if (val >= median) {
      earned = maxPts * 0.75;
    } else if (val >= median * 0.8) {
      earned = maxPts * 0.3;
    }

    if (absoluteGoodLevel && val >= absoluteGoodLevel && earned < maxPts * 0.5) {
      earned = maxPts * 0.5;
    }
    
    return { earned, possible: maxPts };
  };

  const scoreLowerIsBetter = (val: number | null | undefined, median: number | undefined, maxPts: number, absoluteGoodLevel?: number) => {
    if (val === null || val === undefined) return { earned: 0, possible: 0 };
    
    let earned = 0;
    if (val < 0) {
      earned = 0;
    } else if (!median) {
      earned = maxPts * 0.5;
    } else if (val <= median * 0.8) {
      earned = maxPts;
    } else if (val <= median) {
      earned = maxPts * 0.75;
    } else if (val <= median * 1.2) {
      earned = maxPts * 0.3;
    }

    if (absoluteGoodLevel && val <= absoluteGoodLevel && val >= 0 && earned < maxPts * 0.5) {
      earned = maxPts * 0.5;
    }
    
    return { earned, possible: maxPts };
  };

  const addScore = (target: 'quality' | 'strength' | 'earnings' | 'valuation', result: { earned: number, possible: number }) => {
    if (target === 'quality') {
      earnedQuality += result.earned;
      possibleQuality += result.possible;
    } else if (target === 'strength') {
      earnedStrength += result.earned;
      possibleStrength += result.possible;
    } else if (target === 'earnings') {
      earnedEarnings += result.earned;
      possibleEarnings += result.possible;
    } else {
      earnedValuation += result.earned;
      possibleValuation += result.possible;
    }
  };

  // --- PILLAR 1: BUSINESS QUALITY (Max 35) ---
  // ROIC (12), Gross Margin (7), FCF Margin (7), Op Margin Stability proxy (5), Cap Intensity (4)
  if (data.roic !== null && data.roic !== undefined) {
    possibleQuality += 12;
    if (data.roic > 20) earnedQuality += 12;
    else if (data.roic > 15) earnedQuality += 9;
    else if (data.roic > 10) earnedQuality += 6;
  }
  
  addScore('quality', scoreHigherIsBetter(data.grossMargin, medians?.grossMargin, 7, 20));
  
  const fcfMargin = (data.freeCashFlow && data.totalRevenue && data.totalRevenue > 0) ? (data.freeCashFlow / data.totalRevenue) * 100 : null;
  addScore('quality', scoreHigherIsBetter(fcfMargin, undefined, 7, 10)); // absolute good FCF margin > 10%
  
  addScore('quality', scoreHigherIsBetter(data.operatingMargin, medians?.operatingMargin, 5, 15));
  
  const capIntensity = (data.capitalExpenditures && data.totalRevenue && data.totalRevenue > 0) ? (Math.abs(data.capitalExpenditures) / data.totalRevenue) * 100 : null;
  if (capIntensity !== null) {
    possibleQuality += 4;
    // Lower capex is better, but adjust for heavy sectors
    const isHeavy = data.sector === 'Process Industries' || data.sector === 'Non-Energy Minerals' || data.sector === 'Energy Minerals';
    if (isHeavy) {
      if (capIntensity < 10) earnedQuality += 4;
      else if (capIntensity < 20) earnedQuality += 2;
    } else {
      if (capIntensity < 5) earnedQuality += 4;
      else if (capIntensity < 10) earnedQuality += 2;
    }
  }

  // --- PILLAR 2: FINANCIAL STRENGTH (Max 25) ---
  // Debt to Equity (8), ICR (7), Current Ratio (4), Altman Z (3), CFO/Net Income (3)
  if (data.debtToEquity !== null && data.debtToEquity !== undefined) {
    possibleStrength += 8;
    if (data.debtToEquity < 0.5) earnedStrength += 8;
    else if (data.debtToEquity < 1.0) earnedStrength += 4.8; // 60%
    else if (data.debtToEquity < 1.5) earnedStrength += 2.4; // 30%
  }
  
  const proxyInterestExpense = (data.totalDebt && data.totalDebt > 0) ? data.totalDebt * 0.18 : 0; // Assume 18% avg interest rate in PK
  const icr = (data.ebitda && proxyInterestExpense > 0) ? data.ebitda / proxyInterestExpense : null; 
  if (icr !== null) {
    possibleStrength += 7;
    if (icr > 5) earnedStrength += 7;
    else if (icr > 3) earnedStrength += 4.9; // 70%
    else if (icr > 2) earnedStrength += 2.8; // 40%
    
    if (icr < 1.5) flags.push("🚩 Dangerous ICR (High Debt Risk)");
  } else if (data.totalDebt === 0) {
    // No debt, perfect ICR
    possibleStrength += 7;
    earnedStrength += 7;
  }

  if (data.currentRatio !== null && data.currentRatio !== undefined) {
    possibleStrength += 4;
    if (data.currentRatio >= 1.5 && data.currentRatio <= 3.0) earnedStrength += 4;
    else if (data.currentRatio > 1.2 && data.currentRatio < 4.0) earnedStrength += 2;
  }
  
  if (data.altmanZ !== null && data.altmanZ !== undefined) {
    possibleStrength += 3;
    if (data.altmanZ > 2.99) earnedStrength += 3;
    else if (data.altmanZ > 1.81) earnedStrength += 1.5;
  }

  const cfoProxy = (data.freeCashFlow && data.capitalExpenditures) ? data.freeCashFlow + Math.abs(data.capitalExpenditures) : null;
  const cfoToNi = (cfoProxy && data.netIncome && data.netIncome > 0) ? cfoProxy / data.netIncome : null;
  if (cfoToNi !== null) {
    possibleStrength += 3;
    if (cfoToNi > 1.0) earnedStrength += 3;
    else if (cfoToNi > 0.8) earnedStrength += 1.5;
    
    if (cfoToNi < 0.7) flags.push("⚠️ Poor Cash Earnings Quality");
  }

  // Automatic Disqualification Triggers
  let isDisqualified = false;
  if (data.debtToEquity && data.debtToEquity < 0) { isDisqualified = true; flags.push("🚩 Negative Equity"); }
  if (cfoProxy && cfoProxy < 0) { isDisqualified = true; flags.push("🚩 Negative Cash from Operations"); }
  if (icr !== null && icr < 1.0) { isDisqualified = true; flags.push("🚩 ICR < 1.0 (Cannot service debt)"); }

  // --- PILLAR 3: EARNINGS & GROWTH QUALITY (Max 20) ---
  // EPS Strength vs Sector (10), ROA (10)
  addScore('earnings', scoreHigherIsBetter(data.eps, medians?.eps, 10, 20));
  addScore('earnings', scoreHigherIsBetter(data.roa, undefined, 10, 10)); // absolute ROA > 10% is good
  
  if (data.netIncome && data.netIncome < 0) {
    flags.push("🚩 Recent Net Loss");
  }

  // --- PILLAR 4: VALUATION & ENTRY PRICE (Max 20) ---
  // DCF Fair Value (10), EV/EBITDA (6), DDM (4)
  let blendedFairValue = 0;
  let valuationWeight = 0;

  // 1. DCF Valuation Proxy
  if (data.freeCashFlow && data.marketCap && data.price && data.freeCashFlow > 0 && data.marketCap > 0 && data.price > 0) {
    const sharesOutstanding = data.marketCap / data.price;
    const fcfPerShare = data.freeCashFlow / sharesOutstanding;
    
    // Conservative 5-year projection: Base (5%), Bear (2%), Bull (8%)
    const discountRate = 0.15;
    const terminalGrowth = 0.02;
    
    const calculateDCF = (growthRate: number) => {
      let pv = 0;
      let projectedFcf = fcfPerShare;
      for (let i = 1; i <= 5; i++) {
        projectedFcf *= (1 + growthRate);
        pv += projectedFcf / Math.pow(1 + discountRate, i);
      }
      const terminalValue = (projectedFcf * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
      pv += terminalValue / Math.pow(1 + discountRate, 5);
      return pv;
    };

    const bear = calculateDCF(0.02);
    const base = calculateDCF(0.05);
    const bull = calculateDCF(0.08);
    const dcfFairValue = (bear * 0.6) + (base * 0.3) + (bull * 0.1);
    
    blendedFairValue += dcfFairValue * 0.5;
    valuationWeight += 0.5;
  }

  // 2. EV/EBITDA Relative Valuation
  if (data.evToEbitda && medians?.evToEbitda && medians.evToEbitda > 0 && data.eps && data.eps > 0) {
    // If industry pays X EV/EBITDA, implied price:
    // This is a rough proxy: Price = (Sector Median EV/EBITDA / Stock EV/EBITDA) * Stock Price
    const impliedPriceByMultiple = (medians.evToEbitda / data.evToEbitda) * (data.price || 0);
    blendedFairValue += impliedPriceByMultiple * 0.3;
    valuationWeight += 0.3;
  }

  // 3. DDM Valuation
  if (data.dividendYield && data.dividendYield > 0 && data.price && data.price > 0) {
    const currentDividend = (data.dividendYield / 100) * data.price;
    const g = 0.05; // 5% div growth
    const k = 0.15; // 15% required return
    if (k > g) {
      const ddmFairValue = (currentDividend * (1 + g)) / (k - g);
      blendedFairValue += ddmFairValue * 0.2;
      valuationWeight += 0.2;
    }
  }

  let finalFairValue = valuationWeight > 0 ? blendedFairValue / valuationWeight : null;
  let targetBuyRate: number | null = null;

  if (finalFairValue !== null && data.price && data.price > 0) {
    possibleValuation += 20;
    const discount = (finalFairValue - data.price) / finalFairValue;
    
    if (discount > 0.30) earnedValuation += 20;
    else if (discount > 0.20) earnedValuation += 16;
    else if (discount > 0.10) earnedValuation += 12;
    else if (discount > 0.0) earnedValuation += 8;
    else if (discount > -0.15) earnedValuation += 4;
    else earnedValuation += 0;
  } else {
    // Fallback if valuation engine couldn't compute (e.g. negative FCF, negative EPS)
    addScore('val', scoreLowerIsBetter(data.pe, medians?.pe, 10, 12));
    addScore('val', scoreLowerIsBetter(data.pb, medians?.pb, 10, 1.5));
  }

  // Normalize scores to their original maximum weights
  const businessQuality = possibleQuality > 0 ? (earnedQuality / possibleQuality) * 35 : 0;
  const financialStrength = possibleStrength > 0 ? (earnedStrength / possibleStrength) * 25 : 0;
  const earningsQuality = possibleEarnings > 0 ? (earnedEarnings / possibleEarnings) * 20 : 0;
  const valuation = possibleValuation > 0 ? (earnedValuation / possibleValuation) * 20 : 0;

  let rawOverall = businessQuality + financialStrength + earningsQuality + valuation;
  let overall = Math.max(0, Math.min(100, Math.round(rawOverall)));

  // Calculate Ideal Buy Price based on Business Quality Margin of Safety
  if (finalFairValue !== null) {
    let mos = 0.35; // Default average quality
    if (businessQuality >= 28) mos = 0.15; // Exceptional
    else if (businessQuality >= 21) mos = 0.25; // Good
    
    targetBuyRate = finalFairValue * (1 - mos);
  }

  let verdict: ScoreResult['verdict'] = 'HOLD / WATCH';
  if (isDisqualified) {
    verdict = 'AVOID / SELL';
    overall = Math.min(overall, 35); // Cap score if disqualified
  } else {
    if (overall >= 82) verdict = 'STRONG BUY';
    else if (overall >= 68) verdict = 'BUY';
    else if (overall >= 54) verdict = 'HOLD / WATCH';
    else if (overall >= 40) verdict = 'UNDERPERFORM';
    else verdict = 'AVOID / SELL';
  }

  return {
    overall,
    businessQuality,
    financialStrength,
    earningsQuality,
    valuation,
    verdict,
    buyRate: targetBuyRate,
    flags
  };
}
