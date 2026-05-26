'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout';
import { Check, Loader2 } from 'lucide-react';

type BasecampProject = {
  id: number;
  name: string;
  description: string;
  app_url: string;
};

type ExistingClient = {
  id: string;
  basecamp_project_id: number | null;
};

export default function AddProjectPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<BasecampProject[]>([]);
  const [existingIds, setExistingIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [projectsRes, clientsRes] = await Promise.all([
          fetch('/api/basecamp/projects'),
          fetch('/api/clients', { credentials: 'include' }),
        ]);

        if (!projectsRes.ok) {
          const body = await projectsRes.json().catch(() => ({}));
          setError((body as { error?: string }).error || 'Failed to load Basecamp projects.');
          return;
        }

        const basecampProjects: BasecampProject[] = await projectsRes.json();
        setProjects(basecampProjects);

        if (clientsRes.ok) {
          const clients: ExistingClient[] = await clientsRes.json();
          const ids = new Set<number>();
          for (const c of clients) {
            if (c.basecamp_project_id != null) ids.add(c.basecamp_project_id);
          }
          setExistingIds(ids);
        }
      } catch {
        setError('Failed to fetch projects. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const availableProjects = projects.filter((p) => !existingIds.has(p.id));

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === availableProjects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(availableProjects.map((p) => p.id)));
    }
  }

  async function handleAdd() {
    if (selected.size === 0) {
      toast.error('Please select at least one project.');
      return;
    }

    setSubmitting(true);
    let successCount = 0;

    for (const projectId of selected) {
      const project = projects.find((p) => p.id === projectId);
      if (!project) continue;

      try {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: project.name,
            basecamp_project_id: project.id,
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          const body = await res.json().catch(() => ({}));
          toast.error(`Failed to add "${project.name}": ${(body as { error?: string }).error || 'Unknown error'}`);
        }
      } catch {
        toast.error(`Failed to add "${project.name}".`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} project${successCount > 1 ? 's' : ''} added successfully.`);
      router.push('/projects');
      router.refresh();
    }

    setSubmitting(false);
  }

  return (
    <AppLayout title="Add New Project">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold">Import from Basecamp</h3>
              <p className="text-text-muted text-sm mt-1">
                Select projects from your Basecamp account to add them.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
              <span className="ml-3 text-text-muted">Loading Basecamp projects...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          ) : availableProjects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-text-muted mb-2">No new projects to import.</p>
              <p className="text-sm text-text-muted">
                All Basecamp projects have already been added.
              </p>
              <button
                type="button"
                onClick={() => router.push('/projects')}
                className="mt-4 text-sm text-accent hover:underline"
              >
                Back to Projects
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-card-border">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {selected.size === availableProjects.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-text-muted">
                  {selected.size} of {availableProjects.length} selected
                </span>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {availableProjects.map((project) => {
                  const isSelected = selected.has(project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => toggleSelect(project.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'border-accent bg-accent/5'
                          : 'border-card-border hover:border-accent/50 hover:bg-secondary-bg/50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-accent bg-accent text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-text-muted truncate mt-0.5">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-6 mt-6 border-t border-card-border flex gap-4">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={submitting || selected.size === 0}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting
                    ? 'Adding...'
                    : `Add ${selected.size} Project${selected.size !== 1 ? 's' : ''}`}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/projects')}
                  className="flex-1 btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
