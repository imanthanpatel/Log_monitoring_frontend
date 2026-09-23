'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { defaultRoute } from '@/components/layout/route-guard';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(defaultRoute(user.role));
    }
  }, [user, loading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setSubmitting(true);
    try {
      await login(username, password);
      toast.success('Signed in successfully');
      // The auth context will trigger the redirect via useEffect
      router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background grid-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SentinelSIEM</h1>
          <p className="mt-1 text-sm text-muted-foreground">Security Operations Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-xl">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="pl-9"
                autoComplete="username"
                disabled={submitting}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pl-9"
                autoComplete="current-password"
                disabled={submitting}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !username || !password}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Authorized personnel only. All activity is monitored and logged.
        </p>
      </div>
    </div>
  );
}
