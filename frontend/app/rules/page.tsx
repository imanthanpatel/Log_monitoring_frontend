'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Shield, RefreshCw, CircleCheck, CircleX } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { SearchInput } from '@/components/shared/search-input';
import { FilterSelect } from '@/components/shared/filter-select';
import { TableSkeleton } from '@/components/shared/loading-states';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getRules, ApiError } from '@/lib/api';
import type { DetectionRule } from '@/lib/types';

export default function RulesPage() {
  return (
    <RouteGuard>
      <AppLayout>
        <RulesContent />
      </AppLayout>
    </RouteGuard>
  );
}

function RulesContent() {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [enabled, setEnabled] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rules.filter((r) => {
      if (severity !== 'ALL' && String(r.severity).toUpperCase() !== severity) return false;
      const isEnabled = r.enabled ?? r.is_active;
      if (enabled === 'ENABLED' && !isEnabled) return false;
      if (enabled === 'DISABLED' && isEnabled) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.name?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.mitre_technique?.toLowerCase().includes(q) ||
          r.technique_id?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rules, search, severity, enabled]);

  return (
    <div className="space-y-6">
      <PageHeader title="Detection Rules" description="Security detection rules and their MITRE mappings">
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
              placeholder="Search rule name, description, MITRE…"
              className="flex-1"
            />
            <FilterSelect
              value={severity}
              onChange={setSeverity}
              options={[
                { label: 'Critical', value: 'CRITICAL' },
                { label: 'High', value: 'HIGH' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'Low', value: 'LOW' },
              ]}
              placeholder="All Severities"
            />
            <FilterSelect
              value={enabled}
              onChange={setEnabled}
              options={[
                { label: 'Enabled', value: 'ENABLED' },
                { label: 'Disabled', value: 'DISABLED' },
              ]}
              placeholder="All States"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableSkeleton rows={8} cols={5} /></div>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Shield} title="No rules found" description="No detection rules match your current filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>MITRE</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((rule) => {
                    const isEnabled = rule.enabled ?? rule.is_active;
                    const mitre = rule.mitre_technique || rule.technique_id || rule.mitre_tactic || rule.tactic_id;
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono text-xs">#{rule.id}</TableCell>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">{rule.description || '—'}</TableCell>
                        <TableCell>{rule.severity ? <SeverityBadge severity={rule.severity as string} /> : '—'}</TableCell>
                        <TableCell>{mitre ? <Badge variant="outline" className="font-mono text-xs">{mitre}</Badge> : '—'}</TableCell>
                        <TableCell>
                          {isEnabled ? (
                            <span className="flex items-center gap-1 text-xs text-green-400"><CircleCheck className="h-4 w-4" /> Enabled</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground"><CircleX className="h-4 w-4" /> Disabled</span>
                          )}
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
          Showing {filtered.length} of {rules.length} rules
        </p>
      )}
    </div>
  );
}
