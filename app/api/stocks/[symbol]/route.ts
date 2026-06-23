import { NextResponse } from 'next/server';
import { getCompanyDetail } from '@/lib/scrapers/psx';
import { calculateGrahamNumber, evaluateGrahamValue } from '@/lib/calculations/graham';
import { calculateDCF, evaluateDCFValue } from '@/lib/calculations/dcf';
import { getAdvancedFundamentals } from '@/lib/scrapers/tradingview';
import { calculateFundamentalScore } from '@/lib/calculations/scoring';
import { getGlobalSectorMedians } from '@/lib/scrapers/sectorMedians';
import cache, { TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  const CACHE_KEY = `stock_detail_${upperSymbol}`;

  try {
    const cached = cache.get<ReturnType<typeof getCompanyDetail> extends Promise<infer T> ? T : never>(CACHE_KEY);

    if (cached && !cached.stale) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        lastUpdated: new Date().toISOString(),
      });
    }

    const detail = await getCompanyDetail(upperSymbol);

    if (!detail) {
      return NextResponse.json(
        { success: false, error: `Stock ${upperSymbol} not found`, data: null },
        { status: 404 }
      );
    }

    const dcfValue = calculateDCF({ eps: detail.eps });
    const dcfStatus = evaluateDCFValue(detail.price, dcfValue);

    // Fetch Advanced Fundamentals from TV Scanner
    const advancedFundamentals = await getAdvancedFundamentals(upperSymbol);

    // Merge Book Value if PSX didn't provide it
    const effectiveBvps = detail.bvps ?? advancedFundamentals?.bookValuePerShare ?? null;

    const grahamValue = calculateGrahamNumber(detail.eps, effectiveBvps);
    const grahamStatus = evaluateGrahamValue(detail.price, grahamValue);

    // Fetch sector medians
    let sectorMedians = null;
    let sectorName = advancedFundamentals?.sector || null;
    try {
      const { medians } = await getGlobalSectorMedians();
      if (sectorName && medians[sectorName]) {
        sectorMedians = medians[sectorName];
      }
    } catch (e) {
      console.warn('Could not fetch global sector medians', e);
    }

    const enrichedDetail = {
      ...detail,
      bvps: effectiveBvps,
      advancedFundamentals,
      intrinsicValue: {
        graham: { value: grahamValue, status: grahamStatus },
        dcf: { value: dcfValue, status: dcfStatus }
      },
      score: calculateFundamentalScore({
        pe: advancedFundamentals?.pe ?? detail.pe,
        pb: advancedFundamentals?.pb ?? (effectiveBvps && detail.price ? (detail.price / effectiveBvps) : null),
        evToEbitda: advancedFundamentals?.evToEbitda ?? null,
        eps: detail.eps,
        roa: advancedFundamentals?.roa ?? null,
        grossMargin: advancedFundamentals?.grossMargin ?? null,
        operatingMargin: advancedFundamentals?.operatingMargin ?? null,
        fcfMargin: advancedFundamentals?.freeCashFlowMargin ?? null,
        // @ts-ignore - added to object but missing from interface
        capitalExpenditures: advancedFundamentals?.capitalExpenditures ?? null,
        totalRevenue: advancedFundamentals?.totalRevenue ?? null,
        debtToEquity: advancedFundamentals?.debtToEquity ?? null,
        currentRatio: advancedFundamentals?.currentRatio ?? null,
        ebitda: advancedFundamentals?.ebitda ?? null,
        totalDebt: advancedFundamentals?.totalDebt ?? null,
        altmanZ: null,
        // @ts-ignore
        freeCashFlow: advancedFundamentals?.freeCashFlow ?? null,
        marketCap: advancedFundamentals?.marketCap ?? detail.marketCap ?? null,
        price: detail.price,
        roic: advancedFundamentals?.roic ?? null,
        dividendYield: advancedFundamentals?.dividendYield ?? null,
        netIncome: advancedFundamentals?.netIncome ?? null,
        sector: sectorName
      }, sectorMedians ?? undefined)
    };

    cache.set(CACHE_KEY, enrichedDetail, TTL.STOCK_PRICE);

    return NextResponse.json({
      success: true,
      data: enrichedDetail,
      cached: false,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[API/stocks/${symbol}] Error:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock data', data: null },
      { status: 500 }
    );
  }
}
