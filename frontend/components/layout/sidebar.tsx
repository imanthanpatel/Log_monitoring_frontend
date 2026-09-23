'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  FileText,
  FileSearch,
  LayoutDashboard,
  ListTree,
  LogOut,
  ScrollText,
  Shield,
  ShieldCheck,
  Users,
  UserSearch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/types';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'SOC Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SOC', 'VIEWER'] },
  { label: 'Investigator Dashboard', href: '/investigator', icon: UserSearch, roles: ['INVESTIGATOR'] },
  { label: 'Alerts', href: '/alerts', icon: AlertTriangle, roles: ['ADMIN', 'SOC', 'VIEWER'] },
  { label: 'Logs', href: '/logs', icon: ScrollText, roles: ['ADMIN', 'SOC', 'VIEWER'] },
  { label: 'Detection Rules', href: '/rules', icon: Shield, roles: ['ADMIN', 'SOC', 'VIEWER'] },
  { label: 'MITRE ATT&CK', href: '/mitre', icon: ListTree, roles: ['ADMIN', 'SOC', 'VIEWER'] },
  { label: 'Investigations', href: '/investigations', icon: FileSearch, roles: ['ADMIN', 'SOC', 'INVESTIGATOR', 'VIEWER'] },
  { label: 'Notifications', href: '/notifications', icon: Bell, roles: ['ADMIN', 'SOC', 'INVESTIGATOR', 'VIEWER'] },
  { label: 'Audit Logs', href: '/audit-logs', icon: FileText, roles: ['ADMIN', 'SOC', 'VIEWER'] },
  { label: 'Users', href: '/users', icon: Users, roles: ['ADMIN'] },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  if (!user) return null;

  const items = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-bold tracking-tight">SentinelSIEM</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="border-t border-border p-3">
        <button
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export { navItems };
