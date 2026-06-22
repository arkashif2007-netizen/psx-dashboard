const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
  const res = await axios.get('https://dps.psx.com.pk/company/AKBL', { timeout: 15000 });
  const $ = cheerio.load(res.data);
  const results = [];
  $('#announcementsTab .tabs__panel[data-name="Financial Results"] tbody tr').each((_, row) => {
    const cells = [];
    $(row).find('td').each((i, c) => cells.push($(c).text().trim()));
    results.push(cells);
  });
  console.log('Financial Results:', results);
}
test();
