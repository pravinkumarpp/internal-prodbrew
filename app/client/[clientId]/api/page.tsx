'use client';

import { Copy, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ClientInfo = {
  api_webhook_token: string | null;
};

type ApiEndpoint = {
  id: string;
  client_id: string;
  name: string;
  method: string;
  url: string;
  expected_status: number;
  timeout_ms: number;
  enabled: boolean;
  created_at: string;
};

type ApiCheck = {
  api_endpoint_id: string;
  status: 'up' | 'down';
  status_code: number | null;
  response_time_ms: number | null;
  message: string | null;
  checked_at: string;
};

export default function APIMonitoringPage() {
  const params = useParams();
  const clientId = params?.clientId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [latestByEndpoint, setLatestByEndpoint] = useState<Record<string, ApiCheck>>({});
  const [uptimePctByEndpoint, setUptimePctByEndpoint] = useState<Record<string, number | null>>({});

  const loadClient = async () => {
    if (!clientId) return;
    setTokenLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setClient({ api_webhook_token: data.api_webhook_token ?? null });
    } catch {
      setClient(null);
    } finally {
      setTokenLoading(false);
    }
  };

  const refresh = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/api-monitoring`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setEndpoints(Array.isArray(data.endpoints) ? data.endpoints : []);
      setLatestByEndpoint(data.latestByEndpoint ?? {});
      setUptimePctByEndpoint(data.uptimePctByEndpoint ?? {});
    } catch {
      toast.error('Could not load API monitoring data.');
      setEndpoints([]);
      setLatestByEndpoint({});
      setUptimePctByEndpoint({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    loadClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const generateToken = async () => {
    if (!clientId || generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/api-webhook-token`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setClient({ api_webhook_token: data.token ?? null });
      toast.success('Token generated. Use copy to share with client devs.');
    } catch {
      toast.error('Could not generate token.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToken = async () => {
    const token = client?.api_webhook_token;
    if (!token) return;
    try {
      await navigator.clipboard.writeText(`${token}`);
      toast.success('Token is copied.');
    } catch {
      toast.error('Could not copy token.');
    }
  };

  const headerAction = (
    <div className="flex items-center gap-2 ml-2">
      {!client?.api_webhook_token ? (
        <button
          type="button"
          onClick={generateToken}
          disabled={!clientId || tokenLoading || generating}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none"
        >
          <KeyRound size={16} />
          Generate Token
        </button>
      ) : (
        <button
          type="button"
          onClick={copyToken}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-secondary-bg text-text-primary hover:bg-card-border transition-colors"
        >
          <Copy size={16} />
          Copy Token
        </button>
      )}
    </div>
  );

  const cards = useMemo(() => {
    return endpoints.map((ep) => {
      const latest = latestByEndpoint[ep.id];
      const uptimePct = uptimePctByEndpoint[ep.id];

      const statusLabel = latest
        ? latest.status === 'up'
          ? 'Healthy'
          : 'Critical'
        : 'Not Checked';

      const statusClass =
        statusLabel === 'Healthy'
          ? 'text-emerald-500'
          : statusLabel === 'Critical'
            ? 'text-red-500'
            : 'text-text-muted';

      const statusBadgeClass =
        statusLabel === 'Healthy'
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          : statusLabel === 'Critical'
            ? 'bg-red-500/10 text-red-500 border-red-500/20'
            : 'bg-secondary-bg text-text-muted border-card-border';

      const statusDotClass =
        statusLabel === 'Healthy'
          ? 'bg-emerald-500'
          : statusLabel === 'Critical'
            ? 'bg-red-500'
            : 'bg-text-muted';

      const latency = latest?.response_time_ms != null ? `${latest.response_time_ms}ms` : '—';
      const uptime = uptimePct != null ? `${uptimePct.toFixed(2)}%` : '—';
      const message =
        latest?.message != null && String(latest.message).trim() !== ''
          ? String(latest.message).trim()
          : null;

      return {
        id: ep.id,
        name: ep.name,
        url: ep.url,
        method: ep.method,
        statusLabel,
        statusClass,
        statusBadgeClass,
        statusDotClass,
        latency,
        uptime,
        message,
      };
    });
  }, [endpoints, latestByEndpoint, uptimePctByEndpoint]);

  return (
    <AppLayout title="API Monitoring" headerAction={headerAction}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-muted max-w-3xl">
            Endpoints and statuses are reported by the client developers via webhook. Reports are for internal use.
          </p>
          <button
            type="button"
            onClick={refresh}
            className="text-sm font-medium text-accent hover:underline shrink-0 self-start sm:self-auto"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="card text-sm text-text-muted py-12 text-center">Loading…</div>
        ) : cards.length === 0 ? (
          <div className="card text-sm text-text-muted py-12 text-center">
            No endpoints yet. They will appear when the client app sends webhook events.
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-card-border bg-secondary-bg">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Endpoint
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted w-[88px]">
                      Method
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted min-w-[220px]">
                      URL
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted w-[120px]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted w-[100px]">
                      Latency
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted w-[100px]">
                      Uptime
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted min-w-[200px]">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm divide-y divide-card-border">
                  {cards.map((api) => (
                    <tr
                      key={api.id}
                      className="hover:bg-secondary-bg/40 transition-colors"
                    >
                      <td className="px-6 py-4 align-top">
                        <span className="font-sans font-semibold text-text-primary">{api.name}</span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex rounded-md border border-card-border bg-primary-bg px-2 py-0.5 text-xs font-semibold text-text-primary">
                          {api.method}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top max-w-[320px]">
                        <span className="block truncate font-sans text-xs text-text-muted" title={api.url}>
                          {api.url}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold font-sans',
                            api.statusBadgeClass,
                          )}
                        >
                          <span className={cn('mr-1.5 inline-block h-1.5 w-1.5 rounded-full', api.statusDotClass)} />
                          {api.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top whitespace-nowrap text-text-primary">{api.latency}</td>
                      <td className="px-4 py-4 align-top whitespace-nowrap text-text-primary">{api.uptime}</td>
                      <td className="px-6 py-4 align-top">
                        {api.message ? (
                          <span
                            className={cn(
                              'block font-sans text-xs line-clamp-2 font-medium',
                              api.statusClass,
                            )}
                            title={api.message}
                          >
                            {api.message}
                          </span>
                        ) : (
                          <span className="font-sans text-xs text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
