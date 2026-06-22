import axios from 'axios';
import { StockFundamentals } from '@/lib/types';

export interface TVAdvancedFundamentals {
  pe: number | null;
  pb: number | null;
  roe: number | null;
  debtToEquity: number | null;
  ps: number | null;
  dividendYield: number | null;
  bookValuePerShare: number | null;
  recommendation: number | null; // -1 to 1 (Sell to Buy)
  roa: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  freeCashFlowMargin: number | null;
  ebitda: number | null;
  totalRevenue: number | null;
  netIncome: number | null;
  eps: number | null;
  marketCap: number | null;
  evToEbitda: number | null;
  tvSymbol: string | null;
}

export async function getAdvancedFundamentals(symbol: string): Promise<TVAdvancedFundamentals | null> {
  try {
    const res = await axios.post('https://scanner.tradingview.com/pakistan/scan', {
      filter: [{ left: "name", operation: "match", right: symbol }],
      columns: [
        "name", 
        "price_earnings_ttm", 
        "price_book_ratio", 
        "return_on_equity", 
        "debt_to_equity", 
        "price_sales_current", 
        "dividend_yield_recent", 
        "book_value_per_share_fq",
        "Recommend.All",
        "return_on_assets",
        "current_ratio",
        "quick_ratio",
        "gross_margin",
        "operating_margin",
        "net_margin",
        "free_cash_flow_margin_ttm",
        "ebitda",
        "total_revenue",
        "net_income",
        "earnings_per_share_basic_ttm",
        "market_cap_basic",
        "enterprise_value_ebitda"
      ]
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (res.data && res.data.data && res.data.data.length > 0) {
      // Find exact match or use first
      let bestMatch = res.data.data.find((item: any) => item.d[0] === symbol || item.d[0] === `${symbol}H`);
      if (!bestMatch) bestMatch = res.data.data[0];

      const d = bestMatch.d;
      return {
        pe: d[1] ?? null,
        pb: d[2] ?? null,
        roe: d[3] ?? null,
        debtToEquity: d[4] ?? null,
        ps: d[5] ?? null,
        dividendYield: d[6] ?? null,
        bookValuePerShare: d[7] ?? null,
        recommendation: d[8] ?? null,
        roa: d[9] ?? null,
        currentRatio: d[10] ?? null,
        quickRatio: d[11] ?? null,
        grossMargin: d[12] ?? null,
        operatingMargin: d[13] ?? null,
        netMargin: d[14] ?? null,
        freeCashFlowMargin: d[15] ?? null,
        ebitda: d[16] ?? null,
        totalRevenue: d[17] ?? null,
        netIncome: d[18] ?? null,
        eps: d[19] ?? null,
        marketCap: d[20] ?? null,
        evToEbitda: d[21] ?? null,
        tvSymbol: bestMatch.s ? bestMatch.s.replace('PSX:', '').replace('KARACHI:', '') : null
      };
    }
    return null;
  } catch (err) {
    console.error(`[TV Scanner] Failed to fetch advanced fundamentals for ${symbol}:`, err);
    return null;
  }
}
