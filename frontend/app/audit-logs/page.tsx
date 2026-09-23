'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { FilterSelect } from '@/components/shared/filter-select';
import { TableSkeleton } from '@/components/shared/loading-states';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError, getAuditLogs } from '@/lib/api';
import { formatDate, getUserName } from '@/lib/format';
import type { AuditLog } from '@/lib/types';

const actionColors: Record<string, string> = {
  ALERT_ASSIGNED: 'border-transparent bg-cyan-500/15 text-cyan-400',
  INVESTIGATION_UPDATED: 'border-transparent bg-blue-500/15 text-blue-400',
  EVIDENCE_UPLOADED: 'border-transparent bg-orange-500/15 text-orange-400',
  INVESTIGATION_COMPLETED: 'border-transparent bg-green-500/15 text-green-400',
  ALERT_CLOSED: 'border-transparent bg-muted text-muted-foreground',
  USER_LOGIN: 'border-transparent bg-green-500/15 text-green-400',
  USER_LOGOUT: 'border-transparent bg-muted text-muted-foreground',
};

export default function AuditLogsPage() {
  return (
    <RouteGuard>
      <AppLayout>
        <AuditLogsContent />
      </AppLayout>
    </RouteGuard>
  );
}

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(String(l.action).toUpperCase());
    });
    return Array.from(set).sort().map((v) => ({ label: v.replace(/_/g, ' '), value: v }));
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (action !== 'ALL' && String(l.action).toUpperCase() !== action) return false;
      if (search) {
        const q = search.toLowerCase();
        const user = String(l.username || getUserName(l.user) || '').toLowerCase();
        const act = String(l.action || '').toLowerCase();
        const obj = String(l.object || l.target || '').toLowerCase();
        const det = String(l.details || l.description || '').toLowerCase();
        return user.includes(q) || act.includes(q) || obj.includes(q) || det.includes(q);
      }
      return true;
    });
  }, [logs, search, action]);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Security audit trail of all system actions">
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
              placeholder="Search by user, action, target…"
              className="flex-1"
            />
            <FilterSelect
              value={action}
              onChange={setAction}
              options={actions}
              placeholder="All Actions"
              className="w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableSkeleton rows={10} cols={5} /></div>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={FileText} title="No audit activity found" description="No audit log entries match your current filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="w-44">Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-44">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => {
                    const act = String(log.action || '').toUpperCase();
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">#{log.id}</TableCell>
                        <TableCell>
                          <Badge className={actionColors[act] || 'border-transparent bg-muted text-muted-foreground'}>
                            {act.replace(/_/g, ' ') || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.username || getUserName(log.user) || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.object || log.target || '—'}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{log.details || log.description || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(log.timestamp || log.created_at)}</TableCell>
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
          Showing {filtered.length} of {logs.length} audit entries
        </p>
      )}
    </div>
  );
}
