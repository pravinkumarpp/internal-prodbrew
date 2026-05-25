'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';

const LOGO_BUCKET = 'ai-maintenance-client-logos';

export default function AddClientPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<'WordPress' | 'Shopify' | 'Next.js'>('WordPress');
  const [hostingProvider, setHostingProvider] = useState('');
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      toast.error('Website name and URL are required.');
      return;
    }
    setSubmitting(true);
    try {
      let finalLogoUrl = logoUrl.trim() || null;
      if (logoFile) {
        const supabase = createClient();
        const path = `logos/${Date.now()}-${logoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from(LOGO_BUCKET)
          .upload(path, logoFile, { upsert: false });
        if (uploadError) {
          toast.error(uploadError.message || 'Logo upload failed.');
          setSubmitting(false);
          return;
        }
        const { data: urlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
        finalLogoUrl = urlData.publicUrl;
      }
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          platform,
          hosting_provider: hostingProvider.trim() || null,
          git_repo_url: gitRepoUrl.trim() || null,
          logo_url: finalLogoUrl,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; slug?: string };
      if (!res.ok) {
        toast.error(data.error || 'Failed to add client.');
        setSubmitting(false);
        return;
      }
      const formUrl = data.slug
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${data.slug}/form`
        : '';
      toast.success(formUrl ? `Client added. Form URL: ${formUrl}` : 'Client added successfully.');
      router.push('/clients');
      router.refresh();
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout title="Add New Project">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h3 className="text-2xl font-bold mb-6">Project Onboarding</h3>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Website Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="e.g. My Awesome Store"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Website URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="https://example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as 'WordPress' | 'Shopify' | 'Next.js')}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                >
                  <option>WordPress</option>
                  <option>Shopify</option>
                  <option>Next.js</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hosting Provider</label>
                <input
                  type="text"
                  value={hostingProvider}
                  onChange={(e) => setHostingProvider(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="e.g. AWS, Vercel"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Logo (image file)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white file:text-sm file:font-medium"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
                {logoFile && (
                  <p className="text-sm text-text-muted mt-1">{logoFile.name}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Logo URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-text-muted mt-1">Used only if no file is selected above.</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Git Repository URL</label>
                <input
                  type="text"
                  value={gitRepoUrl}
                  onChange={(e) => setGitRepoUrl(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="https://github.com/user/repo"
                />
              </div>
            </div>
            <div className="pt-4 flex gap-4">
              <button
                type="submit"
                className="flex-1 btn-primary disabled:opacity-50 disabled:pointer-events-none"
                disabled={submitting}
              >
                {submitting ? 'Adding…' : 'Start Monitoring'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/clients')}
                className="flex-1 btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
