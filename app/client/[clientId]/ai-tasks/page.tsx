'use client';

import { BrainCircuit, Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';

const recentTasks = [
  {
    title: 'Optimize large image assets on homepage',
    reason: 'LCP > 2.5s detected',
    priority: 'Medium',
  },
  {
    title: 'Patch critical vulnerability in "WP-Forms" plugin',
    reason: 'Security scan alert',
    priority: 'Critical',
  },
  {
    title: 'Fix broken API endpoint /api/v1/checkout',
    reason: '500 Error spike',
    priority: 'High',
  },
];

export default function AITaskEnginePage() {
  return (
    <AppLayout title="AI Task Engine">
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="card bg-accent/5 border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit className="text-accent" size={24} />
            <h3 className="text-xl font-bold">AI Status</h3>
          </div>
          <p className="text-text-body mb-4">
            Analyzing logs and monitoring data in real-time. 12 new tasks generated today.
          </p>
          <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
            <CheckCircle2 size={16} />
            Active &amp; Learning
          </div>
        </div>
        <div className="card">
          <h3 className="text-xl font-bold mb-2">Tasks by Category</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Security</span>
              <span className="font-bold">4</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Performance</span>
              <span className="font-bold">6</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Bug Fixes</span>
              <span className="font-bold">2</span>
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
        <h3 className="mb-6">Recently Generated Tasks</h3>
        <div className="space-y-4">
          {recentTasks.map((task, i) => (
            <div
              key={i}
              className="p-4 border border-card-border rounded-lg flex items-center justify-between hover:bg-secondary-bg/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{task.title}</p>
                  <p className="text-xs text-text-muted">Reason: {task.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold',
                    task.priority === 'Critical'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-accent/10 text-accent'
                  )}
                >
                  {task.priority}
                </span>
                <button type="button" className="btn-primary py-2 px-4 text-xs">
                  Approve Task
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
