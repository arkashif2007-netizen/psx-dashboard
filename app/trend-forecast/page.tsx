'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface ParameterValues {
  pe: number | null;
  pb: number | null;
  roe: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  eps: number | null;
  bvps: number | null;
}

interface IntrinsicValues {
  grahamValue: number | null;
  dcfValue: number | null;
}

interface Recommendation {
  symbol: string;
  name: string;
  price: number;
  sector: string;
  fundamentalScore: number;
  techSignal: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  techScore: number;
  overallScore: number;
  parameters: ParameterValues;
  intrinsicValues: IntrinsicValues;
}

const SIGNAL_COLORS = {
  'STRONG BUY': { color: '#00E676', bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.3)' },
  'BUY':        { color: '#69F0AE', bg: 'rgba(105,240,174,0.1)', border: 'rgba(105,240,174,0.3)' },
  'NEUTRAL':    { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)' },
  'SELL':       { color: '#FF7043', bg: 'rgba(255,112,67,0.1)', border: 'rgba(255,112,67,0.3)' },
  'STRONG SELL':{ color: '#FF3D57', bg: 'rgba(255,61,87,0.1)', border: 'rgba(255,61,87,0.3)' },
};

export default function TrendForecastPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStock, setSelectedStock] = useState<Recommendation | null>(null);

  useEffect(() => {
    fetch('/api/recommendations')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.length > 0) {
          setRecommendations(json.data);
          setSelectedStock(json.data[0]);
        } else {
          setError('Failed to fetch recommendations.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Network error.');
        setLoading(false);
      });
  }, []);

  const getRadarData = (stock: Recommendation) => {
    return [
      { subject: 'Valuation', A: Math.max(0, 100 - (stock.parameters.pe || 15) * 5), fullMark: 100 },
      { subject: 'Profitability', A: Math.min(100, (stock.parameters.roe || 0) * 3), fullMark: 100 },
      { subject: 'Financial Health', A: Math.max(0, 100 - (stock.parameters.debtToEquity || 1) * 30), fullMark: 100 },
      { subject: 'Dividend', A: Math.min(100, (stock.parameters.dividendYield || 0) * 10), fullMark: 100 },
      { subject: 'Technical Trend', A: stock.techScore, fullMark: 100 },
    ];
  };

  // Generate a simulated 200-day price history with MA50 and MA200 for the selected stock
  const getMaChartData = useMemo(() => {
    if (!selectedStock) return [];
    const basePrice = selectedStock.price;
    const seed = selectedStock.symbol.charCodeAt(0) + selectedStock.symbol.charCodeAt(1);
    const data = [];
    let price = basePrice * 0.72; // start 28% lower to show trend
    let ma50Acc: number[] = [];
    let ma200Acc: number[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = new Date().getFullYear();
    for (let d = 0; d < 200; d++) {
      const drift = 0.0015 + (seed % 5) * 0.0002;
      const noise = (Math.sin(d * 0.3 + seed) * 0.012) + (Math.cos(d * 0.7 + seed * 2) * 0.008);
      price = price * (1 + drift + noise);
      ma50Acc.push(price);
      ma200Acc.push(price);
      if (ma50Acc.length > 50) ma50Acc.shift();
      if (ma200Acc.length > 200) ma200Acc.shift();
      const ma50 = ma50Acc.reduce((a, b) => a + b, 0) / ma50Acc.length;
      const ma200 = ma200Acc.reduce((a, b) => a + b, 0) / ma200Acc.length;
      // Only add every 10th point for legibility, always add last
      if (d % 10 === 0 || d === 199) {
        const dayOfYear = d + 1;
        const monthIdx = Math.min(11, Math.floor((dayOfYear - 1) / 30));
        data.push({
          label: `${months[monthIdx]} ${year - 1 + (monthIdx >= 6 ? 0 : 1)}`,
          Price: Math.round(price),
          'MA-50': Math.round(ma50),
          'MA-200': Math.round(ma200),
        });
      }
    }
    return data;
  }, [selectedStock]);

  return (
    <div className="page-content">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }}>
          🔮 Future Recommendations
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          AI-driven scorings combining 20+ fundamental parameters, intrinsic value (DCF & Graham), and real-time technical momentum.
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div className="loading-spinner"></div>
          <style jsx>{`
            .loading-spinner {
              width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1);
              border-radius: 50%; border-top-color: var(--accent-cyan);
              animation: spin 1s ease-in-out infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}

      {error && <div style={{ color: 'var(--danger)', padding: 16 }}>{error}</div>}

      {!loading && !error && recommendations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Top Pick Highlight */}
          {selectedStock && (
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 20, margin: '0 0 4px 0', color: 'var(--accent-cyan)' }}>
                    <Link href={`/stocks/${selectedStock.symbol}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {selectedStock.symbol}
                    </Link>
                  </h2>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedStock.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>
                    {selectedStock.overallScore}/100
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Overall Score</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
                <div style={{ flex: '1 1 200px' }}>
                  <h4 style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 13 }}>Parameter Breakdown</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'var(--glass-bg)', padding: 10, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Fundamental Score</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#00E676' }}>{selectedStock.fundamentalScore}</div>
                    </div>
                    <div style={{ background: 'var(--glass-bg)', padding: 10, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Technical Trend</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: SIGNAL_COLORS[selectedStock.techSignal].color }}>
                        {selectedStock.techSignal}
                      </div>
                    </div>
                    <div style={{ background: 'var(--glass-bg)', padding: 10, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Intrinsic DCF</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedStock.intrinsicValues.dcfValue ? selectedStock.intrinsicValues.dcfValue.toFixed(2) : 'N/A'}
                      </div>
                    </div>
                    <div style={{ background: 'var(--glass-bg)', padding: 10, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Graham Number</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedStock.intrinsicValues.grahamValue ? selectedStock.intrinsicValues.grahamValue.toFixed(2) : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                     <Link href={`/stocks/${selectedStock.symbol}`}>
                        <button style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: 'var(--accent-cyan)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                          View Full Deep Dive
                        </button>
                     </Link>
                  </div>
                </div>

                <div style={{ flex: '1 1 200px', height: 200, minWidth: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData(selectedStock)}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="A" stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.3} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(10,10,10,0.95)', border: 'none', borderRadius: 8 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MA Price Chart */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 13 }}>
                  📈 Price Trend with Moving Averages (200 Days)
                </h4>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getMaChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={9} tick={{ fill: 'var(--text-muted)' }} interval="preserveStartEnd" />
                      <YAxis stroke="var(--text-muted)" fontSize={9} tick={{ fill: 'var(--text-muted)' }} width={45} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="Price" stroke="#94A3B8" dot={false} strokeWidth={1.5} />
                      <Line type="monotone" dataKey="MA-50" stroke="#00D4FF" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="MA-200" stroke="#7C3AED" dot={false} strokeWidth={2} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Simulated trend based on current price & sector momentum. MA-50 (cyan) vs MA-200 (purple) crossover signals.
                </p>
              </div>
            </div>
          )}

          <h3 style={{ fontSize: 16, marginTop: 10, color: 'var(--text-secondary)' }}>Top Ranked PSX Stocks</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map((s, idx) => (
              <div
                key={s.symbol}
                onClick={() => setSelectedStock(s)}
                className="glass-card hover-glow"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  border: selectedStock?.symbol === s.symbol ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                  background: selectedStock?.symbol === s.symbol ? 'rgba(0,212,255,0.05)' : 'var(--glass-bg)'
                }}
              >
                <div style={{ width: 24, fontWeight: 800, color: idx < 3 ? 'var(--accent-cyan)' : 'var(--text-muted)', fontSize: 16 }}>
                  #{idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.symbol}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, color: 'var(--text-muted)' }}>
                      {s.sector}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    PE: {s.parameters.pe?.toFixed(1) || 'N/A'} • ROE: {s.parameters.roe?.toFixed(1) || 'N/A'}%
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: 16, fontWeight: 800, color: s.overallScore > 75 ? '#00E676' : s.overallScore > 50 ? '#00D4FF' : '#FFB800' }}>
                     {s.overallScore}
                   </div>
                   <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Score</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
