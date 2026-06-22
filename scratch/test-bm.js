const cheerio = require('cheerio');
async function test() {
  const payload = new URLSearchParams({
    type: 'C',
    symbol: 'AKBL',
    query: '', count: 100, offset: 0, date_from: '', date_to: '', page: 'annc'
  }).toString();
  const res = await fetch('https://dps.psx.com.pk/announcements', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: payload
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  $('table tr').each((_, tr) => {
    const cells = [];
    $(tr).find('td').each((_, td) => cells.push($(td).text().trim()));
    if (cells.length > 4 && cells[4].toLowerCase().includes('board')) {
      console.log('Found:', cells[0], cells[1], cells[4]);
    }
  });
}
test();
