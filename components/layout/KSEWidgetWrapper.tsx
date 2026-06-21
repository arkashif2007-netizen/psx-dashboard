'use client';

import dynamic from 'next/dynamic';

const KSEWidget = dynamic(() => import('./KSEWidget'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 300,
      borderRadius: 16,
      background: 'var(--glass)',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ fontSize: 32 }}>📊</div>
      <div className="skeleton" style={{ width: 150, height: 12, borderRadius: 6 }} />
      <div className="skeleton" style={{ width: 80, height: 10, borderRadius: 6 }} />
    </div>
  ),
});

export default function KSEWidgetWrapper({ height = 300, compact = false, symbol }: { height?: number; compact?: boolean; symbol?: string }) {
  return <KSEWidget height={height} compact={compact} symbol={symbol} />;
}
