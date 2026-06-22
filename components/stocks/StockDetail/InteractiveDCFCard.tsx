'use client';

import React, { useState, useEffect } from 'react';
import { calculateDCF, evaluateDCFValue } from '@/lib/calculations/dcf';

interface InteractiveDCFCardProps {
  eps: number | null;
  currentPrice: number | null;
}

export default function InteractiveDCFCard({ eps, currentPrice }: InteractiveDCFCardProps) {
  const [growthRate, setGrowthRate] = useState<number>(8); // default 8%
  const [discountRate, setDiscountRate] = useState<number>(15); // default 15%
  const [terminalGrowthRate, setTerminalGrowthRate] = useState<number>(3); // default 3%
  
  const [dcfValue, setDcfValue] = useState<number | null>(null);
  const [dcfStatus, setDcfStatus] = useState<string>('UNKNOWN');

  useEffect(() => {
    if (eps !== null) {
      const val = calculateDCF({
        eps,
        growthRate: growthRate / 100,
        discountRate: discountRate / 100,
        terminalGrowthRate: terminalGrowthRate / 100,
        years: 5
      });
      setDcfValue(val);
      if (val !== null && currentPrice !== null) {
        setDcfStatus(evaluateDCFValue(currentPrice, val));
      } else {
        setDcfStatus('UNKNOWN');
      }
    }
  }, [eps, currentPrice, growthRate, discountRate, terminalGrowthRate]);

  if (eps === null || eps <= 0) {
    return (
      <div style={{ flex: '1 1 300px', background: 'var(--glass-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
        <h4 style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Discounted Cash Flow (Earnings)</h4>
        <div style={{ color: 'var(--text-muted)' }}>Not enough data to calculate DCF (Missing EPS or Negative).</div>
      </div>
    );
  }

  return (
    <div style={{ flex: '1 1 300px', background: 'var(--glass-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Interactive DCF Model</h4>
      
      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Growth Rate (1-5 yrs)</label>
            <span style={{ fontSize: 12, fontWeight: 'bold' }}>{growthRate}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="50" step="1" 
            value={growthRate} 
            onChange={(e) => setGrowthRate(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
          />
        </div>
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Discount Rate</label>
            <span style={{ fontSize: 12, fontWeight: 'bold' }}>{discountRate}%</span>
          </div>
          <input 
            type="range" 
            min="5" max="40" step="1" 
            value={discountRate} 
            onChange={(e) => setDiscountRate(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Terminal Growth Rate</label>
            <span style={{ fontSize: 12, fontWeight: 'bold' }}>{terminalGrowthRate}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="10" step="0.5" 
            value={terminalGrowthRate} 
            onChange={(e) => setTerminalGrowthRate(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
          />
        </div>
      </div>

      {/* Result */}
      {dcfValue ? (
        <>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-cyan)' }}>
            {dcfValue.toFixed(2)} PKR
          </div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            Current Price: {currentPrice} PKR
          </div>
          <div style={{ 
            marginTop: 12, 
            padding: '8px 12px', 
            borderRadius: 8, 
            textAlign: 'center',
            fontWeight: 600,
            background: dcfStatus === 'UNDERVALUED' ? 'var(--success-dim)' : 
                        dcfStatus === 'OVERVALUED' ? 'var(--danger-dim)' : 'var(--warning-dim)',
            color: dcfStatus === 'UNDERVALUED' ? 'var(--success)' : 
                    dcfStatus === 'OVERVALUED' ? 'var(--danger)' : 'var(--warning)',
          }}>
            {dcfStatus}
          </div>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Base EPS: {eps}. Projected over 5 years and discounted.
          </p>
        </>
      ) : (
        <div style={{ color: 'var(--text-muted)' }}>Calculating...</div>
      )}
    </div>
  );
}
