const axios = require('axios');
const cheerio = require('cheerio');
async function run() {
  const res = await axios.get('https://dps.psx.com.pk/company/ENGRO');
  const $ = cheerio.load(res.data);
  const payouts = [];
  $('#payoutsTab tbody tr').each((_, row) => {
    payouts.push($(row).text().replace(/\s+/g, ' '));
  });
  console.log('Payouts Tab:', payouts.length);
  const allTabs = [];
  $('.tabs__tab').each((_, tab) => allTabs.push($(tab).text().trim()));
  console.log('All Tabs:', allTabs.join(', '));
}
run();
