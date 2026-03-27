'use client';

import { BrainCircuit, Zap, CheckCircle2, AlertTriangle, Link2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout';

type AutomationEvent = {
  id: string;
  eventType: string | null;
  eventId: string | null;
  requestId: string | null;
  status: string | null;
  source: string | null;
  eventTime: string | null;
  prompt: string | null;
  baseBranch: string | null;
  newBranch: string | null;
  repoFullName: string | null;
  prNumber: number | null;
  prUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  promptPreview: string;
};

export default function AITaskEnginePage() {
  const params = useParams();
  const clientId = params?.clientId as string | undefined;

  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/clients/${clientId}/automation-events`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  const lastEvent = events[0] ?? null;
  const isSuccess = (lastEvent?.status ?? "").toLowerCase() === "success";

  const aiStatusText = useMemo(() => {
    if (!lastEvent) return "Waiting for automation results…";
    if (isSuccess) return "Automation completed successfully.";
    return "Automation failed. Check error details.";
  }, [lastEvent, isSuccess]);

  return (
    <AppLayout title="AI Task Engine">
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="card bg-accent/5 border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit className="text-accent" size={24} />
            <h3 className="text-xl font-bold">AI Status</h3>
          </div>
          <p className="text-text-body mb-4">
            {aiStatusText}
          </p>
          {lastEvent ? (
            isSuccess ? (
              <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                <CheckCircle2 size={16} />
                Success
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-500 text-sm font-bold">
                <AlertTriangle size={16} />
                Failed
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-text-muted text-sm font-bold">
              <CheckCircle2 size={16} />
              Idle
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="text-xl font-bold mb-2">Tasks by Category</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Security</span>
              <span className="font-bold">
                {events.filter((e) => (e.eventType ?? "").toLowerCase().includes("security")).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Performance</span>
              <span className="font-bold">
                {events.filter((e) => (e.eventType ?? "").toLowerCase().includes("perf")).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Bug Fixes</span>
              <span className="font-bold">
                {events.filter((e) => (e.prompt ?? "").toLowerCase().includes("fix")).length}
              </span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-xl font-bold mb-2">Auto-Assignment</h3>
          <p className="text-text-muted text-sm mb-4">
            Tasks are automatically routed to developers based on expertise.
          </p>
          <button type="button" className="btn-secondary w-full py-2 text-sm">
            Configure Rules
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-6">Automation Results</h3>
        <div className="space-y-4">
          {loading ? (
            <div className="px-4 py-6 text-text-muted text-sm">Loading…</div>
          ) : events.length === 0 ? (
            <div className="px-4 py-6 text-text-muted text-sm">No automation results yet.</div>
          ) : (
            events.map((evt) => (
            <div
              key={evt.id}
              className="p-4 border border-card-border rounded-lg flex items-center justify-between hover:bg-secondary-bg/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    {evt.status === 'success' ? 'PR Created' : 'Automation Failed'}
                    {evt.prUrl ? ` #${evt.prNumber ?? ''}` : ''}
                  </p>
                  <p className="text-xs text-text-muted">
                    {evt.repoFullName ? evt.repoFullName : ''}{evt.baseBranch ? ` · ${evt.baseBranch}` : ''}
                  </p>
                  {evt.errorMessage ? (
                    <p className="text-xs text-rose-400 mt-1">
                      {evt.errorCode ? `${evt.errorCode}: ` : ''}
                      {evt.errorMessage}
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted mt-1">
                      Prompt: {evt.promptPreview}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                {evt.prUrl ? (
                  <a
                    href={evt.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent inline-flex items-center gap-2"
                  >
                    <Link2 size={14} />
                    View PR
                  </a>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-card-bg border border-card-border text-text-muted">
                    {evt.status ?? 'unknown'}
                  </span>
                )}
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
