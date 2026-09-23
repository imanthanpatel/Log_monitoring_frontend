'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ScrollText, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
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
import { getLogs, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { SecurityLog } from '@/lib/types';

export default function LogsPage() {
  return (
    <RouteGuard>
      <AppLayout>
        <LogsContent />
      </AppLayout>
    </RouteGuard>
  );
}

function LogsContent() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('ALL');
  const [source, setSource] = useState('ALL');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const levels = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      const v = l.level || l.severity;
      if (v) set.add(String(v).toUpperCase());
    });
    return Array.from(set).sort().map((v) => ({ label: v, value: v }));
  }, [logs]);

  const sources = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.source) set.add(l.source);
      if (l.source_ip) set.add(l.source_ip);
    });
    return Array.from(set).sort().map((v) => ({ label: v, value: v }));
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const lv = (l.level || l.severity || '').toUpperCase();
      const src = l.source || l.source_ip || '';
      if (level !== 'ALL' && lv !== level) return false;
      if (source !== 'ALL' && src !== source) return false;
      if (search) {
        const q = search.toLowerCase();
        const msg = String(l.message || l.event_type || '').toLowerCase();
        const raw = String(l.raw_data || '').toLowerCase();
        return msg.includes(q) || raw.includes(q) || src.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, search, level, source]);

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Security Logs" description="Monitor security events and raw log data">
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
              placeholder="Search message, source, raw data…"
              className="flex-1"
            />
            <FilterSelect value={level} onChange={setLevel} options={levels} placeholder="All Levels" />
            <FilterSelect value={source} onChange={setSource} options={sources} placeholder="All Sources" />
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
            <EmptyState icon={ScrollText} title="No logs found" description="No log entries match your current filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="w-24">Level</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-44">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => {
                    const isOpen = expanded.has(log.id);
                    const lv = String(log.level || log.severity || '').toUpperCase();
                    const lvColor =
                      lv === 'CRITICAL' || lv === 'ERROR' ? 'text-red-400' :
                      lv === 'HIGH' || lv === 'WARNING' ? 'text-orange-400' :
                      lv === 'MEDIUM' || lv === 'INFO' ? 'text-blue-400' :
                      'text-muted-foreground';
                    return (
                      <>
                        <TableRow key={log.id} className="cursor-pointer" onClick={() => toggle(log.id)}>
                          <TableCell className="w-8 p-2">
                            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </TableCell>
                          <TableCell className="font-mono text-xs">#{log.id}</TableCell>
                          <TableCell className={`font-medium ${lvColor}`}>{lv || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{log.source || log.source_ip || '—'}</TableCell>
                          <TableCell className="max-w-md truncate">{log.message || log.event_type || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(log.timestamp || log.created_at)}</TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow key={`${log.id}-detail`} className="hover:bg-transparent">
                            <TableCell colSpan={6} className="bg-secondary/20 p-4">
                              <pre className="max-h-64 overflow-auto scrollbar-thin rounded-md border border-border bg-background p-3 text-xs font-mono text-muted-foreground">
                                {log.raw_data || JSON.stringify(log, null, 2)}
                              </pre>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
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
          Showing {filtered.length} of {logs.length} log entries
        </p>
      )}
    </div>
  );
}
