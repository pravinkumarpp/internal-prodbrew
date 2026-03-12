'use client';

import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';

const logs = [
  {
    time: '10:45:22',
    level: 'Error',
    msg: 'Failed to connect to Redis at 127.0.0.1:6379',
    source: 'Backend',
    color: 'text-red-400',
  },
  {
    time: '10:42:10',
    level: 'Warning',
    msg: 'Memory usage exceeding 80% threshold',
    source: 'Infrastructure',
    color: 'text-accent',
  },
  {
    time: '10:38:05',
    level: 'Error',
    msg: 'SQLSTATE[HY000] [2002] Connection refused',
    source: 'Database',
    color: 'text-red-400',
  },
  {
    time: '10:35:12',
    level: 'Critical',
    msg: 'Application crash: Out of memory',
    source: 'Runtime',
    color: 'text-red-600',
  },
];

export default function LogsPage() {
  return (
    <AppLayout title="Server Error Logs">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <select className="bg-secondary-bg border border-card-border rounded-lg px-4 py-2 text-sm focus:outline-none">
            <option>All Levels</option>
            <option>Error</option>
            <option>Warning</option>
            <option>Critical</option>
          </select>
          <button type="button" className="btn-secondary py-2">
            Clear Logs
          </button>
        </div>
        <span className="text-small">Showing last 100 errors</span>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="bg-secondary-bg px-6 py-4 border-b border-card-border flex gap-4">
          <span className="text-xs font-semibold text-text-muted uppercase w-32">Timestamp</span>
          <span className="text-xs font-semibold text-text-muted uppercase w-24">Level</span>
          <span className="text-xs font-semibold text-text-muted uppercase flex-1">Message</span>
          <span className="text-xs font-semibold text-text-muted uppercase w-32">Source</span>
        </div>
        <div className="divide-y divide-card-border font-mono text-sm">
          {logs.map((log, i) => (
            <div
              key={i}
              className="px-6 py-4 flex gap-4 hover:bg-secondary-bg/30 transition-colors"
            >
              <span className="text-text-muted w-32">2026-03-11 {log.time}</span>
              <span className={cn('w-24 font-bold uppercase', log.color)}>{log.level}</span>
              <span className="flex-1 text-text-body">{log.msg}</span>
              <span className="text-text-muted w-32">{log.source}</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
