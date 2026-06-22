'use client';

import useSWR from 'swr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FipiLipiMiniChart() {
  const { data, error, isLoading } = useSWR('/api/fipi-lipi', fetcher, { refreshInterval: 0 });

  if (isLoading) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Loading FIPI / LIPI data...
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--danger)', fontSize: 13 }}>
        Could not load FIPI / LIPI data.
      </div>
    );
  }

  // Take only the last 10 entries for the mini view
  const chartData = (data.data || []).slice(-10);

  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={9} tickMargin={4} interval="preserveStartEnd" />
          <YAxis stroke="var(--text-muted)" fontSize={9} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10,10,10,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 11,
              color: 'var(--text-primary)'
            }}
          />
          <ReferenceLine y={0} stroke="#555" />
          <Bar dataKey="Foreign Corporates" fill="#00e5ff" stackId="a" />
          <Bar dataKey="Individuals" fill="#b388ff" stackId="a" />
          <Bar dataKey="Mutual Funds" fill="#00e676" stackId="a" />
          <Bar dataKey="Banks / DFI" fill="#ff3d00" stackId="a" />
          <Bar dataKey="Broker Proprietary Trading" fill="#ffd600" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
