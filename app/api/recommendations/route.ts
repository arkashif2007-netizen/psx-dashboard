import { NextResponse } from 'next/server';
import axios from 'axios';
import { calculateFundamentalScore } from '@/lib/calculations/scoring';
import { calculateGrahamNumber, evaluateGrahamValue } from '@/lib/calculations/graham';
import { calculateDCF, evaluateDCFValue } from '@/lib/calculations/dcf';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const res = await axios.post('https://scanner.tradingview.com/pakistan/scan', {
      filter: [{ left: "type", operation: "in_range", right: ["stock"] }],
      columns: [
        "name", "description", "close", "price_earnings_ttm", "price_book_ratio", "return_on_equity",
        "debt_to_equity", "price_sales_current", "dividend_yield_recent", "book_value_per_share_fq",
        "Recommend.All", "return_on_assets", "current_ratio", "quick_ratio", "gross_margin",
        "operating_margin", "net_margin", "free_cash_flow_margin_ttm", "ebitda", "total_revenue",
        "net_income", "earnings_per_share_basic_ttm", "market_cap_basic", "enterprise_value_ebitda",
        "sector", "Recommend.MA", "Recommend.Other", "RSI7", "MACD.macd"
      ],
      sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
      range: [0, 500]
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!res.data || !res.data.data) {
      return NextResponse.json({ success: false, data: [] });
    }

    const stocks = res.data.data.map((item: any) => {
      const d = item.d;
      const symbol = d[0].replace('PSX:', '').replace('KARACHI:', '');
      const name = d[1];
      const price = d[2] ?? 0;
      
      const eps = d[21] ?? null;
      const bvps = d[9] ?? null;
      
      const grahamValue = calculateGrahamNumber(eps, bvps);
      const grahamStatus = evaluateGrahamValue(price, grahamValue);
      
      const dcfValue = calculateDCF({ eps });
      const dcfStatus = evaluateDCFValue(price, dcfValue);

      const fundamentalResult = calculateFundamentalScore({
        pe: d[3],
        pb: d[4],
        evToEbitda: d[23],
        roe: d[5],
        roa: d[11],
        netMargin: d[16],
        debtToEquity: d[6],
        currentRatio: d[12],
        sector: d[24] ?? 'Unknown'
      });
      const fundamentalScore = fundamentalResult.overall;

      const techRating = d[10] ?? 0; // -1 to 1
      let techSignal = 'NEUTRAL';
      if (techRating > 0.5) techSignal = 'STRONG BUY';
      else if (techRating > 0.1) techSignal = 'BUY';
      else if (techRating < -0.5) techSignal = 'STRONG SELL';
      else if (techRating < -0.1) techSignal = 'SELL';

      // 70% Fundamental, 30% Technical combination score
      const techScore = ((techRating + 1) / 2) * 100; 
      const overallScore = Math.round((fundamentalScore * 0.7) + (techScore * 0.3));

      return {
        symbol,
        name,
        price,
        sector: d[24] ?? 'Unknown',
        fundamentalScore,
        techSignal,
        techScore: Math.round(techScore),
        overallScore,
        parameters: {
          pe: d[3],
          pb: d[4],
          roe: d[5],
          debtToEquity: d[6],
          dividendYield: d[8],
          eps,
          bvps
        },
        intrinsicValues: {
          grahamValue,
          dcfValue
        }
      };
    });

    // Filter out stocks that don't have enough data
    const validStocks = stocks.filter((s: any) => s.parameters.pe !== null && s.price > 1);
    validStocks.sort((a: any, b: any) => b.overallScore - a.overallScore);

    return NextResponse.json({
      success: true,
      data: validStocks.slice(0, 100) // Top 100
    });

  } catch (error) {
    console.error('Recommendations API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
