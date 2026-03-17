'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AppLayout } from '@/components/layout';
import { toast } from 'sonner';

type ClientUptime = {
  id: string;
  name: string;
  url: string;
  status: string | null;
  last_check_at: string | null;
  last_status: string | null;
  uptime_pct_24h: number | null;
};

type CheckPoint = {
  checked_at: string;
  status: string;
  response_time_ms: number | null;
};

export default function UptimePage() {
  const params = useParams();
  const clientId = params?.clientId as string | undefined;
  const [client, setClient] = useState<ClientUptime | null>(null);
  const [history, setHistory] = useState<CheckPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setError('Missing client id');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const [clientRes, historyRes] = await Promise.all([
          fetch(`/api/clients/${clientId}`, { credentials: 'include' }),
          fetch(`/api/clients/${clientId}/uptime-history`, { credentials: 'include' }),
        ]);

        const clientBody = await clientRes.json().catch(() => ({}));
        if (!clientRes.ok) {
          if (!cancelled) {
            setError((clientBody as { error?: string }).error || 'Failed to load uptime data.');
          }
          return;
        }

        const historyBody = (await historyRes.json().catch(() => [])) as CheckPoint[] | { error?: string };
        if (!historyRes.ok && !('length' in historyBody)) {
          if (!cancelled) {
            setError((historyBody as { error?: string }).error || 'Failed to load uptime history.');
          }
          return;
        }

        if (!cancelled) {
          setClient(clientBody as ClientUptime);
          if (Array.isArray(historyBody)) setHistory(historyBody);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load uptime data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const derived = useMemo(() => {
    if (!client) {
      return {
        isUp: false,
        statusLabel: 'Unknown',
        statusDotClass: 'bg-gray-400',
        uptimeLabel: '—',
        lastCheckLabel: '—',
        lastIncidentLabel: '—',
      };
    }

    const isUp = client.last_status === 'up';
    const statusLabel = isUp ? 'Online' : 'Offline';
    const statusDotClass = isUp ? 'bg-emerald-500' : 'bg-red-500';

    const uptime =
      client.uptime_pct_24h != null && !Number.isNaN(client.uptime_pct_24h)
        ? `${client.uptime_pct_24h.toFixed(2)}%`
        : '—';

    const lastCheck =
      client.last_check_at && !Number.isNaN(new Date(client.last_check_at).getTime())
        ? new Date(client.last_check_at).toLocaleString()
        : '—';

    const lastIncidentLabel = isUp ? 'None' : lastCheck;

    return {
      isUp,
      statusLabel,
      statusDotClass,
      uptimeLabel: uptime,
      lastCheckLabel: lastCheck,
      lastIncidentLabel,
    };
  }, [client]);

  const chartData = useMemo(() => {
    if (!history.length) return [];
    return history
      .filter((h) => h.response_time_ms != null)
      .map((h) => ({
        time: new Date(h.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        response: h.response_time_ms as number,
      }));
  }, [history]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <AppLayout title="Uptime Monitoring">
      {loading ? (
        <p className="text-text-muted">Loading uptime data…</p>
      ) : error ? (
        <div className="card flex items-center gap-3">
          <AlertTriangle className="text-red-500" />
          <p className="text-text-muted text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <p className="text-small mb-1">Current Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${derived.statusDotClass} ${derived.isUp ? 'animate-pulse' : ''}`} />
                <h3 className="text-2xl font-bold">{derived.statusLabel}</h3>
              </div>
            </div>
            <div className="card">
              <p className="text-small mb-1">Uptime (last 7 days)</p>
              <h3 className="text-2xl font-bold">{derived.uptimeLabel}</h3>
            </div>
            <div className="card">
              <p className="text-small mb-1">Last Check</p>
              <h3 className="text-lg font-semibold">{derived.lastCheckLabel}</h3>
            </div>
            <div className="card">
              <p className="text-small mb-1">Last Incident</p>
              <h3 className="text-lg font-semibold text-text-muted">
                {derived.lastIncidentLabel}
              </h3>
            </div>
          </div>

          <div className="card h-[400px]">
            <h3 className="mb-6">Response Time (ms)</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-text-muted">
                No recent checks with response time data. The chart will appear after the cron
                has run a few times.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000b36" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#000b36" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="time" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#000b36' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="response"
                    stroke="#000b36"
                    fillOpacity={1}
                    fill="url(#colorRes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
