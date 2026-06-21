import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Stock, StockFundamentals, MarketIndex, BoardMeeting, FinancialResult } from '@/lib/types';

// ─── HTTP CLIENT ──────────────────────────────────────────────────────────────
const psxClient = axios.create({
  baseURL: 'https://dps.psx.com.pk',
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Cache-Control': 'no-cache',
  },
});

// ─── HELPER: Parse number strings ─────────────────────────────────────────────
function parseNum(str: string | undefined): number | null {
  if (!str) return null;
  const cleaned = str.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseNumWithCommas(str: string | undefined): number | null {
  if (!str) return null;
  const cleaned = str.replace(/,/g, '').replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// ─── 1. GET ALL PSX SYMBOLS ───────────────────────────────────────────────────
export interface PSXSymbol {
  symbol: string;
  name: string;
  sectorName: string;
  isETF: boolean;
  isDebt: boolean;
  isGEM?: boolean;
}

export async function getAllSymbols(): Promise<PSXSymbol[]> {
  try {
    const res = await psxClient.get('/symbols', {
      headers: { 'Accept': 'application/json' }
    });
    const data: PSXSymbol[] = Array.isArray(res.data) ? res.data : [];
    // Filter to equity stocks only (exclude debt/bonds)
    return data.filter(s => !s.isDebt);
  } catch (err) {
    console.error('[PSX] Failed to fetch symbols:', err);
    return [];
  }
}

// ─── 2. GET MARKET INDICES ────────────────────────────────────────────────────
export async function getMarketIndices(): Promise<MarketIndex[]> {
  try {
    const res = await psxClient.get('/indices');
    const $ = cheerio.load(res.data);
    const indices: MarketIndex[] = [];

    // Parse from slider (top bar)
    $('.topIndices__item').each((_, el) => {
      const name = $(el).find('.topIndices__item__name').text().trim();
      const valText = $(el).find('.topIndices__item__val').text().trim();
      const changeText = $(el).find('.topIndices__item__change').text().trim();
      const changePctText = $(el).find('.topIndices__item__changep').text().trim();

      const value = parseNumWithCommas(valText);
      if (!name || value === null) return;

      const changeMatch = changeText.replace(/[^0-9.\-]/g, '');
      const changePctMatch = changePctText.replace(/[()%]/g, '').trim();
      const isNeg = changeText.includes('icon-down-dir') || changePctText.startsWith('-');

      const change = parseFloat(changeMatch) * (isNeg ? -1 : 1);
      const changePct = parseFloat(changePctMatch) * (isNeg ? -1 : 1);

      indices.push({
        name,
        value,
        change: isNaN(change) ? 0 : change,
        changePercent: isNaN(changePct) ? 0 : changePct,
        lastUpdated: new Date().toISOString(),
      });
    });

    // Also parse the table for more accurate data
    const tableIndices: MarketIndex[] = [];
    $('#indicesTable .tbl__body tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 5) return;
      const name = $(cells[0]).text().trim().replace(/\s+/g, ' ');
      const current = parseNumWithCommas($(cells[3]).attr('data-order'));
      const change = parseNumWithCommas($(cells[4]).attr('data-order'));
      const changePct = parseNumWithCommas($(cells[5]).attr('data-order'));

      if (!name || current === null) return;
      tableIndices.push({
        name,
        value: current,
        change: change ?? 0,
        changePercent: changePct ?? 0,
        lastUpdated: new Date().toISOString(),
      });
    });

    return tableIndices.length > 0 ? tableIndices : indices;
  } catch (err) {
    console.error('[PSX] Failed to fetch indices:', err);
    return [];
  }
}

// ─── 3. GET COMPANY DETAIL (Price + Fundamentals + Announcements) ─────────────
export interface CompanyDetail {
  symbol: string;
  name: string;
  sector: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  ldcp: number | null;
  marketCap: number | null;
  shares: number | null;
  freeFloat: number | null;
  week52High: number | null;
  week52Low: number | null;
  pe: number | null;
  eps: number | null;
  bvps: number | null;
  var: number | null;
  circuitLow: number | null;
  circuitHigh: number | null;
  description: string;
  boardMeetings: BoardMeeting[];
  financialResults: FinancialResult[];
  annualEPS: { year: string; eps: number | null }[];
}

export async function getCompanyDetail(symbol: string): Promise<CompanyDetail | null> {
  try {
    const res = await psxClient.get(`/company/${symbol.toUpperCase()}`);
    const $ = cheerio.load(res.data);

    // Basic info
    const name = $('.quote__name').first().text().replace(/DELISTED|NEW/g, '').trim();
    const sector = $('.quote__sector span').first().text().trim();

    // Price data
    const priceText = $('.quote__close').first().text().replace('Rs.', '').trim();
    const price = parseNumWithCommas(priceText);

    const changeValueText = $('.change__value').first().text().trim();
    const changePctText = $('.change__percent').first().text().replace(/[()%]/g, '').trim();
    const isNeg = $('.quote__change').first().hasClass('change__text--neg');
    const change = parseNumWithCommas(changeValueText);
    const changePercent = parseNumWithCommas(changePctText);

    // Stats
    const statsItems: Record<string, string> = {};
    $('.stats_item').each((_, el) => {
      const label = $(el).find('.stats_label').text().trim().toUpperCase();
      const value = $(el).find('.stats_value').first().text().trim();
      if (label && value) statsItems[label] = value;
    });

    const open = parseNumWithCommas(statsItems['OPEN']);
    const high = parseNumWithCommas(statsItems['HIGH']);
    const low = parseNumWithCommas(statsItems['LOW']);
    const volume = parseNumWithCommas(statsItems['VOLUME']);
    const ldcp = parseNumWithCommas(statsItems['LDCP']);
    const pe = parseNumWithCommas(statsItems['P/E RATIO (TTM) **']);
    const varVal = parseNumWithCommas(statsItems['VAR']);

    // Circuit breaker range
    const circuitText = statsItems['CIRCUIT BREAKER'] || '';
    const circuitParts = circuitText.split('—').map(s => parseNumWithCommas(s.trim()));
    const circuitLow = circuitParts[0] ?? null;
    const circuitHigh = circuitParts[1] ?? null;

    // 52-week range
    const week52Key = Object.keys(statsItems).find(k => k.includes('52-WEEK RANGE'));
    const week52Text = week52Key ? statsItems[week52Key] : '';
    const week52Parts = week52Text.split('—').map(s => parseNumWithCommas(s.trim()));
    const week52Low = week52Parts[0] ?? null;
    const week52High = week52Parts[1] ?? null;

    // Equity profile
    const equityItems: Record<string, string> = {};
    $('#equity .stats_item').each((_, el) => {
      const label = $(el).find('.stats_label').text().trim().toUpperCase();
      const value = $(el).find('.stats_value').first().text().trim();
      if (label && value) equityItems[label] = value;
    });
    const marketCapText = equityItems["MARKET CAP (000'S)"] || equityItems['MARKET CAP'];
    const marketCap = parseNumWithCommas(marketCapText);
    const shares = parseNumWithCommas(equityItems['SHARES']);
    const freeFloat = parseNumWithCommas(equityItems['FREE FLOAT'] || '');

    // Description
    const description = $('.profile__item--decription p').text().trim();

    // EPS from financials table
    const annualEPS: { year: string; eps: number | null }[] = [];
    const epsRow = $('#financialTab .tabs__panel[data-name="Annual"] tbody tr').filter((_, el) => {
      return $(el).find('td').first().text().trim() === 'EPS';
    });
    if (epsRow.length) {
      epsRow.find('td:not(:first-child)').each((_, td) => {
        const val = $(td).text().trim();
        annualEPS.push({ year: '', eps: parseNumWithCommas(val) });
      });
      // Get years from header
      const headers: string[] = [];
      $('#financialTab .tabs__panel[data-name="Annual"] thead tr th').each((i, th) => {
        if (i > 0) headers.push($(th).text().trim());
      });
      headers.forEach((year, i) => {
        if (annualEPS[i]) annualEPS[i].year = year;
      });
    }

    // Board Meetings
    const boardMeetings: BoardMeeting[] = [];
    $('#announcementsTab .tabs__panel[data-name="Board Meetings"] tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      const date = $(cells[0]).text().trim();
      const title = $(cells[1]).text().trim();
      if (date && title) {
        boardMeetings.push({
          symbol,
          companyName: name,
          meetingDate: date,
          agenda: title,
        });
      }
    });

    // Financial Results
    const financialResults: FinancialResult[] = [];
    $('#announcementsTab .tabs__panel[data-name="Financial Results"] tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      const date = $(cells[0]).text().trim();
      const title = $(cells[1]).text().trim();
      if (date && title) {
        const isAnnual = title.toLowerCase().includes('annual') || title.toLowerCase().includes('full year');
        const isInterim = title.toLowerCase().includes('half') || title.toLowerCase().includes('interim');
        financialResults.push({
          symbol,
          companyName: name,
          period: title,
          resultDate: date,
          resultType: isAnnual ? 'ANNUAL' : isInterim ? 'INTERIM' : 'QUARTERLY',
        });
      }
    });

    return {
      symbol: symbol.toUpperCase(),
      name,
      sector,
      price,
      change: change ? (isNeg ? -Math.abs(change) : Math.abs(change)) : null,
      changePercent: changePercent ? (isNeg ? -Math.abs(changePercent) : Math.abs(changePercent)) : null,
      open,
      high,
      low,
      volume,
      ldcp,
      marketCap,
      shares,
      freeFloat,
      week52High,
      week52Low,
      pe,
      eps: annualEPS[0]?.eps ?? null,
      bvps: null,
      var: varVal,
      circuitLow,
      circuitHigh,
      description,
      boardMeetings,
      financialResults,
      annualEPS,
    };
  } catch (err) {
    console.error(`[PSX] Failed to fetch company ${symbol}:`, err);
    return null;
  }
}

// ─── 4. GET TODAY'S MARKET SUMMARY (Gainers / Losers / All stocks) ────────────
export interface MarketSummaryStock {
  symbol: string;
  name: string;
  ldcp: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  change: number | null;
  changePercent: number | null;
}

export async function getMarketSummary(): Promise<MarketSummaryStock[]> {
  try {
    const res = await psxClient.get('/');
    const $ = cheerio.load(res.data);
    const stocks: MarketSummaryStock[] = [];

    // PSX home page has a market summary table
    $('table.tbl tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 8) return;

      const symbol = $(cells[0]).text().trim();
      const name = $(cells[1]).text().trim();
      if (!symbol || symbol.length > 12) return;

      const ldcp = parseNumWithCommas($(cells[2]).text().trim());
      const open = parseNumWithCommas($(cells[3]).text().trim());
      const high = parseNumWithCommas($(cells[4]).text().trim());
      const low = parseNumWithCommas($(cells[5]).text().trim());
      const close = parseNumWithCommas($(cells[6]).text().trim());
      const volume = parseNumWithCommas($(cells[7]).text().trim());
      const changeText = $(cells[8]).text().trim();
      const changePctText = $(cells[9]).text().trim();

      const change = parseNumWithCommas(changeText);
      const changePct = parseNumWithCommas(changePctText);

      stocks.push({
        symbol,
        name,
        ldcp,
        open,
        high,
        low,
        close,
        volume,
        change,
        changePercent: changePct,
      });
    });

    return stocks;
  } catch (err) {
    console.error('[PSX] Failed to fetch market summary:', err);
    return [];
  }
}

// ─── 5. GET ANNOUNCEMENTS (Board Meetings & Financial Results for all companies) ──
export async function getAllAnnouncements(type: 'companies'): Promise<{ date: string; symbol: string; title: string; type: string }[]> {
  try {
    const res = await psxClient.get(`/announcements/${type}`);
    const $ = cheerio.load(res.data);
    const announcements: { date: string; symbol: string; title: string; type: string }[] = [];

    $('table.tbl tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 3) return;
      const date = $(cells[0]).text().trim();
      const symbol = $(cells[1]).text().trim();
      const title = $(cells[2]).text().trim();
      if (date && symbol && title) {
        const isBM = title.toLowerCase().includes('board meeting');
        const isFR = title.toLowerCase().includes('financial result') || title.toLowerCase().includes('quarterly');
        announcements.push({
          date,
          symbol: symbol.toUpperCase(),
          title,
          type: isBM ? 'BOARD_MEETING' : isFR ? 'FINANCIAL_RESULT' : 'OTHER',
        });
      }
    });

    return announcements;
  } catch (err) {
    console.error('[PSX] Failed to fetch announcements:', err);
    return [];
  }
}

// ─── 6. GET PAYOUTS (Dividends) ────────────────────────────────────────────────
export async function getPayouts(): Promise<{ symbol: string; date: string; type: string; amount: string }[]> {
  try {
    const res = await psxClient.get('/payouts');
    const $ = cheerio.load(res.data);
    const payouts: { symbol: string; date: string; type: string; amount: string }[] = [];

    $('table.tbl tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;
      const symbol = $(cells[0]).text().trim().toUpperCase();
      const date = $(cells[1]).text().trim();
      const type = $(cells[2]).text().trim();
      const amount = $(cells[3]).text().trim();
      if (symbol && date) {
        payouts.push({ symbol, date, type, amount });
      }
    });

    return payouts;
  } catch (err) {
    console.error('[PSX] Failed to fetch payouts:', err);
    return [];
  }
}

// ─── 7. GET SECTOR SUMMARY ─────────────────────────────────────────────────────
export async function getSectorSummary(): Promise<{ sector: string; change: number | null; changePercent: number | null; volume: number | null }[]> {
  try {
    const res = await psxClient.get('/sector-summary');
    const $ = cheerio.load(res.data);
    const sectors: { sector: string; change: number | null; changePercent: number | null; volume: number | null }[] = [];

    $('table.tbl tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 3) return;
      const sector = $(cells[0]).text().trim();
      const change = parseNumWithCommas($(cells[1]).attr('data-order'));
      const changePct = parseNumWithCommas($(cells[2]).attr('data-order'));
      const volume = parseNumWithCommas($(cells[3])?.attr('data-order'));
      if (sector) {
        sectors.push({ sector, change, changePercent: changePct, volume });
      }
    });

    return sectors;
  } catch (err) {
    console.error('[PSX] Failed to fetch sector summary:', err);
    return [];
  }
}

// ─── 8. CONVERT TO STOCK TYPE ─────────────────────────────────────────────────
export function companyDetailToStock(detail: CompanyDetail): Stock {
  return {
    symbol: detail.symbol,
    name: detail.name,
    sector: detail.sector,
    price: detail.price ?? 0,
    change: detail.change ?? 0,
    changePercent: detail.changePercent ?? 0,
    volume: detail.volume ?? 0,
    open: detail.open ?? 0,
    high: detail.high ?? 0,
    low: detail.low ?? 0,
    close: detail.price ?? 0,
    prevClose: detail.ldcp ?? 0,
    marketCap: detail.marketCap ?? undefined,
    week52High: detail.week52High ?? undefined,
    week52Low: detail.week52Low ?? undefined,
    lastUpdated: new Date().toISOString(),
  };
}

export function companyDetailToFundamentals(detail: CompanyDetail): StockFundamentals {
  return {
    symbol: detail.symbol,
    eps: detail.eps,
    pe: detail.pe,
    pb: null,
    ps: null,
    roe: null,
    roa: null,
    debtToEquity: null,
    currentRatio: null,
    dividendYield: null,
    dividendPerShare: null,
    revenue: null,
    netProfit: null,
    grossMargin: null,
    netMargin: null,
    bookValuePerShare: detail.bvps,
    freeCashFlow: null,
    sharesOutstanding: detail.shares,
    marketCap: detail.marketCap,
    lastUpdated: new Date().toISOString(),
  };
}
