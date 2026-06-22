import * as cheerio from 'cheerio';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet?: string;
}

const RSS_FEEDS = [
  { name: 'Dawn News', url: 'https://www.dawn.com/feeds/home/' },
  { name: 'Profit by Pakistan Today', url: 'https://profit.pakistantoday.com.pk/feed/' },
  { name: 'ProPakistani', url: 'https://propakistani.pk/category/business/feed/' },
];

async function fetchAndParseRSS(url: string, sourceName: string, limit: number): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } });
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: NewsItem[] = [];
    
    $('item').slice(0, limit).each((_, el) => {
      const title = $(el).find('title').text() || 'No Title';
      const link = $(el).find('link').text() || '#';
      const pubDate = $(el).find('pubDate').text() || new Date().toISOString();
      const desc = $(el).find('description').text() || '';
      const contentSnippet = desc.replace(/<[^>]*>?/gm, '').substring(0, 150);
      
      items.push({
        id: $(el).find('guid').text() || link || Math.random().toString(),
        title: title.replace(' - Google News', ''),
        link,
        pubDate,
        source: $(el).find('source').text() || sourceName,
        snippet: contentSnippet,
      });
    });
    return items;
  } catch (e) {
    console.error(`[News] Failed to fetch feed ${sourceName}:`, e);
    return [];
  }
}

export async function getGlobalMarketNews(): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  // 1. Fetch Local Pakistani Feeds
  for (const feed of RSS_FEEDS) {
    const items = await fetchAndParseRSS(feed.url, feed.name, 10);
    allNews.push(...items);
  }

  // 2. Fetch Google News for "Pakistan Stock Exchange" (covers all global news + PSX)
  const googleFeedUrl = `https://news.google.com/rss/search?q=Pakistan+Stock+Exchange+OR+PSX&hl=en-PK&gl=PK&ceid=PK:en`;
  const googleItems = await fetchAndParseRSS(googleFeedUrl, 'Google News', 50);
  allNews.push(...googleItems);

  // Sort by newest
  allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Filter to ensure we have all news from the last 24 hours, or at least 15 items
  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  const filteredNews = allNews.filter((item, index) => {
    return new Date(item.pubDate).getTime() >= twentyFourHoursAgo || index < 15;
  });

  return filteredNews;
}

export async function getStockSpecificNews(symbol: string, companyName?: string): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];
  try {
    // Construct search query for Google News
    const query = encodeURIComponent(`"${symbol}" OR "${companyName}" Pakistan Stock Exchange`);
    const googleFeedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-PK&gl=PK&ceid=PK:en`;
    
    const items = await fetchAndParseRSS(googleFeedUrl, 'Google News', 50);
    allNews.push(...items);
  } catch (err) {
    console.error(`[News] Failed to fetch specific news for ${symbol}:`, err);
  }

  allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Filter to ensure we have all news from the last 24 hours, or at least 10 items
  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  const filteredNews = allNews.filter((item, index) => {
    return new Date(item.pubDate).getTime() >= twentyFourHoursAgo || index < 10;
  });

  return filteredNews;
}
