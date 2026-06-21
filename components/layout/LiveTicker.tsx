'use client';

import { useEffect, useState, useRef } from 'react';

interface TickerStock {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

// Fallback static ticker while data loads
const FALLBACK: TickerStock[] = [
  { symbol: 'HBL', name: 'Habib Bank', price: 298.4, change: -6.02, changePercent: -1.98 },
  { symbol: 'OGDC', name: 'Oil & Gas Dev', price: 189.5, change: 2.1, changePercent: 1.12 },
  { symbol: 'PSO', name: 'Pakistan State Oil', price: 421.3, change: -3.5, changePercent: -0.82 },
  { symbol: 'LUCK', name: 'Lucky Cement', price: 1050.0, change: 12.5, changePercent: 1.2 },
  { symbol: 'ENGRO', name: 'Engro Corp', price: 485.38, change: 7.08, changePercent: 1.48 },
  { symbol: 'UBL', name: 'United Bank', price: 312.5, change: -4.2, changePercent: -1.33 },
  { symbol: 'MCB', name: 'MCB Bank', price: 445.0, change: 5.75, changePercent: 1.31 },
  { symbol: 'EFERT', name: 'Engro Fertilizers', price: 97.5, change: -1.2, changePercent: -1.22 },
  { symbol: 'PPL', name: 'Pakistan Petroleum', price: 146.8, change: 1.8, changePercent: 1.24 },
  { symbol: 'MEBL', name: 'Meezan Bank', price: 278.4, change: -3.6, changePercent: -1.28 },
  { symbol: 'BAHL', name: 'Bank AL Habib', price: 112.5, change: 0.8, changePercent: 0.72 },
  { symbol: 'HUBC', name: 'Hub Power', price: 145.2, change: -2.1, changePercent: -1.42 },
  { symbol: 'SEARL', name: 'Searle Pakistan', price: 198.6, change: 3.4, changePercent: 1.74 },
  { symbol: 'SYS', name: 'Systems Limited', price: 567.0, change: 8.5, changePercent: 1.52 },
  { symbol: 'AKBL', name: 'Askari Bank', price: 56.3, change: -0.7, changePercent: -1.23 },
];

export default function LiveTicker() {
  const [stocks, setStocks] = useState<TickerStock[]>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch('/api/stocks?filter=equity');
        const json = await res.json();
        if (json.success && json.data?.stocks?.length > 0) {
          // Use symbol list — prices come from detail endpoint later
          // For now use the symbols as ticker items
          const items: TickerStock[] = json.data.stocks
            .filter((s: { symbol: string; name: string }) => s.symbol && s.name)
            .slice(0, 100)
            .map((s: { symbol: string; name: string }) => ({
              symbol: s.symbol,
              name: s.name,
            }));
          if (items.length > 0) {
            setStocks(items);
            setLoaded(true);
          }
        }
      } catch {
        // Keep fallback data
      }
    };

    fetchTicker();
    const interval = setInterval(fetchTicker, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Double the array for seamless infinite scroll
  const doubled = [...stocks, ...stocks];

  return (
    <div className="ticker-wrap">
      <div className="ticker-move" style={{ animationDuration: `${Math.max(60, stocks.length * 2)}s` }}>
        {doubled.map((stock, i) => {
          const isUp = (stock.changePercent ?? 0) >= 0;
          const hasPrice = stock.price !== undefined;

          return (
            <div key={`${stock.symbol}-${i}`} className="ticker-item">
              {/* Symbol */}
              <span style={{
                color: 'var(--accent-cyan)',
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: '0.03em',
              }}>
                {stock.symbol}
              </span>

              {/* Price */}
              {hasPrice && (
                <span style={{
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}>
                  {stock.price?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}

              {/* Change */}
              {hasPrice && stock.changePercent !== undefined && (
                <span style={{
                  color: isUp ? 'var(--success)' : 'var(--danger)',
                  fontSize: 10,
                  fontWeight: 500,
                }}>
                  {isUp ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                </span>
              )}

              {/* No price yet — just show symbol name */}
              {!hasPrice && (
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                  {stock.name.slice(0, 12)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
