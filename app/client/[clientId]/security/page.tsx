'use client';

import { ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';

const scans = [
  { type: 'Malware Scan', status: 'Clean', date: 'Today, 08:00 AM' },
  { type: 'Dependency Audit', status: '3 Warnings', date: 'Yesterday, 10:00 PM' },
  { type: 'Firewall Logs', status: '12 Blocks', date: 'Yesterday, 06:00 PM' },
];

export default function SecurityMonitoringPage() {
  return (
    <AppLayout title="Security Monitoring">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-emerald-500" size={24} />
            <h3 className="text-xl font-bold">Safe</h3>
          </div>
          <p className="text-sm">No active threats detected in the last scan (2 hours ago).</p>
        </div>
        <div className="card">
          <p className="text-small mb-1">Vulnerabilities</p>
          <h3 className="text-2xl font-bold">0</h3>
        </div>
        <div className="card">
          <p className="text-small mb-1">Outdated Plugins</p>
          <h3 className="text-2xl font-bold text-accent">3</h3>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-6">Security Scan History</h3>
        <div className="space-y-4">
          {scans.map((scan, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-secondary-bg rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-text-muted" />
                <span className="font-medium">{scan.type}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-text-muted">{scan.date}</span>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold',
                    scan.status === 'Clean' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-accent/10 text-accent'
                  )}
                >
                  {scan.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
