'use client';

import { useRouter } from 'next/navigation';
import { PlusCircle, Filter, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_CLIENTS } from '@/lib/constants';
import { AppLayout } from '@/components/layout';

export default function ClientsListPage() {
  const router = useRouter();

  return (
    <AppLayout title="Clients List">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-secondary-bg px-4 py-2 rounded-lg border border-card-border">
            <Filter size={18} className="text-text-muted" />
            <span className="text-sm font-medium">All Platforms</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary-bg px-4 py-2 rounded-lg border border-card-border">
            <span className="text-sm font-medium">Status: All</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/add-client')}
          className="btn-primary w-full sm:w-auto"
        >
          <PlusCircle size={20} />
          Add New Client
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-secondary-bg border-b border-card-border">
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Client / URL
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Health
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  SSL Expiry
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {MOCK_CLIENTS.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-secondary-bg/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/client/${client.id}/uptime`)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-text-primary">{client.name}</div>
                    <div className="text-sm text-text-muted">{client.url}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-background border border-card-border text-xs font-medium">
                      {client.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          client.status === 'Healthy'
                            ? 'bg-emerald-500'
                            : client.status === 'Warning'
                              ? 'bg-accent'
                              : 'bg-red-500'
                        )}
                      />
                      <span className="text-sm">{client.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">{client.uptime}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-muted">{client.sslExpiry}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
                      {client.openTasks}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" className="text-text-muted hover:text-text-primary">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
