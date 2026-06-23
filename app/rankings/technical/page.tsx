'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface TechnicalRankItem {
  symbol: string;
  price: number | null;
  volume: number | null;
  score: number;
  verdict: string;
  metrics: {
    recommendAll: number | null;
    recommendMA: number | null;
    recommendOther: number | null;
    rsi: number | null;
    macd: number | null;
    macdSignal: number | null;
    sma50: number | null;
    sma200: number | null;
  };
}

export default function TechnicalRankingsPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<TechnicalRankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await fetch('/api/rankings/technical');
        const json = await res.json();
        if (json.success && json.data) {
          setStocks(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch technical rankings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  const getVerdictColor = (verdict: string) => {
    if (verdict.includes('BUY')) return '#00E676'; // Bright green for technical
    if (verdict.includes('SELL')) return '#FF1744'; // Bright red
    return 'var(--text-muted)';
  };

  return (
    <div className="page-content" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        marginBottom: 24,
        padding: '24px 20px',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(10, 14, 23, 0) 100%)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 150, height: 150,
          background: '#a855f7', opacity: 0.15, filter: 'blur(50px)', borderRadius: '50%'
        }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
          Technical Ranking
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, maxWidth: '90%' }}>
          Top PSX stocks ranked by momentum, trend-following indicators, moving averages, and oscillators.
        </p>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="glass-card-static skeleton" style={{ height: 80, borderRadius: 12 }} />
          ))
        ) : stocks.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
            No data available.
          </div>
        ) : (
          stocks.map((stock, idx) => {
            const isExpanded = expandedSymbol === stock.symbol;
            return (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="glass-card-static"
                style={{
                  padding: 0,
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: isExpanded ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border)'
                }}
              >
                {/* Row Header */}
                <div
                  onClick={() => setExpandedSymbol(isExpanded ? null : stock.symbol)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', cursor: 'pointer',
                    background: isExpanded ? 'rgba(168, 85, 247, 0.05)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, fontFamily: 'Space Grotesk, sans-serif'
                    }}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'JetBrains Mono, monospace' }}>
                        {stock.symbol}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Mom. Score: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{stock.score}/100</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: getVerdictColor(stock.verdict) }}>
                        {stock.verdict}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Rs {stock.price?.toFixed(2) ?? '—'}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      ▼
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
                          
                          <div className="stat-box">
                            <div className="stat-label">RSI (14)</div>
                            <div className="stat-val" style={{ color: (stock.metrics.rsi ?? 50) > 70 ? 'var(--danger)' : (stock.metrics.rsi ?? 50) < 30 ? 'var(--success)' : 'inherit' }}>
                              {stock.metrics.rsi?.toFixed(2) ?? 'N/A'}
                            </div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-label">MACD</div>
                            <div className="stat-val">{stock.metrics.macd?.toFixed(2) ?? 'N/A'}</div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-label">MACD Signal</div>
                            <div className="stat-val">{stock.metrics.macdSignal?.toFixed(2) ?? 'N/A'}</div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-label">SMA 50</div>
                            <div className="stat-val">{stock.metrics.sma50?.toFixed(2) ?? 'N/A'}</div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-label">SMA 200</div>
                            <div className="stat-val">{stock.metrics.sma200?.toFixed(2) ?? 'N/A'}</div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-label">Trend</div>
                            <div className="stat-val" style={{ fontSize: 11 }}>
                              {stock.metrics.recommendMA !== null ? (stock.metrics.recommendMA > 0 ? 'BULLISH' : 'BEARISH') : 'NEUTRAL'}
                            </div>
                          </div>

                        </div>
                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => router.push(`/stocks/${stock.symbol}`)}
                            style={{
                              background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.4)',
                              color: '#d8b4fe', padding: '8px 16px', borderRadius: 8,
                              fontSize: 12, fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            Full Analysis →
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .stat-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }
        .stat-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .stat-val {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
    </div>
  );
}
