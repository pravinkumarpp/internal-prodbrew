'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

type Client = {
  id: string;
  slug: string | null;
  api_webhook_token: string | null;
};

type LogEvent = {
  id: string;
  message: string;
  level: string | null;
  source: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type LevelFilter = 'all' | 'error' | 'warning';
type TimeFilter = 'all' | '1h' | '24h' | '7d';

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getCurlExample(token: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return [
    `curl -X POST "${origin}/api/webhook/logs" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "Authorization: Bearer ${token}" \\`,
    `  -d '{ "type": "server_log", "message": "Nginx error example", "level": "error", "source": "/var/log/nginx/error.log" }'`,
  ].join('\n');
}

function normalizeLevel(level: string | null): 'error' | 'warning' | 'info' {
  const v = String(level ?? '').toLowerCase();
  if (v === 'warning') return 'warning';
  if (v === 'info') return 'info';
  return 'error';
}

export default function ServerLogsPage() {
  const params = useParams();
  const clientId = params?.clientId as string | undefined;

  const [client, setClient] = useState<Client | null>(null);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [clientLoading, setClientLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  useEffect(() => {
    if (!clientId) {
      setClientLoading(false);
      return;
    }
    fetch(`/api/clients/${clientId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setClient(data))
      .catch(() => setClient(null))
      .finally(() => setClientLoading(false));
  }, [clientId]);

  useEffect(() => {
    if (!clientId) {
      setEventsLoading(false);
      return;
    }
    setEventsLoading(true);
    fetch(`/api/clients/${clientId}/logs`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, [clientId]);

  const token = client?.api_webhook_token ?? null;
  const curlExample = useMemo(() => (token ? getCurlExample(token) : ''), [token]);

  const handleGenerateToken = async () => {
    if (!clientId || generatingToken) return;
    setGeneratingToken(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/api-webhook-token`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const nextToken = typeof data?.token === 'string' ? data.token : null;
      setClient((prev) => (prev ? { ...prev, api_webhook_token: nextToken } : prev));
      toast.success('Token generated.');
    } catch {
      toast.error('Could not generate token.');
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopy = async () => {
    if (!curlExample) return;
    try {
      await navigator.clipboard.writeText(curlExample);
      toast.success('Example copied to clipboard.');
    } catch {
      toast.error('Could not copy.');
    }
  };

  const headerAction = (
    <div className="flex items-center gap-2 ml-2">
      {!token ? (
        <button
          type="button"
          onClick={handleGenerateToken}
          disabled={clientLoading || generatingToken}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none"
        >
          <KeyRound size={16} />
          Generate Token
        </button>
      ) : (
        <button
          type="button"
          onClick={handleCopy}
          disabled={!curlExample}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-secondary-bg text-text-primary hover:bg-card-border transition-colors disabled:opacity-50 disabled:pointer-events-none"
          title="Copy curl example"
          aria-label="Copy curl example"
        >
            Copy 
        </button>
      )}
    </div>
  );

  const isEmpty = !eventsLoading && events.length === 0;
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const timeWindowMs =
      timeFilter === '1h'
        ? 60 * 60 * 1000
        : timeFilter === '24h'
          ? 24 * 60 * 60 * 1000
          : timeFilter === '7d'
            ? 7 * 24 * 60 * 60 * 1000
            : null;

    return events.filter((evt) => {
      const normalizedLevel = normalizeLevel(evt.level);
      const matchesLevel = levelFilter === 'all' || normalizedLevel === levelFilter;
      if (!matchesLevel) return false;

      if (timeWindowMs == null) return true;
      const createdAtMs = new Date(evt.created_at).getTime();
      if (Number.isNaN(createdAtMs)) return false;
      return now - createdAtMs <= timeWindowMs;
    });
  }, [events, levelFilter, timeFilter]);
  const isFilteredEmpty = !eventsLoading && filteredEvents.length === 0;

  return (
    <AppLayout title="Server Logs" headerAction={headerAction}>
      <div className="space-y-4">
        <div className="card p-4">
          <div className="text-sm text-text-muted">
            {token ? (
              <div className="space-y-2">
                <div className="font-medium text-text-primary">Webhook example (copy from header)</div>
                <pre className="mt-2 p-3 bg-secondary-bg border border-card-border rounded-lg overflow-x-auto text-xs">
                  {curlExample}
                </pre>
              </div>
            ) : (
              <div>
                Generate a token to authenticate server log submissions from the client’s Linux agent.
              </div>
            )}
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border flex items-center justify-between gap-3">
            <div className="text-xs text-text-muted">
              Filter events by severity and time range
            </div>
            <div className="flex items-center gap-2">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
                className="px-2 py-1.5 rounded-md border border-card-border bg-primary-bg text-sm text-text-primary"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
              </select>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="px-2 py-1.5 rounded-md border border-card-border bg-primary-bg text-sm text-text-primary"
              >
                <option value="all">All Time</option>
                <option value="1h">Last 1 Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
          </div>
          <div className="bg-secondary-bg px-6 py-4 border-b border-card-border flex gap-4">
            <span className="text-xs font-semibold text-text-muted uppercase w-32">Timestamp</span>
            <span className="text-xs font-semibold text-text-muted uppercase flex-1">Message</span>
            <span className="text-xs font-semibold text-text-muted uppercase w-64">Source</span>
            <span className="text-xs font-semibold text-text-muted uppercase w-32">Level</span>
          </div>
          {eventsLoading ? (
            <div className="px-6 py-12 text-center text-text-muted text-sm">Loading events…</div>
          ) : isEmpty ? (
            <div className="px-6 py-12 text-center text-text-muted text-sm">
              No server logs recorded yet. Once the client installs the Linux agent, warnings/errors will appear here.
            </div>
          ) : isFilteredEmpty ? (
            <div className="px-6 py-12 text-center text-text-muted text-sm">
              No events found for the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-card-border font-mono text-sm">
              {filteredEvents.map((evt) => {
                const level = normalizeLevel(evt.level);
                const isWarning = level === 'warning';
                const messageClass = isWarning ? 'text-yellow-600' : 'text-red-500';
                const levelClass = isWarning ? 'text-yellow-600' : 'text-red-500';

                return (
                  <div
                    key={evt.id}
                    className="px-6 py-4 flex gap-4 hover:bg-secondary-bg/30 transition-colors"
                  >
                    <span className="text-text-muted w-32 shrink-0">
                      {formatTime(evt.created_at)}
                    </span>
                    <span className={`flex-1 min-w-0 break-words ${messageClass}`}>{evt.message}</span>
                    <span className="text-text-muted w-64 truncate shrink-0" title={evt.source ?? undefined}>
                      {evt.source ?? '—'}
                    </span>
                    <span className={`w-32 shrink-0 capitalize font-semibold ${levelClass}`}>{level}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
