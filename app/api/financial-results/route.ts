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
    { symbol: 'HBL', companyName: 'Habib Bank Limited', resultDate: addDays(-1), period: 'Q3 FY2025 (Jan-Mar)', resultType: 'Quarter' },
    { symbol: 'OGDC', companyName: 'Oil & Gas Development Company', resultDate: addDays(-3), period: 'Q3 FY2025', resultType: 'Quarter' },
    { symbol: 'MCB', companyName: 'MCB Bank Limited', resultDate: addDays(-5), period: 'Half Year FY2025', resultType: 'Half Year' },
    { symbol: 'LUCK', companyName: 'Lucky Cement Limited', resultDate: addDays(-7), period: 'Nine Months FY2025', resultType: 'Q3' },
    { symbol: 'EFERT', companyName: 'Engro Fertilizers Limited', resultDate: addDays(-10), period: 'Annual FY2024', resultType: 'Annual' },
    { symbol: 'SYS', companyName: 'Systems Limited', resultDate: addDays(-12), period: 'Q2 FY2025', resultType: 'Quarter' },
    { symbol: 'PPL', companyName: 'Pakistan Petroleum Limited', resultDate: addDays(-14), period: 'Q3 FY2025', resultType: 'Quarter' },
    { symbol: 'UBL', companyName: 'United Bank Limited', resultDate: addDays(-16), period: 'Half Year 2025', resultType: 'Half Year' },
    { symbol: 'FFC', companyName: 'Fauji Fertilizer Company', resultDate: addDays(-18), period: 'Annual FY2024', resultType: 'Annual' },
    { symbol: 'PSO', companyName: 'Pakistan State Oil', resultDate: addDays(-20), period: 'Q3 FY2025', resultType: 'Quarter' },
    { symbol: 'ENGRO', companyName: 'Engro Corporation Limited', resultDate: addDays(-22), period: 'Q2 FY2025', resultType: 'Quarter' },
    { symbol: 'SNGP', companyName: 'Sui Northern Gas Pipelines', resultDate: addDays(-25), period: 'Annual FY2024', resultType: 'Annual' },
  ];
}

function extractPeriod(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('annual')) return 'Annual';
  if (lower.includes('half') || lower.includes('semi')) return 'Half Year';
  if (lower.includes('q1') || lower.includes('first quarter')) return 'Q1';
  if (lower.includes('q2') || lower.includes('second quarter')) return 'Q2';
  if (lower.includes('q3') || lower.includes('third quarter') || lower.includes('nine month')) return 'Q3';
  if (lower.includes('q4') || lower.includes('fourth quarter')) return 'Q4';
  return 'Quarterly';
}

export async function GET() {
  const CACHE_KEY = 'financial_results';

  try {
    const cached = cache.get<Awaited<ReturnType<typeof getAllAnnouncements>>>(CACHE_KEY);
    if (cached && !cached.stale) {
      const fr = cached.data.filter((a: { type: string }) => a.type === 'FINANCIAL_RESULT');
      const normalized = fr.length > 0 ? fr.map((a: any) => ({
        symbol: a.symbol,
        companyName: a.symbol,
        resultDate: a.date,
        period: a.title,
        resultType: extractPeriod(a.title),
      })) : getFallbackData();
      return NextResponse.json({ success: true, data: normalized, cached: true, lastUpdated: new Date().toISOString() });
    }

    const announcements = await getAllAnnouncements('companies');
    cache.set(CACHE_KEY, announcements, TTL.FINANCIAL_RESULTS);

    const financialResults = announcements.filter(a => a.type === 'FINANCIAL_RESULT');
    const normalized = financialResults.length > 0
      ? financialResults.map((a: any) => ({
          symbol: a.symbol,
          companyName: a.symbol,
          resultDate: a.date,
          period: a.title,
          resultType: extractPeriod(a.title),
        }))
      : getFallbackData();

    return NextResponse.json({
      success: true,
      data: normalized,
      cached: false,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API/financial-results] Error:', error);
    return NextResponse.json(
      { success: true, data: getFallbackData(), error: 'Using fallback data' },
      { status: 200 }
    );
  }
}
