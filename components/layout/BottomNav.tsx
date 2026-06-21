'use client';

import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/stocks', icon: '📈', label: 'Stocks' },
  { href: '/gainers-losers', icon: '🔥', label: 'Movers' },
  { href: '/news', icon: '📰', label: 'News' },
  { href: '/fipi-lipi', icon: '🏦', label: 'FIPI' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bottom-nav">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        padding: '0 4px',
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              id={`nav-${item.label.toLowerCase()}`}
              aria-label={item.label}
            >
              <div className="nav-icon" style={{ fontSize: 18 }}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
