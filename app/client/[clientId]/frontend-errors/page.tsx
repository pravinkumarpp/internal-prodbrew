'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Copy, FileCode } from 'lucide-react';
import { toast } from 'sonner';

type Client = {
  id: string;
  slug: string | null;
  frontend_script_generated_at: string | null;
};

type LogEvent = {
  id: string;
  message: string;
  level: string | null;
  source: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

function getScriptTag(slug: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const scriptUrl = `${origin}/maintainai-logger.js`;
  return `<script src="${scriptUrl}" data-client-id="${slug}"></script>`;
}

type LevelFilter = 'all' | 'error' | 'warning';
type TimeFilter = 'all' | '1h' | '24h' | '7d';

function normalizeLevel(level: string | null): 'error' | 'warning' | 'info' {
  const v = String(level ?? '').toLowerCase();
  if (v === 'warning') return 'warning';
  if (v === 'info') return 'info';
  return 'error';
}

export default function FrontendErrorsPage() {
  const params = useParams();
  const clientId = params?.clientId as string | undefined;
  const [client, setClient] = useState<Client | null>(null);
  const [logEvents, setLogEvents] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    fetch(`/api/clients/${clientId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setClient(data))
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    if (!clientId) {
      setEventsLoading(false);
      return;
    }
    setEventsLoading(true);
    fetch(`/api/clients/${clientId}/log-events`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setLogEvents(Array.isArray(data) ? data : []))
      .catch(() => setLogEvents([]))
      .finally(() => setEventsLoading(false));
  }, [clientId]);

  const scriptGenerated = Boolean(client?.frontend_script_generated_at);
  const slug = client?.slug ?? '';
  const scriptTag = slug ? getScriptTag(slug) : '';

  const handleGenerateScript = async () => {
    if (!clientId || generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/frontend-script`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setClient((prev) =>
        prev
          ? {
              ...prev,
              frontend_script_generated_at:
                data.frontend_script_generated_at ?? new Date().toISOString(),
            }
          : null,
      );
      toast.success('Script generated. Use the copy button to add it to your site.');
    } catch {
      toast.error('Could not generate script.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!scriptTag) return;
    try {
      await navigator.clipboard.writeText(scriptTag);
      toast.success('Script tag copied to clipboard.');
    } catch {
      toast.error('Could not copy.');
    }
  };

  const headerAction = (
    <div className="flex items-center gap-2 ml-2">
      {!scriptGenerated ? (
        <button
          type="button"
          onClick={handleGenerateScript}
          disabled={loading || generating || !slug}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none"
        >
          <FileCode size={16} />
          Generate Script
        </button>
      ) : (
        <button
          type="button"
          onClick={handleCopy}
          disabled={!scriptTag}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-secondary-bg text-text-primary hover:bg-card-border disabled:opacity-50 disabled:pointer-events-none"
        >
          <Copy size={16} />
          Copy Script
        </button>
      )}
    </div>
  );

  const isEmpty = !eventsLoading && logEvents.length === 0;
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

    return logEvents.filter((evt) => {
      const normalizedLevel = normalizeLevel(evt.level);
      const matchesLevel = levelFilter === 'all' || normalizedLevel === levelFilter;
      if (!matchesLevel) return false;

      if (timeWindowMs == null) return true;
      const createdAtMs = new Date(evt.created_at).getTime();
      if (Number.isNaN(createdAtMs)) return false;
      return now - createdAtMs <= timeWindowMs;
    });
  }, [logEvents, levelFilter, timeFilter]);
  const isFilteredEmpty = !eventsLoading && filteredEvents.length === 0;

  return (
    <AppLayout title="Frontend JavaScript Errors" headerAction={headerAction}>
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
          <span className="text-xs font-semibold text-text-muted uppercase flex-1">Error Message</span>
          <span className="text-xs font-semibold text-text-muted uppercase w-48">Page URL</span>
          <span className="text-xs font-semibold text-text-muted uppercase w-32">Level</span>
        </div>
        {eventsLoading ? (
          <div className="px-6 py-12 text-center text-text-muted text-sm">Loading events…</div>
        ) : isEmpty ? (
          <div className="px-6 py-12 text-center text-text-muted text-sm">
            No frontend errors recorded yet. Add the script to your site to start receiving console errors, 404s, and slow responses.
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
              const levelClass = isWarning ? 'text-yellow-600 px-2 py-0.5 rounded-md inline-block' : 'text-red-500';

              return (
                <div
                  key={evt.id}
                  className="px-6 py-4 flex gap-4 hover:bg-secondary-bg/30 transition-colors"
                >
                  <span className="text-text-muted w-32 shrink-0">{formatTime(evt.created_at)}</span>
                  <span className={`flex-1 min-w-0 break-words ${messageClass}`}>{evt.message}</span>
                  <span className="text-text-muted w-48 truncate shrink-0" title={evt.source ?? undefined}>
                    {evt.source ?? '—'}
                  </span>
                  <span className="w-32 shrink-0">
                    <span className={`capitalize font-semibold ${levelClass}`}>{level}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
