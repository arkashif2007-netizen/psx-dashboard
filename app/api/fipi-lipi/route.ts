import { NextResponse } from 'next/server';
import { getFipiData } from '@/lib/scrapers/fipi';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getFipiData();

    // Group the flat data into a time-series format for Recharts
    // e.g. [ { date: '2026-06-01', "Foreign Corporates": -1.2, "Individuals": 2.5 }, ... ]
    const groupedByDate: Record<string, any> = {};

    data.forEach((record) => {
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = { date: record.date };
      }
      groupedByDate[record.date][record.investorType] = record.netValue;
    });

    const chartData = Object.values(groupedByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      success: true,
      data: chartData,
      raw: data, // optionally return raw if needed
    });
  } catch (error) {
    console.error('[API/fipi-lipi] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FIPI data', data: [] },
      { status: 500 }
    );
  }
}
