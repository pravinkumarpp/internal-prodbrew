'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export default function FrontendErrorsPage() {
  const params = useParams();
  const clientId = params?.clientId as string | undefined;
  const [client, setClient] = useState<Client | null>(null);
  const [logEvents, setLogEvents] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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
          className="p-2 rounded-lg text-text-muted hover:bg-secondary-bg hover:text-text-primary transition-colors"
          title="Copy script tag"
          aria-label="Copy script tag"
        >
          <Copy size={18} />
        </button>
      )}
    </div>
  );

  const isEmpty = !eventsLoading && logEvents.length === 0;

  return (
    <AppLayout title="Frontend JavaScript Errors" headerAction={headerAction}>
      <div className="card p-0 overflow-hidden">
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
        ) : (
          <div className="divide-y divide-card-border font-mono text-sm">
            {logEvents.map((evt) => (
              <div
                key={evt.id}
                className="px-6 py-4 flex gap-4 hover:bg-secondary-bg/30 transition-colors"
              >
                <span className="text-text-muted w-32 shrink-0">{formatTime(evt.created_at)}</span>
                <span className="flex-1 text-red-400 min-w-0 break-words">{evt.message}</span>
                <span className="text-text-muted w-48 truncate shrink-0" title={evt.source ?? undefined}>
                  {evt.source ?? '—'}
                </span>
                <span className="text-text-muted w-32 shrink-0 capitalize">{evt.level ?? 'error'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
