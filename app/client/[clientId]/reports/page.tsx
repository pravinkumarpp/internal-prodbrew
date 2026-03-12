'use client';

import { FileText, Globe } from 'lucide-react';
import { AppLayout } from '@/components/layout';

const sections = [
  'Uptime Stats',
  'Performance Audit',
  'Security Scan',
  'Tasks Completed',
  'Resource Usage',
  'Incident Log',
];

export default function ReportsPage() {
  return (
    <AppLayout title="Monthly Report Generator">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h3 className="text-xl font-bold mb-6">Generate Maintenance Report</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Report Period</label>
              <select className="w-full bg-secondary-bg border border-card-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent">
                <option>February 2026</option>
                <option>January 2026</option>
                <option>December 2025</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Include Sections</label>
              <div className="grid grid-cols-2 gap-4">
                {sections.map((section) => (
                  <label
                    key={section}
                    className="flex items-center gap-3 p-3 bg-secondary-bg rounded-lg cursor-pointer hover:border-accent border border-transparent transition-colors"
                  >
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-accent" />
                    <span className="text-sm">{section}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="pt-4 flex gap-4">
              <button type="button" className="flex-1 btn-primary">
                <FileText size={20} />
                Generate PDF
              </button>
              <button type="button" className="flex-1 btn-secondary">
                <Globe size={20} />
                Preview Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
