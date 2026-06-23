'use client';

import IndexCards from '@/components/market/IndexCards';
import GainersLosers from '@/components/market/GainersLosers';
import KSEWidgetWrapper from '@/components/layout/KSEWidgetWrapper';
import FipiLipiMiniChart from '@/components/market/FipiLipiMiniChart';

export default function HomePage() {
  return (
    <div className="page-content">

      {/* ── HERO GREETING ──────────────────────────────────── */}
      <div style={{ marginBottom: 20 }} className="animate-fade-up">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 22,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #F1F5F9 0%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Pakistan Stock
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Exchange Dashboard
            </span>
          </h1>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 14,
            padding: '8px 12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20 }}>🇵🇰</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600, letterSpacing: '0.06em' }}>PSX</div>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Live market data · All 550+ listed stocks
        </p>
      </div>

      {/* ── INDEX CARDS ─────────────────────────────────────── */}
      <section style={{ marginBottom: 20 }} className="animate-fade-up">
        <div className="section-title" style={{ marginBottom: 12 }}>
          Market Indices
        </div>
        <IndexCards />
      </section>

      {/* ── FIPI / LIPI MINI CHART ───────────────────────── */}
      <section style={{ marginBottom: 20 }} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="section-title">FIPI / LIPI Flow</div>
          <a href="/fipi-lipi" style={{ fontSize: 12, color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>
            Full View →
          </a>
        </div>
        <div className="glass-card" style={{ padding: '12px 12px 8px' }}>
          <FipiLipiMiniChart />
        </div>
      </section>

      {/* ── KSE-100 CHART ───────────────────────────────────── */}

      <section style={{ marginBottom: 20 }} className="animate-fade-up">
        <div className="section-title" style={{ marginBottom: 12 }}>
          KSE-100 Live Chart
        </div>
        <KSEWidgetWrapper height={300} />
      </section>

      {/* ── GAINERS & LOSERS ─────────────────────────────────── */}
      <section style={{ marginBottom: 20 }} className="animate-fade-up">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div className="section-title">Top Movers</div>
          <a href="/gainers-losers" style={{
            fontSize: 12,
            color: 'var(--accent-cyan)',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            View All →
          </a>
        </div>
        <GainersLosers limit={5} />
      </section>

      {/* ── QUICK ACCESS GRID ───────────────────────────────── */}
      <section style={{ marginBottom: 20 }} className="animate-fade-up">
        <div className="section-title" style={{ marginBottom: 12 }}>
          Quick Access
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '📋', label: 'All Stocks', desc: '550+ listed', href: '/stocks', color: '#00D4FF' },
            { icon: '💎', label: 'Fund. Rank', desc: 'Top investments', href: '/rankings/fundamental', color: '#00E676' },
            { icon: '📈', label: 'Tech. Rank', desc: 'Trade momentum', href: '/rankings/technical', color: '#a855f7' },
            { icon: '🏦', label: 'FIPI / LIPI', desc: 'Institution flow', href: '/fipi-lipi', color: '#7C3AED' },
            { icon: '📅', label: 'Board Meetings', desc: 'Upcoming events', href: '/board-meetings', color: '#FFB800' },
            { icon: '💹', label: 'Financial Results', desc: 'Earnings & EPS', href: '/financial-results', color: '#00E676' },
            { icon: '💰', label: 'Payouts', desc: 'Dividends & Ex-Date', href: '/payouts', color: '#FFD700' },
            { icon: '📰', label: 'Market News', desc: 'PSX & economy', href: '/news', color: '#FF3D57' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="glass-card"
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  borderColor: `${item.color}20`,
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${item.color}18`,
                  border: `1px solid ${item.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 700,
                    fontSize: 13,
                    color: 'var(--text-primary)',
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── POPULAR STOCKS ───────────────────────────────────── */}
      <section style={{ marginBottom: 20 }} className="animate-fade-up">
        <div className="section-title" style={{ marginBottom: 12 }}>
          Popular Stocks
        </div>
        <div className="glass-card-static" style={{ overflow: 'hidden' }}>
          {[
            { symbol: 'HBL', name: 'Habib Bank', sector: 'Banks' },
            { symbol: 'OGDC', name: 'Oil & Gas Dev', sector: 'Oil & Gas' },
            { symbol: 'PSO', name: 'Pakistan State Oil', sector: 'Oil Marketing' },
            { symbol: 'LUCK', name: 'Lucky Cement', sector: 'Cement' },
            { symbol: 'SYS', name: 'Systems Limited', sector: 'Technology' },
            { symbol: 'EFERT', name: 'Engro Fertilizers', sector: 'Fertilizer' },
          ].map((stock, i) => (
            <a
              key={stock.symbol}
              href={`/stocks/${stock.symbol}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.1))',
                    border: '1px solid rgba(0,212,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    fontSize: 11,
                    color: 'var(--accent-cyan)',
                  }}>
                    {stock.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {stock.symbol}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {stock.sector}
                    </div>
                  </div>
                </div>
                <div style={{
                  color: 'var(--text-muted)',
                  fontSize: 16,
                }}>
                  →
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── FOOTER SPACE ─────────────────────────────────────── */}
      <div style={{ height: 8 }} />
    </div>
  );
}
