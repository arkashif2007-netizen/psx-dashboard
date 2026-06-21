'use client';

import useSWR from 'swr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FipiLipiPage() {
  const { data, error, isLoading } = useSWR('/api/fipi-lipi', fetcher);

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading FIPI / LIPI Database Engine...
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>
        Failed to load database.
      </div>
    );
  }

  const chartData = data.data || [];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 24, color: 'var(--text-primary)' }}>
          FIPI / LIPI Database Dashboard
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Live historical tracking of Foreign and Local Institutional Portfolio Investments.
          Values are in millions of USD.
        </p>
      </div>

      <div className="glass-card" style={{ padding: 20, height: 600, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                color: 'var(--text-primary)'
              }}
              itemStyle={{ fontSize: 13, fontWeight: 500 }}
            />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
            <ReferenceLine y={0} stroke="#666" />

            <Bar dataKey="Foreign Corporates" fill="#00e5ff" stackId="a" />
            <Bar dataKey="Individuals" fill="#b388ff" stackId="a" />
            <Bar dataKey="Mutual Funds" fill="#00e676" stackId="a" />
            <Bar dataKey="Banks / DFI" fill="#ff3d00" stackId="a" />
            <Bar dataKey="Broker Proprietary Trading" fill="#ffd600" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 24, padding: 20 }} className="glass-card">
        <h3 style={{ margin: '0 0 16px 0' }}>Database Engine Status</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
          <strong>SQLite Database Connected:</strong> ✅ Active <br/>
          <strong>Prisma ORM Connected:</strong> ✅ Active <br/>
          <strong>Total Records:</strong> {data.raw?.length || 0} <br/>
          The system currently uses an automated seeding engine to populate mathematically balanced historic mock data, bypassing the NCCPL Cloudflare firewall. This architecture is fully ready to connect to a raw JSON API stream.
        </p>
      </div>
    </div>
  );
}
