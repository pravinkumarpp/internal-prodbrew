"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Activity,
  ShieldCheck,
  Terminal,
  AlertTriangle,
  Zap,
  Globe,
  Database,
  Cpu,
  BrainCircuit,
  ListTodo,
  History,
  BookOpen,
  Clock,
  FileText,
  Edit3,
  Code2,
  Trello,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import favicon from "../../public/favicon.png";
import { SidebarItem } from "./SidebarItem";

const mainNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'Projects', href: '/projects' },
  { icon: PlusCircle, label: 'Add Project', href: '/add-project' },
];

const getClientNav = (clientId: string) => [
  { icon: Activity, label: 'Uptime', href: `/client/${clientId}/uptime` },
  { icon: Lock, label: 'SSL', href: `/client/${clientId}/ssl` },
  { icon: Terminal, label: 'Server Logs', href: `/client/${clientId}/logs` },
  { icon: AlertTriangle, label: 'Frontend Errors', href: `/client/${clientId}/frontend-errors` },
  { icon: Globe, label: 'API Monitoring', href: `/client/${clientId}/api` },
  { icon: BrainCircuit, label: 'AI Task Engine', href: `/client/${clientId}/ai-tasks` },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  headerAction?: React.ReactNode;
}

function getInitials(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export function AppLayout({ children, title, headerAction }: AppLayoutProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const clientId = params?.clientId as string | undefined;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{ fullName: string | null; email: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const fullName = (user.user_metadata?.full_name as string) || null;
        setProfile({ fullName, email: user.email ?? '' });
      }
    });
  }, []);

  const isClientView = pathname?.includes('/client/');
  const clientNav = clientId ? getClientNav(clientId) : [];
  const displayName = profile?.fullName?.trim() || profile?.email || null;
  const initials = getInitials(profile?.fullName ?? null, profile?.email);

  return (
    <div className="flex min-h-screen bg-background text-text-body">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'bg-white border-r border-card-border transition-all duration-300 flex flex-col fixed lg:sticky top-0 h-screen z-40 lg:z-20',
          collapsed ? 'w-20' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-6 flex items-center justify-between lg:justify-start gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#000b36] flex items-center justify-center shadow-lg shadow-[#000b36]/30">
              <Image
                src={favicon}
                alt="MaintainAI"
                className="h-8 w-8 object-contain"
                priority
              />
            </div>
            {(!collapsed || mobileMenuOpen) && (
              <span className="text-xl font-bold text-text-primary tracking-tight">
                MaintainAI
              </span>
            )}
          </Link>
          <button type="button" className="lg:hidden text-text-muted" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="mb-4">
            {!collapsed && <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Main</p>}
            {mainNav.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={pathname === item.href}
                collapsed={collapsed}
              />
            ))}
          </div>

          {isClientView && clientNav.length > 0 && (
            <div className="mt-6">
              {!collapsed && (
                <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Client Monitoring</p>
              )}
              {clientNav.map((item) => (
                <SidebarItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={pathname === item.href}
                  collapsed={collapsed}
                />
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-card-border">
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push('/login');
              router.refresh();
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-text-muted hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-card-border bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden p-2 text-text-muted hover:bg-secondary-bg rounded-lg"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-semibold text-text-primary truncate">{title}</h1>
            {headerAction}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="bg-background border border-card-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent w-48 md:w-80 lg:w-96"
              />
            </div>
            <div
              className="w-8 h-8 rounded-full bg-[#000b36]/10 border border-[#000b36]/20 flex items-center justify-center text-[#000b36] font-bold text-sm"
              title={displayName ?? undefined}
            >
              {initials}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
