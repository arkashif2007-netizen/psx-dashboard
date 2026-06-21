export function calculateGrahamNumber(eps: number | null, bvps: number | null): number | null {
  if (eps === null || bvps === null) return null;
  
  // Graham Number formula: √(22.5 × EPS × BVPS)
  // If either EPS or BVPS is negative, the Graham Number is not applicable (returns 0 or null)
  if (eps < 0 || bvps < 0) return null;

  const value = Math.sqrt(22.5 * eps * bvps);
  return isNaN(value) ? null : value;
}

export function evaluateGrahamValue(price: number | null, grahamValue: number | null): 'UNDERVALUED' | 'FAIR' | 'OVERVALUED' | 'UNKNOWN' {
  if (price === null || grahamValue === null) return 'UNKNOWN';

  const marginOfSafety = 0.15; // 15% margin
  if (price < grahamValue * (1 - marginOfSafety)) return 'UNDERVALUED';
  if (price > grahamValue * (1 + marginOfSafety)) return 'OVERVALUED';
  return 'FAIR';
}
