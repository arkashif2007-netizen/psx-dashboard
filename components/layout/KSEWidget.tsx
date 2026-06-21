'use client';

import { useEffect, useRef } from 'react';

interface KSEWidgetProps {
  height?: number;
  compact?: boolean;
  symbol?: string;
}

export default function KSEWidget({ height = 300, compact = false, symbol = 'KSE100' }: KSEWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `PSX:${symbol}`,
      interval: compact ? '30' : 'D',
      timezone: 'Asia/Karachi',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#070B14',
      enable_publishing: false,
      hide_top_toolbar: compact,
      hide_legend: compact,
      save_image: false,
      backgroundColor: '#070B14',
      gridColor: 'rgba(255,255,255,0.04)',
      hide_volume: compact,
      support_host: 'https://www.tradingview.com',
      container_id: `tv_chart_${symbol}`,
      studies: compact ? [] : ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%';

    containerRef.current.appendChild(wrapper);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [compact, symbol]);

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--glass)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📊</span>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--text-primary)',
          }}>{symbol === 'KSE100' ? 'KSE-100 Index' : symbol}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{
            background: 'var(--accent-cyan-dim)',
            color: 'var(--accent-cyan)',
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 6,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            border: '1px solid rgba(0,212,255,0.2)',
          }}>LIVE</span>
          <span style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-muted)',
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 6,
          }}>PSX:{symbol}</span>
        </div>
      </div>

      {/* Chart */}
      <div
        id={`tv_chart_${symbol}`}
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height, background: '#070B14' }}
      />
    </div>
  );
}
