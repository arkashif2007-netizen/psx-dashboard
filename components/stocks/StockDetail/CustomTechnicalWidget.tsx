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

  // --- 1. Core Signals ---
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
    ? (sma50 > sma200 ? 'BULLISH' : 'BEARISH') 
    : 'N/A';
  const smaColor = sma50 !== null && sma200 !== null ? (sma50 > sma200 ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)';

  const bbLower = adv.bbLower;
  const bbUpper = adv.bbUpper;
  let bbSignal = 'NEUTRAL';
  if (price && bbLower && bbUpper) {
    if (price <= bbLower) bbSignal = 'OVERSOLD (BUY)';
    else if (price >= bbUpper) bbSignal = 'OVERBOUGHT (SELL)';
  }
  const bbColor = bbSignal.includes('BUY') ? 'var(--success)' : bbSignal.includes('SELL') ? 'var(--danger)' : 'var(--text-secondary)';

  // --- 2. Advanced Phase 6 Signals ---
  // Candlesticks
  let activePatterns: string[] = [];
  if (adv.candleDoji) activePatterns.push('Doji (Indecision)');
  if (adv.candleHammer) activePatterns.push('Hammer (Bullish)');
  if (adv.candleMorningStar) activePatterns.push('Morning Star (Bullish Reversal)');
  if (adv.candleEngulfingBullish) activePatterns.push('Bullish Engulfing');
  if (adv.candleEngulfingBearish) activePatterns.push('Bearish Engulfing');
  
  // Trend Strength
  const adx = adv.adx;
  const adxStrength = adx === null ? 'N/A' : (adx > 25 ? 'STRONG TREND' : 'WEAK/SIDEWAYS');
  const adxColor = adx === null ? 'var(--text-muted)' : (adx > 25 ? 'var(--success)' : 'var(--text-secondary)');
  
  const aroonUp = adv.aroonUp;
  const aroonDown = adv.aroonDown;
  const aroonSignal = (aroonUp !== null && aroonDown !== null) 
    ? (aroonUp > aroonDown ? 'BULLISH TREND' : 'BEARISH TREND') 
    : 'N/A';
  const aroonColor = (aroonUp !== null && aroonDown !== null) ? (aroonUp > aroonDown ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)';

  // Volume Flow
  const obv = adv.obv; // May be null
  const chaikin = adv.chaikin;
  const volumeFlowSignal = chaikin === null ? 'N/A' : (chaikin > 0 ? 'ACCUMULATION' : 'DISTRIBUTION');
  const volumeColor = chaikin === null ? 'var(--text-muted)' : (chaikin > 0 ? 'var(--success)' : 'var(--danger)');

  // Master Score Logic Update
  let masterMomentum = (adv.recommendation ?? 0) * 50 + 50; // Base 0-100
  if (adx !== null && adx > 25) {
    // Strengthen the existing signal
    masterMomentum = masterMomentum > 50 ? Math.min(100, masterMomentum + 5) : Math.max(0, masterMomentum - 5);
  }
  if (activePatterns.some(p => p.includes('Bullish'))) masterMomentum = Math.min(100, masterMomentum + 10);
  if (activePatterns.some(p => p.includes('Bearish'))) masterMomentum = Math.max(0, masterMomentum - 10);
  if (chaikin !== null && chaikin > 0) masterMomentum = Math.min(100, masterMomentum + 5);

  const trendAction = masterMomentum >= 80 ? 'STRONG BUY' : masterMomentum >= 60 ? 'BUY' : masterMomentum <= 20 ? 'STRONG SELL' : masterMomentum <= 40 ? 'SELL' : 'NEUTRAL';
  const trendActionColor = masterMomentum >= 60 ? 'var(--success)' : masterMomentum <= 40 ? 'var(--danger)' : 'var(--text-secondary)';

  // Trade Setup Calculations
  const buyPrice = price;
  let targetPrice = adv.pivotR1 ?? (price ? price * 1.05 : null);
  let stopLoss = adv.pivotS1 ?? (price ? price * 0.95 : null);

  if (trendAction.includes('SELL')) {
    targetPrice = adv.pivotS1 ?? (price ? price * 0.95 : null);
    stopLoss = adv.pivotR1 ?? (price ? price * 1.05 : null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Overall Verdict */}
      <div className="glass-card" style={{ padding: 24, textAlign: 'center', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(10, 14, 23, 0) 100%)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
        <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Proprietary Technical Verdict
        </h3>
        <div style={{ fontSize: 32, fontWeight: 800, color: trendActionColor }}>
          {trendAction}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          Momentum Score: {masterMomentum.toFixed(0)}/100
        </p>

        {/* Trade Setup */}
        {trendAction !== 'NEUTRAL' && buyPrice && (
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{trendAction.includes('SELL') ? 'Sell Near' : 'Entry Price'}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>{buyPrice.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: trendAction.includes('SELL') ? 'var(--danger)' : 'var(--success)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>{targetPrice?.toFixed(2) ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stop Loss</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>{stopLoss?.toFixed(2) ?? '—'}</div>
            </div>
          </div>
        )}
      </div>

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

        {/* Trend Strength */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ADX Trend Strength</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
            {adx?.toFixed(2) ?? '—'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: adxColor, marginTop: 4 }}>{adxStrength}</div>
        </div>

        {/* Volume Flow */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Chaikin Money Flow (Volume)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
            {chaikin?.toFixed(2) ?? '—'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: volumeColor, marginTop: 4 }}>{volumeFlowSignal}</div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        
        {/* Support & Resistance (Pivots) */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Support & Resistance</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Classic S1</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono' }}>{adv.pivotS1?.toFixed(2) ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pivot Middle</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono' }}>{adv.pivotM?.toFixed(2) ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Classic R1</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono' }}>{adv.pivotR1?.toFixed(2) ?? '—'}</div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Fibonacci S1</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono' }}>{adv.fibS1?.toFixed(2) ?? '—'}</div>
            </div>
            <div style={{ marginTop: 8 }}></div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Fibonacci R1</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono' }}>{adv.fibR1?.toFixed(2) ?? '—'}</div>
            </div>
          </div>
        </div>

        {/* Candlesticks & Averages */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Pattern Recognition</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Candlestick Patterns:</span>
              <span style={{ fontWeight: 600, color: activePatterns.length > 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                {activePatterns.length > 0 ? activePatterns.join(', ') : 'None Detected'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>SMA 50 / 200 Cross:</span>
              <span style={{ fontWeight: 600, color: smaColor }}>{smaCross}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Aroon Trend Indicator:</span>
              <span style={{ fontWeight: 600, color: aroonColor }}>{aroonSignal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
