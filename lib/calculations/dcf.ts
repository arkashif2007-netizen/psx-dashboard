/**
 * Earnings-based Discounted Cash Flow (DCF) model
 * Used as a proxy for traditional FCF DCF when only EPS is available.
 */

export interface DCFParams {
  eps: number | null;
  growthRate?: number; // Expected annual growth rate (default 8% for PK market)
  discountRate?: number; // Required rate of return (default 15% due to high risk-free rate)
  terminalGrowthRate?: number; // Perpetual growth rate (default 3%)
  years?: number; // Projection period (default 5 years)
}

export function calculateDCF(params: DCFParams): number | null {
  if (params.eps === null || params.eps <= 0) return null;

  const g = params.growthRate ?? 0.08;
  const r = params.discountRate ?? 0.15;
  const tg = params.terminalGrowthRate ?? 0.03;
  const t = params.years ?? 5;

  let presentValue = 0;
  let projectedEps = params.eps;

  // Calculate PV of projected earnings
  for (let year = 1; year <= t; year++) {
    projectedEps *= (1 + g);
    presentValue += projectedEps / Math.pow(1 + r, year);
  }

  // Calculate Terminal Value (Gordon Growth Model)
  // TV = EPS_t * (1 + tg) / (r - tg)
  const terminalValue = (projectedEps * (1 + tg)) / (r - tg);
  
  // Discount Terminal Value back to present
  const presentTerminalValue = terminalValue / Math.pow(1 + r, t);

  const intrinsicValue = presentValue + presentTerminalValue;
  return isNaN(intrinsicValue) ? null : intrinsicValue;
}

export function evaluateDCFValue(price: number | null, dcfValue: number | null): 'UNDERVALUED' | 'FAIR' | 'OVERVALUED' | 'UNKNOWN' {
  if (price === null || dcfValue === null) return 'UNKNOWN';

  const marginOfSafety = 0.20; // 20% margin for DCF due to higher uncertainty
  if (price < dcfValue * (1 - marginOfSafety)) return 'UNDERVALUED';
  if (price > dcfValue * (1 + marginOfSafety)) return 'OVERVALUED';
  return 'FAIR';
}
