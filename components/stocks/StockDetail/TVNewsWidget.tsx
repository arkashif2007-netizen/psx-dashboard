'use client';

import { useEffect, useRef, memo } from 'react';

function TVNewsWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerEl = document.getElementById('tv-news-widget');
    if (containerEl) {
      containerEl.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        feedMode: "symbol",
        symbol: symbol.includes(':') ? symbol : `KARACHI:${symbol}`,
        colorTheme: "dark",
        isTransparent: true,
        displayMode: "regular",
        width: "100%",
        height: "100%",
        locale: "en"
      });
      containerEl.appendChild(script);
    }
  }, [symbol]);

  return <div id="tv-news-widget" className="tradingview-widget-container" ref={container} style={{ height: '100%', minHeight: 400 }} />;
}

export default memo(TVNewsWidget);
