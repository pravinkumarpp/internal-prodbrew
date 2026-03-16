'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Filter, ChevronRight, Globe2, ChevronDown, Trash2, X, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';

type ClientRow = {
  id: string;
  name: string;
  url: string;
  platform: string;
  status: string | null;
  logo_url: string | null;
  slug: string | null;
  last_check_at: string | null;
  last_status: string | null;
  uptime_pct_24h: number | null;
  ssl_expiry_date: string | null;
  ssl_last_checked_at: string | null;
  tasks_count?: number;
};

const PLATFORM_OPTIONS = ['All', 'WordPress', 'Shopify', 'Next.js'] as const;
const STATUS_OPTIONS = ['All', 'Healthy', 'Warning', 'Critical'] as const;

export default function ClientsListPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);

  const loadClients = async () => {
    try {
      const res = await fetch('/api/clients', { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((body as { error?: string }).error || 'Failed to load clients.');
        setClients([]);
      } else {
        setClients((body as ClientRow[]) || []);
      }
    } catch {
      toast.error('Failed to load clients.');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  function openDeleteModal(clientId: string, clientName: string) {
    setDeleteModal({ id: clientId, name: clientName });
  }

  function copyFormUrl(slug: string | null) {
    if (!slug?.trim()) {
      toast.error('No form URL for this client.');
      return;
    }
    const formUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}/form`;
    navigator.clipboard.writeText(formUrl).then(
      () => toast.success('Form URL copied to clipboard'),
      () => toast.error('Could not copy'),
    );
  }

  async function confirmDelete() {
    if (!deleteModal) return;
    const { id, name } = deleteModal;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE', credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((body as { error?: string }).error || 'Failed to delete client.');
        return;
      }
      toast.success('Client deleted.');
      setClients((prev) => prev.filter((c) => c.id !== id));
      setDeleteModal(null);
    } catch {
      toast.error('Failed to delete client.');
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (platformFilter !== 'All' && c.platform !== platformFilter) return false;
      const status = c.status || 'Healthy';
      if (statusFilter !== 'All' && status !== statusFilter) return false;
      return true;
    });
  }, [clients, platformFilter, statusFilter]);

  const hasClients = clients.length > 0;

  return (
    <AppLayout title="Clients List">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 bg-secondary-bg rounded-lg border border-card-border min-w-[160px] cursor-pointer hover:border-accent/50 transition-colors">
            <Filter size={18} className="text-text-muted shrink-0 ml-3" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-text-primary py-2.5 pr-8 pl-1 cursor-pointer focus:outline-none appearance-none focus:ring-0 border-0"
              aria-label="Filter by platform"
            >
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'All' ? 'All Platforms' : opt}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="text-text-muted pointer-events-none mr-2 shrink-0" aria-hidden />
          </label>
          <label className="flex items-center bg-secondary-bg rounded-lg border border-card-border min-w-[140px] cursor-pointer hover:border-accent/50 transition-colors">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-text-primary py-2.5 pr-8 pl-3 cursor-pointer focus:outline-none appearance-none focus:ring-0 border-0"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'All' ? 'Status: All' : opt}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="text-text-muted pointer-events-none mr-2 shrink-0" aria-hidden />
          </label>
        </div>
        <button
          type="button"
          onClick={() => router.push('/add-client')}
          className="btn-primary w-full sm:w-auto"
        >
          <PlusCircle size={20} />
          Add New Client
        </button>
      </div>

      {loading ? (
        <p className="text-text-muted">Loading clients…</p>
      ) : !hasClients ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary-bg flex items-center justify-center text-text-muted mb-6">
            <Globe2 size={40} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No clients yet
          </h3>
          <p className="text-text-muted max-w-sm mb-6">
            Add your first client to start monitoring uptime, SSL health, and tasks across their site.
          </p>
          <button
            type="button"
            onClick={() => router.push('/add-client')}
            className="btn-primary"
          >
            <PlusCircle size={20} />
            Add your first client
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="text-text-muted">No clients match the current filters.</p>
          <button
            type="button"
            onClick={() => {
              setPlatformFilter('All');
              setStatusFilter('All');
            }}
            className="mt-4 text-sm text-accent hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-secondary-bg border-b border-card-border">
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Client / URL
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Health
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Uptime
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    SSL Expiry
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-secondary-bg/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/client/${client.id}/uptime`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{client.name}</div>
                      <div className="text-sm text-text-muted">{client.url}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-background border border-card-border text-xs font-medium">
                        {client.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            (client.status || 'Healthy') === 'Healthy'
                              ? 'bg-emerald-500'
                              : client.status === 'Warning'
                                ? 'bg-accent'
                                : 'bg-red-500'
                          )}
                        />
                        <span className="text-sm">{client.status || 'Healthy'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">
                        {client.uptime_pct_24h != null
                          ? `${client.uptime_pct_24h}%`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-muted">
                        {client.ssl_expiry_date
                          ? new Date(client.ssl_expiry_date).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
                        {client.tasks_count ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => copyFormUrl(client.slug ?? null)}
                          disabled={!client.slug}
                          className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                          aria-label={`Copy form URL for ${client.name}`}
                          title="Copy form URL"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(client.id, client.name)}
                          disabled={deletingId === client.id}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                          aria-label={`Delete ${client.name}`}
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                          aria-label={`Open ${client.name}`}
                          onClick={() => router.push(`/client/${client.id}/uptime`)}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card max-w-md w-full relative mx-4">
            <button
              type="button"
              onClick={() => setDeleteModal(null)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold mb-2">Delete client</h3>
            <p className="text-text-muted mb-6">
              Are you sure you want to delete &quot;{deleteModal.name}&quot;? This will remove the
              client and their logo from storage. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId === deleteModal.id}
                className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {deletingId === deleteModal.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
