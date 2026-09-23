'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { FileSearch, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { SearchInput } from '@/components/shared/search-input';
import { FilterSelect } from '@/components/shared/filter-select';
import { TableSkeleton } from '@/components/shared/loading-states';
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
import { getMyInvestigations, ApiError } from '@/lib/api';
import { formatDate, getUserId } from '@/lib/format';
import type { Alert, Investigation } from '@/lib/types';

const statusOptions = [
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function InvestigationsPage() {
  return (
    <RouteGuard>
      <AppLayout>
        <InvestigationsContent />
      </AppLayout>
    </RouteGuard>
  );
}

function InvestigationsContent() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

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

  const filtered = useMemo(() => {
    return investigations.filter((inv) => {
      if (status !== 'ALL' && String(inv.status).toUpperCase() !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        const id = String(inv.id);
        const alertId = String(inv.alert_id ?? (typeof inv.alert === 'object' ? (inv.alert as Alert)?.id : inv.alert) ?? '');
        return id.includes(q) || alertId.includes(q);
      }
      return true;
    });
  }, [investigations, search, status]);

  function getAlertId(inv: Investigation): string {
    if (inv.alert_id) return String(inv.alert_id);
    if (typeof inv.alert === 'number') return String(inv.alert);
    if (typeof inv.alert === 'object' && inv.alert) return String((inv.alert as Alert).id);
    return '—';
  }

  function getAlertSeverity(inv: Investigation): string | null {
    if (typeof inv.alert === 'object' && inv.alert) {
      return (inv.alert as Alert).severity as string;
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Investigations" description="Investigations assigned to you">
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
              placeholder="Search by investigation or alert ID…"
              className="flex-1"
            />
            <FilterSelect value={status} onChange={setStatus} options={statusOptions} placeholder="All Statuses" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableSkeleton rows={6} cols={6} /></div>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={FileSearch} title="No investigations found" description="No investigations have been assigned to you yet." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => {
                    const sev = getAlertSeverity(inv);
                    return (
                      <TableRow key={inv.id} className="cursor-pointer" onClick={() => window.location.href = `/investigations/${inv.id}`}>
                        <TableCell className="font-mono text-xs">#{inv.id}</TableCell>
                        <TableCell className="font-mono text-xs">#{getAlertId(inv)}</TableCell>
                        <TableCell>{sev ? <SeverityBadge severity={sev} /> : '—'}</TableCell>
                        <TableCell><StatusBadge status={inv.status as string} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(inv.created_at)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(inv.completed_at)}</TableCell>
                        <TableCell>
                          <Link href={`/investigations/${inv.id}`} onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">Open</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {!loading && !error && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {filtered.length} of {investigations.length} investigations
        </p>
      )}
    </div>
  );
}
