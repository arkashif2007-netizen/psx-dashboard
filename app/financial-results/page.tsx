'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FinResult {
  symbol: string;
  companyName: string;
  resultDate: string;
  period: string;
  resultType: string;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function getMonthLabel(dateStr: string) {
  try { return MONTHS[new Date(dateStr).getMonth()]; } catch { return ''; }
}
function getDayLabel(dateStr: string) {
  try { return new Date(dateStr).getDate(); } catch { return ''; }
}

const TYPE_COLORS: Record<string, string> = {
  'Annual': '#00E676',
  'Half Year': '#00D4FF',
  'Quarter': '#FFB800',
  'Q1': '#FFB800',
  'Q2': '#FFB800',
  'Q3': '#FFB800',
  'Q4': '#FFB800',
  'Interim': '#7C3AED',
};

export default function FinancialResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<FinResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch('/api/financial-results');
        const json = await res.json();
        if (json.success) {
          setResults(json.data || []);
        } else {
          setError(json.error || 'Failed to load results');
        }
      } catch {
        setError('Network error. Could not load financial results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const types = ['All', ...Array.from(new Set(results.map(r => r.resultType).filter(Boolean)))];

  const filtered = results.filter(r => {
    const matchSearch = r.symbol.toLowerCase().includes(search.toLowerCase()) ||
      r.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      r.period?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || r.resultType === typeFilter;
    return matchSearch && matchType;
  });

  const typeColor = TYPE_COLORS[typeFilter] || 'var(--accent-cyan)';

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }}>
          💹 Financial Results
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          Latest earnings, EPS releases & corporate announcements
        </p>
      </div>

      {/* Search & Filters */}
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="text"
          placeholder="Search by symbol or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 14px',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {types.slice(0, 6).map(t => {
            const color = TYPE_COLORS[t] || 'var(--accent-cyan)';
            const isActive = typeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: isActive ? color : 'var(--border)',
                  background: isActive ? `${color}18` : 'var(--glass-bg)',
                  color: isActive ? color : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Loading financial results...
        </div>
      )}
      {error && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--danger)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          No results found.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="glass-card-static" style={{ overflow: 'hidden' }}>
          {filtered.map((r, i) => {
            const tColor = TYPE_COLORS[r.resultType] || '#94A3B8';
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 16px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start',
                }}
              >
                {/* Date Badge */}
                <div style={{
                  minWidth: 44,
                  background: `linear-gradient(135deg, ${tColor}20, ${tColor}08)`,
                  border: `1px solid ${tColor}40`,
                  borderRadius: 10,
                  padding: '6px 4px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: tColor, lineHeight: 1 }}>
                    {getDayLabel(r.resultDate)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                    {getMonthLabel(r.resultDate)}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'var(--accent-cyan)',
                    }}>
                      {r.symbol}
                    </span>
                    {r.resultType && (
                      <span style={{
                        fontSize: 10,
                        background: `${tColor}18`,
                        color: tColor,
                        border: `1px solid ${tColor}40`,
                        padding: '2px 7px',
                        borderRadius: 20,
                        fontWeight: 600,
                      }}>
                        {r.resultType}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {r.companyName}
                  </div>
                  {r.period && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Period: {r.period}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
