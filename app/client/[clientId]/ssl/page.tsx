'use client';

import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout';

export default function SSLPage() {
  return (
    <AppLayout title="SSL Monitoring">
      <div className="max-w-3xl">
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Certificate is Valid</h3>
                <p className="text-text-muted">Issued by Let&apos;s Encrypt</p>
              </div>
            </div>
            <span className="px-4 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold">
              Secure
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8 py-6 border-t border-card-border">
            <div>
              <p className="text-small mb-1">Expiry Date</p>
              <p className="text-lg font-semibold">August 15, 2026</p>
            </div>
            <div>
              <p className="text-small mb-1">Days Remaining</p>
              <p className="text-lg font-semibold text-emerald-500">157 Days</p>
            </div>
            <div>
              <p className="text-small mb-1">Auto-Renewal</p>
              <p className="text-lg font-semibold">Enabled</p>
            </div>
            <div>
              <p className="text-small mb-1">Protocol</p>
              <p className="text-lg font-semibold">TLS 1.3</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4">Renewal History</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-card-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                  <span className="text-sm font-medium">Successful Renewal</span>
                </div>
                <span className="text-xs text-text-muted">May {15 - i}, 2025</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
