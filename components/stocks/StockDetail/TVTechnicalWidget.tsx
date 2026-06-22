'use client';

import { useEffect, useRef, useState, memo } from 'react';

function TVTechnicalWidget({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  // Clean symbol: strip exchange prefix, get clean ticker
  const cleanSymbol = symbol.replace(/^(KARACHI:|PSX:|KSE:)/i, '').toUpperCase();
  const tvSymbol = `PSX:${cleanSymbol}`;

  useEffect(() => {
    setHasError(false);
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: '1D',
      width: '100%',
      isTransparent: true,
      height: '100%',
      symbol: tvSymbol,
      showIntervalTabs: true,
      displayMode: 'single',
      locale: 'en',
      colorTheme: 'dark',
    });
    container.appendChild(script);

    // Detect "Invalid Symbol" message injected by TradingView via MutationObserver
    const observer = new MutationObserver(() => {
      if (container.innerText.toLowerCase().includes('invalid symbol') ||
          container.innerText.toLowerCase().includes('not available')) {
        setHasError(true);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });

    // Also fallback after 8 seconds if widget is empty
    const timer = setTimeout(() => {
      if (container.innerText.trim() === '' || container.innerText.toLowerCase().includes('invalid')) {
        setHasError(true);
      }
    }, 8000);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [tvSymbol]);

  if (hasError) {
    return (
      <div style={{ 
        height: '100%', minHeight: 450, 
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 12, border: '1px solid var(--border)',
        gap: 12
      }}>
        <div style={{ fontSize: 40 }}>📊</div>
        <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Technical Analysis</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', maxWidth: 300, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--accent-cyan)' }}>PSX:{cleanSymbol}</strong> is not available in TradingView's widget library.
          <br />Visit TradingView directly for full technical analysis.
        </div>
        <a
          href={`https://www.tradingview.com/chart/?symbol=PSX:${cleanSymbol}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 8, padding: '10px 24px', borderRadius: 8,
            background: 'var(--accent-cyan)', color: '#000',
            fontWeight: 700, fontSize: 13, textDecoration: 'none',
          }}
        >
          Open on TradingView →
        </a>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: '100%', minHeight: 450 }}
    />
  );
}

export default memo(TVTechnicalWidget);
