import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PSX_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
  'Accept-Language': 'en-US,en;q=0.5',
  'Referer': 'https://dps.psx.com.pk/',
};

function strip(html: string) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#[0-9]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRows(html: string) {
  const rows: string[][] = [];
  const trReg = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trReg.exec(html)) !== null) {
    const cells: string[] = [];
    const tdReg = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch;
    while ((tdMatch = tdReg.exec(trMatch[1])) !== null) {
      cells.push(strip(tdMatch[1]));
    }
    if (cells.length >= 2 && cells[0] && cells[0] !== 'Date') rows.push(cells);
  }
  return rows;
}

async function fetchCorporatePage(path: string, symbol: string) {
  // Try PSX corporate pages — these are the LIVE notice boards updated in real time
  const urls = [
    `https://dps.psx.com.pk/corporate/${path}?symbol=${symbol}`,
    `https://dps.psx.com.pk/corporate/${path}?company=${symbol}`,
    `https://dps.psx.com.pk/corporate/${path}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: PSX_HEADERS, next: { revalidate: 600 } });
      if (!res.ok) continue;
      const html = await res.text();
      const rows = parseRows(html);

      // Filter rows that contain the symbol in any cell
      const filtered = rows.filter(cells =>
        cells.some(c => c.toUpperCase().includes(symbol.toUpperCase()))
      );

      if (filtered.length > 0) return filtered;
      if (rows.length > 0) return rows; // Return all if no symbol match (some pages filter server-side)
    } catch {
      continue;
    }
  }
  return [];
}

function extractResultType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('annual') || t.includes('full year')) return 'Annual';
  if (t.includes('half') || t.includes('semi') || t.includes('six month')) return 'Half Year';
  if (t.includes('nine month') || t.includes('q3') || t.includes('third quarter')) return 'Q3';
  if (t.includes('q1') || t.includes('first quarter') || t.includes('three month')) return 'Q1';
  if (t.includes('q2') || t.includes('second quarter')) return 'Q2';
  if (t.includes('q4') || t.includes('fourth quarter')) return 'Q4';
  return 'Quarterly';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  try {
    // Fetch both in parallel
    const [bmRows, frRows] = await Promise.all([
      fetchCorporatePage('board-meeting', upperSymbol),
      fetchCorporatePage('financial-result', upperSymbol),
    ]);

    const boardMeetings = bmRows.map(cells => ({
      meetingDate: cells[0] || '',
      symbol: (cells[1] || upperSymbol).toUpperCase(),
      companyName: cells[2] || cells[1] || upperSymbol,
      agenda: cells[3] || cells[2] || '',
      category: cells[4] || '',
    })).slice(0, 20);

    const financialResults = frRows.map(cells => {
      const title = cells[3] || cells[2] || '';
      return {
        resultDate: cells[0] || '',
        symbol: (cells[1] || upperSymbol).toUpperCase(),
        companyName: cells[2] || cells[1] || upperSymbol,
        period: title,
        resultType: extractResultType(title),
      };
    }).slice(0, 20);

    return NextResponse.json({
      success: true,
      symbol: upperSymbol,
      boardMeetings,
      financialResults,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[API/stocks/${symbol}/events] Error:`, error);
    return NextResponse.json({
      success: false,
      symbol: upperSymbol,
      boardMeetings: [],
      financialResults: [],
      error: 'Failed to fetch events',
    }, { status: 500 });
  }
}
