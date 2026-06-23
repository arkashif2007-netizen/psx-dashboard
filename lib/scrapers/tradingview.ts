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
  // --- New Technicals ---
  recommendMA: number | null;
  recommendOther: number | null;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  sma50: number | null;
  sma200: number | null;
  ema20: number | null;
  bbLower: number | null;
  bbUpper: number | null;
  // --- New Fundamentals ---
  roic: number | null;
  cash: number | null;
  totalDebt: number | null;
  netDebt: number | null;
  beta: number | null;
  perfY: number | null;
  sector: string | null;
  // --- Phase 6: Advanced Technicals ---
  obv: number | null;
  adx: number | null;
  aroonUp: number | null;
  aroonDown: number | null;
  pivotM: number | null;
  pivotR1: number | null;
  pivotS1: number | null;
  fibR1: number | null;
  fibS1: number | null;
  candleDoji: number | null;
  candleHammer: number | null;
  candleMorningStar: number | null;
  candleEngulfingBullish: number | null;
  candleEngulfingBearish: number | null;
  chaikin: number | null;
  // --- Phase 8: Long-Term Investing Metrics ---
  fcfMargin: number | null;
  capitalExpenditures: number | null;
  freeCashFlow: number | null;
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
        "capital_expenditures_ttm",
        "free_cash_flow_ttm",
        "ebitda",
        "total_revenue",
        "net_income",
        "return_on_invested_capital",
        "earnings_per_share_basic_ttm",
        "market_cap_basic",
        "enterprise_value_ebitda",
        "Recommend.MA",
        "Recommend.Other",
        "RSI",
        "MACD.macd",
        "MACD.signal",
        "SMA50",
        "SMA200",
        "EMA20",
        "BB.lower",
        "BB.upper",
        "return_on_invested_capital",
        "cash_n_short_term_invest_fq",
        "total_debt_fq",
        "net_debt_fq",
        "beta_1_year",
        "Perf.Y",
        "sector",
        "OBV",
        "ADX",
        "Aroon.Up",
        "Aroon.Down",
        "Pivot.M.Classic.Middle",
        "Pivot.M.Classic.R1",
        "Pivot.M.Classic.S1",
        "Pivot.M.Fibonacci.R1",
        "Pivot.M.Fibonacci.S1",
        "Candle.Doji",
        "Candle.Hammer",
        "Candle.MorningStar",
        "Candle.Engulfing.Bullish",
        "Candle.Engulfing.Bearish",
        "ChaikinMoneyFlow"
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
        capitalExpenditures: d[16] ?? null,
        freeCashFlow: d[17] ?? null,
        ebitda: d[18] ?? null,
        totalRevenue: d[19] ?? null,
        netIncome: d[20] ?? null,
        roic: d[21] ?? null,
        eps: d[22] ?? null,
        marketCap: d[23] ?? null,
        evToEbitda: d[24] ?? null,
        recommendMA: d[25] ?? null,
        recommendOther: d[26] ?? null,
        rsi: d[27] ?? null,
        macd: d[28] ?? null,
        macdSignal: d[29] ?? null,
        sma50: d[30] ?? null,
        sma200: d[31] ?? null,
        ema20: d[32] ?? null,
        bbLower: d[33] ?? null,
        bbUpper: d[34] ?? null,
        cash: d[36] ?? null,
        totalDebt: d[37] ?? null,
        netDebt: d[38] ?? null,
        beta: d[39] ?? null,
        perfY: d[40] ?? null,
        sector: d[41] ?? null,
        obv: d[42] ?? null,
        adx: d[43] ?? null,
        aroonUp: d[44] ?? null,
        aroonDown: d[45] ?? null,
        pivotM: d[46] ?? null,
        pivotR1: d[47] ?? null,
        pivotS1: d[48] ?? null,
        fibR1: d[49] ?? null,
        fibS1: d[50] ?? null,
        candleDoji: d[51] ?? null,
        candleHammer: d[52] ?? null,
        candleMorningStar: d[53] ?? null,
        candleEngulfingBullish: d[54] ?? null,
        candleEngulfingBearish: d[55] ?? null,
        chaikin: d[56] ?? null,
        tvSymbol: bestMatch.s ? bestMatch.s.replace('PSX:', '').replace('KARACHI:', '') : null
      };
    }
    return null;
  } catch (err) {
    console.error(`[TV Scanner] Failed to fetch advanced fundamentals for ${symbol}:`, err);
    return null;
  }
}
