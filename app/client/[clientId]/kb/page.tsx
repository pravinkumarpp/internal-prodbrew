'use client';

import { Search, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout';

const articles = [
  {
    title: 'Fixing Redis Connection Refused on Ubuntu 22.04',
    category: 'Infrastructure',
    tags: ['Redis', 'Server'],
  },
  {
    title: 'Resolving Shopify Webhook HMAC Validation Failures',
    category: 'API',
    tags: ['Shopify', 'Security'],
  },
  {
    title: 'Next.js Image Optimization Memory Leak Fix',
    category: 'Development',
    tags: ['Next.js', 'Performance'],
  },
  {
    title: 'WordPress "White Screen of Death" after Plugin Update',
    category: 'WordPress',
    tags: ['PHP', 'Debug'],
  },
];

export default function KnowledgeBasePage() {
  return (
    <AppLayout title="AI Knowledge Base">
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input
            type="text"
            placeholder="Search for solutions or previous fixes..."
            className="w-full bg-secondary-bg border border-card-border rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {articles.map((article, i) => (
          <div
            key={i}
            className="card hover:border-accent transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider mb-2 block">
                  {article.category}
                </span>
                <h4 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
                  {article.title}
                </h4>
                <div className="flex gap-2 mt-3">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-background border border-card-border text-[10px] text-text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight className="text-text-muted" />
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
