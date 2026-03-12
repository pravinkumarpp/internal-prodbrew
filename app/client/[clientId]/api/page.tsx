'use client';

import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';

const apis = [
  {
    name: 'Stripe Payments',
    url: 'api.stripe.com',
    status: 'Healthy',
    latency: '142ms',
    uptime: '100%',
  },
  {
    name: 'Shopify Admin API',
    url: 'myshop.myshopify.com/admin/api',
    status: 'Healthy',
    latency: '210ms',
    uptime: '99.99%',
  },
  {
    name: 'SendGrid Mail',
    url: 'api.sendgrid.com',
    status: 'Warning',
    latency: '850ms',
    uptime: '99.5%',
  },
];

export default function APIMonitoringPage() {
  return (
    <AppLayout title="API Monitoring">
      <div className="grid grid-cols-1 gap-6">
        {apis.map((api, i) => (
          <div key={i} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'p-3 rounded-lg',
                  api.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-accent/10 text-accent'
                )}
              >
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">{api.name}</h3>
                <p className="text-sm text-text-muted">{api.url}</p>
              </div>
            </div>
            <div className="flex gap-12 text-right">
              <div>
                <p className="text-xs text-text-muted uppercase mb-1">Status</p>
                <p
                  className={cn(
                    'font-bold',
                    api.status === 'Healthy' ? 'text-emerald-500' : 'text-accent'
                  )}
                >
                  {api.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase mb-1">Latency</p>
                <p className="font-bold">{api.latency}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase mb-1">Uptime</p>
                <p className="font-bold">{api.uptime}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
