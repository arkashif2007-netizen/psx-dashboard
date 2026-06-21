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
        "Recommend.All"
      ]
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
        tvSymbol: bestMatch.s ? bestMatch.s.replace('PSX:', '') : null
      };
    }
    return null;
  } catch (err) {
    console.error(`[TV Scanner] Failed to fetch advanced fundamentals for ${symbol}:`, err);
    return null;
  }
}
