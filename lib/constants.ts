import type { Client, Task, TeamMember } from '@/lib/types';

export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'EcoStore Global',
    url: 'https://ecostore.com',
    platform: 'Shopify',
    status: 'Healthy',
    uptime: 99.98,
    sslExpiry: '2026-08-15',
    openTasks: 2,
    lastBackup: '2026-03-10 04:00 AM',
  },
  {
    id: '2',
    name: 'TechBlog Pro',
    url: 'https://techblog.io',
    platform: 'WordPress',
    status: 'Warning',
    uptime: 98.5,
    sslExpiry: '2026-03-20',
    openTasks: 5,
    lastBackup: '2026-03-09 11:00 PM',
  },
  {
    id: '3',
    name: 'SaaS Dashboard',
    url: 'https://app.saas.com',
    platform: 'Next.js',
    status: 'Critical',
    uptime: 94.2,
    sslExpiry: '2026-12-01',
    openTasks: 12,
    lastBackup: '2026-03-10 02:00 AM',
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Update outdated WordPress plugins',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'John Doe',
    createdAt: '2026-03-10',
    type: 'AI Generated',
  },
  {
    id: 't2',
    title: 'Fix SSL certificate renewal',
    priority: 'Critical',
    status: 'Backlog',
    assignedTo: 'Jane Smith',
    createdAt: '2026-03-11',
    type: 'Manual',
  },
];

export const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'Alex Founder', email: 'alex@maintainai.com', role: 'Founder' },
  { id: '2', name: 'Sarah Manager', email: 'sarah@maintainai.com', role: 'Project Manager' },
  { id: '3', name: 'John Dev', email: 'john@maintainai.com', role: 'Developer' },
  { id: '4', name: 'Jane Dev', email: 'jane@maintainai.com', role: 'Developer' },
];
