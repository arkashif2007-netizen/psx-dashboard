// ─── STOCK TYPES ──────────────────────────────────────────────────────────────

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
  prevClose: number;
  marketCap?: number;
  week52High?: number;
  week52Low?: number;
  lastUpdated: string;
}

export interface StockFundamentals {
  symbol: string;
  eps: number | null;
  pe: number | null;
  pb: number | null;
  ps: number | null;
  roe: number | null;
  roa: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  dividendYield: number | null;
  dividendPerShare: number | null;
  revenue: number | null;
  netProfit: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  bookValuePerShare: number | null;
  freeCashFlow: number | null;
  sharesOutstanding: number | null;
  marketCap: number | null;
  lastUpdated: string;
}

export interface StockTechnicals {
  symbol: string;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  sma20: number | null;
  sma50: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  atr: number | null;
  stochastic: number | null;
  cci: number | null;
  mfi: number | null;
  volumeAvg20: number | null;
  support: number | null;
  resistance: number | null;
  recommendation: TechnicalRecommendation;
  lastUpdated: string;
}

export type TechnicalRecommendation = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export interface ChartPattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  description: string;
  detectedAt: string;
}

// ─── INTRINSIC VALUE ───────────────────────────────────────────────────────────

export interface IntrinsicValue {
  symbol: string;
  grahamNumber: number | null;
  grahamMoS: number | null; // Margin of Safety %
  dcfValue: number | null;
  dcfMoS: number | null;
  peBasedValue: number | null;
  currentPrice: number;
  verdict: 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED';
  lastUpdated: string;
}

// ─── MARKET DATA ───────────────────────────────────────────────────────────────

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  volume?: number;
  lastUpdated: string;
}

export interface MarketStatus {
  isOpen: boolean;
  status: 'OPEN' | 'PRE_OPEN' | 'CLOSED';
  nextOpen?: string;
  nextClose?: string;
  lastUpdated: string;
}

// ─── FIPI / LIPI ───────────────────────────────────────────────────────────────

export interface FIPILIPIData {
  date: string;
  fipi_buy: number;
  fipi_sell: number;
  fipi_net: number;
  lipi_buy: number;
  lipi_sell: number;
  lipi_net: number;
  fipilipt_trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface StockFIPILIPI {
  symbol: string;
  fipi_buy: number;
  fipi_sell: number;
  fipi_net: number;
  lipi_buy: number;
  lipi_sell: number;
  lipi_net: number;
  date: string;
}

// ─── NEWS ──────────────────────────────────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  relatedSymbols: string[];
  imageUrl?: string;
}

// ─── EVENTS ────────────────────────────────────────────────────────────────────

export interface BoardMeeting {
  symbol: string;
  companyName: string;
  meetingDate: string;
  agenda: string;
  expectedDividend?: string;
  venue?: string;
}

export interface FinancialResult {
  symbol: string;
  companyName: string;
  period: string;
  resultDate: string;
  eps?: number;
  revenue?: number;
  netProfit?: number;
  dividend?: number;
  resultType: 'QUARTERLY' | 'ANNUAL' | 'INTERIM';
}

// ─── RECOMMENDATIONS ───────────────────────────────────────────────────────────

export interface InvestmentRecommendation {
  symbol: string;
  overallRating: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  fundamentalScore: number; // 0-100
  technicalScore: number;   // 0-100
  targetPrice: number | null;
  stopLoss: number | null;
  rationale: string;
  risks: string[];
  dayTradeSetup: TradeSetup | null;
  swingTradeSetup: TradeSetup | null;
  lastUpdated: string;
}

export interface TradeSetup {
  type: 'LONG' | 'SHORT';
  entry: number;
  target: number;
  stopLoss: number;
  riskReward: number;
  timeframe: string;
  rationale: string;
}

// ─── API RESPONSES ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  lastUpdated: string;
  cached: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}
