'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StockRow {
  symbol: string;
  name: string;
  sector: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
}

interface GainersLosersData {
  gainers: StockRow[];
  losers: StockRow[];
}

// Static placeholder data while loading
const PLACEHOLDER: GainersLosersData = {
  gainers: [
    { symbol: 'SYS', name: 'Systems Ltd', sector: 'Technology', price: 567.0, change: 8.5, changePercent: 1.52, volume: 1200000 },
    { symbol: 'SEARL', name: 'Searle Pakistan', sector: 'Pharma', price: 198.6, change: 3.4, changePercent: 1.74, volume: 890000 },
    { symbol: 'MCB', name: 'MCB Bank', sector: 'Banks', price: 445.0, change: 5.75, changePercent: 1.31, volume: 2300000 },
    { symbol: 'PPL', name: 'Pak Petroleum', sector: 'Oil & Gas', price: 146.8, change: 1.8, changePercent: 1.24, volume: 1800000 },
    { symbol: 'LUCK', name: 'Lucky Cement', sector: 'Cement', price: 1050.0, change: 12.5, changePercent: 1.2, volume: 450000 },
  ],
  losers: [
    { symbol: 'HBL', name: 'Habib Bank', sector: 'Banks', price: 298.4, change: -6.02, changePercent: -1.98, volume: 3200000 },
    { symbol: 'HUBC', name: 'Hub Power', sector: 'Power', price: 145.2, change: -2.1, changePercent: -1.42, volume: 980000 },
    { symbol: 'UBL', name: 'United Bank', sector: 'Banks', price: 312.5, change: -4.2, changePercent: -1.33, volume: 1700000 },
    { symbol: 'EFERT', name: 'Engro Fertilizers', sector: 'Fertilizer', price: 97.5, change: -1.2, changePercent: -1.22, volume: 2100000 },
    { symbol: 'AKBL', name: 'Askari Bank', sector: 'Banks', price: 56.3, change: -0.7, changePercent: -1.23, volume: 4500000 },
  ],
};

function formatVol(v: number | null): string {
  if (!v) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return v.toString();
}

function StockMiniRow({ stock, isGainer }: { stock: StockRow; isGainer: boolean }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/stocks/${stock.symbol}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        gap: 10,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Rank indicator */}
      <div style={{
        width: 6,
        height: 32,
        borderRadius: 3,
        background: isGainer
          ? 'linear-gradient(180deg, var(--success), rgba(0,230,118,0.3))'
          : 'linear-gradient(180deg, var(--danger), rgba(255,61,87,0.3))',
        flexShrink: 0,
      }} />

      {/* Symbol + Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700,
          fontSize: 13,
          color: 'var(--text-primary)',
        }}>
          {stock.symbol}
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {stock.name}
        </div>
      </div>

      {/* Volume */}
      <div style={{ textAlign: 'right', minWidth: 40 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Vol</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
          {formatVol(stock.volume)}
        </div>
      </div>

      {/* Price + Change */}
      <div style={{ textAlign: 'right', minWidth: 70 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>
          {stock.price?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          padding: '2px 6px',
          borderRadius: 5,
          fontSize: 11,
          fontWeight: 700,
          background: isGainer ? 'var(--success-dim)' : 'var(--danger-dim)',
          color: isGainer ? 'var(--success)' : 'var(--danger)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {isGainer ? '▲' : '▼'} {Math.abs(stock.changePercent ?? 0).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

export default function GainersLosers({ limit = 5 }: { limit?: number }) {
  const [data, setData] = useState<GainersLosersData>(PLACEHOLDER);
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/gainers-losers');
        const json = await res.json();
        if (json.success && (json.data.gainers.length > 0 || json.data.losers.length > 0)) {
          setData(json.data);
        }
      } catch { /* keep placeholder */ }
      finally { setLoading(false); }
    };
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, []);

  const stocks = tab === 'gainers' ? data.gainers.slice(0, limit) : data.losers.slice(0, limit);

  return (
    <div className="glass-card-static" style={{ overflow: 'hidden' }}>
      {/* Tab Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={() => setTab('gainers')}
          style={{
            flex: 1,
            padding: '12px',
            background: tab === 'gainers' ? 'var(--success-dim)' : 'transparent',
            border: 'none',
            borderBottom: tab === 'gainers' ? '2px solid var(--success)' : '2px solid transparent',
            color: tab === 'gainers' ? 'var(--success)' : 'var(--text-muted)',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          id="gainers-tab"
        >
          🚀 Top Gainers
        </button>
        <button
          onClick={() => setTab('losers')}
          style={{
            flex: 1,
            padding: '12px',
            background: tab === 'losers' ? 'var(--danger-dim)' : 'transparent',
            border: 'none',
            borderBottom: tab === 'losers' ? '2px solid var(--danger)' : '2px solid transparent',
            color: tab === 'losers' ? 'var(--danger)' : 'var(--text-muted)',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          id="losers-tab"
        >
          📉 Top Losers
        </button>
      </div>

      {/* Stock List */}
      <div>
        {loading && stocks.length === 0
          ? [...Array(limit)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, margin: '4px 14px', borderRadius: 8 }} />
            ))
          : stocks.map((stock) => (
              <StockMiniRow
                key={stock.symbol}
                stock={stock}
                isGainer={tab === 'gainers'}
              />
            ))
        }
      </div>

      {/* View All */}
      <div
        onClick={() => router.push('/gainers-losers')}
        style={{
          padding: '12px',
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--accent-cyan)',
          cursor: 'pointer',
          borderTop: '1px solid var(--border)',
          fontWeight: 600,
          transition: 'opacity 0.2s',
        }}
      >
        View All {tab === 'gainers' ? 'Gainers' : 'Losers'} →
      </div>
    </div>
  );
}
