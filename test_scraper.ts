import { getCompanyDetail } from './lib/scrapers/psx';

async function test() {
  try {
    const data = await getCompanyDetail('ENGRO');
    console.log(JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

test();
