'use client';

import { BrainCircuit, Edit3, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout';

export default function AIContentPage() {
  return (
    <AppLayout title="AI Content Editor">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[calc(100vh-200px)]">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card flex-1 flex flex-col p-0 overflow-hidden">
            <div className="bg-secondary-bg px-6 py-3 border-b border-card-border flex justify-between items-center">
              <span className="text-sm font-bold">Editor: Homepage Hero Section</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="p-1.5 hover:bg-card-bg rounded text-text-muted"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-card-bg rounded text-text-muted"
                >
                  <Search size={16} />
                </button>
              </div>
            </div>
            <textarea
              className="flex-1 bg-transparent p-8 focus:outline-none resize-none text-lg leading-relaxed"
              defaultValue="Welcome to our premium store. We provide the best sustainable products for your daily life. Shop our new collection today and get 20% off your first order."
            />
          </div>
          <div className="flex gap-4">
            <button type="button" className="btn-primary flex-1">
              Save Changes
            </button>
            <button type="button" className="btn-secondary flex-1">
              Publish to Site
            </button>
          </div>
        </div>
        <div className="card flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BrainCircuit className="text-accent" size={24} />
            <h3 className="text-lg font-bold">AI Assistant</h3>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            <div className="p-3 bg-secondary-bg rounded-lg text-sm italic text-text-muted">
              &quot;I&apos;ve analyzed your content. Would you like me to improve the SEO or make the
              tone more professional?&quot;
            </div>
            <button
              type="button"
              className="w-full btn-secondary py-2 text-xs text-left justify-start"
            >
              ✨ Improve SEO keywords
            </button>
            <button
              type="button"
              className="w-full btn-secondary py-2 text-xs text-left justify-start"
            >
              ✍️ Make tone more professional
            </button>
            <button
              type="button"
              className="w-full btn-secondary py-2 text-xs text-left justify-start"
            >
              📏 Shorten for mobile view
            </button>
            <button
              type="button"
              className="w-full btn-secondary py-2 text-xs text-left justify-start"
            >
              🔍 Fix grammar &amp; spelling
            </button>
          </div>
          <div className="mt-6 pt-6 border-t border-card-border">
            <input
              type="text"
              placeholder="Ask AI to edit..."
              className="w-full bg-secondary-bg border border-card-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
