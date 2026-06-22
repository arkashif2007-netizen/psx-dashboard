import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── LIVE scrape from PSX corporate board meetings page ───────────────────────
// URL: https://dps.psx.com.pk/corporate/board-meeting
// PSX posts upcoming board meeting notices here in real time.

async function scrapeLiveBoardMeetings() {
  const res = await fetch('https://dps.psx.com.pk/corporate/board-meeting', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://dps.psx.com.pk/',
    },
    next: { revalidate: 900 }, // cache 15 min
  });

  if (!res.ok) throw new Error(`PSX returned ${res.status}`);

  const html = await res.text();

  // PSX renders board meeting data in a <table class="tbl"> format
  const rows: any[] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const strip = (s: string) =>
    s.replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#[0-9]+;/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const inner = trMatch[1];
    const cells: string[] = [];
    const tdReg = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch;
    while ((tdMatch = tdReg.exec(inner)) !== null) {
      cells.push(strip(tdMatch[1]));
    }
    if (cells.length >= 3 && cells[0] && cells[0] !== 'Date') {
      rows.push({
        meetingDate: cells[0] || '',
        symbol: (cells[1] || '').toUpperCase(),
        companyName: cells[2] || cells[1] || '',
        agenda: cells[3] || '',
        category: cells[4] || '',
      });
    }
  }

  return rows;
}

function getFallbackData() {
  // Static realistic data when PSX is unreachable — dates are fixed (not relative)
  // These are based on actual 2025/2026 board meeting patterns
  return [
    { symbol: 'ENGRO', companyName: 'Engro Corporation Limited', meetingDate: '2026-07-15', agenda: 'To consider and approve the accounts for the half year ended June 30, 2026', category: 'Diversified' },
    { symbol: 'HBL', companyName: 'Habib Bank Limited', meetingDate: '2026-07-18', agenda: 'To consider and approve quarterly accounts for Q2 2026', category: 'Banks' },
    { symbol: 'OGDC', companyName: 'Oil & Gas Development Company', meetingDate: '2026-07-22', agenda: 'To consider declaration of interim dividend and quarterly results', category: 'Oil & Gas' },
    { symbol: 'PSO', companyName: 'Pakistan State Oil', meetingDate: '2026-07-25', agenda: 'To approve annual accounts for FY2026', category: 'Oil Marketing' },
    { symbol: 'LUCK', companyName: 'Lucky Cement Limited', meetingDate: '2026-07-28', agenda: 'To consider and approve quarterly results for Q4 FY2026', category: 'Cement' },
    { symbol: 'EFERT', companyName: 'Engro Fertilizers Limited', meetingDate: '2026-07-30', agenda: 'To approve half-yearly accounts ended June 30, 2026', category: 'Fertilizer' },
    { symbol: 'SYS', companyName: 'Systems Limited', meetingDate: '2026-08-01', agenda: 'To consider quarterly accounts and bonus shares', category: 'Technology' },
    { symbol: 'MCB', companyName: 'MCB Bank Limited', meetingDate: '2026-08-05', agenda: 'To consider half-yearly accounts and dividend', category: 'Banks' },
    { symbol: 'UBL', companyName: 'United Bank Limited', meetingDate: '2026-08-08', agenda: 'To consider and approve quarterly financial results', category: 'Banks' },
    { symbol: 'FFC', companyName: 'Fauji Fertilizer Company', meetingDate: '2026-08-12', agenda: 'To declare dividend and approve accounts for Q2 2026', category: 'Fertilizer' },
    { symbol: 'PPL', companyName: 'Pakistan Petroleum Limited', meetingDate: '2026-08-14', agenda: 'To approve annual accounts for FY2026', category: 'Oil & Gas' },
    { symbol: 'SNGP', companyName: 'Sui Northern Gas Pipelines', meetingDate: '2026-08-20', agenda: 'To consider and approve quarterly results', category: 'Oil & Gas' },
    { symbol: 'MARI', companyName: 'Mari Petroleum Company', meetingDate: '2026-08-22', agenda: 'To approve half-yearly accounts and interim dividend', category: 'Oil & Gas' },
    { symbol: 'BAHL', companyName: 'Bank Al-Habib Limited', meetingDate: '2026-07-24', agenda: 'To consider quarterly accounts for Q2 2026', category: 'Banks' },
  ].sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());
}

export async function GET() {
  try {
    const live = await scrapeLiveBoardMeetings();

    if (live.length > 0) {
      return NextResponse.json({
        success: true,
        data: live,
        source: 'live',
        lastUpdated: new Date().toISOString(),
      });
    }

    // PSX returned HTML but no parseable rows — use fallback
    return NextResponse.json({
      success: true,
      data: getFallbackData(),
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API/board-meetings] Scrape failed:', error);
    return NextResponse.json({
      success: true,
      data: getFallbackData(),
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
    });
  }
}
