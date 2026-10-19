'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Activity,
  Shield,
  FileWarning,
  Users,
  ShieldX,
  RefreshCw,
  ArrowRight,
  FileSearch,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { DashboardSkeleton } from '@/components/shared/loading-states';
import { ErrorState } from '@/components/shared/states';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
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
import { getAlerts, getCompletedInvestigations, getDashboard, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Alert, DashboardData, Investigation } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN', 'SOC', 'VIEWER']}>
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </RouteGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [completedInvestigations, setCompletedInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, alertData, investigationData] = await Promise.all([
        getDashboard(),
        getAlerts(),
        user?.role === 'SOC' || user?.role === 'ADMIN'
          ? getCompletedInvestigations()
          : Promise.resolve([]),
      ]);
      setData(dash);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setCompletedInvestigations(
        Array.isArray(investigationData) ? investigationData : []
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <DashboardSkeleton />;
  if (error || !data)
    return <ErrorState message={error || 'No data'} onRetry={load} />;

  const severityData = [
    { label: 'Critical', value: data.critical_alerts, color: 'bg-red-500' },
    { label: 'High', value: data.high_alerts, color: 'bg-orange-500' },
    { label: 'Medium', value: data.medium_alerts, color: 'bg-yellow-500' },
    { label: 'Low', value: data.low_alerts, color: 'bg-blue-500' },
  ];
  const maxSev = Math.max(...severityData.map((s) => s.value), 1);
  const recentAlerts = alerts.slice(0, 8);

  const getInvestigationAlertId = (investigation: Investigation) => {
    if (typeof investigation.alert === 'number') return investigation.alert;
    if (investigation.alert && typeof investigation.alert === 'object') {
      return investigation.alert.id;
    }
    return '—';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="SOC Dashboard" description="Security operations overview and real-time metrics">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Logs" value={data.total_logs} icon={Activity} accent="blue" />
        <StatCard title="Total Alerts" value={data.total_alerts} icon={AlertTriangle} accent="orange" />
        <StatCard title="Active Rules" value={data.active_rules} icon={Shield} accent="green" />
        <StatCard title="Critical Alerts" value={data.critical_alerts} icon={FileWarning} accent="red" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alert Severity Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {severityData.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-16 text-sm text-muted-foreground">{s.label}</span>
                <div className="flex-1">
                  <div className="h-6 w-full overflow-hidden rounded-md bg-muted">
                    <div
                      className={`h-full ${s.color} transition-all duration-500`}
                      style={{ width: `${(s.value / maxSev) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right text-sm font-semibold">{s.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">Total Users</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{data.total_users}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldX className="h-4 w-4" />
                <span className="text-sm">Failed Logins</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-red-400">{data.failed_logins}</p>
            </div>
            <div className="col-span-2 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    All systems operational
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Active Rules</p>
                  <p className="text-lg font-bold text-green-400">{data.active_rules}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Alerts</CardTitle>
          <Link href="/alerts">
            <Button variant="ghost" size="sm">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentAlerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No alerts found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAlerts.map((alert) => (
                    <TableRow key={alert.id} className="cursor-pointer" onClick={() => window.location.href = `/alerts/${alert.id}`}>
                      <TableCell className="font-mono text-xs">#{alert.id}</TableCell>
                      <TableCell className="font-medium">{(alert.rule_name || alert.rule as string || '—')}</TableCell>
                      <TableCell><SeverityBadge severity={alert.severity as string} /></TableCell>
                      <TableCell><StatusBadge status={alert.status as string} /></TableCell>
                      <TableCell className="text-muted-foreground">{alert.source || alert.source_ip || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(alert.timestamp || alert.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Completed Investigation Reports</CardTitle>
          <FileSearch className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {completedInvestigations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No completed investigation reports found
            </p>
          ) : (
            <div className="space-y-3">
              {completedInvestigations.slice(0, 5).map((investigation) => (
                <Link
                  key={investigation.id}
                  href={`/investigations/${investigation.id}`}
                  className="block rounded-md border border-border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      Investigation #{investigation.id} · Alert #{getInvestigationAlertId(investigation)}
                    </p>
                    <StatusBadge status={investigation.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {investigation.conclusion || investigation.summary || 'Report completed'}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Completed {formatDate(investigation.completed_at)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
