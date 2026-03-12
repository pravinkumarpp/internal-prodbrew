'use client';

import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';

export default function AddClientPage() {
  const router = useRouter();

  return (
    <AppLayout title="Add New Client">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h3 className="text-2xl font-bold mb-6">Client Onboarding</h3>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              router.push('/clients');
            }}
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Website Name</label>
                <input
                  type="text"
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="e.g. My Awesome Store"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Website URL</label>
                <input
                  type="url"
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent">
                  <option>WordPress</option>
                  <option>Shopify</option>
                  <option>Next.js</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hosting Provider</label>
                <input
                  type="text"
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="e.g. AWS, Vercel"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Git Repository URL</label>
                <input
                  type="text"
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                  placeholder="https://github.com/user/repo"
                />
              </div>
            </div>
            <div className="pt-4 flex gap-4">
              <button type="submit" className="flex-1 btn-primary">
                Start Monitoring
              </button>
              <button
                type="button"
                onClick={() => router.push('/clients')}
                className="flex-1 btn-secondary"
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
