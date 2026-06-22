const axios = require('axios');
async function searchTV(query) {
  const url = `https://symbol-search.tradingview.com/symbol_search/v3/?text=${query}&hl=1&exchange=KARACHI&lang=en&type=stock`;
  try {
    const res = await axios.get(url);
    console.log(res.data.symbols.slice(0,5).map(s => s.symbol + ' | ' + s.description));
  } catch(e) { console.error(e.message); }
}
searchTV('ENGRO');
searchTV('HUBC');
searchTV('SYS');
