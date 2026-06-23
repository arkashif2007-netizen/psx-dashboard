'use client';

import { useMemo } from 'react';

interface CustomTechnicalWidgetProps {
  data: any;
}

export default function CustomTechnicalWidget({ data }: CustomTechnicalWidgetProps) {
  const adv = data?.advancedFundamentals;
  const price = data?.price;

  if (!adv) {
    return (
      <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        No technical data available.
      </div>
    );
  }

  // Determine signals
  const rsi = adv.rsi;
  const rsiSignal = rsi === null ? 'N/A' : (rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'NEUTRAL');
  const rsiColor = rsi === null ? 'var(--text-muted)' : (rsi > 70 ? 'var(--danger)' : rsi < 30 ? 'var(--success)' : 'var(--text-secondary)');

  const macd = adv.macd;
  const macdSignalVal = adv.macdSignal;
  const macdTrend = (macd !== null && macdSignalVal !== null) 
    ? (macd > macdSignalVal ? 'BUY' : 'SELL') 
    : 'N/A';
  const macdColor = macdTrend === 'BUY' ? 'var(--success)' : macdTrend === 'SELL' ? 'var(--danger)' : 'var(--text-muted)';

  const sma50 = adv.sma50;
  const sma200 = adv.sma200;
  const smaCross = (sma50 !== null && sma200 !== null) 
    ? (sma50 > sma200 ? 'BULLISH (Golden)' : 'BEARISH (Death)') 
    : 'N/A';
  const smaColor = sma50 !== null && sma200 !== null ? (sma50 > sma200 ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)';

  const trendAction = adv.recommendMA !== null ? (adv.recommendMA > 0.1 ? 'STRONG BUY' : adv.recommendMA > 0 ? 'BUY' : adv.recommendMA < -0.1 ? 'STRONG SELL' : adv.recommendMA < 0 ? 'SELL' : 'NEUTRAL') : 'N/A';
  const trendColor = adv.recommendMA !== null ? (adv.recommendMA > 0 ? 'var(--success)' : adv.recommendMA < 0 ? 'var(--danger)' : 'var(--text-secondary)') : 'var(--text-muted)';

  const bbLower = adv.bbLower;
  const bbUpper = adv.bbUpper;
  let bbSignal = 'NEUTRAL';
  if (price && bbLower && bbUpper) {
    if (price <= bbLower) bbSignal = 'OVERSOLD (BUY)';
    else if (price >= bbUpper) bbSignal = 'OVERBOUGHT (SELL)';
  }
  const bbColor = bbSignal.includes('BUY') ? 'var(--success)' : bbSignal.includes('SELL') ? 'var(--danger)' : 'var(--text-secondary)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Overall Verdict */}
      <div className="glass-card" style={{ padding: 24, textAlign: 'center', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(10, 14, 23, 0) 100%)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
        <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Proprietary Technical Verdict
        </h3>
        <div style={{ fontSize: 32, fontWeight: 800, color: trendColor }}>
          {trendAction}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          Momentum Score: {((adv.recommendAll ?? 0) * 50 + 50).toFixed(0)}/100
        </p>
      </div>

      {/* Grid of Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        
        {/* RSI */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>RSI (14)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
            {rsi?.toFixed(2) ?? '—'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: rsiColor, marginTop: 4 }}>{rsiSignal}</div>
        </div>

        {/* MACD */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>MACD</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
            {macd?.toFixed(2) ?? '—'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: macdColor, marginTop: 4 }}>{macdTrend}</div>
        </div>

        {/* SMA Cross */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SMA 50 / 200 Cross</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
            {sma50?.toFixed(2) ?? '—'} / {sma200?.toFixed(2) ?? '—'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: smaColor, marginTop: 4 }}>{smaCross}</div>
        </div>

        {/* Bollinger Bands */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Bollinger Bands</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
            {bbLower?.toFixed(1) ?? '—'} - {bbUpper?.toFixed(1) ?? '—'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: bbColor, marginTop: 4 }}>{bbSignal}</div>
        </div>

      </div>
    </div>
  );
}
