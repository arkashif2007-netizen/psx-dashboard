const axios = require('axios');
const cheerio = require('cheerio');

async function test(symbol) {
  const payload = {
    type: 'C',
    symbol: symbol,
    query: '',
    count: 100,
    offset: 0,
    date_from: '',
    date_to: '',
    page: 'annc'
  };

  const body = new URLSearchParams(payload).toString();

  const res = await axios.post('https://dps.psx.com.pk/announcements', body, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://dps.psx.com.pk/announcements/companies'
    }
  });

  const $ = cheerio.load(res.data);
  const titles = [];
  $('table tr').each((_, tr) => {
    const tds = [];
    $(tr).find('td').each((_, td) => tds.push($(td).text().trim()));
    if (tds.length >= 5) titles.push(tds[4]);
  });
  console.log(`Symbol ${symbol} Total Announcements:`, titles.length);
  console.log('Sample Titles:');
  titles.slice(0, 10).forEach(t => console.log(' - ' + t));
}

test('AKBL').catch(console.error);
