'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface ForecastSignal {
  symbol: string;
  name: string;
  price: number;
  ma50: number;
  ma200: number;
  signal: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  reason: string;
  changePercent: number;
  rsi?: number;
  sector: string;
}

const SIGNAL_COLORS = {
  'STRONG BUY': { color: '#00E676', bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.3)' },
  'BUY':        { color: '#69F0AE', bg: 'rgba(105,240,174,0.1)', border: 'rgba(105,240,174,0.3)' },
  'NEUTRAL':    { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)' },
  'SELL':       { color: '#FF7043', bg: 'rgba(255,112,67,0.1)', border: 'rgba(255,112,67,0.3)' },
  'STRONG SELL':{ color: '#FF3D57', bg: 'rgba(255,61,87,0.1)', border: 'rgba(255,61,87,0.3)' },
};

const SIGNAL_ICONS = {
  'STRONG BUY': '🚀',
  'BUY': '📈',
  'NEUTRAL': '➡️',
  'SELL': '📉',
  'STRONG SELL': '⚠️',
};

// Calculate MA from historical data
function calcMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calcRSI(prices: number[], period = 14): number | null {
  if (prices.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

function deriveSignal(price: number, ma50: number | null, ma200: number | null, rsi: number | null): {
  signal: ForecastSignal['signal'], reason: string
} {
  if (!ma50 || !ma200) {
    return { signal: 'NEUTRAL', reason: 'Insufficient data for moving average analysis.' };
  }

  const above50 = price > ma50;
  const above200 = price > ma200;
  const goldenCross = ma50 > ma200;

  let reason = '';
  let signal: ForecastSignal['signal'] = 'NEUTRAL';

  if (goldenCross && above50 && above200) {
    signal = 'STRONG BUY';
    reason = `Golden Cross detected (MA50 ${ma50.toFixed(0)} > MA200 ${ma200.toFixed(0)}). Price is above both moving averages.`;
  } else if (above50 && above200) {
    signal = 'BUY';
    reason = `Price above both MA50 (${ma50.toFixed(0)}) and MA200 (${ma200.toFixed(0)}). Bullish momentum.`;
  } else if (!goldenCross && !above50 && !above200) {
    signal = 'STRONG SELL';
    reason = `Death Cross detected (MA50 ${ma50.toFixed(0)} < MA200 ${ma200.toFixed(0)}). Price below both moving averages.`;
  } else if (!above50 || !above200) {
    signal = 'SELL';
    reason = `Price below MA50 (${ma50.toFixed(0)}) or MA200 (${ma200.toFixed(0)}). Bearish pressure.`;
  } else {
    signal = 'NEUTRAL';
    reason = `Mixed signals. Price between MA50 (${ma50.toFixed(0)}) and MA200 (${ma200.toFixed(0)}).`;
  }

  if (rsi !== null) {
    if (rsi < 30) reason += ` RSI at ${rsi} — Oversold.`;
    else if (rsi > 70) reason += ` RSI at ${rsi} — Overbought.`;
    else reason += ` RSI: ${rsi}.`;
  }

  return { signal, reason };
}

// Seeded deterministic price history generator
function generatePriceHistory(seed: number, basePrice: number, days = 250): number[] {
  const prices: number[] = [basePrice];
  let current = basePrice;
  let rng = seed;
  const nextRng = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0x100000000;
  };
  for (let i = 1; i < days; i++) {
    const change = (nextRng() - 0.49) * current * 0.022;
    current = Math.max(current + change, current * 0.5);
    prices.push(Math.round(current * 100) / 100);
  }
  return prices;
}

const STOCKS_TO_ANALYZE = [
  { symbol: 'KSE-100', name: 'KSE-100 Index', price: 114000, sector: 'Index', seed: 1001 },
  { symbol: 'HBL', name: 'Habib Bank', price: 192, sector: 'Banks', seed: 2001 },
  { symbol: 'OGDC', name: 'Oil & Gas Dev Co', price: 160, sector: 'Oil & Gas', seed: 3001 },
  { symbol: 'LUCK', name: 'Lucky Cement', price: 826, sector: 'Cement', seed: 4001 },
  { symbol: 'SYS', name: 'Systems Limited', price: 655, sector: 'Technology', seed: 5001 },
  { symbol: 'EFERT', name: 'Engro Fertilizers', price: 128, sector: 'Fertilizer', seed: 6001 },
  { symbol: 'PSO', name: 'Pakistan State Oil', price: 312, sector: 'Oil Marketing', seed: 7001 },
  { symbol: 'MCB', name: 'MCB Bank', price: 218, sector: 'Banks', seed: 8001 },
  { symbol: 'FFC', name: 'Fauji Fertilizer', price: 145, sector: 'Fertilizer', seed: 9001 },
  { symbol: 'PPL', name: 'Pakistan Petroleum', price: 110, sector: 'Oil & Gas', seed: 1101 },
  { symbol: 'UBL', name: 'United Bank', price: 248, sector: 'Banks', seed: 1201 },
  { symbol: 'ENGRO', name: 'Engro Corp', price: 290, sector: 'Diversified', seed: 1301 },
];

export default function TrendForecastPage() {
  const router = useRouter();
  const [signals, setSignals] = useState<ForecastSignal[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('KSE-100');
  const [filterSignal, setFilterSignal] = useState<string>('All');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Calculate signals for all stocks
    const computed: ForecastSignal[] = STOCKS_TO_ANALYZE.map(s => {
      const prices = generatePriceHistory(s.seed, s.price);
      const current = prices[prices.length - 1];
      const ma50 = calcMA(prices, 50);
      const ma200 = calcMA(prices, 200);
      const rsi = calcRSI(prices);
      const changePercent = ((current - prices[0]) / prices[0]) * 100;
      const { signal, reason } = deriveSignal(current, ma50, ma200, rsi);

      return {
        symbol: s.symbol,
        name: s.name,
        price: current,
        ma50: ma50 ?? 0,
        ma200: ma200 ?? 0,
        signal,
        reason,
        changePercent,
        rsi: rsi ?? undefined,
        sector: s.sector,
      };
    });

    setSignals(computed);
    updateChart('KSE-100');
  }, []);

  function updateChart(sym: string) {
    const stock = STOCKS_TO_ANALYZE.find(s => s.symbol === sym);
    if (!stock) return;
    const prices = generatePriceHistory(stock.seed, stock.price);
    const data: any[] = [];
    for (let i = 49; i < prices.length; i += 3) {
      const ma50 = calcMA(prices.slice(0, i + 1), 50);
      const ma200 = i >= 199 ? calcMA(prices.slice(0, i + 1), 200) : null;
      data.push({
        day: i - 49 + 1,
        Price: Math.round(prices[i] * 10) / 10,
        'MA-50': ma50 ? Math.round(ma50 * 10) / 10 : null,
        'MA-200': ma200 ? Math.round(ma200 * 10) / 10 : null,
      });
    }
    setChartData(data);
    setSelectedSymbol(sym);
  }

  const filtered = filterSignal === 'All'
    ? signals
    : signals.filter(s => s.signal === filterSignal);

  const selectedSignal = signals.find(s => s.symbol === selectedSymbol);

  return (
    <div className="page-content">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }}>
          🔮 Trend Forecast
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          Moving Average analysis — MA50, MA200 crossovers & RSI
        </p>
      </div>

      {/* Selected Stock Chart */}
      {selectedSignal && (
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: 14 }}>
                {selectedSignal.symbol}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                {selectedSignal.name}
              </span>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              background: SIGNAL_COLORS[selectedSignal.signal].bg,
              color: SIGNAL_COLORS[selectedSignal.signal].color,
              border: `1px solid ${SIGNAL_COLORS[selectedSignal.signal].border}`,
            }}>
              {SIGNAL_ICONS[selectedSignal.signal]} {selectedSignal.signal}
            </span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={9} interval={20} />
                <YAxis stroke="var(--text-muted)" fontSize={9} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Price" stroke="#94A3B8" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="MA-50" stroke="#00D4FF" dot={false} strokeWidth={2} strokeDasharray="0" />
                <Line type="monotone" dataKey="MA-200" stroke="#7C3AED" dot={false} strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            {selectedSignal.reason}
          </p>
        </div>
      )}

      {/* Signal Filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
        {(['All', 'STRONG BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG SELL'] as const).map(f => {
          const isActive = filterSignal === f;
          const col = f !== 'All' ? SIGNAL_COLORS[f].color : 'var(--accent-cyan)';
          return (
            <button
              key={f}
              onClick={() => setFilterSignal(f)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: isActive ? col : 'var(--border)',
                background: isActive ? `${col}18` : 'var(--glass-bg)',
                color: isActive ? col : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {f !== 'All' && SIGNAL_ICONS[f as keyof typeof SIGNAL_ICONS]} {f}
            </button>
          );
        })}
      </div>

      {/* Signal Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(s => {
          const col = SIGNAL_COLORS[s.signal];
          const isSelected = selectedSymbol === s.symbol;
          return (
            <button
              key={s.symbol}
              onClick={() => updateChart(s.symbol)}
              style={{
                background: isSelected ? col.bg : 'var(--glass-bg)',
                border: `1px solid ${isSelected ? col.border : 'var(--border)'}`,
                borderRadius: 12,
                padding: '12px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: 13 }}>
                      {s.symbol}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: col.bg, color: col.color, border: `1px solid ${col.border}`,
                    }}>
                      {SIGNAL_ICONS[s.signal]} {s.signal}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sector}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                    MA50: {s.ma50.toFixed(0)} · MA200: {s.ma200.toFixed(0)}{s.rsi ? ` · RSI: ${s.rsi}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                    {s.price.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: s.changePercent >= 0 ? 'var(--success)' : 'var(--danger)',
                    marginTop: 2, fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {s.changePercent >= 0 ? '▲' : '▼'} {Math.abs(s.changePercent).toFixed(1)}%
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 12 }}>
        <div style={{ fontSize: 12, color: '#FFB800', fontWeight: 600, marginBottom: 4 }}>⚠️ Disclaimer</div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          These signals are based on historical Moving Average crossovers (MA50/MA200) and RSI. This is for educational purposes only and not financial advice. Past performance does not guarantee future results.
        </p>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
