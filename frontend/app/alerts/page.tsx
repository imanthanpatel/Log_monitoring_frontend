'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { SearchInput } from '@/components/shared/search-input';
import { FilterSelect } from '@/components/shared/filter-select';
import { LoadingState, TableSkeleton } from '@/components/shared/loading-states';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAlerts, ApiError } from '@/lib/api';
import { formatDate, getAlertRuleName } from '@/lib/format';
import type { Alert } from '@/lib/types';

const severityOptions = [
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];
const statusOptions = [
  { label: 'Open', value: 'OPEN' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'False Positive', value: 'FALSE_POSITIVE' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function AlertsPage() {
  return (
    <RouteGuard>
      <AppLayout>
        <AlertsContent />
      </AppLayout>
    </RouteGuard>
  );
}

function AlertsContent() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (severity !== 'ALL' && String(a.severity).toUpperCase() !== severity) return false;
      if (status !== 'ALL' && String(a.status).toUpperCase() !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        const rule = getAlertRuleName(a).toLowerCase();
        const src = String(a.source || a.source_ip || '').toLowerCase();
        const id = String(a.id);
        const msg = String(a.message || a.description || '').toLowerCase();
        return rule.includes(q) || src.includes(q) || id.includes(q) || msg.includes(q);
      }
      return true;
    });
  }, [alerts, search, severity, status]);

  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" description="Security alerts detected by your detection rules">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by rule, source, ID, message…"
              className="flex-1"
            />
            <FilterSelect
              value={severity}
              onChange={setSeverity}
              options={severityOptions}
              placeholder="All Severities"
            />
            <FilterSelect
              value={status}
              onChange={setStatus}
              options={statusOptions}
              placeholder="All Statuses"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableSkeleton rows={8} cols={6} /></div>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No alerts found"
              description="No alerts match your current filters. Try adjusting your search or filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((alert) => (
                    <TableRow key={alert.id} className="cursor-pointer" onClick={() => window.location.href = `/alerts/${alert.id}`}>
                      <TableCell className="font-mono text-xs">#{alert.id}</TableCell>
                      <TableCell className="font-medium">{getAlertRuleName(alert)}</TableCell>
                      <TableCell><SeverityBadge severity={alert.severity as string} /></TableCell>
                      <TableCell><StatusBadge status={alert.status as string} /></TableCell>
                      <TableCell className="text-muted-foreground">{alert.source || alert.source_ip || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(alert.timestamp || alert.created_at)}</TableCell>
                      <TableCell>
                        <Link href={`/alerts/${alert.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {!loading && !error && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {filtered.length} of {alerts.length} alerts
        </p>
      )}
    </div>
  );
}
