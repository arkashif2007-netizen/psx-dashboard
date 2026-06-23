'use client';

import { useEffect, useRef, memo } from 'react';

function TVProfileWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      colorTheme: "dark",
      isTransparent: true,
      symbol: symbol.includes(':') ? symbol : `PSX:${symbol}`,
      locale: "en"
    });
    container.current.appendChild(script);
  }, [symbol]);

  return <div className="tradingview-widget-container" ref={container} style={{ height: '100%', minHeight: 400 }} />;
}

export default memo(TVProfileWidget);
