import { NextResponse } from 'next/server';
import { getAllAnnouncements } from '@/lib/scrapers/psx';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const CACHE_KEY = 'financial_results';

  try {
    const cached = cache.get<Awaited<ReturnType<typeof getAllAnnouncements>>>(CACHE_KEY);
    if (cached && !cached.stale) {
      const fr = cached.data.filter((a: { type: string }) => a.type === 'FINANCIAL_RESULT');
      return NextResponse.json({ success: true, data: fr, cached: true, lastUpdated: new Date().toISOString() });
    }

    const announcements = await getAllAnnouncements('companies');
    cache.set(CACHE_KEY, announcements, TTL.FINANCIAL_RESULTS);

    const financialResults = announcements.filter(a => a.type === 'FINANCIAL_RESULT');

    return NextResponse.json({
      success: true,
      data: financialResults,
      cached: false,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API/financial-results] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch financial results', data: [] },
      { status: 500 }
    );
  }
}
