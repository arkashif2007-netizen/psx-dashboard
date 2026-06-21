import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In a real production environment, this would scrape the daily NCCPL FIPI PDF/Excel
// However, since NCCPL blocks bots via Cloudflare, we will seed realistic mock data
// for the last 30 days so the frontend visualization works immediately.
export async function seedFipiData() {
  const investorTypes = [
    'Foreign Corporates',
    'Foreign Individuals',
    'Overseas Pakistanis',
    'Individuals',
    'Companies',
    'Banks / DFI',
    'NBFC',
    'Mutual Funds',
    'Other Organization',
    'Broker Proprietary Trading',
    'Insurance Companies'
  ];

  // Check if data already exists
  const count = await prisma.fipiRecord.count();
  if (count > 0) return; // Already seeded

  console.log('[FIPI] Seeding 30 days of FIPI/LIPI data...');
  
  const records = [];
  const today = new Date();

  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dateStr = d.toISOString().split('T')[0];

    // Generate random but balanced flows so Net is close to zero
    let dailyNet = 0;
    
    for (const type of investorTypes) {
      // Base values between 1M and 10M USD
      const buyValue = (Math.random() * 10) + 1;
      const sellValue = (Math.random() * 10) + 1;
      let netValue = buyValue - sellValue;

      // To make it interesting, let's bias Foreign Corporates to sell, Individuals to buy
      if (type === 'Foreign Corporates') netValue -= (Math.random() * 2);
      if (type === 'Individuals') netValue += (Math.random() * 2);
      if (type === 'Mutual Funds') netValue += (Math.random() * 1);

      records.push({
        date: dateStr,
        investorType: type,
        buyValue: parseFloat(buyValue.toFixed(2)),
        sellValue: parseFloat(sellValue.toFixed(2)),
        netValue: parseFloat(netValue.toFixed(2)),
      });
    }
  }

  try {
    await prisma.fipiRecord.createMany({
      data: records,
    });
    console.log('[FIPI] Successfully seeded database.');
  } catch (error) {
    console.error('[FIPI] Failed to seed database:', error);
  }
}

export async function getFipiData() {
  try {
    // Seed automatically if empty
    await seedFipiData();

    const data = await prisma.fipiRecord.findMany({
      orderBy: { date: 'asc' },
    });
    return data;
  } catch (error) {
    console.error('[FIPI] Error fetching data:', error);
    return [];
  }
}
