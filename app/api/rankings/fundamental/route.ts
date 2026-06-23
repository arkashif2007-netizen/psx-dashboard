import { NextResponse } from 'next/server';
import { calculateFundamentalScore } from '@/lib/calculations/scoring';
import { getGlobalSectorMedians } from '@/lib/scrapers/sectorMedians';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const CACHE_KEY = 'global_fundamental_ranking_v11';

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
      
      const eps = d[14];
      const divYield = d[16];

      const scoringData = {
        sector,
        marketCap: d[23] ?? null,
        price,
        roic: d[8] ?? null,
        grossMargin: d[12] ?? null,
        fcfMargin: null, // Will calculate inside engine
        operatingMargin: d[11] ?? null,
        capitalExpenditures: d[17] ?? null,
        totalRevenue: d[20] ?? null,
        debtToEquity: d[7] ?? null,
        ebitda: d[19] ?? null,
        totalDebt: d[22] ?? null,
        currentRatio: d[9] ?? null,
        altmanZ: null, // Altman Z logic omitted for bulk scanner for now, rely on standard D/E & ICR
        freeCashFlow: d[18] ?? null,
        netIncome: d[21] ?? null,
        eps: eps ?? null,
        roa: null,
        pe: d[4] ?? null,
        pb: d[5] ?? null,
        evToEbitda: d[13] ?? null,
        dividendYield: divYield ?? null
      };

      const medians = sectorMedians[sector];
      const scoreResult = calculateFundamentalScore(scoringData, medians);

      return {
        symbol: symbol.replace('PSX:', '').replace('KARACHI:', ''),
        price,
        volume,
        score: scoreResult.overall,
        verdict: scoreResult.verdict,
        buyRate: scoreResult.buyRate,
        sector,
        flags: scoreResult.flags,
        scoreBreakdown: {
          businessQuality: scoreResult.businessQuality,
          financialStrength: scoreResult.financialStrength,
          earningsQuality: scoreResult.earningsQuality,
          valuation: scoreResult.valuation
        },
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
