'use client';

import { AppLayout } from '@/components/layout';

const errors = [
  {
    time: '11:20:15',
    msg: 'Uncaught ReferenceError: analytics is not defined',
    url: '/checkout',
    browser: 'Chrome 122',
  },
  {
    time: '11:15:42',
    msg: 'TypeError: Cannot read property "id" of null',
    url: '/product/123',
    browser: 'Safari 17.2',
  },
  {
    time: '10:55:10',
    msg: 'Failed to load resource: net::ERR_BLOCKED_BY_ADBLOCKER',
    url: '/blog/post-1',
    browser: 'Firefox 123',
  },
];

export default function FrontendErrorsPage() {
  return (
    <AppLayout title="Frontend JavaScript Errors">
      <div className="card p-0 overflow-hidden">
        <div className="bg-secondary-bg px-6 py-4 border-b border-card-border flex gap-4">
          <span className="text-xs font-semibold text-text-muted uppercase w-32">Timestamp</span>
          <span className="text-xs font-semibold text-text-muted uppercase flex-1">Error Message</span>
          <span className="text-xs font-semibold text-text-muted uppercase w-48">Page URL</span>
          <span className="text-xs font-semibold text-text-muted uppercase w-32">Browser</span>
        </div>
        <div className="divide-y divide-card-border font-mono text-sm">
          {errors.map((err, i) => (
            <div
              key={i}
              className="px-6 py-4 flex gap-4 hover:bg-secondary-bg/30 transition-colors"
            >
              <span className="text-text-muted w-32">{err.time}</span>
              <span className="flex-1 text-red-400">{err.msg}</span>
              <span className="text-text-muted w-48 truncate">{err.url}</span>
              <span className="text-text-muted w-32">{err.browser}</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
