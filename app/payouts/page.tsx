'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface PayoutItem {
  symbol: string;
  company: string;
  sector: string;
  announcement: string;
  announcementDate: string;
  bookClosure: string;
}

export default function PayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const res = await fetch('/api/payouts');
        const json = await res.json();
        if (json.success && json.data) {
          setPayouts(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch payouts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayouts();
  }, []);

  const filteredPayouts = useMemo(() => {
    if (!search.trim()) return payouts;
    const q = search.toLowerCase();
    return payouts.filter(p => 
      p.symbol.toLowerCase().includes(q) || 
      p.company.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q)
    );
  }, [payouts, search]);

  return (
    <div className="page-content" style={{ paddingBottom: 80 }}>
      {/* Header & Search */}
      <div style={{ marginBottom: 16, position: 'sticky', top: 'var(--nav-height)', paddingTop: 16, backgroundColor: 'var(--bg-primary)', zIndex: 10 }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Dividend Payouts</h1>
        
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            className="search-bar"
            placeholder="Search by symbol, company or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="glass-card-static skeleton" style={{ height: 100, borderRadius: 12 }} />
          ))
        ) : filteredPayouts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
            No payouts found.
          </div>
        ) : (
          filteredPayouts.map((item, idx) => (
            <motion.div
              key={`${item.symbol}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx % 10) * 0.03 }}
              className="glass-card-static"
              style={{
                padding: '16px 20px',
                borderRadius: 16,
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
              onClick={() => router.push(`/stocks/${item.symbol}`)}
            >
              {/* Top Row: Symbol & Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                      {item.symbol}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                      {item.sector}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {item.company}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Announced On</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {item.announcementDate}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Payout & Book Closure */}
              <div style={{ 
                background: 'rgba(255,215,0,0.05)', 
                border: '1px solid rgba(255,215,0,0.1)', 
                borderRadius: 8, 
                padding: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Dividend / Bonus</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFD700' }}>
                    {item.announcement || 'N/A'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Book Closure (Ex-Date)</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.bookClosure || '—'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
