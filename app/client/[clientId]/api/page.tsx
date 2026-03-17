'use client';

import { Copy, KeyRound, Globe } from 'lucide-react';
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
      await navigator.clipboard.writeText(`Authorization: Bearer ${token}`);
      toast.success('Authorization header copied.');
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
          className="p-2 rounded-lg text-text-muted hover:bg-secondary-bg hover:text-text-primary transition-colors"
          title="Copy Authorization header"
          aria-label="Copy Authorization header"
        >
          <Copy size={18} />
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

      const iconClass =
        statusLabel === 'Healthy'
          ? 'bg-emerald-500/10 text-emerald-500'
          : statusLabel === 'Critical'
            ? 'bg-red-500/10 text-red-500'
            : 'bg-secondary-bg text-text-muted';

      const latency = latest?.response_time_ms != null ? `${latest.response_time_ms}ms` : '—';
      const uptime = uptimePct != null ? `${uptimePct.toFixed(2)}%` : '—';

      return {
        id: ep.id,
        name: ep.name,
        url: ep.url,
        method: ep.method,
        statusLabel,
        statusClass,
        iconClass,
        latency,
        uptime,
      };
    });
  }, [endpoints, latestByEndpoint, uptimePctByEndpoint]);

  return (
    <AppLayout title="API Monitoring" headerAction={headerAction}>
      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Endpoints and statuses are reported by the client developers via webhook. Reports are for internal use.
          </p>
          <button
            type="button"
            onClick={refresh}
            className="text-sm text-accent hover:underline"
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
          cards.map((api) => (
            <div key={api.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn('p-3 rounded-lg', api.iconClass)}>
                  <Globe size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold truncate">
                    {api.name}{' '}
                    <span className="text-xs font-semibold text-text-muted align-middle">
                      {api.method}
                    </span>
                  </h3>
                  <p className="text-sm text-text-muted truncate" title={api.url}>
                    {api.url}
                  </p>
                </div>
              </div>
              <div className="flex gap-12 text-right">
                <div>
                  <p className="text-xs text-text-muted uppercase mb-1">Status</p>
                  <p className={cn('font-bold', api.statusClass)}>{api.statusLabel}</p>
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
          ))
        )}
      </div>
    </AppLayout>
  );
}
