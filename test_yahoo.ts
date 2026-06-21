import axios from 'axios';
import * as cheerio from 'cheerio';

async function testYahooScrape() {
  try {
    const res = await axios.get('https://finance.yahoo.com/quote/MARI.KA', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(res.data);
    
    // Yahoo Finance embeds data in a Fin-Streamer or standard td
    const pb = $('fin-streamer[data-field="priceToBook"]').text();
    const roe = $('td:contains("Return on Equity")').next().text();
    
    console.log("P/B:", pb);
    console.log("ROE:", roe);
    
    // Also try to find any JSON blob if present
    // Not needed if we can just scrape the key statistics page
    
  } catch(err: any) {
    console.error("Scrape failed", err.message);
  }
}

testYahooScrape();
