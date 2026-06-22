'use client';

import React from 'react';

interface ScoreResult {
  overall: number; // 0-100
  valuation: number; // 0-30
  profitability: number; // 0-30
  health: number; // 0-20
  intrinsic: number; // 0-20
  verdict: string;
}

export default function ScoreDisplayCard({ score }: { score: ScoreResult | null }) {
  if (!score) return null;

  // Determine color based on verdict
  let color = 'var(--text-primary)';
  let bg = 'rgba(255,255,255,0.05)';
  
  if (score.verdict === 'STRONG BUY' || score.verdict === 'BUY') {
    color = 'var(--success)';
    bg = 'var(--success-dim)';
  } else if (score.verdict === 'STRONG SELL' || score.verdict === 'SELL') {
    color = 'var(--danger)';
    bg = 'var(--danger-dim)';
  } else {
    color = 'var(--warning)';
    bg = 'var(--warning-dim)';
  }

  const Progress = ({ label, value, max, colorOverride }: { label: string, value: number, max: number, colorOverride?: string }) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontWeight: 'bold' }}>{value} / {max}</span>
        </div>
        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: colorOverride || color, borderRadius: 4 }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--glass-bg)', padding: 24, borderRadius: 16, border: '1px solid var(--border)', maxWidth: 600, margin: '0 auto 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: 'var(--text-muted)' }}>Fundamental Score</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 48, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{score.overall}</span>
            <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>/ 100</span>
          </div>
        </div>
        <div style={{ 
          padding: '12px 24px', 
          borderRadius: 12, 
          background: bg, 
          color: color, 
          fontWeight: 800, 
          fontSize: 20,
          letterSpacing: 1
        }}>
          {score.verdict}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 24px' }}>
        <Progress label="Valuation" value={score.valuation} max={30} colorOverride="var(--accent-cyan)" />
        <Progress label="Profitability" value={score.profitability} max={30} colorOverride="#8b5cf6" />
        <Progress label="Financial Health" value={score.health} max={20} colorOverride="#10b981" />
        <Progress label="Intrinsic Value" value={score.intrinsic} max={20} colorOverride="#f59e0b" />
      </div>
      
      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        * Score is dynamically calculated based on 20 fundamental parameters including P/E, P/B, ROE, Margins, Debt/Equity, and Intrinsic Value estimates.
      </p>
    </div>
  );
}
