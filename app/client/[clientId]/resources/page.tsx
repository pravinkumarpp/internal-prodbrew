'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AppLayout } from '@/components/layout';

const data = [
  { time: '10:00', cpu: 45, ram: 62, disk: 80 },
  { time: '11:00', cpu: 52, ram: 65, disk: 80 },
  { time: '12:00', cpu: 48, ram: 63, disk: 80 },
  { time: '13:00', cpu: 75, ram: 70, disk: 81 },
  { time: '14:00', cpu: 55, ram: 68, disk: 81 },
];

export default function ResourcesPage() {
  return (
    <AppLayout title="Server Resource Monitoring">
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">CPU Usage</h3>
            <span className="text-accent font-bold">55%</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div className="h-full bg-accent" style={{ width: '55%' }} />
          </div>
        </div>
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Memory Usage</h3>
            <span className="text-emerald-500 font-bold">68%</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: '68%' }} />
          </div>
        </div>
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Disk Space</h3>
            <span className="text-red-500 font-bold">81%</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: '81%' }} />
          </div>
        </div>
      </div>

      <div className="card h-[400px]">
        <h3 className="mb-6">Resource Trends</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="time" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="cpu" stroke="#000b36" strokeWidth={2} name="CPU %" />
            <Line type="monotone" dataKey="ram" stroke="#10B981" strokeWidth={2} name="RAM %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AppLayout>
  );
}
