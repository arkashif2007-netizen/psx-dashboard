import { NextResponse } from 'next/server';
import { getAllSymbols, getMarketSummary, MarketSummaryStock } from '@/lib/scrapers/psx';
import cache, { TTL, getCurrentTTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all'; // all | equity | etf
  const search = searchParams.get('search') || '';
  const sector = searchParams.get('sector') || '';

  const CACHE_KEY = 'all_stocks';

  try {
    const cached = cache.get<{ symbols: ReturnType<typeof getAllSymbols> extends Promise<infer T> ? T : never }>(CACHE_KEY);
    let symbols;

    if (cached && !cached.stale) {
      symbols = cached.data.symbols;
    } else {
      symbols = await getAllSymbols();
      if (symbols.length > 0) {
        cache.set(CACHE_KEY, { symbols }, getCurrentTTL('ALL_STOCKS'));
      }
    }

    const SUMMARY_CACHE_KEY = 'market_summary_stocks';
    let summary: MarketSummaryStock[] = [];
    const cachedSummary = cache.get<{ summary: MarketSummaryStock[] }>(SUMMARY_CACHE_KEY);
    
    if (cachedSummary && !cachedSummary.stale) {
      summary = cachedSummary.data.summary;
    } else {
      summary = await getMarketSummary();
      if (summary.length > 0) {
        cache.set(SUMMARY_CACHE_KEY, { summary }, getCurrentTTL('STOCK_PRICE'));
      }
    }

    // Merge prices from summary into symbols
    const summaryMap = new Map<string, MarketSummaryStock>();
    for (const item of summary) {
      summaryMap.set(item.symbol.toUpperCase(), item);
    }

    let mergedSymbols = symbols.map(s => {
      const liveData = summaryMap.get(s.symbol.toUpperCase());
      return {
        ...s,
        price: liveData?.close ?? liveData?.ldcp ?? null,
        change: liveData?.change ?? null,
        changePercent: liveData?.changePercent ?? null,
        volume: liveData?.volume ?? null,
      };
    });

    // Apply filters
    let filtered = mergedSymbols.filter(s => {
      const nameUpper = s.name.toUpperCase();
      const sectorUpper = s.sectorName.toUpperCase();
      
      // Exclude explicitly delisted or defaulter segment stocks
      if (nameUpper.includes('DELISTED') || nameUpper.includes('DEFAULTER')) return false;
      if (sectorUpper.includes('DEFAULTER') || sectorUpper.includes('DELISTED')) return false;

      // Exclude effectively dead/suspended stocks with no price and no volume
      const isDead = (!s.price || s.price === 0) && (!s.volume || s.volume === 0);
      if (isDead) return false;

      return true;
    });

    if (filter === 'equity') {
      filtered = filtered.filter(s => !s.isETF && !s.isDebt);
    } else if (filter === 'etf') {
      filtered = filtered.filter(s => s.isETF);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
      );
    }

    if (sector) {
      filtered = filtered.filter(s =>
        s.sectorName.toLowerCase().includes(sector.toLowerCase())
      );
    }

    // Get unique sectors
    const sectors = [...new Set(symbols.map(s => s.sectorName).filter(Boolean))].sort();

    return NextResponse.json({
      success: true,
      data: {
        stocks: filtered,
        total: filtered.length,
        sectors,
      },
      cached: !!cached && !cached.stale,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API/stocks] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stocks', data: { stocks: [], total: 0, sectors: [] } },
      { status: 500 }
    );
  }
}
