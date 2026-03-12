'use client';

import { Code2 } from 'lucide-react';
import { AppLayout } from '@/components/layout';

export default function AIProgrammingPage() {
  return (
    <AppLayout title="AI Programming Assistant">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[calc(100vh-200px)]">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card flex-1 flex flex-col p-0 overflow-hidden font-mono text-sm">
            <div className="bg-secondary-bg px-6 py-3 border-b border-card-border flex justify-between items-center">
              <span className="text-xs font-bold text-text-muted">src/api/checkout.ts</span>
              <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded">
                Error Detected
              </span>
            </div>
            <div className="flex-1 bg-[#011627] p-6 overflow-auto text-emerald-400">
              <pre>
                {`export async function POST(req: Request) {
  const body = await req.json();
  
  // Potential issue: No validation for body.items
  const total = body.items.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  return Response.json({ total });
}`}
              </pre>
            </div>
          </div>
          <div className="flex gap-4">
            <button type="button" className="btn-primary flex-1">
              Apply AI Fix
            </button>
            <button type="button" className="btn-secondary flex-1">
              Run Tests
            </button>
          </div>
        </div>
        <div className="card flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Code2 className="text-accent" size={24} />
            <h3 className="text-lg font-bold">AI Diagnosis</h3>
          </div>
          <div className="flex-1 space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs font-bold text-red-500 mb-1 uppercase">Critical Issue</p>
              <p className="text-sm text-text-body">
                The reduce function will throw an error if &quot;body.items&quot; is undefined or
                not an array.
              </p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-xs font-bold text-emerald-500 mb-1 uppercase">AI Recommendation</p>
              <p className="text-sm text-text-body">
                Add a guard clause to validate the request body before processing.
              </p>
            </div>
            <div className="pt-4">
              <p className="text-xs font-bold text-text-muted mb-3 uppercase">Suggested Fix</p>
              <div className="bg-secondary-bg p-3 rounded font-mono text-[10px] text-text-body">
                {
                  "if (!Array.isArray(body.items)) return Response.json({ error: 'Invalid items' }, { status: 400 });"
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
