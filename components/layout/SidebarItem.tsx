'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  active: boolean;
  collapsed: boolean;
}

export function SidebarItem({ icon: Icon, label, href, active, collapsed }: SidebarItemProps) {
  const itemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (active && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [active]);

  return (
    <Link
      ref={itemRef}
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
        active ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-text-muted hover:bg-secondary-bg hover:text-text-body'
      )}
    >
      <Icon size={20} className={cn(active ? 'text-white' : 'text-text-muted group-hover:text-text-body')} />
      {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
  );
}
