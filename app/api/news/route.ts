import { NextResponse } from 'next/server';
import { getGlobalMarketNews } from '@/lib/scrapers/news';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const CACHE_KEY = 'global_market_news';

  try {
    const cached = cache.get(CACHE_KEY);
    if (cached && !cached.stale) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
      });
    }

    const news = await getGlobalMarketNews();

    cache.set(CACHE_KEY, news, TTL.NEWS);

    return NextResponse.json({
      success: true,
      data: news,
      cached: false,
    });
  } catch (error) {
    console.error('[API/news] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news', data: [] },
      { status: 500 }
    );
  }
}
