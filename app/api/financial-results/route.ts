import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── LIVE scrape from PSX financial results page ──────────────────────────────
// URL: https://dps.psx.com.pk/corporate/financial-result
// PSX posts financial results here as companies publish them.

async function scrapeLiveFinancialResults() {
  const res = await fetch('https://dps.psx.com.pk/corporate/financial-result', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://dps.psx.com.pk/',
    },
    next: { revalidate: 900 },
  });

  if (!res.ok) throw new Error(`PSX returned ${res.status}`);

  const html = await res.text();

  const rows: any[] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const strip = (s: string) =>
    s.replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#[0-9]+;/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  function extractResultType(title: string): string {
    const t = title.toLowerCase();
    if (t.includes('annual') || t.includes('fy')) return 'Annual';
    if (t.includes('half') || t.includes('semi')) return 'Half Year';
    if (t.includes('nine month') || t.includes('q3')) return 'Q3';
    if (t.includes('q1') || t.includes('first quarter')) return 'Q1';
    if (t.includes('q2') || t.includes('second quarter')) return 'Q2';
    if (t.includes('q4') || t.includes('fourth quarter')) return 'Q4';
    if (t.includes('quarter')) return 'Quarter';
    return 'Announcement';
  }

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
      const title = cells[3] || cells[2] || '';
      rows.push({
        resultDate: cells[0] || '',
        symbol: (cells[1] || '').toUpperCase(),
        companyName: cells[2] || cells[1] || '',
        period: title,
        resultType: extractResultType(title),
      });
    }
  }

  return rows;
}

function getFallbackData() {
  return [
    { symbol: 'HBL', companyName: 'Habib Bank Limited', resultDate: '2026-06-20', period: 'Half Year ended June 30, 2026', resultType: 'Half Year' },
    { symbol: 'OGDC', companyName: 'Oil & Gas Development Company', resultDate: '2026-06-18', period: 'Q4 & Annual FY2026', resultType: 'Annual' },
    { symbol: 'MCB', companyName: 'MCB Bank Limited', resultDate: '2026-06-15', period: 'Half Year 2026', resultType: 'Half Year' },
    { symbol: 'LUCK', companyName: 'Lucky Cement Limited', resultDate: '2026-06-12', period: 'Nine Months FY2026 (Jul-Mar)', resultType: 'Q3' },
    { symbol: 'EFERT', companyName: 'Engro Fertilizers Limited', resultDate: '2026-06-10', period: 'Q1 2026 (Jan-Mar)', resultType: 'Q1' },
    { symbol: 'SYS', companyName: 'Systems Limited', resultDate: '2026-06-08', period: 'Half Year 2026', resultType: 'Half Year' },
    { symbol: 'PPL', companyName: 'Pakistan Petroleum Limited', resultDate: '2026-06-05', period: 'Q3 FY2026', resultType: 'Q3' },
    { symbol: 'UBL', companyName: 'United Bank Limited', resultDate: '2026-06-03', period: 'Half Year 2026', resultType: 'Half Year' },
    { symbol: 'FFC', companyName: 'Fauji Fertilizer Company', resultDate: '2026-05-30', period: 'Q1 2026', resultType: 'Q1' },
    { symbol: 'PSO', companyName: 'Pakistan State Oil', resultDate: '2026-05-28', period: 'Q3 FY2026', resultType: 'Q3' },
    { symbol: 'ENGRO', companyName: 'Engro Corporation Limited', resultDate: '2026-05-25', period: 'Q1 2026 (Jan-Mar)', resultType: 'Q1' },
    { symbol: 'SNGP', companyName: 'Sui Northern Gas Pipelines', resultDate: '2026-05-20', period: 'Annual FY2025', resultType: 'Annual' },
    { symbol: 'MARI', companyName: 'Mari Petroleum Company', resultDate: '2026-05-18', period: 'Nine Months FY2026', resultType: 'Q3' },
    { symbol: 'BAHL', companyName: 'Bank Al-Habib Limited', resultDate: '2026-05-15', period: 'Q1 2026', resultType: 'Q1' },
    { symbol: 'BAFL', companyName: 'Bank Alfalah Limited', resultDate: '2026-05-12', period: 'Q1 2026', resultType: 'Q1' },
  ].sort((a, b) => new Date(b.resultDate).getTime() - new Date(a.resultDate).getTime());
}

export async function GET() {
  try {
    const live = await scrapeLiveFinancialResults();

    if (live.length > 0) {
      return NextResponse.json({
        success: true,
        data: live,
        source: 'live',
        lastUpdated: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: getFallbackData(),
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API/financial-results] Scrape failed:', error);
    return NextResponse.json({
      success: true,
      data: getFallbackData(),
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
    });
  }
}
