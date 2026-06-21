'use client';

import { useEffect, useState } from 'react';

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

const INDEX_META: Record<string, { label: string; icon: string; color: string }> = {
  KSE100:    { label: 'KSE-100',  icon: '🏆', color: '#00D4FF' },
  KSE30:     { label: 'KSE-30',   icon: '📊', color: '#7C3AED' },
  KMI30:     { label: 'KMI-30',   icon: '🕌', color: '#00E676' },
  ALLSHR:    { label: 'All Shares', icon: '📈', color: '#FFB800' },
  BKTI:      { label: 'Banking',  icon: '🏦', color: '#00D4FF' },
  OGTI:      { label: 'Oil & Gas', icon: '⛽', color: '#FF8C00' },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toFixed(2);
}

export default function IndexCards() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIndices = async () => {
    try {
      const res = await fetch('/api/market');
      const json = await res.json();
      if (json.success && json.data?.indices) {
        setIndices(json.data.indices.slice(0, 6));
      }
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    const id = setInterval(fetchIndices, 30_000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card skeleton" style={{ height: 80 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="scroll-x" style={{ display: 'flex', gap: 10, paddingBottom: 4 }}>
      {indices.map((idx) => {
        const meta = INDEX_META[idx.name] || { label: idx.name, icon: '📊', color: '#00D4FF' };
        const isUp = idx.change >= 0;

        return (
          <div
            key={idx.name}
            className="index-card"
            style={{
              minWidth: 150,
              flexShrink: 0,
              borderColor: `${meta.color}25`,
              background: `linear-gradient(135deg, ${meta.color}08 0%, rgba(7,11,20,0.8) 100%)`,
              cursor: 'default',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{meta.icon}</span>
              <span style={{
                fontSize: 10,
                color: meta.color,
                fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif',
                letterSpacing: '0.04em',
              }}>
                {meta.label}
              </span>
            </div>

            {/* Value */}
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              {idx.value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {/* Change */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
            }}>
              <span style={{
                fontSize: 10,
                color: isUp ? 'var(--success)' : 'var(--danger)',
                fontWeight: 600,
              }}>
                {isUp ? '▲' : '▼'} {Math.abs(idx.change).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 5,
                fontWeight: 600,
                background: isUp ? 'var(--success-dim)' : 'var(--danger-dim)',
                color: isUp ? 'var(--success)' : 'var(--danger)',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
