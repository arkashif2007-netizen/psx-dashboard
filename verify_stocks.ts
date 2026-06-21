import axios from 'axios';

const stocks = ['ENGRO', 'OGDC', 'PSO', 'LUCK', 'SYS', 'HBL', 'HUBC', 'MEBL', 'MARI', 'EFERT'];

async function verify() {
  console.log("Starting verification of 10 random stocks...");
  let passed = 0;
  
  for (const sym of stocks) {
    try {
      console.log(`\nVerifying ${sym}...`);
      const res = await axios.get(`http://localhost:3000/api/stocks/${sym}`);
      const data = res.data.data;
      
      const checks = {
        hasPrice: data.price !== null && data.price !== undefined,
        hasEPS: data.eps !== null && data.eps !== undefined,
        hasAdvanced: !!data.advancedFundamentals,
        hasTVSymbol: !!(data.advancedFundamentals?.tvSymbol),
        hasIntrinsicValue: !!(data.intrinsicValue?.graham)
      };
      
      console.log(checks);
      
      if (Object.values(checks).every(v => v)) {
        console.log(`✅ ${sym} passed all checks.`);
        passed++;
      } else {
        console.log(`❌ ${sym} failed some checks.`);
        if (!checks.hasTVSymbol) console.log(`Missing TV Symbol: It will say Invalid Symbol in Technicals!`);
      }
    } catch (e: any) {
      console.error(`❌ ${sym} failed to fetch:`, e.message);
    }
  }
  
  console.log(`\nVerification Complete: ${passed}/10 stocks passed.`);
}

verify();
