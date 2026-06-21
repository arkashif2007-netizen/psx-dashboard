'use client';

import { useRouter } from 'next/navigation';
import CustomNewsWidget from '@/components/market/CustomNewsWidget';

export default function GlobalNewsPage() {
  const router = useRouter();

  return (
    <div className="page-content">
      {/* Header Back Button */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Market News</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Latest updates, press releases, and economic news impacting the PSX.</p>
      </div>

      <div className="glass-card-static" style={{ padding: 20, minHeight: '80vh', overflow: 'hidden' }}>
        <div style={{ height: '80vh' }}>
          {/* Fetching global PSX and market news via custom RSS aggregator */}
          <CustomNewsWidget />
        </div>
      </div>
    </div>
  );
}
