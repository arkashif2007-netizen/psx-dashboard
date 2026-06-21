import { NextResponse } from 'next/server';
import { getMarketIndices } from '@/lib/scrapers/psx';
import { getMarketStatus } from '@/lib/cache';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const CACHE_KEY = 'market_data';

  try {
    const cached = cache.get<{ indices: Awaited<ReturnType<typeof getMarketIndices>>; status: string }>(CACHE_KEY);

    if (cached && !cached.stale) {
      return NextResponse.json({
        success: true,
        data: { ...cached.data, marketStatus: cached.data.status },
        cached: true,
        lastUpdated: new Date().toISOString(),
      });
    }

    const [indices] = await Promise.all([
      getMarketIndices(),
    ]);

    const status = getMarketStatus();

    const data = { indices, status };
    cache.set(CACHE_KEY, data, TTL.MARKET_STATUS);

    // Extract key indices
    const kse100 = indices.find(i => i.name === 'KSE100');
    const kse30 = indices.find(i => i.name === 'KSE30');
    const kmi30 = indices.find(i => i.name === 'KMI30');
    const allShares = indices.find(i => i.name === 'ALLSHR');

    return NextResponse.json({
      success: true,
      data: {
        indices,
        kse100,
        kse30,
        kmi30,
        allShares,
        marketStatus: status,
      },
      cached: false,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API/market] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data', data: null },
      { status: 500 }
    );
  }
}
