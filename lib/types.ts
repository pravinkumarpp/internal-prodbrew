export type Platform = 'WordPress' | 'Shopify' | 'Next.js';

export interface Client {
  id: string;
  name: string;
  url: string;
  platform: Platform;
  status: 'Healthy' | 'Warning' | 'Critical';
  uptime: number;
  sslExpiry: string;
  openTasks: number;
  lastBackup: string;
}

export interface Task {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Backlog' | 'In Progress' | 'Review' | 'Completed';
  assignedTo?: string;
  createdAt: string;
  type: 'AI Generated' | 'Manual';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Founder' | 'Project Manager' | 'Developer';
  avatar?: string;
}
