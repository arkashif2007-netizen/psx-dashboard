// ─── IN-MEMORY CACHE LAYER ─────────────────────────────────────────────────────
// Server-side cache to avoid hammering scrapers on every request

interface CacheEntry<T> {
  data: T;
  expiry: number;
  cachedAt: number;
}

class Cache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlMs,
      cachedAt: Date.now(),
    });
  }

  get<T>(key: string): { data: T; stale: boolean } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const stale = Date.now() > entry.expiry;
    return { data: entry.data, stale };
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    return Date.now() < entry.expiry;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // Get all keys matching a prefix
  getByPrefix(prefix: string): string[] {
    return Array.from(this.store.keys()).filter(k => k.startsWith(prefix));
  }
}

// Singleton cache instance (persists across requests in same server process)
const cache = new Cache();
export default cache;

// ─── TTL CONSTANTS ─────────────────────────────────────────────────────────────
export const TTL = {
  STOCK_PRICE: 30_000,        // 30 seconds (market hours)
  STOCK_PRICE_CLOSED: 300_000, // 5 minutes (outside hours)
  FUNDAMENTALS: 3_600_000,    // 1 hour
  TECHNICALS: 300_000,         // 5 minutes
  NEWS: 300_000,               // 5 minutes
  FIPI_LIPI: 900_000,         // 15 minutes
  BOARD_MEETINGS: 3_600_000,  // 1 hour
  FINANCIAL_RESULTS: 3_600_000, // 1 hour
  MARKET_STATUS: 30_000,      // 30 seconds
  ALL_STOCKS: 60_000,          // 1 minute
} as const;

// ─── MARKET HOURS HELPER ───────────────────────────────────────────────────────
export function isMarketOpen(): boolean {
  const now = new Date();
  const pkTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
  const day = pkTime.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const hours = pkTime.getHours();
  const minutes = pkTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // PSX: Mon-Fri, 9:30 AM - 3:30 PM PKT
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = timeInMinutes >= marketOpen && timeInMinutes < marketClose;

  return isWeekday && isMarketHours;
}

export function getMarketStatus(): 'OPEN' | 'PRE_OPEN' | 'CLOSED' {
  const now = new Date();
  const pkTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
  const day = pkTime.getDay();
  const hours = pkTime.getHours();
  const minutes = pkTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const isWeekday = day >= 1 && day <= 5;
  if (!isWeekday) return 'CLOSED';

  const preOpen = 9 * 60 + 0;   // 9:00 AM
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  if (timeInMinutes >= preOpen && timeInMinutes < marketOpen) return 'PRE_OPEN';
  if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) return 'OPEN';
  return 'CLOSED';
}

export function getCurrentTTL(baseKey: 'STOCK_PRICE' | 'ALL_STOCKS' = 'STOCK_PRICE'): number {
  return isMarketOpen() ? TTL[baseKey] : TTL.STOCK_PRICE_CLOSED;
}
