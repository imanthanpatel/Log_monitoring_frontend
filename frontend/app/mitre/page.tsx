'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ListTree, RefreshCw, Target, Layers, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { TableSkeleton } from '@/components/shared/loading-states';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { SearchInput } from '@/components/shared/search-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  getMitre,
  getMitreCoverage,
  getMitreStats,
  ApiError,
} from '@/lib/api';
import type { MitreCoverage, MitreStats, MitreTechnique } from '@/lib/types';

export default function MitrePage() {
  return (
    <RouteGuard>
      <AppLayout>
        <MitreContent />
      </AppLayout>
    </RouteGuard>
  );
}

function MitreContent() {
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [coverage, setCoverage] = useState<MitreCoverage | null>(null);
  const [stats, setStats] = useState<MitreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tech, cov, st] = await Promise.all([
        getMitre(),
        getMitreCoverage(),
        getMitreStats(),
      ]);
      setTechniques(Array.isArray(tech) ? tech : []);
      setCoverage(cov);
      setStats(st);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load MITRE data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search) return techniques;
    const q = search.toLowerCase();
    return techniques.filter((t) =>
      t.technique_id?.toLowerCase().includes(q) ||
      t.name?.toLowerCase().includes(q) ||
      t.tactic?.toLowerCase().includes(q) ||
      t.tactic_name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  }, [techniques, search]);

  const coveragePct = coverage?.coverage_percent ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="MITRE ATT&CK" description="Adversarial tactics, techniques, and procedures coverage">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Coverage" value={`${coveragePct.toFixed(1)}%`} icon={Target} accent="green" />
            <StatCard title="Mapped Rules" value={coverage?.mapped_rules ?? 0} icon={CheckCircle2} accent="cyan" subtitle={`of ${coverage?.total_rules ?? 0} total`} />
            <StatCard title="Techniques" value={stats?.total_techniques ?? 0} icon={ListTree} accent="blue" />
            <StatCard title="Tactics" value={stats?.total_tactics ?? 0} icon={Layers} accent="orange" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detection Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {coverage?.mapped_rules ?? 0} of {coverage?.total_rules ?? 0} rules mapped to MITRE techniques
                </span>
                <span className="font-semibold">{coveragePct.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${coveragePct}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Techniques</CardTitle>
              <SearchInput value={search} onChange={setSearch} placeholder="Search techniques…" className="w-64" />
            </CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <EmptyState icon={ListTree} title="No techniques found" description="No MITRE techniques match your search." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-32">Technique ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Tactic</TableHead>
                        <TableHead className="w-24">Rules</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((t, i) => (
                        <TableRow key={t.id || i}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {t.technique_id || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{t.name || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {t.tactic || t.tactic_name || t.tactic_id || '—'}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {t.rules_count ?? t.mapped_rules ?? 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
