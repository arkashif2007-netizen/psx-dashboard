import { NextResponse } from 'next/server';
import { getAllSymbols, getCompanyDetail } from '@/lib/scrapers/psx';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// We fetch top 30 stocks by market cap to find gainers/losers
const TOP_SYMBOLS = [
  'HBL', 'OGDC', 'PSO', 'MCB', 'UBL', 'LUCK', 'ENGRO', 'EFERT', 'PPL', 'MEBL',
  'BAHL', 'HUBC', 'SEARL', 'SYS', 'AKBL', 'NBP', 'BAFL', 'MARI', 'TRG', 'PAKT',
  'SNGP', 'SSGC', 'KAPCO', 'MLCF', 'DGKC', 'CHCC', 'FCCL', 'PIOC', 'KOHC', 'GWLC',
];

export async function GET() {
  const CACHE_KEY = 'gainers_losers';

  try {
    const cached = cache.get<{ gainers: unknown[]; losers: unknown[] }>(CACHE_KEY);
    if (cached && !cached.stale) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Fetch data for top stocks concurrently (limited to avoid overload)
    const results = await Promise.allSettled(
      TOP_SYMBOLS.slice(0, 20).map(sym => getCompanyDetail(sym))
    );

    const stocks = results
      .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof getCompanyDetail>>>> =>
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value)
      .filter(s => s.price !== null && s.changePercent !== null);

    const sorted = [...stocks].sort((a, b) =>
      (b.changePercent ?? 0) - (a.changePercent ?? 0)
    );

    const data = {
      gainers: sorted.slice(0, 10).filter(s => (s.changePercent ?? 0) > 0).map(s => ({
        symbol: s.symbol, name: s.name, sector: s.sector,
        price: s.price, change: s.change, changePercent: s.changePercent,
        volume: s.volume, marketCap: s.marketCap,
      })),
      losers: sorted.slice(-10).reverse().filter(s => (s.changePercent ?? 0) < 0).map(s => ({
        symbol: s.symbol, name: s.name, sector: s.sector,
        price: s.price, change: s.change, changePercent: s.changePercent,
        volume: s.volume, marketCap: s.marketCap,
      })),
    };

    cache.set(CACHE_KEY, data, TTL.STOCK_PRICE);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API/gainers-losers] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gainers/losers', data: { gainers: [], losers: [] } },
      { status: 500 }
    );
  }
}
