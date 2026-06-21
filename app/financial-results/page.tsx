'use client';

import { useRouter } from 'next/navigation';

export default function FinancialResultsPage() {
  const router = useRouter();

  return (
    <div className="page-content">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Financial Results</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Latest earnings announcements and EPS releases.</p>
      </div>

      <div className="glass-card-static" style={{ 
        padding: 60, 
        minHeight: '50vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📊</div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: 12 }}>Under Construction</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.6 }}>
          The global financial results calendar is being aggregated and will be launched soon!
        </p>
      </div>
    </div>
  );
}
