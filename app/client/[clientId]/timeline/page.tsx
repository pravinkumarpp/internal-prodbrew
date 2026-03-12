'use client';

import { AlertCircle, ShieldCheck, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';

const events = [
  {
    title: 'Server Downtime Resolved',
    desc: 'Main application server recovered after 12 minutes of downtime.',
    time: 'Today, 10:45 AM',
    type: 'incident',
    icon: AlertCircle,
    color: 'text-red-500',
  },
  {
    title: 'Security Patch Applied',
    desc: 'Updated WordPress core to version 6.4.3 to address CVE-2024-1234.',
    time: 'Yesterday, 04:20 PM',
    type: 'maintenance',
    icon: ShieldCheck,
    color: 'text-emerald-500',
  },
  {
    title: 'SSL Certificate Renewed',
    desc: "Let's Encrypt certificate successfully renewed for another 90 days.",
    time: 'Mar 09, 2026',
    type: 'system',
    icon: Lock,
    color: 'text-blue-500',
  },
  {
    title: 'Performance Optimization',
    desc: 'Compressed 42 image assets on the homepage. LCP improved by 400ms.',
    time: 'Mar 08, 2026',
    type: 'task',
    icon: Zap,
    color: 'text-accent',
  },
];

export default function TimelinePage() {
  return (
    <AppLayout title="Incident Timeline">
      <div className="max-w-3xl mx-auto">
        <div className="relative border-l-2 border-card-border ml-4 space-y-12 pb-8">
          {events.map((event, i) => (
            <div key={i} className="relative pl-10">
              <div
                className={cn(
                  'absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-background border-2 border-card-border flex items-center justify-center',
                  event.color
                )}
              >
                <event.icon size={10} />
              </div>
              <div className="card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-text-primary">{event.title}</h4>
                  <span className="text-xs text-text-muted">{event.time}</span>
                </div>
                <p className="text-sm text-text-body">{event.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
