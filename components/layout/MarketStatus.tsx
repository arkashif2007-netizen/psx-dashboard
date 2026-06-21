'use client';

import { useEffect, useState } from 'react';

type Status = 'OPEN' | 'PRE_OPEN' | 'CLOSED';

function getPKTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
}

function getStatus(): { status: Status; label: string; nextEvent: string } {
  const pk = getPKTime();
  const day = pk.getDay();
  const h = pk.getHours();
  const m = pk.getMinutes();
  const t = h * 60 + m;

  const isWeekday = day >= 1 && day <= 5;
  const preOpen = 9 * 60;        // 9:00 AM
  const open = 9 * 60 + 30;     // 9:30 AM
  const close = 15 * 60 + 30;   // 3:30 PM

  if (!isWeekday) {
    const daysUntilMon = day === 0 ? 1 : 2;
    return { status: 'CLOSED', label: 'Weekend', nextEvent: `Opens Monday 9:30 AM PKT` };
  }

  if (t >= preOpen && t < open) {
    const rem = open - t;
    return { status: 'PRE_OPEN', label: 'Pre-Open', nextEvent: `Opens in ${rem}m` };
  }
  if (t >= open && t < close) {
    const rem = close - t;
    const rh = Math.floor(rem / 60);
    const rm = rem % 60;
    return { status: 'OPEN', label: 'Market Open', nextEvent: `Closes in ${rh}h ${rm}m` };
  }
  return { status: 'CLOSED', label: 'Market Closed', nextEvent: 'Opens Tomorrow 9:30 AM PKT' };
}

export default function MarketStatus() {
  const [info, setInfo] = useState(getStatus());

  useEffect(() => {
    const id = setInterval(() => setInfo(getStatus()), 60_000);
    return () => clearInterval(id);
  }, []);

  const colorClass =
    info.status === 'OPEN' ? 'market-open' :
    info.status === 'PRE_OPEN' ? 'market-pre' : 'market-closed';

  const dotClass =
    info.status === 'OPEN' ? 'pulse-dot' :
    info.status === 'PRE_OPEN' ? 'pulse-dot pre' : 'pulse-dot closed';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}
      className={colorClass}>
      <span className={dotClass} />
      <span>{info.label}</span>
      <span style={{ opacity: 0.7, fontWeight: 400 }}>· {info.nextEvent}</span>
    </div>
  );
}
