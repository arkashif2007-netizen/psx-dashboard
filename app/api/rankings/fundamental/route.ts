import { NextResponse } from 'next/server';
import axios from 'axios';
import { calculateFundamentalScore } from '@/lib/calculations/scoring';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const CACHE_KEY = 'global_fundamental_ranking_v2';

  try {
    const cached = cache.get(CACHE_KEY);
    if (cached && !cached.stale) {
      return NextResponse.json({ success: true, data: cached.data, cached: true });
    }

    const res = await axios.post('https://scanner.tradingview.com/pakistan/scan', {
      columns: [
        "name", 
        "close",
        "volume",
        "price_earnings_ttm", 
        "price_book_ratio", 
        "return_on_equity", 
        "debt_to_equity", 
        "return_on_assets",
        "current_ratio",
        "net_margin",
        "enterprise_value_ebitda",
        "earnings_per_share_basic_ttm",
        "book_value_per_share_fq"
      ]
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!res.data || !res.data.data) {
      throw new Error('Invalid TV scanner response');
    }

    const rankedStocks = res.data.data.map((item: any) => {
      const d = item.d;
      const symbol = d[0];
      const price = d[1];
      const volume = d[2];
      
      const eps = d[11];
      const bvps = d[12];
      
      let grahamNumber = null;
      let grahamStatus = null;
      if (eps !== null && bvps !== null && eps > 0 && bvps > 0) {
        grahamNumber = Math.sqrt(22.5 * eps * bvps);
        if (price) {
          if (price < grahamNumber * 0.8) grahamStatus = 'UNDERVALUED';
          else if (price < grahamNumber * 1.2) grahamStatus = 'FAIR';
        }
      }

      const scoringData = {
        pe: d[3] ?? null,
        pb: d[4] ?? null,
        roe: d[5] ?? null,
        debtToEquity: d[6] ?? null,
        roa: d[7] ?? null,
        currentRatio: d[8] ?? null,
        netMargin: d[9] ?? null,
        evToEbitda: d[10] ?? null,
        grahamStatus: grahamStatus
      };

      const scoreResult = calculateFundamentalScore(scoringData);

      return {
        symbol,
        price,
        volume,
        score: scoreResult.overall,
        verdict: scoreResult.verdict,
        buyRate: grahamNumber, // Phase 7: Export Graham Number as Intrinsic Target
        metrics: scoringData
      };
    })
    // Filter out stocks with exactly 0 volume/price or null to avoid defunct stocks clogging the top
    .filter((s: any) => s.price > 0 && s.volume > 0)
    // Sort descending by score
    .sort((a: any, b: any) => b.score - a.score);

    // Grab top 100
    const top100 = rankedStocks.slice(0, 100);

    cache.set(CACHE_KEY, top100, TTL.ALL_STOCKS);

    return NextResponse.json({
      success: true,
      data: top100,
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
