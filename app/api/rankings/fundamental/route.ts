import { NextResponse } from 'next/server';
import { calculateFundamentalScore } from '@/lib/calculations/scoring';
import { getGlobalSectorMedians } from '@/lib/scrapers/sectorMedians';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const CACHE_KEY = 'global_fundamental_ranking_v6';

  try {
    const cached = cache.get(CACHE_KEY);
    if (cached && !cached.stale) {
      return NextResponse.json({ success: true, data: cached.data, cached: true });
    }

    const { medians: sectorMedians, rawData } = await getGlobalSectorMedians();

    // Score Stocks
    const rankedStocks = rawData.map((item: any) => {
      const d = item.d;
      const symbol = d[0];
      const price = d[1];
      const volume = d[2];
      const sector = d[3] || 'Unknown';
      
      const eps = d[13];
      const bvps = d[14];
      const divYield = d[15];

      const scoringData = {
        sector,
        pe: d[4] ?? null,
        pb: d[5] ?? null,
        roe: d[6] ?? null,
        debtToEquity: d[7] ?? null,
        roce: d[8] ?? null,
        currentRatio: d[9] ?? null,
        netMargin: d[10] ?? null,
        operatingMargin: d[11] ?? null,
        evToEbitda: d[12] ?? null,
        dividendYield: divYield ?? null
      };

      const medians = sectorMedians[sector];
      const scoreResult = calculateFundamentalScore(scoringData, medians);

      // Blended Target Price (Ideal Buy Logic)
      let buyRate = null;
      if (eps !== null && eps > 0) {
        let grahamNumber = null;
        if (bvps !== null && bvps > 0) {
          grahamNumber = Math.sqrt(22.5 * eps * bvps);
        }
        
        let relativeTarget = null;
        if (medians && medians.pe > 0) {
          relativeTarget = medians.pe * eps;
        }

        // Blended target: 50% Relative, 50% Graham
        if (grahamNumber && relativeTarget) {
          buyRate = (relativeTarget * 0.5) + (grahamNumber * 0.5);
        } else if (grahamNumber) {
          buyRate = grahamNumber;
        } else if (relativeTarget) {
          buyRate = relativeTarget;
        }

        // Margin of Safety Discount
        if (buyRate !== null) {
          if (scoreResult.overall >= 80) buyRate = buyRate * 0.90; // 10% MoS
          else if (scoreResult.overall >= 65) buyRate = buyRate * 0.85; // 15% MoS
          else if (scoreResult.overall >= 50) buyRate = buyRate * 0.80; // 20% MoS
          else buyRate = null; // Too risky, don't generate buy rate
        }
      }

      return {
        symbol,
        price,
        volume,
        score: scoreResult.overall,
        verdict: scoreResult.verdict,
        buyRate: buyRate,
        sector: sector,
        metrics: scoringData
      };
    })
    // Filter out stocks with exactly 0 volume/price or null to avoid defunct stocks clogging the top
    .filter((s: any) => s.price > 0 && s.volume > 0)
    // Sort descending by score
    .sort((a: any, b: any) => b.score - a.score);

    cache.set(CACHE_KEY, rankedStocks, TTL.ALL_STOCKS);

    return NextResponse.json({
      success: true,
      data: rankedStocks,
      cached: false
    });
  } catch (error) {
    console.error('[API/rankings/fundamental] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fundamental rankings', data: [] },
      { status: 500 }
    );
  }
}
