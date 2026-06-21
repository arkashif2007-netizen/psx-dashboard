import axios from 'axios';

async function testTradingView() {
  try {
    const res = await axios.post('https://scanner.tradingview.com/pakistan/scan', {
      filter: [{ left: "name", operation: "match", right: "MARI" }],
      columns: ["name", "description", "price_earnings_ttm", "price_book_ratio", "return_on_equity", "debt_to_equity", "price_sales_current", "dividend_yield_recent", "book_value_per_share_fq"]
    });
    console.log("TradingView Data:", JSON.stringify(res.data, null, 2));
  } catch (error: any) {
    console.error("TV Error:", error.message);
  }
}

testTradingView();
