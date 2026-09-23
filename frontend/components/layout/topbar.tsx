'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarContent } from './sidebar';
import { useAuth } from '@/lib/auth-context';
import { RoleBadge } from '@/components/shared/role-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getNotifications } from '@/lib/api';
import { cn } from '@/lib/utils';

const routeNames: Record<string, string> = {
  dashboard: 'SOC Dashboard',
  alerts: 'Alerts',
  logs: 'Security Logs',
  rules: 'Detection Rules',
  mitre: 'MITRE ATT&CK',
  investigations: 'Investigations',
  investigator: 'Investigator Dashboard',
  notifications: 'Notifications',
  'audit-logs': 'Audit Logs',
  users: 'User Management',
  login: 'Sign In',
};

function buildBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [{ label: 'Home', href: '/' }];
  let path = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    path += '/' + seg;
    const label = routeNames[seg] || seg.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
    crumbs.push({ label, href: i === segments.length - 1 && /^\d+$/.test(seg) ? '#' : path });
  }
  return crumbs;
}

export function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getNotifications()
      .then((notifs) => {
        if (!active) return;
        const unread = notifs.filter(
          (n) => !n.read && !n.is_read
        ).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, pathname]);

  const crumbs = buildBreadcrumbs(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label || 'Dashboard';
  const initials = user?.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="rounded-md p-2 hover:bg-accent lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold">{pageTitle}</h2>
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground/50">/</span>}
                {c.href === '#' || i === crumbs.length - 1 ? (
                  <span className={cn(i === crumbs.length - 1 && 'text-foreground')}>{c.label}</span>
                ) : (
                  <Link href={c.href} className="hover:text-foreground transition-colors">{c.label}</Link>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/notifications" className="relative rounded-md p-2 hover:bg-accent transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none">{user?.username || '—'}</p>
            <div className="mt-1">
              {user?.role && <RoleBadge role={user.role} />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
