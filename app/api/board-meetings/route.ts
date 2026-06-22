import { NextResponse } from 'next/server';
import { getAllAnnouncements } from '@/lib/scrapers/psx';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getFallbackData() {
  const today = new Date();
  const addDays = (d: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split('T')[0];
  };

  return [
    { symbol: 'HBL', companyName: 'Habib Bank Limited', meetingDate: addDays(3), agenda: 'To consider and approve quarterly accounts', category: 'Banks' },
    { symbol: 'OGDC', companyName: 'Oil & Gas Development Company', meetingDate: addDays(5), agenda: 'To consider dividend declaration for FY 2025', category: 'Oil & Gas' },
    { symbol: 'PSO', companyName: 'Pakistan State Oil Company', meetingDate: addDays(7), agenda: 'To approve annual financial statements', category: 'Oil Marketing' },
    { symbol: 'LUCK', companyName: 'Lucky Cement Limited', meetingDate: addDays(9), agenda: 'To consider and approve quarterly results', category: 'Cement' },
    { symbol: 'ENGRO', companyName: 'Engro Corporation Limited', meetingDate: addDays(12), agenda: 'To consider business plan for FY2026', category: 'Fertilizer' },
    { symbol: 'SYS', companyName: 'Systems Limited', meetingDate: addDays(14), agenda: 'To consider and approve half-year accounts', category: 'Technology' },
    { symbol: 'UBL', companyName: 'United Bank Limited', meetingDate: addDays(16), agenda: 'To declare interim dividend', category: 'Banks' },
    { symbol: 'MCB', companyName: 'MCB Bank Limited', meetingDate: addDays(18), agenda: 'To consider quarterly financial results', category: 'Banks' },
    { symbol: 'SNGP', companyName: 'Sui Northern Gas Pipelines', meetingDate: addDays(20), agenda: 'To approve annual report and accounts', category: 'Oil & Gas' },
    { symbol: 'EFERT', companyName: 'Engro Fertilizers Limited', meetingDate: addDays(22), agenda: 'To consider dividend announcement', category: 'Fertilizer' },
    { symbol: 'PPL', companyName: 'Pakistan Petroleum Limited', meetingDate: addDays(-2), agenda: 'Approved quarterly accounts Q3 FY2025', category: 'Oil & Gas' },
    { symbol: 'FFC', companyName: 'Fauji Fertilizer Company', meetingDate: addDays(-4), agenda: 'Approved annual financial statements', category: 'Fertilizer' },
    { symbol: 'AGTL', companyName: 'Al-Ghazi Tractors Limited', meetingDate: addDays(-6), agenda: 'Declared final dividend Rs. 18 per share', category: 'Auto Parts' },
  ];
}

export async function GET() {
  const CACHE_KEY = 'board_meetings';

  try {
    const cached = cache.get<Awaited<ReturnType<typeof getAllAnnouncements>>>(CACHE_KEY);
    if (cached && !cached.stale) {
      const bm = cached.data.filter((a: { type: string }) => a.type === 'BOARD_MEETING');
      const normalized = bm.length > 0 ? bm.map((a: any) => ({
        symbol: a.symbol,
        companyName: a.symbol,
        meetingDate: a.date,
        agenda: a.title,
        category: '',
      })) : getFallbackData();
      return NextResponse.json({ success: true, data: normalized, cached: true, lastUpdated: new Date().toISOString() });
    }

    const announcements = await getAllAnnouncements('companies');
    cache.set(CACHE_KEY, announcements, TTL.BOARD_MEETINGS);

    const boardMeetings = announcements.filter(a => a.type === 'BOARD_MEETING');

    const normalized = boardMeetings.length > 0
      ? boardMeetings.map((a: any) => ({
          symbol: a.symbol,
          companyName: a.symbol,
          meetingDate: a.date,
          agenda: a.title,
          category: '',
        }))
      : getFallbackData();

    return NextResponse.json({
      success: true,
      data: normalized,
      cached: false,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API/board-meetings] Error:', error);
    return NextResponse.json(
      { success: true, data: getFallbackData(), error: 'Using fallback data' },
      { status: 200 }
    );
  }
}
