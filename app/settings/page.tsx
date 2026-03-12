'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';

type SettingsSection = 'general' | 'monitoring' | 'notifications' | 'integrations';

const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations', label: 'Integrations' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  return (
    <AppLayout title="System Settings">
      <div className="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex overflow-x-auto md:flex-col gap-2 pb-4 md:pb-0 custom-scrollbar">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={cn(
                  'flex-shrink-0 md:w-full text-left px-4 py-2 rounded-lg font-medium transition-colors',
                  activeSection === id
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'text-text-muted hover:bg-secondary-bg hover:text-text-body'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="md:col-span-2 space-y-6">
            {activeSection === 'general' && (
              <>
                <div className="card">
                  <h3 className="text-xl font-bold mb-6">General Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Organization Name</label>
                      <input
                        type="text"
                        className="w-full bg-secondary-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                        defaultValue="MaintainAI Corp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Admin Email</label>
                      <input
                        type="email"
                        className="w-full bg-secondary-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                        defaultValue="admin@maintainai.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Timezone</label>
                      <select className="w-full bg-secondary-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent">
                        <option>UTC (GMT+0)</option>
                        <option>EST (GMT-5)</option>
                        <option>PST (GMT-8)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <button type="button" className="btn-secondary">
                    Discard Changes
                  </button>
                  <button type="button" className="btn-primary">
                    Save Settings
                  </button>
                </div>
              </>
            )}

            {activeSection === 'monitoring' && (
              <div className="card">
                <h3 className="text-xl font-bold mb-6">Monitoring Rules</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary-bg rounded-lg">
                    <div>
                      <p className="font-medium">Uptime Check Interval</p>
                      <p className="text-xs text-text-muted">How often we check if sites are online</p>
                    </div>
                    <select className="bg-white border border-card-border rounded-lg px-3 py-1 text-sm">
                      <option>1 Minute</option>
                      <option>5 Minutes</option>
                      <option>15 Minutes</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary-bg rounded-lg">
                    <div>
                      <p className="font-medium">Auto-Task Generation</p>
                      <p className="text-xs text-text-muted">Allow AI to create tasks from logs</p>
                    </div>
                    <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button type="button" className="btn-secondary">
                    Discard Changes
                  </button>
                  <button type="button" className="btn-primary">
                    Save Settings
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="card">
                <h3 className="text-xl font-bold mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary-bg rounded-lg">
                    <div>
                      <p className="font-medium">Email Alerts</p>
                      <p className="text-xs text-text-muted">Receive email when incidents occur</p>
                    </div>
                    <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary-bg rounded-lg">
                    <div>
                      <p className="font-medium">Slack Alerts</p>
                      <p className="text-xs text-text-muted">Post critical alerts to Slack</p>
                    </div>
                    <div className="w-12 h-6 bg-secondary-bg rounded-full relative cursor-pointer border border-card-border">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button type="button" className="btn-secondary">
                    Discard Changes
                  </button>
                  <button type="button" className="btn-primary">
                    Save Settings
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'integrations' && (
              <div className="card">
                <h3 className="text-xl font-bold mb-6">Integrations</h3>
                <p className="text-text-muted text-sm mb-6">
                  Connect your monitoring tools, ticketing systems, and communication channels.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary-bg rounded-lg">
                    <div>
                      <p className="font-medium">Slack</p>
                      <p className="text-xs text-text-muted">Connect workspace for alerts</p>
                    </div>
                    <button type="button" className="btn-secondary py-2 text-sm">
                      Connect
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary-bg rounded-lg">
                    <div>
                      <p className="font-medium">GitHub</p>
                      <p className="text-xs text-text-muted">Link repos for deployment status</p>
                    </div>
                    <button type="button" className="btn-secondary py-2 text-sm">
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
