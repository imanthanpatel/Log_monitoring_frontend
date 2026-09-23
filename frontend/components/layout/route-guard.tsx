'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/types';
import { LoadingState } from '@/components/shared/loading-states';

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(defaultRoute(user.role));
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) return <LoadingState message="Loading…" />;
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;
  return <>{children}</>;
}

export function defaultRoute(role: Role): string {
  switch (role) {
    case 'INVESTIGATOR':
      return '/investigator';
    default:
      return '/dashboard';
  }
}
