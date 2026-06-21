'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import MarketStatus from './MarketStatus';

export default function TopNav() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toUpperCase();
    if (q) {
      router.push(`/stocks/${q}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  return (
    <header className="top-nav">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        padding: '0 16px',
        gap: 12,
      }}>
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => router.push('/')}
        >
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(124,58,237,0.3))',
            border: '1px solid rgba(0,212,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}>
            📈
          </div>
          <div>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 800,
              fontSize: 14,
              background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              PSX
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Dashboard
            </div>
          </div>
        </div>

        {/* Market Status */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <MarketStatus />
        </div>

        {/* Search Icon */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          style={{
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: showSearch ? 'var(--accent-cyan)' : 'var(--text-muted)',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
          aria-label="Search stocks"
          id="search-toggle-btn"
        >
          🔍
        </button>
      </div>

      {/* Expandable Search Bar */}
      {showSearch && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'rgba(7,11,20,0.98)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          zIndex: 99,
          animation: 'fade-in-up 0.2s ease',
        }}>
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}>🔍</span>
            <input
              autoFocus
              type="text"
              className="search-bar"
              placeholder="Search symbol or company (e.g. HBL, ENGRO)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value.toUpperCase())}
              id="stock-search-input"
            />
            {searchQuery && (
              <button type="submit" style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--accent-cyan)',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}>
                Go →
              </button>
            )}
          </form>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['HBL', 'OGDC', 'PSO', 'LUCK', 'EFERT', 'MCB', 'UBL', 'SYS'].map(s => (
              <button
                key={s}
                onClick={() => { router.push(`/stocks/${s}`); setShowSearch(false); }}
                style={{
                  background: 'var(--accent-cyan-dim)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
