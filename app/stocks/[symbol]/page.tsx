'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import KSEWidgetWrapper from '@/components/layout/KSEWidgetWrapper';
import MarketStatus from '@/components/layout/MarketStatus';
import CustomTechnicalWidget from '@/components/stocks/StockDetail/CustomTechnicalWidget';
import TVProfileWidget from '@/components/stocks/StockDetail/TVProfileWidget';
import CustomNewsWidget from '@/components/market/CustomNewsWidget';
import FipiLipiMiniChart from '@/components/market/FipiLipiMiniChart';
import InteractiveDCFCard from '@/components/stocks/StockDetail/InteractiveDCFCard';
import ScoreDisplayCard from '@/components/stocks/StockDetail/ScoreDisplayCard';

const TABS = [
  'Overview',
  'Fundamentals',
  'Technicals',
  'Intrinsic Value',
  'Target Prices',
  'Recommendations',
  'Chart Patterns',
  'FIPI/LIPI',
  'News',
  'Events'
];

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const router = useRouter();
  const { symbol } = use(params);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [targetData, setTargetData] = useState<any>(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [events, setEvents] = useState<{ boardMeetings: any[]; financialResults: any[]; loading: boolean; lastUpdated: string | null }>({
    boardMeetings: [],
    financialResults: [],
    loading: false,
    lastUpdated: null,
  });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/stocks/${symbol}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load stock data');
        }
      } catch (err) {
        setError('Network error loading stock data');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    
    // Refresh every minute for live price
    const id = setInterval(fetchDetail, 60_000);
    return () => clearInterval(id);
  }, [symbol]);

  // Fetch live events separately (board meetings + financial results) when Events tab is opened
  useEffect(() => {
    if (activeTab !== 'Events') return;
    if (events.lastUpdated) return; // Already fetched
    setEvents(prev => ({ ...prev, loading: true }));
    fetch(`/api/stocks/${symbol}/events`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setEvents({
            boardMeetings: json.boardMeetings || [],
            financialResults: json.financialResults || [],
            loading: false,
            lastUpdated: json.lastUpdated,
          });
        } else {
          // Fallback to data from main stock fetch
          setEvents(prev => ({ ...prev, loading: false, lastUpdated: 'fallback' }));
        }
      })
      .catch(() => setEvents(prev => ({ ...prev, loading: false, lastUpdated: 'fallback' })));
  }, [activeTab, symbol]);

  useEffect(() => {
    if (activeTab === 'Target Prices' && !targetData && !targetLoading) {
      setTargetLoading(true);
      fetch(`/api/stocks/${symbol}/target-price`)
        .then(res => res.json())
        .then(json => {
          if (json.success) setTargetData(json.data);
          setTargetLoading(false);
        })
        .catch(err => {
          console.error(err);
          setTargetLoading(false);
        });
    }
  }, [activeTab, symbol, targetData, targetLoading]);

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading-spinner"></div>
        <style jsx>{`
          .loading-spinner {
            width: 40px; height: 40px;
            border: 3px solid rgba(255,255,255,0.1);
            border-radius: 50%;
            border-top-color: var(--accent-cyan);
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-content" style={{ textAlign: 'center', paddingTop: 60 }}>
        <h2>{error || 'Stock not found'}</h2>
        <button onClick={() => router.back()} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 8, background: 'var(--glass-bg)', color: 'white' }}>
          Go Back
        </button>
      </div>
    );
  }

  const isUp = (data.changePercent ?? 0) >= 0;

  return (
    <div className="page-content" style={{ paddingBottom: 80 }}>
      {/* Header Back Button */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <MarketStatus />
        </div>
      </div>

      {/* Header Info */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 28, margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>{data.symbol}</h1>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{data.name}</div>
            <div style={{ fontSize: 12, color: 'var(--accent-cyan)', marginTop: 4, display: 'inline-block', padding: '2px 8px', borderRadius: 12, background: 'rgba(0, 212, 255, 0.1)' }}>
              {data.sector}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
              {data.price?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
            </div>
            {data.changePercent !== null && (
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: isUp ? 'var(--success)' : 'var(--danger)',
                fontFamily: 'JetBrains Mono, monospace',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 4
              }}>
                {isUp ? '▲' : '▼'} {Math.abs(data.change).toFixed(2)} ({Math.abs(data.changePercent).toFixed(2)}%)
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, overflowX: 'auto', paddingBottom: 8, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <div style={{ background: 'var(--glass-bg)', padding: '8px 12px', borderRadius: 8, minWidth: 100 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Volume</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{data.volume?.toLocaleString() ?? '—'}</div>
          </div>
          <div style={{ background: 'var(--glass-bg)', padding: '8px 12px', borderRadius: 8, minWidth: 100 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>High</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{data.high ?? '—'}</div>
          </div>
          <div style={{ background: 'var(--glass-bg)', padding: '8px 12px', borderRadius: 8, minWidth: 100 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Low</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{data.low ?? '—'}</div>
          </div>
          <div style={{ background: 'var(--glass-bg)', padding: '8px 12px', borderRadius: 8, minWidth: 100 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mkt Cap</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{data.marketCap ? (data.marketCap / 1000000).toFixed(2) + 'B' : '—'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="glass-card-static" style={{ minHeight: 400, padding: 16 }}>
        {activeTab === 'Overview' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>{data.symbol} Interactive Chart</h3>
            <div style={{ height: 400, borderRadius: 12, overflow: 'hidden' }}>
              <KSEWidgetWrapper symbol={data.advancedFundamentals?.tvSymbol || data.symbol.replace('.', '')} />
            </div>
            
            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Company Profile</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                {data.description || 'No company description available.'}
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'Fundamentals' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Fundamental Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {/* Valuation */}
              <StatBox label="P/E Ratio" value={data.advancedFundamentals?.pe ?? data.pe} suffix="x" />
              <StatBox label="P/B Ratio" value={data.advancedFundamentals?.pb ?? (data.bvps && data.price ? (data.price / data.bvps).toFixed(2) : null)} suffix="x" />
              <StatBox label="P/S Ratio" value={data.advancedFundamentals?.ps ? data.advancedFundamentals.ps.toFixed(2) : null} suffix="x" />
              <StatBox label="EV/EBITDA" value={data.advancedFundamentals?.evToEbitda ? data.advancedFundamentals.evToEbitda.toFixed(2) : null} suffix="x" />
              
              {/* Profitability & Returns */}
              <StatBox label="EPS (TTM)" value={data.advancedFundamentals?.eps ?? data.eps} suffix=" PKR" />
              <StatBox label="ROE" value={data.advancedFundamentals?.roe ? `${data.advancedFundamentals.roe.toFixed(2)}%` : null} />
              <StatBox label="ROA" value={data.advancedFundamentals?.roa ? `${data.advancedFundamentals.roa.toFixed(2)}%` : null} />
              <StatBox label="Gross Margin" value={data.advancedFundamentals?.grossMargin ? `${data.advancedFundamentals.grossMargin.toFixed(2)}%` : null} />
              <StatBox label="Oper. Margin" value={data.advancedFundamentals?.operatingMargin ? `${data.advancedFundamentals.operatingMargin.toFixed(2)}%` : null} />
              <StatBox label="Net Margin" value={data.advancedFundamentals?.netMargin ? `${data.advancedFundamentals.netMargin.toFixed(2)}%` : null} />
              <StatBox label="FCF Margin" value={data.advancedFundamentals?.freeCashFlowMargin ? `${data.advancedFundamentals.freeCashFlowMargin.toFixed(2)}%` : null} />
              
              {/* Liquidity & Health */}
              <StatBox label="Debt/Equity" value={data.advancedFundamentals?.debtToEquity ? data.advancedFundamentals.debtToEquity.toFixed(2) : null} />
              <StatBox label="Current Ratio" value={data.advancedFundamentals?.currentRatio ? data.advancedFundamentals.currentRatio.toFixed(2) : null} />
              <StatBox label="Quick Ratio" value={data.advancedFundamentals?.quickRatio ? data.advancedFundamentals.quickRatio.toFixed(2) : null} />
              <StatBox label="Book Value" value={data.advancedFundamentals?.bookValuePerShare ?? data.bvps} suffix=" PKR" />
              
              {/* Dividends */}
              <StatBox label="Div. Yield" value={data.advancedFundamentals?.dividendYield ? `${data.advancedFundamentals.dividendYield.toFixed(2)}%` : null} />
              
              {/* Scale */}
              <StatBox label="Market Cap" value={(() => {
                const val = data.advancedFundamentals?.marketCap;
                if (!val) return null;
                return val >= 1e9 ? `${(val / 1e9).toFixed(2)}B` : val >= 1e6 ? `${(val / 1e6).toFixed(2)}M` : val.toString();
              })()} />
              <StatBox label="Revenue" value={(() => {
                const val = data.advancedFundamentals?.totalRevenue;
                if (!val) return null;
                return val >= 1e9 ? `${(val / 1e9).toFixed(2)}B` : val >= 1e6 ? `${(val / 1e6).toFixed(2)}M` : val.toString();
              })()} />
              <StatBox label="Net Income" value={(() => {
                const val = data.advancedFundamentals?.netIncome;
                if (!val) return null;
                return val >= 1e9 ? `${(val / 1e9).toFixed(2)}B` : val >= 1e6 ? `${(val / 1e6).toFixed(2)}M` : val.toString();
              })()} />
              <StatBox label="EBITDA" value={(() => {
                const val = data.advancedFundamentals?.ebitda;
                if (!val) return null;
                return val >= 1e9 ? `${(val / 1e9).toFixed(2)}B` : val >= 1e6 ? `${(val / 1e6).toFixed(2)}M` : val.toString();
              })()} />

              {/* Shares & Price action */}
              <StatBox label="Shares Out" value={data.shares} />
              <StatBox label="Free Float" value={data.freeFloat} />
              <StatBox label="52W High" value={data.week52High} />
              <StatBox label="52W Low" value={data.week52Low} />
            </div>

            <div style={{ marginTop: 24, height: 400 }}>
              <TVProfileWidget symbol={data.advancedFundamentals?.tvSymbol || data.symbol.replace('.', '')} />
            </div>

            {/* Dividends & Payouts */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>💰 Dividends & Payouts History</h4>
              {data.payouts && data.payouts.length > 0 ? (
                <div style={{ background: 'var(--glass-bg)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', padding: '8px 14px', background: 'rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Date</span>
                    <span>Description</span>
                    <span style={{ textAlign: 'right' }}>Type</span>
                  </div>
                  {data.payouts.map((p: any, i: number) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr 2fr 1fr',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border)',
                      fontSize: 13,
                      alignItems: 'center',
                    }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-cyan)', fontSize: 12 }}>{p.date}</span>
                      <span style={{ color: 'var(--text-primary)', lineHeight: 1.3 }}>{p.amount}</span>
                      <span style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                          background: p.type === 'Dividend' ? 'rgba(0,230,118,0.1)' : 'rgba(0,212,255,0.1)',
                          color: p.type === 'Dividend' ? '#00E676' : 'var(--accent-cyan)',
                          border: `1px solid ${p.type === 'Dividend' ? 'rgba(0,230,118,0.3)' : 'rgba(0,212,255,0.3)'}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {p.type}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12, background: 'var(--glass-bg)', borderRadius: 8 }}>
                  No payout history available for {symbol}.
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'Technicals' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Technical Analysis</h3>
            <div>
              <CustomTechnicalWidget data={data} />
            </div>
          </div>
        )}

        {activeTab === 'Intrinsic Value' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Intrinsic Value Estimates</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {/* Graham Number Card */}
              <div style={{ flex: '1 1 300px', background: 'var(--glass-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Graham Number</h4>
                {data.intrinsicValue?.graham?.value ? (
                  <>
                    <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-cyan)' }}>
                      {data.intrinsicValue.graham.value.toFixed(2)} PKR
                    </div>
                    <div style={{ marginTop: 8, fontSize: 14 }}>
                      Current Price: {data.price} PKR
                    </div>
                    <div style={{ 
                      marginTop: 12, 
                      padding: '8px 12px', 
                      borderRadius: 8, 
                      textAlign: 'center',
                      fontWeight: 600,
                      background: data.intrinsicValue.graham.status === 'UNDERVALUED' ? 'var(--success-dim)' : 
                                  data.intrinsicValue.graham.status === 'OVERVALUED' ? 'var(--danger-dim)' : 'var(--warning-dim)',
                      color: data.intrinsicValue.graham.status === 'UNDERVALUED' ? 'var(--success)' : 
                             data.intrinsicValue.graham.status === 'OVERVALUED' ? 'var(--danger)' : 'var(--warning)',
                    }}>
                      {data.intrinsicValue.graham.status}
                    </div>
                    <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                      Based on Benjamin Graham's formula: √(22.5 × EPS × BVPS). Assumes EPS of {data.eps} and BVPS of {data.bvps}.
                    </p>
                  </>
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>Not enough data to calculate Graham Number (Missing EPS or BVPS).</div>
                )}
              </div>

              {/* DCF Card */}
              <InteractiveDCFCard eps={data.eps} currentPrice={data.price} />
            </div>
          </div>
        )}

        {activeTab === 'Target Prices' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Broker Target Prices</h3>
            {targetLoading ? (
              <div style={{ color: 'var(--text-muted)' }}>Fetching analyst estimates...</div>
            ) : targetData ? (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
                  <div style={{ flex: '1 1 200px', background: 'var(--glass-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                    <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 13 }}>Consensus Target</h4>
                    <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-cyan)' }}>
                      {targetData.averageTarget} PKR
                    </div>
                    <div style={{ marginTop: 8, color: targetData.upside > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {targetData.upside > 0 ? '+' : ''}{targetData.upside}% Upside
                    </div>
                  </div>
                  <div style={{ flex: '1 1 200px', background: 'var(--glass-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                    <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 13 }}>Consensus Rating</h4>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8,
                      color: targetData.consensusRating.includes('BUY') ? 'var(--success)' : targetData.consensusRating.includes('SELL') ? 'var(--danger)' : 'var(--warning)'
                     }}>
                      {targetData.consensusRating}
                    </div>
                  </div>
                </div>

                <h4 style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Broker Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {targetData.brokers.map((broker: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: 16, borderRadius: 8 }}>
                      <div style={{ fontWeight: 600 }}>{broker.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ 
                          padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700,
                          background: broker.rating.includes('BUY') ? 'var(--success-dim)' : broker.rating.includes('SELL') ? 'var(--danger-dim)' : 'var(--warning-dim)',
                          color: broker.rating.includes('BUY') ? 'var(--success)' : broker.rating.includes('SELL') ? 'var(--danger)' : 'var(--warning)'
                        }}>
                          {broker.rating}
                        </div>
                        <div style={{ fontWeight: 700, width: 100, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                          {broker.target.toFixed(2)} PKR
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {targetData.isSimulated && (
                  <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
                    * Note: Target prices shown are generated proxies based on the current market price for demonstration purposes. Premium API integration required for real-time broker estimates.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Failed to load target prices.</div>
            )}
          </div>
        )}

        {activeTab === 'Recommendations' && (
          <div style={{ padding: '0 20px 40px' }}>
            <h3 style={{ marginBottom: 24, textAlign: 'center' }}>Future Recommendations</h3>
            
            <ScoreDisplayCard score={data.score} />

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Technical Analysis</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Based on technical indicators and moving averages.</p>
              <div style={{ maxWidth: 500, margin: '0 auto' }}>
                 <CustomTechnicalWidget data={data} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'News' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Latest News</h3>
            <div style={{ height: 600, overflowY: 'auto' }}>
              <CustomNewsWidget symbol={data.symbol.replace('.', '')} />
            </div>
          </div>
        )}
        
        {activeTab === 'Events' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Board Meetings & Results</h3>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: events.lastUpdated && events.lastUpdated !== 'fallback' ? 'rgba(0,230,118,0.12)' : 'rgba(255,184,0,0.12)',
                color: events.lastUpdated && events.lastUpdated !== 'fallback' ? '#00E676' : '#FFB800',
                border: `1px solid ${events.lastUpdated && events.lastUpdated !== 'fallback' ? 'rgba(0,230,118,0.3)' : 'rgba(255,184,0,0.3)'}`,
              }}>
                {events.loading ? '⏳ Loading...' : events.lastUpdated && events.lastUpdated !== 'fallback' ? '🟢 LIVE' : '🟡 CACHED'}
              </span>
            </div>

            <h4 style={{ color: 'var(--text-secondary)', marginBottom: 10, marginTop: 16 }}>Board Meetings</h4>
            {events.loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Fetching latest board meetings...</div>
            ) : (events.boardMeetings.length > 0 ? events.boardMeetings : (data.boardMeetings || [])).length > 0 ? (
              <div style={{ background: 'var(--glass-bg)', borderRadius: 8, overflow: 'hidden' }}>
                {(events.boardMeetings.length > 0 ? events.boardMeetings : (data.boardMeetings || [])).map((bm: any, i: number) => (
                  <div key={i} style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: 13 }}>{bm.meetingDate}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.4 }}>{bm.agenda}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No board meetings found for {symbol}.</div>
            )}

            <h4 style={{ color: 'var(--text-secondary)', marginBottom: 10, marginTop: 28 }}>Financial Results</h4>
            {events.loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Fetching latest financial results...</div>
            ) : (events.financialResults.length > 0 ? events.financialResults : (data.financialResults || [])).length > 0 ? (
              <div style={{ background: 'var(--glass-bg)', borderRadius: 8, overflow: 'hidden' }}>
                {(events.financialResults.length > 0 ? events.financialResults : (data.financialResults || [])).map((fr: any, i: number) => (
                  <div key={i} style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: 13 }}>{fr.resultDate}</span>
                      <span style={{ fontSize: 11, background: 'var(--glass-hover)', padding: '2px 8px', borderRadius: 12, whiteSpace: 'nowrap' }}>
                        {fr.resultType}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.4 }}>{fr.period}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No financial results found for {symbol}.</div>
            )}

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <a href="/board-meetings" style={{ color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 600, marginRight: 20 }}>
                All Board Meetings →
              </a>
              <a href="/financial-results" style={{ color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 600 }}>
                All Financial Results →
              </a>
            </div>
          </div>
        )}

        {/* Chart Patterns tab */}
        {activeTab === 'Chart Patterns' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Chart Pattern Analysis</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Advanced pattern recognition using TradingView's technical engine.
            </p>
            <div style={{ height: 500, borderRadius: 12, overflow: 'hidden' }}>
              <KSEWidgetWrapper symbol={data.advancedFundamentals?.tvSymbol || data.symbol.replace('.', '')} height={500} />
            </div>
            <div style={{ marginTop: 16 }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Technical Summary</h4>
              <div>
                <CustomTechnicalWidget data={data} />
              </div>
            </div>
          </div>
        )}

        {/* FIPI/LIPI tab */}
        {activeTab === 'FIPI/LIPI' && (
          <div>
            <h3 style={{ marginBottom: 8 }}>FIPI / LIPI Institutional Flow</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Foreign & Local Institutional Portfolio Investment flow. Values in millions.
            </p>
            <FipiLipiMiniChart />
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <a href="/fipi-lipi" style={{ color: 'var(--accent-cyan)', fontSize: 13, fontWeight: 600 }}>
                View Full FIPI/LIPI Dashboard →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, suffix = '' }: { label: string, value: any, suffix?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'JetBrains Mono, monospace',
        color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        wordBreak: 'break-all',
        overflowWrap: 'break-word',
        lineHeight: 1.3,
      }}>
        {value !== null && value !== undefined && value !== '' ? `${value}${suffix}` : '—'}
      </div>
    </div>
  );
}
