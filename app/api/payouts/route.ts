import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const CACHE_KEY = 'global_payouts_calendar';

  try {
    const cached = cache.get(CACHE_KEY);
    if (cached && !cached.stale) {
      return NextResponse.json({ success: true, data: cached.data, cached: true });
    }

    const currentYear = new Date().getFullYear();
    const payload = { year: currentYear.toString() };
    const body = new URLSearchParams(payload as any).toString();

    const res = await axios.post('https://dps.psx.com.pk/payouts', body, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: 8000
    });

    const html = res.data;
    const $ = cheerio.load(html);
    const payouts: any[] = [];

    $('#announcementsTable tbody tr').each((_, tr) => {
      const cells: string[] = [];
      $(tr).find('td').each((_, td) => {
        cells.push($(td).text().trim());
      });
      
      if (cells.length >= 6) {
        const symbol = cells[0];
        const company = cells[1];
        const sector = cells[2];
        const announcement = cells[3];
        const announcementDate = cells[4];
        const bookClosure = cells[5];

        payouts.push({
          symbol,
          company,
          sector,
          announcement,
          announcementDate,
          bookClosure
        });
      }
    });

    cache.set(CACHE_KEY, payouts, TTL.BOARD_MEETINGS); // Reuse 1 hour TTL

    return NextResponse.json({
      success: true,
      data: payouts,
      cached: false
    });
  } catch (error) {
    console.error('[API/payouts] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts', data: [] },
      { status: 500 }
    );
  }
}
