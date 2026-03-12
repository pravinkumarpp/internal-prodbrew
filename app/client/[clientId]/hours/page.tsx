'use client';

import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';

const entries = [
  { date: 'Mar 10, 2026', dev: 'John Dev', task: 'Security Patching', hours: '2.5', status: 'Approved' },
  { date: 'Mar 09, 2026', dev: 'Jane Dev', task: 'Performance Audit', hours: '4.0', status: 'Pending' },
  { date: 'Mar 08, 2026', dev: 'John Dev', task: 'Bug Fix: Checkout', hours: '1.5', status: 'Approved' },
];

export default function HoursTrackingPage() {
  return (
    <AppLayout title="Hours Tracking">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-small mb-1">Total Hours (This Month)</p>
          <h3 className="text-3xl font-bold">42.5h</h3>
        </div>
        <div className="card">
          <p className="text-small mb-1">Billable Amount</p>
          <h3 className="text-3xl font-bold text-emerald-500">$3,400.00</h3>
        </div>
        <div className="card">
          <p className="text-small mb-1">Remaining Budget</p>
          <h3 className="text-3xl font-bold text-accent">12.5h</h3>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-secondary-bg border-b border-card-border">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase">Developer</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase">Task</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase">Hours</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {entries.map((entry, i) => (
              <tr key={i} className="hover:bg-secondary-bg/30 transition-colors">
                <td className="px-6 py-4 text-sm">{entry.date}</td>
                <td className="px-6 py-4 text-sm font-medium">{entry.dev}</td>
                <td className="px-6 py-4 text-sm text-text-muted">{entry.task}</td>
                <td className="px-6 py-4 text-sm font-bold">{entry.hours}h</td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={cn(
                      'px-2 py-1 rounded text-[10px] font-bold uppercase',
                      entry.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-accent/10 text-accent'
                    )}
                  >
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
