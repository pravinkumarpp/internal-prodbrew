'use client';

import { useState } from 'react';
import { PlusCircle, Edit3, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_TEAM } from '@/lib/constants';
import { AppLayout } from '@/components/layout';

export default function TeamManagementPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <AppLayout title="Team Management">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Our Team</h2>
          <p className="text-text-muted">Manage roles and permissions for your organization</p>
        </div>
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          onClick={() => setInviteOpen(true)}
        >
          <PlusCircle size={20} />
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_TEAM.map((member) => (
          <div key={member.id} className="card flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-secondary-bg flex items-center justify-center text-accent font-bold text-2xl mb-4 border-4 border-white shadow-md">
              {member.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <h3 className="text-lg font-bold text-text-primary">{member.name}</h3>
            <p className="text-sm text-text-muted mb-4">{member.email}</p>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold',
                member.role === 'Founder'
                  ? 'bg-purple-100 text-purple-600'
                  : member.role === 'Project Manager'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-emerald-100 text-emerald-600'
              )}
            >
              {member.role}
            </span>
            <div className="mt-6 pt-6 border-t border-card-border w-full flex justify-around">
              <button type="button" className="text-text-muted hover:text-accent transition-colors">
                <Edit3 size={18} />
              </button>
              <button type="button" className="text-text-muted hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card max-w-md w-full relative">
            <button
              type="button"
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
              onClick={() => setInviteOpen(false)}
              aria-label="Close invite modal"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold mb-2">Invite Team Member</h3>
            <p className="text-sm text-text-muted mb-6">
              Send an invitation email to add a new collaborator to your workspace.
            </p>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                // In a real app you would call your API here.
                setInviteOpen(false);
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="Alex Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="alex@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  defaultValue="Developer"
                >
                  <option>Founder</option>
                  <option>Project Manager</option>
                  <option>Developer</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
