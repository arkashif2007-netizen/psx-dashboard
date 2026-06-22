const axios = require('axios');
const cheerio = require('cheerio');
(async () => {
  try {
    const res = await axios.get('https://dps.psx.com.pk/company/ENGRO');
    const $ = cheerio.load(res.data);
    console.log('Tabs:', $('.tabs__panel').map((i, el) => $(el).attr('data-name')).get());
    
    console.log('Board Meetings HTML:', $('#announcementsTab .tabs__panel[data-name="Board Meetings"] tbody').html()?.trim().substring(0, 500));
    console.log('Financial Results HTML:', $('#announcementsTab .tabs__panel[data-name="Financial Results"] tbody').html()?.trim().substring(0, 500));
  } catch(e) { console.error(e.message); }
})();
