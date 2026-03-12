'use client';

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

export default function DashboardPage() {
  return (
    <AppLayout title="System Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Globe size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-500">+2 this month</span>
          </div>
          <p className="text-text-muted text-sm mb-1">Total Clients</p>
          <h3 className="text-3xl font-bold">24</h3>
        </div>
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Activity size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-500">99.9% Avg</span>
          </div>
          <p className="text-text-muted text-sm mb-1">System Health</p>
          <h3 className="text-3xl font-bold">Healthy</h3>
        </div>
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <ListTodo size={24} />
            </div>
            <span className="text-xs font-bold text-red-500">5 Urgent</span>
          </div>
          <p className="text-text-muted text-sm mb-1">Open Tasks</p>
          <h3 className="text-3xl font-bold">42</h3>
        </div>
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Clock size={24} />
            </div>
            <span className="text-xs font-bold text-text-muted">Last 7 days</span>
          </div>
          <p className="text-text-muted text-sm mb-1">Hours Tracked</p>
          <h3 className="text-3xl font-bold">156h</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card">
          <h3 className="mb-6">Uptime Overview (All Clients)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'EcoStore', uptime: 99.9 },
                  { name: 'TechBlog', uptime: 98.5 },
                  { name: 'SaaS App', uptime: 94.2 },
                  { name: 'Portfolio', uptime: 100 },
                  { name: 'Agency', uptime: 99.5 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" domain={[90, 100]} />
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
          </div>
        </div>
        <div className="card">
          <h3 className="mb-6">Recent Alerts</h3>
          <div className="space-y-4">
            {[
              { type: 'Critical', msg: 'SaaS App is DOWN', time: '2 mins ago' },
              { type: 'Warning', msg: 'SSL Expiring: TechBlog', time: '1 hour ago' },
              { type: 'Info', msg: 'Backup Success: EcoStore', time: '3 hours ago' },
              { type: 'Error', msg: 'API Failure: Shopify Webhook', time: '5 hours ago' },
            ].map((alert, i) => (
              <div
                key={i}
                className="flex gap-3 items-start p-3 rounded-lg bg-background border border-card-border"
              >
                <div
                  className={
                    alert.type === 'Critical'
                      ? 'mt-1 text-red-500'
                      : alert.type === 'Warning'
                        ? 'mt-1 text-accent'
                        : 'mt-1 text-blue-500'
                  }
                >
                  <AlertCircle size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{alert.msg}</p>
                  <p className="text-xs text-text-muted">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="w-full btn-secondary mt-6 py-2 text-sm">
            View All Alerts
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
