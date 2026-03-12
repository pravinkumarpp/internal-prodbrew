'use client';

import { PlusCircle, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_TASKS } from '@/lib/constants';
import { AppLayout } from '@/components/layout';

const columns = ['Backlog', 'In Progress', 'Review', 'Completed'];

export default function KanbanPage() {
  return (
    <AppLayout title="Kanban Project Board">
      <div className="flex gap-6 h-[calc(100vh-200px)] overflow-x-auto pb-4 custom-scrollbar">
        {columns.map((col) => (
          <div key={col} className="flex-shrink-0 w-72 md:w-80 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {col}
                <span className="text-xs bg-card-bg px-2 py-0.5 rounded-full border border-card-border">
                  {MOCK_TASKS.filter((t) => t.status === col).length}
                </span>
              </h3>
              <button
                type="button"
                className="text-text-muted hover:text-text-primary"
              >
                <PlusCircle size={18} />
              </button>
            </div>
            <div className="bg-secondary-bg/30 rounded-xl p-3 flex-1 border border-card-border/50 space-y-4 overflow-y-auto">
              {MOCK_TASKS.filter((t) => t.status === col).map((task) => (
                <div
                  key={task.id}
                  className="card p-4 hover:border-accent transition-colors cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                        task.priority === 'Critical'
                          ? 'bg-red-500/20 text-red-500'
                          : task.priority === 'High'
                            ? 'bg-accent/20 text-accent'
                            : 'bg-blue-500/20 text-blue-500'
                      )}
                    >
                      {task.priority}
                    </span>
                    <MoreVertical size={14} className="text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-4">{task.title}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                        {task.assignedTo
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span className="text-xs text-text-muted">{task.assignedTo}</span>
                    </div>
                    <span className="text-[10px] text-text-muted">{task.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
