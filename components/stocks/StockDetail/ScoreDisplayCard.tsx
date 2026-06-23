'use client';

import React from 'react';

interface ScoreResult {
  overall: number; // 0-100
  businessQuality: number; // 0-35
  financialStrength: number; // 0-25
  earningsQuality: number; // 0-20
  valuation: number; // 0-20
  verdict: string;
  flags?: string[];
}

export default function ScoreDisplayCard({ score }: { score: ScoreResult | null }) {
  if (!score) return null;

  // Determine color based on verdict
  let color = 'var(--text-primary)';
  let bg = 'rgba(255,255,255,0.05)';
  
  if (score.verdict === 'STRONG BUY' || score.verdict === 'BUY') {
    color = 'var(--success)';
    bg = 'var(--success-dim)';
  } else if (score.verdict.includes('AVOID') || score.verdict.includes('SELL')) {
    color = 'var(--danger)';
    bg = 'var(--danger-dim)';
  } else if (score.verdict === 'UNDERPERFORM') {
    color = '#f97316'; // orange
    bg = 'rgba(249, 115, 22, 0.1)';
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

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 32px' }}>
        <Progress label="Business Quality" value={Math.round(score.businessQuality || 0)} max={35} colorOverride="var(--primary)" />
        <Progress label="Financial Strength" value={Math.round(score.financialStrength || 0)} max={25} colorOverride="var(--success)" />
        <Progress label="Earnings Quality" value={Math.round(score.earningsQuality || 0)} max={20} colorOverride="var(--warning)" />
        <Progress label="Valuation & Entry" value={Math.round(score.valuation || 0)} max={20} colorOverride="#8b5cf6" />
      </div>

      {score.flags && score.flags.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Warning Flags:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {score.flags.map((flag, i) => (
              <div key={i} style={{ 
                background: flag.includes('🚩') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: flag.includes('🚩') ? 'var(--danger)' : 'var(--warning)',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500
              }}>
                {flag}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        * Score is dynamically calculated based on 20 fundamental parameters including P/E, P/B, ROE, Margins, Debt/Equity, and Intrinsic Value estimates.
      </p>
    </div>
  );
}
