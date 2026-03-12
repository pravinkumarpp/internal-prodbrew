'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AppLayout } from '@/components/layout';

const data = [
  { time: '00:00', response: 240 },
  { time: '04:00', response: 280 },
  { time: '08:00', response: 310 },
  { time: '12:00', response: 260 },
  { time: '16:00', response: 290 },
  { time: '20:00', response: 250 },
  { time: '23:59', response: 270 },
];

export default function UptimePage() {
  return (
    <AppLayout title="Uptime Monitoring">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-small mb-1">Current Status</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <h3 className="text-2xl font-bold">Online</h3>
          </div>
        </div>
        <div className="card">
          <p className="text-small mb-1">Uptime (30d)</p>
          <h3 className="text-2xl font-bold">99.98%</h3>
        </div>
        <div className="card">
          <p className="text-small mb-1">Avg. Response</p>
          <h3 className="text-2xl font-bold">264ms</h3>
        </div>
        <div className="card">
          <p className="text-small mb-1">Last Incident</p>
          <h3 className="text-2xl font-bold text-text-muted">None</h3>
        </div>
      </div>

      <div className="card h-[400px]">
        <h3 className="mb-6">Response Time (ms)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4e67eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4e67eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="time" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
              itemStyle={{ color: '#4e67eb' }}
            />
            <Area type="monotone" dataKey="response" stroke="#4e67eb" fillOpacity={1} fill="url(#colorRes)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AppLayout>
  );
}
