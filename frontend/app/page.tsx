'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoadingState } from '@/components/shared/loading-states';
import { defaultRoute } from '@/components/layout/route-guard';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else {
      router.replace(defaultRoute(user.role));
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingState message="Starting SentinelSIEM…" />
    </div>
  );
}
