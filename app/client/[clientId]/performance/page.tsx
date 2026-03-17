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
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';

const metrics = [
  { name: 'LCP', value: 1.2, unit: 's', status: 'Good' },
  { name: 'FID', value: 12, unit: 'ms', status: 'Good' },
  { name: 'CLS', value: 0.05, unit: '', status: 'Good' },
  { name: 'TTFB', value: 240, unit: 'ms', status: 'Good' },
];

const speedData = [
  { day: 'Mon', speed: 1.4 },
  { day: 'Tue', speed: 1.6 },
  { day: 'Wed', speed: 1.3 },
  { day: 'Thu', speed: 1.5 },
  { day: 'Fri', speed: 1.2 },
  { day: 'Sat', speed: 1.1 },
  { day: 'Sun', speed: 1.2 },
];

const resourceBreakdown = [
  { label: 'Scripts', size: '1.2 MB', color: 'bg-accent' },
  { label: 'Images', size: '2.4 MB', color: 'bg-emerald-500' },
  { label: 'Styles', size: '150 KB', color: 'bg-blue-500' },
  { label: 'Fonts', size: '80 KB', color: 'bg-purple-500' },
];

export default function PerformancePage() {
  return (
    <AppLayout title="Performance Monitoring">
      <div className="grid grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div key={metric.name} className="card">
            <div className="flex justify-between items-start mb-2">
              <p className="text-small font-bold">{metric.name}</p>
              <span className="text-xs font-bold text-emerald-500">{metric.status}</span>
            </div>
            <h3 className="text-3xl font-bold">
              {metric.value}
              {metric.unit}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="card">
          <h3 className="mb-6">Page Load Speed (Last 7 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="#000b36"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#000b36' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-6">Resource Breakdown</h3>
          <div className="space-y-4">
            {resourceBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="text-text-muted">{item.size}</span>
                </div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div className={cn('h-full', item.color)} style={{ width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
