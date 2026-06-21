'use client';

import useSWR from 'swr';
const fetcher = (url: string) => fetch(url).then((res) => res.json());
import type { NewsItem } from '@/lib/scrapers/news';

export default function CustomNewsWidget({ symbol }: { symbol?: string }) {
  const url = symbol ? `/api/stocks/${symbol}/news` : '/api/news';
  const { data, error, isLoading } = useSWR(url, fetcher, {
    refreshInterval: 5 * 60 * 1000, // 5 min
  });

  if (isLoading) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading latest news...
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--danger)' }}>
        Failed to load news.
      </div>
    );
  }

  const news: NewsItem[] = data.data || [];

  if (news.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
        No recent news found.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {news.map((item) => {
        // Format relative time if possible, or just standard string
        const dateObj = new Date(item.pubDate);
        const timeAgo = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('en-US', { 
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : item.pubDate;

        return (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="glass-card"
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--glass)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {item.source}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {timeAgo}
                </span>
              </div>
              <h4 style={{
                margin: 0,
                fontSize: 15,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
                fontFamily: 'Space Grotesk, sans-serif'
              }}>
                {item.title}
              </h4>
              {item.snippet && (
                <p style={{
                  margin: 0,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }} dangerouslySetInnerHTML={{ __html: item.snippet.replace(/<[^>]*>?/gm, '') }} />
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}
