import axios from 'axios';
import cache, { TTL } from '@/lib/cache';
import { SectorMedians } from '@/lib/calculations/scoring';

export async function getGlobalSectorMedians(): Promise<{ medians: Record<string, SectorMedians>, rawData: any[] }> {
  const CACHE_KEY = 'global_sector_medians_data_v2';
  const cached = cache.get<{ medians: Record<string, SectorMedians>, rawData: any[] }>(CACHE_KEY);

  if (cached && !cached.stale) {
    return cached.data;
  }

  const res = await axios.post('https://scanner.tradingview.com/pakistan/scan', {
    columns: [
      "name", 
      "close",
      "volume",
      "sector",
      "price_earnings_ttm", 
      "price_book_ratio", 
      "return_on_equity", 
      "debt_to_equity", 
      "return_on_invested_capital", // ROCE
      "current_ratio",
      "net_margin",
      "operating_margin",
      "enterprise_value_ebitda",
      "earnings_per_share_basic_ttm",
      "book_value_per_share_fq",
      "dividend_yield_recent"
    ],
    filter: [{ left: "type", operation: "in_range", right: ["stock"] }],
    sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
    range: [0, 600]
  }, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json'
    }
  });

  if (!res.data || !res.data.data) {
    throw new Error('Invalid TV scanner response');
  }

  const rawData = res.data.data;

  // 1. Calculate Sector Medians
  const sectors: Record<string, any[]> = {};
  rawData.forEach((item: any) => {
    const d = item.d;
    const sector = d[3] || 'Unknown';
    if (!sectors[sector]) sectors[sector] = [];
    sectors[sector].push({
      pe: d[4], pb: d[5], roe: d[6], debtToEquity: d[7],
      roce: d[8], currentRatio: d[9], netMargin: d[10], operatingMargin: d[11],
      evToEbitda: d[12]
    });
  });

  const getMedian = (arr: number[]) => {
    const filtered = arr.filter(v => v !== null && v !== undefined && !isNaN(v)).sort((a, b) => a - b);
    if (filtered.length === 0) return 0;
    const mid = Math.floor(filtered.length / 2);
    return filtered.length % 2 !== 0 ? filtered[mid] : (filtered[mid - 1] + filtered[mid]) / 2;
  };

  const sectorMedians: Record<string, SectorMedians> = {};
  for (const [sector, stocks] of Object.entries(sectors)) {
    sectorMedians[sector] = {
      pe: getMedian(stocks.map(s => s.pe)),
      pb: getMedian(stocks.map(s => s.pb)),
      roe: getMedian(stocks.map(s => s.roe)),
      debtToEquity: getMedian(stocks.map(s => s.debtToEquity)),
      roce: getMedian(stocks.map(s => s.roce)),
      currentRatio: getMedian(stocks.map(s => s.currentRatio)),
      netMargin: getMedian(stocks.map(s => s.netMargin)),
      operatingMargin: getMedian(stocks.map(s => s.operatingMargin)),
      evToEbitda: getMedian(stocks.map(s => s.evToEbitda))
    };
  }

  const result = { medians: sectorMedians, rawData };
  cache.set(CACHE_KEY, result, TTL.ALL_STOCKS);

  return result;
}
