'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Globe,
  Activity,
  ListTodo,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AppLayout } from '@/components/layout';

type Client = {
  id: string;
  name: string;
  status: string | null;
  uptime_pct_24h: number | null;
  ssl_expiry_date: string | null;
};

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/clients', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setClients(Array.isArray(data) ? data : []);
        } else {
          setClients([]);
        }
      } catch {
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const { totalClients, systemHealth, healthLabel, avgUptime, chartData, alerts } = useMemo(() => {
    const total = clients.length;
    const hasCritical = clients.some((c) => (c.status || '') === 'Critical');
    const hasWarning = clients.some((c) => (c.status || '') === 'Warning');
    const health = hasCritical ? 'Critical' : hasWarning ? 'Warning' : 'Healthy';
    const withUptime = clients.filter((c) => c.uptime_pct_24h != null);
    const avg =
      withUptime.length > 0
        ? withUptime.reduce((s, c) => s + (c.uptime_pct_24h ?? 0), 0) / withUptime.length
        : null;
    const chartData = clients.map((c) => ({
      name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
      uptime: c.uptime_pct_24h ?? 0,
    }));
    const alerts: { type: 'Critical' | 'Warning'; msg: string }[] = [];
    clients.forEach((c) => {
      const name = c.name;
      const status = c.status || 'Healthy';
      if (status === 'Critical') alerts.push({ type: 'Critical', msg: `${name} is DOWN` });
      else if (status === 'Warning') alerts.push({ type: 'Warning', msg: `Warning: ${name} (check SSL/uptime)` });
    });
    return {
      totalClients: total,
      systemHealth: health,
      healthLabel: avg != null ? `${avg.toFixed(1)}% Avg` : '—',
      avgUptime: avg,
      chartData,
      alerts: alerts.slice(0, 5),
    };
  }, [clients]);

  if (loading) {
    return (
      <AppLayout title="System Overview">
        <p className="text-text-muted">Loading dashboard…</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="System Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Globe size={24} />
            </div>
          </div>
          <p className="text-text-muted text-sm mb-1">Total Clients</p>
          <h3 className="text-3xl font-bold">{totalClients}</h3>
        </div>
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div
              className={`p-2 rounded-lg ${
                systemHealth === 'Critical'
                  ? 'bg-red-500/10 text-red-500'
                  : systemHealth === 'Warning'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-emerald-500/10 text-emerald-500'
              }`}
            >
              <Activity size={24} />
            </div>
            {avgUptime != null && (
              <span className="text-xs font-bold text-text-muted">{healthLabel}</span>
            )}
          </div>
          <p className="text-text-muted text-sm mb-1">System Health</p>
          <h3 className="text-3xl font-bold">{systemHealth}</h3>
        </div>
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <ListTodo size={24} />
            </div>
            <span className="text-xs font-bold text-text-muted">Open</span>
          </div>
          <p className="text-text-muted text-sm mb-1">Open Tasks</p>
          <h3 className="text-3xl font-bold">0</h3>
        </div>
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Clock size={24} />
            </div>
            <span className="text-xs font-bold text-text-muted">—</span>
          </div>
          <p className="text-text-muted text-sm mb-1">Hours Tracked</p>
          <h3 className="text-3xl font-bold">—</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card">
          <h3 className="mb-6">Uptime Overview (All Clients)</h3>
          <div className="h-[350px]">
            {chartData.length === 0 ? (
              <p className="text-text-muted text-sm">No client data yet. Add clients to see uptime.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="uptime" fill="#4e67eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="mb-6">Recent Alerts</h3>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-text-muted text-sm">No recent alerts.</p>
            ) : (
              alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start p-3 rounded-lg bg-background border border-card-border"
                >
                  <div
                    className={
                      alert.type === 'Critical' ? 'mt-1 text-red-500' : 'mt-1 text-accent'
                    }
                  >
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{alert.msg}</p>
                    <p className="text-xs text-text-muted">From monitoring</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
