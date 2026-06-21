import axios from 'axios';
import * as cheerio from 'cheerio';

async function testSarmaaya() {
  try {
    const res = await axios.get('https://sarmaaya.pk/psx/company/MARI', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const $ = cheerio.load(res.data);
    
    // Find ratios
    const ratios: any = {};
    $('.fundamental-ratios table tbody tr').each((_, el) => {
       const key = $(el).find('td:nth-child(1)').text().trim();
       const value = $(el).find('td:nth-child(2)').text().trim();
       if(key) ratios[key] = value;
    });

    console.log("Ratios:", ratios);
    
    // Sometimes it's in a different div class. Let's dump all text to see if it works.
    const fullText = $('body').text().replace(/\s+/g, ' ').substring(0, 500);
    console.log("Body Snippet:", fullText);
  } catch (err: any) {
    console.error('Sarmaaya Error:', err.message);
  }
}

testSarmaaya();
