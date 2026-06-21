import Parser from 'rss-parser';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet?: string;
}

const parser = new Parser({
  customFields: {
    item: ['description', 'content:encoded'],
  }
});

const RSS_FEEDS = [
  { name: 'Dawn News', url: 'https://www.dawn.com/feeds/home/' },
  { name: 'Profit by Pakistan Today', url: 'https://profit.pakistantoday.com.pk/feed/' },
  { name: 'ProPakistani', url: 'https://propakistani.pk/category/business/feed/' },
];

export async function getGlobalMarketNews(): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  // 1. Fetch Local Pakistani Feeds
  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      parsed.items.slice(0, 10).forEach(item => {
        allNews.push({
          id: item.guid || item.link || Math.random().toString(),
          title: item.title || 'No Title',
          link: item.link || '#',
          pubDate: item.pubDate || new Date().toISOString(),
          source: feed.name,
          snippet: item.contentSnippet || item.description || '',
        });
      });
    } catch (err) {
      console.error(`[News] Failed to fetch feed ${feed.name}:`, err);
    }
  }

  // 2. Fetch Google News for "Pakistan Stock Exchange" (covers all global news + PSX)
  try {
    const googleFeedUrl = `https://news.google.com/rss/search?q=Pakistan+Stock+Exchange+OR+PSX&hl=en-PK&gl=PK&ceid=PK:en`;
    const googleParsed = await parser.parseURL(googleFeedUrl);
    googleParsed.items.slice(0, 15).forEach(item => {
      allNews.push({
        id: item.guid || item.link || Math.random().toString(),
        title: item.title?.replace(' - Google News', '') || 'No Title',
        link: item.link || '#',
        pubDate: item.pubDate || new Date().toISOString(),
        source: (item as any).source || 'Google News',
        snippet: item.contentSnippet || item.description || '',
      });
    });
  } catch (err) {
    console.error(`[News] Failed to fetch Google News:`, err);
  }

  // Sort by newest
  allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return allNews;
}

export async function getStockSpecificNews(symbol: string, companyName?: string): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];
  try {
    // Construct search query for Google News
    const query = encodeURIComponent(`"${symbol}" OR "${companyName}" Pakistan Stock Exchange`);
    const googleFeedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-PK&gl=PK&ceid=PK:en`;
    
    const parsed = await parser.parseURL(googleFeedUrl);
    parsed.items.slice(0, 15).forEach(item => {
      allNews.push({
        id: item.guid || item.link || Math.random().toString(),
        title: item.title?.replace(' - Google News', '') || 'No Title',
        link: item.link || '#',
        pubDate: item.pubDate || new Date().toISOString(),
        source: (item as any).source || 'Google News',
        snippet: item.contentSnippet || item.description || '',
      });
    });
  } catch (err) {
    console.error(`[News] Failed to fetch specific news for ${symbol}:`, err);
  }

  return allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}
