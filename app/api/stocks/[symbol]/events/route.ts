import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

function extractResultType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('annual') || t.includes('fy')) return 'Annual';
  if (t.includes('half') || t.includes('semi')) return 'Half Year';
  if (t.includes('nine month') || t.includes('q3')) return 'Q3';
  if (t.includes('q1') || t.includes('first quarter')) return 'Q1';
  if (t.includes('q2') || t.includes('second quarter')) return 'Q2';
  if (t.includes('q4') || t.includes('fourth quarter')) return 'Q4';
  if (t.includes('quarter')) return 'Quarter';
  return 'Quarterly';
}

function isFinancialResult(title: string): boolean {
  const t = title.toLowerCase();
  if (t.includes('other than') || t.includes('other tan')) return false;
  if (t.includes('notice of') || t.includes('notice for') || t.includes('agenda')) return false;
  if (t.includes('budget') || t.includes('election') || t.includes('directors') || t.includes('resignation')) return false;
  if (t.includes('book closure') || t.includes('dividend distribution')) return false;
  
  return t.includes('financial result') || 
         t.includes('financial statements') || 
         t.includes('quarter ended') || 
         t.includes('half year ended') || 
         t.includes('year ended') || 
         t.includes('period ended') ||
         t.includes('quarterly accounts') ||
         t.includes('annual accounts') ||
         t.includes('half yearly accounts');
}

function isBoardMeeting(title: string): boolean {
  const t = title.toLowerCase();
  return t.includes('board meeting') || t.includes('board of directors meeting') || t.includes('bod meeting') || t.includes('intimation of');
}

async function fetchCompanyAnnouncements(symbol: string) {
  const payload = {
    type: 'C',
    symbol: symbol,
    query: '',
    count: 100,
    offset: 0,
    date_from: '',
    date_to: '',
    page: 'annc'
  };

  const body = new URLSearchParams(payload as any).toString();

  const res = await fetch('https://dps.psx.com.pk/announcements', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://dps.psx.com.pk/announcements/companies',
    },
    body,
    next: { revalidate: 600 },
  });

  if (!res.ok) throw new Error(`PSX returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const boardMeetings: any[] = [];
  const financialResults: any[] = [];

  $('table tr').each((_, tr) => {
    const cells: string[] = [];
    $(tr).find('td').each((_, td) => {
      cells.push($(td).text().trim());
    });
    if (cells.length >= 5) {
      const date = cells[0];
      const time = cells[1];
      const companySymbol = cells[2].toUpperCase();
      const companyName = cells[3];
      const title = cells[4];

      if (isBoardMeeting(title)) {
        boardMeetings.push({
          meetingDate: `${date} ${time}`,
          symbol: companySymbol,
          companyName,
          agenda: title,
        });
      } else if (isFinancialResult(title)) {
        financialResults.push({
          resultDate: `${date} ${time}`,
          symbol: companySymbol,
          companyName,
          period: title,
          resultType: extractResultType(title),
        });
      }
    }
  });

  return { boardMeetings, financialResults };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  try {
    const { boardMeetings, financialResults } = await fetchCompanyAnnouncements(upperSymbol);

    return NextResponse.json({
      success: true,
      symbol: upperSymbol,
      boardMeetings: boardMeetings.slice(0, 20),
      financialResults: financialResults.slice(0, 20),
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
