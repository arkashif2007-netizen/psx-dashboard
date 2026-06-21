import { NextResponse } from 'next/server';
import { getStockSpecificNews } from '@/lib/scrapers/news';
import cache, { TTL } from '@/lib/cache';
import { getCompanyDetail } from '@/lib/scrapers/psx';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  const CACHE_KEY = `stock_news_${upperSymbol}`;

  try {
    const cached = cache.get(CACHE_KEY);
    if (cached && !cached.stale) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
      });
    }

    // Try to get company name to make Google News search better
    const detail = await getCompanyDetail(upperSymbol);
    const companyName = detail ? detail.name.replace('Limited', '').trim() : undefined;

    const news = await getStockSpecificNews(upperSymbol, companyName);

    cache.set(CACHE_KEY, news, TTL.NEWS);

    return NextResponse.json({
      success: true,
      data: news,
      cached: false,
    });
  } catch (error) {
    console.error(`[API/stocks/${symbol}/news] Error:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock news', data: [] },
      { status: 500 }
    );
  }
}
