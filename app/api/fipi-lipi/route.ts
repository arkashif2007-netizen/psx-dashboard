import { NextResponse } from 'next/server';

// ─── In-memory FIPI/LIPI seeded data (Vercel-compatible — no SQLite needed) ───
// NCCPL blocks all bots via Cloudflare. This generates mathematically-balanced
// mock data for the last 30 trading days. Replace with a paid NCCPL API stream
// when available.

const INVESTOR_TYPES = [
  'Foreign Corporates',
  'Individuals',
  'Mutual Funds',
  'Banks / DFI',
  'Broker Proprietary Trading',
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateFipiData() {
  const records: { date: string; investorType: string; netValue: number }[] = [];
  const today = new Date();
  let daySeed = 42;

  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

    const dateStr = d.toISOString().split('T')[0];

    INVESTOR_TYPES.forEach((type, typeIdx) => {
      daySeed++;
      const r1 = seededRandom(daySeed * 17 + typeIdx * 31 + i * 7);
      const r2 = seededRandom(daySeed * 13 + typeIdx * 29 + i * 11);
      const buy = (r1 * 9) + 1;
      const sell = (r2 * 9) + 1;
      let net = buy - sell;

      // Bias: Foreign Corporates tend to sell, Individuals/Mutual Funds tend to buy
      if (type === 'Foreign Corporates') net -= r1 * 2;
      if (type === 'Individuals') net += r2 * 1.5;
      if (type === 'Mutual Funds') net += r1 * 0.8;

      records.push({
        date: dateStr,
        investorType: type,
        netValue: parseFloat(net.toFixed(2)),
      });
    });
  }

  return records;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = generateFipiData();

    // Group into time-series format for Recharts
    const groupedByDate: Record<string, any> = {};
    data.forEach((record) => {
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = { date: record.date };
      }
      groupedByDate[record.date][record.investorType] = record.netValue;
    });

    const chartData = Object.values(groupedByDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      success: true,
      data: chartData,
      raw: data,
    });
  } catch (error) {
    console.error('[API/fipi-lipi] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate FIPI data', data: [] },
      { status: 500 }
    );
  }
}
