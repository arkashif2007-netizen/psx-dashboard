'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Meeting {
  symbol: string;
  companyName: string;
  meetingDate: string;
  agenda: string;
  category: string;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getMonthLabel(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return MONTHS[d.getMonth()];
  } catch { return ''; }
}
function getDayLabel(dateStr: string) {
  try {
    return new Date(dateStr).getDate();
  } catch { return ''; }
}

export default function BoardMeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Upcoming' | 'Today'>('All');

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await fetch('/api/board-meetings');
        const json = await res.json();
        if (json.success) {
          setMeetings(json.data || []);
        } else {
          setError(json.error || 'Failed to load meetings');
        }
      } catch {
        setError('Network error. Could not load board meetings.');
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = meetings.filter(m => {
    const matchSearch = m.symbol.toLowerCase().includes(search.toLowerCase()) ||
      m.companyName.toLowerCase().includes(search.toLowerCase()) ||
      m.agenda?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    const mDate = new Date(m.meetingDate);
    mDate.setHours(0, 0, 0, 0);
    if (filter === 'Today') return mDate.getTime() === today.getTime();
    if (filter === 'Upcoming') return mDate >= today;
    return true;
  });

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
          📅 Board Meetings
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          Live corporate events from the Pakistan Stock Exchange
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
        <div style={{ display: 'flex', gap: 8 }}>
          {(['All', 'Upcoming', 'Today'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: '1px solid',
                borderColor: filter === f ? 'var(--accent-cyan)' : 'var(--border)',
                background: filter === f ? 'rgba(0,212,255,0.1)' : 'var(--glass-bg)',
                color: filter === f ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Loading board meetings...
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
          No meetings found for this filter.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="glass-card-static" style={{ overflow: 'hidden' }}>
          {filtered.map((m, i) => (
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
                background: 'linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,184,0,0.05))',
                border: '1px solid rgba(255,184,0,0.3)',
                borderRadius: 10,
                padding: '6px 4px',
                textAlign: 'center',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#FFB800', lineHeight: 1 }}>
                  {getDayLabel(m.meetingDate)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  {getMonthLabel(m.meetingDate)}
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
                    {m.symbol}
                  </span>
                  {m.category && (
                    <span style={{
                      fontSize: 10,
                      background: 'rgba(124,58,237,0.15)',
                      color: '#A78BFA',
                      border: '1px solid rgba(124,58,237,0.3)',
                      padding: '2px 7px',
                      borderRadius: 20,
                      fontWeight: 600,
                    }}>
                      {m.category}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.companyName}
                </div>
                {m.agenda && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                    {m.agenda}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
