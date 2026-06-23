import { NextResponse } from 'next/server';
import axios from 'axios';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const CACHE_KEY = 'global_technical_ranking_v2';

  try {
    const cached = cache.get(CACHE_KEY);
    if (cached && !cached.stale) {
      return NextResponse.json({ success: true, data: cached.data, cached: true });
    }

    const res = await axios.post('https://scanner.tradingview.com/pakistan/scan', {
      columns: [
        "name", 
        "close",
        "volume",
        "Recommend.All", 
        "Recommend.MA", 
        "Recommend.Other", 
        "RSI", 
        "MACD.macd", 
        "MACD.signal", 
        "SMA50", 
        "SMA200",
        "ADX",
        "ChaikinMoneyFlow",
        "Candle.Hammer",
        "Candle.Engulfing.Bullish",
        "Candle.Engulfing.Bearish",
        "Candle.MorningStar",
        "Pivot.M.Classic.Middle"
      ]
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!res.data || !res.data.data) {
      throw new Error('Invalid TV scanner response');
    }

    const rankedStocks = res.data.data.map((item: any) => {
      const d = item.d;
      const symbol = d[0];
      const price = d[1];
      const volume = d[2];
      
      const recAll = d[3] ?? 0; // -1 to 1
      let score = Math.round(((recAll + 1) / 2) * 100); // Normalize -1..1 to 0..100

      // Add Phase 6 Modifiers
      const adx = d[11];
      const chaikin = d[12];
      const candleHammer = d[13];
      const candleEngBull = d[14];
      const candleEngBear = d[15];
      const candleMorn = d[16];

      if (adx !== null && adx > 25) {
        score = score > 50 ? Math.min(100, score + 5) : Math.max(0, score - 5);
      }
      if (chaikin !== null && chaikin > 0) {
        score = Math.min(100, score + 5);
      }
      if (candleHammer || candleEngBull || candleMorn) {
        score = Math.min(100, score + 10);
      }
      if (candleEngBear) {
        score = Math.max(0, score - 10);
      }

      let verdict = 'HOLD';
      if (score >= 80) verdict = 'STRONG BUY';
      else if (score >= 60) verdict = 'BUY';
      else if (score >= 40) verdict = 'HOLD';
      else if (score >= 20) verdict = 'SELL';
      else verdict = 'STRONG SELL';

      return {
        symbol,
        price,
        volume,
        score,
        verdict,
        metrics: {
          recommendAll: d[3],
          recommendMA: d[4],
          recommendOther: d[5],
          rsi: d[6],
          macd: d[7],
          macdSignal: d[8],
          sma50: d[9],
          sma200: d[10],
          adx: adx,
          chaikin: chaikin,
          pivotM: d[17]
        }
      };
    })
    .filter((s: any) => s.price > 0 && s.volume > 0)
    .sort((a: any, b: any) => b.score - a.score);

    const top100 = rankedStocks.slice(0, 100);

    cache.set(CACHE_KEY, top100, TTL.ALL_STOCKS);

    return NextResponse.json({
      success: true,
      data: top100,
      cached: false
    });
  } catch (error) {
    console.error('[API/rankings/technical] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch technical rankings', data: [] },
      { status: 500 }
    );
  }
}
