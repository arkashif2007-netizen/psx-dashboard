import { NextResponse } from 'next/server';
import { getAllAnnouncements } from '@/lib/scrapers/psx';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const CACHE_KEY = 'board_meetings';

  try {
    const cached = cache.get<Awaited<ReturnType<typeof getAllAnnouncements>>>(CACHE_KEY);
    if (cached && !cached.stale) {
      const bm = cached.data.filter((a: { type: string }) => a.type === 'BOARD_MEETING');
      return NextResponse.json({ success: true, data: bm, cached: true, lastUpdated: new Date().toISOString() });
    }

    const announcements = await getAllAnnouncements('companies');
    cache.set(CACHE_KEY, announcements, TTL.BOARD_MEETINGS);

    const boardMeetings = announcements.filter(a => a.type === 'BOARD_MEETING');

    return NextResponse.json({
      success: true,
      data: boardMeetings,
      cached: false,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API/board-meetings] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch board meetings', data: [] },
      { status: 500 }
    );
  }
}
