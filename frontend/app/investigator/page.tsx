'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FileSearch,
  ClipboardList,
  Clock,
  CheckCircle2,
  Paperclip,
  Percent,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { DashboardSkeleton } from '@/components/shared/loading-states';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getMyInvestigations, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Alert, Investigation } from '@/lib/types';

export default function InvestigatorDashboardPage() {
  return (
    <RouteGuard allowedRoles={['INVESTIGATOR']}>
      <AppLayout>
        <InvestigatorDashboardContent />
      </AppLayout>
    </RouteGuard>
  );
}

function InvestigatorDashboardContent() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyInvestigations();
      setInvestigations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load investigations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = investigations.length;
    const assigned = investigations.filter((i) => String(i.status).toUpperCase() === 'ASSIGNED').length;
    const inProgress = investigations.filter((i) => String(i.status).toUpperCase() === 'IN_PROGRESS').length;
    const completed = investigations.filter(
      (i) => String(i.status).toUpperCase() === 'COMPLETED' || String(i.status).toUpperCase() === 'CLOSED'
    ).length;
    const evidenceCount = investigations.reduce((sum, inv) => {
      const ev = inv.evidence;
      if (Array.isArray(ev)) return sum + ev.length;
      if (typeof inv.evidence_count === 'number') return sum + inv.evidence_count;
      return sum;
    }, 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, assigned, inProgress, completed, evidenceCount, completionRate };
  }, [investigations]);

  const recent = useMemo(() => investigations.slice(0, 5), [investigations]);
  const completedList = useMemo(
    () => investigations.filter((i) => String(i.status).toUpperCase() === 'COMPLETED' || String(i.status).toUpperCase() === 'CLOSED').slice(0, 5),
    [investigations]
  );

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Investigator Dashboard" description="Your investigation workload and progress">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="My Investigations" value={stats.total} icon={FileSearch} accent="blue" />
        <StatCard title="Assigned" value={stats.assigned} icon={ClipboardList} accent="cyan" />
        <StatCard title="In Progress" value={stats.inProgress} icon={Clock} accent="orange" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} accent="green" />
        <StatCard title="Evidence Collected" value={stats.evidenceCount} icon={Paperclip} accent="blue" />
        <StatCard title="Completion Rate" value={`${stats.completionRate}%`} icon={Percent} accent="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recently Assigned</CardTitle>
            <Link href="/investigations">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState icon={FileSearch} title="No investigations assigned" description="You have no investigations assigned to you yet." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Alert</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((inv) => (
                      <TableRow key={inv.id} className="cursor-pointer" onClick={() => window.location.href = `/investigations/${inv.id}`}>
                        <TableCell className="font-mono text-xs">#{inv.id}</TableCell>
                        <TableCell className="font-mono text-xs">#{typeof inv.alert === 'number' ? inv.alert : (inv.alert as Alert)?.id ?? '—'}</TableCell>
                        <TableCell><StatusBadge status={inv.status as string} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(inv.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently Completed</CardTitle>
          </CardHeader>
          <CardContent>
            {completedList.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No completed investigations" description="Your completed investigations will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Alert</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedList.map((inv) => (
                      <TableRow key={inv.id} className="cursor-pointer" onClick={() => window.location.href = `/investigations/${inv.id}`}>
                        <TableCell className="font-mono text-xs">#{inv.id}</TableCell>
                        <TableCell className="font-mono text-xs">#{typeof inv.alert === 'number' ? inv.alert : (inv.alert as Alert)?.id ?? '—'}</TableCell>
                        <TableCell><StatusBadge status={inv.status as string} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(inv.completed_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
