const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
  const res = await axios.get('https://dps.psx.com.pk/company/ENGRO', { timeout: 15000 });
  const $ = cheerio.load(res.data);
  const panels = [];
  $('.tabs__panel').each((i, el) => {
    panels.push($(el).attr('data-name'));
  });
  console.log('Panels:', panels);
}
test();
