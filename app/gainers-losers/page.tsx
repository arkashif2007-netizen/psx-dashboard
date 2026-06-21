'use client';

import { useRouter } from 'next/navigation';
import GainersLosers from '@/components/market/GainersLosers';

export default function GainersLosersPage() {
  const router = useRouter();

  return (
    <div className="page-content">
      {/* Header Back Button */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Header spacer */}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Market Movers</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Live updates of today's top gainers, losers, and volume leaders.</p>
      </div>

      <div className="glass-card-static" style={{ padding: 20, minHeight: '60vh' }}>
        <GainersLosers limit={20} />
      </div>
    </div>
  );
}
