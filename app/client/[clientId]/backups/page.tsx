'use client';

import { Database, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout';

export default function BackupMonitoringPage() {
  return (
    <AppLayout title="Backup Monitoring">
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Database size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Backups are Healthy</h3>
              <p className="text-text-muted">Automated daily backups are running as scheduled.</p>
            </div>
          </div>
          <div className="flex gap-8 border-t border-card-border pt-6">
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Last Backup</p>
              <p className="font-bold">12 hours ago</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Storage Used</p>
              <p className="font-bold">42.5 GB</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Retention</p>
              <p className="font-bold">30 Days</p>
            </div>
          </div>
        </div>
        <div className="card flex flex-col justify-center items-center text-center">
          <p className="text-small mb-2">Next Scheduled</p>
          <h3 className="text-2xl font-bold">Tonight, 02:00 AM</h3>
        </div>
        <div className="card flex flex-col justify-center items-center text-center">
          <button type="button" className="btn-primary w-full mb-2">
            Run Backup Now
          </button>
          <button type="button" className="btn-secondary w-full">
            Restore Point
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-6">Backup History</h3>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 hover:bg-secondary-bg/30 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" size={16} />
                <span className="text-sm">Daily Automated Backup - {24 - i}h ago</span>
              </div>
              <span className="text-xs text-text-muted">1.2 GB • Success</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
