'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface StockRow {
  symbol: string;
  name: string;
  sectorName: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
}

const SECTORS = [
  'All',
  'Commercial Banks',
  'Oil & Gas Exploration Companies',
  'Oil & Gas Marketing Companies',
  'Cement',
  'Technology & Communication',
  'Fertilizer',
  'Power Generation & Distribution',
  'Food & Personal Care Products',
  'Pharmaceuticals',
  'Automobile Assembler',
  'Textile Composite',
  'Chemical',
];

function formatVol(v: number | null): string {
  if (!v) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function StockMiniRow({ stock }: { stock: StockRow }) {
  const router = useRouter();
  const isUp = (stock.changePercent ?? 0) >= 0;
  
  return (
    <div
      onClick={() => router.push(`/stocks/${stock.symbol}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 14px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        gap: 10,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Symbol + Sector */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--text-primary)',
          }}>
            {stock.symbol}
          </span>
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginTop: 2
        }}>
          {stock.sectorName}
        </div>
      </div>

      {/* Volume */}
      <div style={{ textAlign: 'right', minWidth: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Vol</span>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
          {formatVol(stock.volume)}
        </span>
      </div>

      {/* Price + Change */}
      <div style={{ textAlign: 'right', minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 2
        }}>
          {stock.price?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
        </div>
        {stock.changePercent !== null && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            padding: '2px 6px',
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 700,
            background: isUp ? 'var(--success-dim)' : 'var(--danger-dim)',
            color: isUp ? 'var(--success)' : 'var(--danger)',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {isUp ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
}

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSector, setActiveSector] = useState('All');
  const [sortBy, setSortBy] = useState<'volume' | 'change' | 'symbol'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('/api/stocks?filter=equity');
        const json = await res.json();
        if (json.success && json.data?.stocks) {
          setStocks(json.data.stocks);
        }
      } catch (err) {
        console.error('Failed to fetch stocks', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStocks();
    // Refresh prices every minute
    const id = setInterval(fetchStocks, 60_000);
    return () => clearInterval(id);
  }, []);

  const filteredAndSortedStocks = useMemo(() => {
    let result = stocks;

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => 
        s.symbol.toLowerCase().includes(q) || 
        s.name.toLowerCase().includes(q)
      );
    }

    // 2. Sector Filter
    if (activeSector !== 'All') {
      result = result.filter(s => s.sectorName && s.sectorName.toLowerCase() === activeSector.toLowerCase());
    }

    // 3. Sort
    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      // Handle nulls by pushing them to the bottom
      if (valA === null) valA = sortOrder === 'asc' ? Infinity : -Infinity;
      if (valB === null) valB = sortOrder === 'asc' ? Infinity : -Infinity;

      if (sortBy === 'symbol') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortBy === 'change') {
         valA = a.changePercent ?? (sortOrder === 'asc' ? Infinity : -Infinity);
         valB = b.changePercent ?? (sortOrder === 'asc' ? Infinity : -Infinity);
         return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    return result;
  }, [stocks, search, activeSector, sortBy, sortOrder]);

  const toggleSort = (field: 'volume' | 'change' | 'symbol') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'symbol' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="page-content" style={{ paddingBottom: 80 }}>
      {/* Header & Search */}
      <div style={{ marginBottom: 16, position: 'sticky', top: 'var(--nav-height)', paddingTop: 16, backgroundColor: 'var(--bg-primary)', zIndex: 10 }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Market Watch</h1>
        
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            className="search-bar"
            placeholder="Search by symbol or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sector Tabs */}
        <div className="tab-bar">
          {SECTORS.map(sector => (
            <button
              key={sector}
              className={`tab-btn ${activeSector === sector ? 'active' : ''}`}
              onClick={() => setActiveSector(sector)}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      {/* Sorting Controls */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 12,
        padding: '0 4px'
      }}>
        <button 
          onClick={() => toggleSort('symbol')}
          style={{
            background: sortBy === 'symbol' ? 'var(--glass-hover)' : 'transparent',
            border: '1px solid',
            borderColor: sortBy === 'symbol' ? 'var(--border-accent)' : 'var(--border)',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            color: sortBy === 'symbol' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          onClick={() => toggleSort('volume')}
          style={{
            background: sortBy === 'volume' ? 'var(--glass-hover)' : 'transparent',
            border: '1px solid',
            borderColor: sortBy === 'volume' ? 'var(--border-accent)' : 'var(--border)',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            color: sortBy === 'volume' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          Volume {sortBy === 'volume' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          onClick={() => toggleSort('change')}
          style={{
            background: sortBy === 'change' ? 'var(--glass-hover)' : 'transparent',
            border: '1px solid',
            borderColor: sortBy === 'change' ? 'var(--border-accent)' : 'var(--border)',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            color: sortBy === 'change' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          % Change {sortBy === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* Stock List */}
      <div className="glass-card-static" style={{ minHeight: 400 }}>
        {loading ? (
          <div>
            {[...Array(10)].map((_, i) => (
              <div key={i} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ height: 20, width: 80, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: 150 }} />
              </div>
            ))}
          </div>
        ) : filteredAndSortedStocks.length > 0 ? (
          <div>
            {/* Limit to 100 on initial render for performance, ideally we'd use infinite scroll/virtualization here */}
            {filteredAndSortedStocks.slice(0, 100).map((stock) => (
              <StockMiniRow key={stock.symbol} stock={stock} />
            ))}
            {filteredAndSortedStocks.length > 100 && (
              <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>
                Showing top 100 results. Use search to find specific stocks.
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            No stocks found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
