'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  UserPlus,
  XCircle,
  RefreshCw,
  Loader2,
  FileSearch,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-states';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { RoleBadge } from '@/components/shared/role-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ApiError,
  assignAlert,
  getAlert,
  getUsers,
  updateAlertStatus,
} from '@/lib/api';
import { formatDate, getAlertRuleName, getUserName } from '@/lib/format';
import type { Alert, User } from '@/lib/types';

export default function AlertDetailPage() {
  return (
    <RouteGuard>
      <AppLayout>
        <AlertDetailContent />
      </AppLayout>
    </RouteGuard>
  );
}

function AlertDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [investigators, setInvestigators] = useState<User[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [fpOpen, setFpOpen] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlert(id);
      setAlert(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load alert');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getUsers()
      .then((users) => {
        setInvestigators(users.filter((u) => u.role === 'INVESTIGATOR'));
      })
      .catch(() => {});
  }, []);

  async function handleFalsePositive() {
    if (!alert) return;
    setFpLoading(true);
    try {
      await updateAlertStatus(alert.id, 'FALSE_POSITIVE');
      toast.success('Alert marked as false positive');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update alert');
    } finally {
      setFpLoading(false);
      setFpOpen(false);
    }
  }

  async function handleAssign() {
    if (!alert || !selectedInvestigator) return;
    setAssigning(true);
    try {
      await assignAlert(alert.id, parseInt(selectedInvestigator, 10));
      toast.success('Alert assigned to investigator');
      setAssignOpen(false);
      setSelectedInvestigator('');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to assign alert');
    } finally {
      setAssigning(false);
    }
  }

  if (loading) return <LoadingState message="Loading alert…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!alert) return <EmptyState icon={AlertTriangle} title="Alert not found" />;

  const status = String(alert.status).toUpperCase();
  const canAct = status === 'OPEN';
  const extraKeys = Object.keys(alert).filter(
    (k) => !['id', 'severity', 'status', 'rule', 'rule_name', 'source', 'source_ip', 'message', 'description', 'timestamp', 'created_at', 'updated_at', 'assigned_to', 'assigned_investigator', 'investigation', 'mitre_technique', 'mitre_tactic', 'raw_log'].includes(k)
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/alerts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Alerts
        </Link>
      </div>
      <PageHeader title={`Alert #${alert.id}`} description={getAlertRuleName(alert)}>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Alert Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Severity"><SeverityBadge severity={alert.severity as string} /></InfoRow>
              <InfoRow label="Status"><StatusBadge status={alert.status as string} /></InfoRow>
              <InfoRow label="Rule" value={getAlertRuleName(alert)} />
              <InfoRow label="Source" value={alert.source || alert.source_ip || '—'} />
              <InfoRow label="Created" value={formatDate(alert.created_at || alert.timestamp)} />
              <InfoRow label="Updated" value={formatDate(alert.updated_at)} />
              {alert.mitre_technique && <InfoRow label="MITRE Technique" value={alert.mitre_technique} />}
              {alert.mitre_tactic && <InfoRow label="MITRE Tactic" value={alert.mitre_tactic} />}
            </div>
            {(alert.message || alert.description) && (
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Description</p>
                <p className="rounded-md border border-border bg-secondary/30 p-3 text-sm">{alert.message || alert.description}</p>
              </div>
            )}
            {alert.raw_log && (
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Raw Log</p>
                <pre className="max-h-64 overflow-auto scrollbar-thin rounded-md border border-border bg-secondary/30 p-3 text-xs font-mono text-muted-foreground">{alert.raw_log}</pre>
              </div>
            )}
            {extraKeys.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Additional Fields</p>
                <div className="space-y-1">
                  {extraKeys.map((k) => (
                    <div key={k} className="flex justify-between rounded-md border border-border bg-secondary/20 px-3 py-1.5 text-xs">
                      <span className="font-mono text-muted-foreground">{k}</span>
                      <span className="font-mono">{String(alert[k as keyof Alert] ?? '—')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Assigned To" value={getUserName(alert.assigned_to || alert.assigned_investigator)} />
              {alert.investigation && (
                <Link href={`/investigations/${alert.investigation}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <FileSearch className="mr-2 h-4 w-4" />
                    View Investigation
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {canAct && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analyst Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign to Investigator
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => setFpOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark False Positive
                </Button>
                <p className="text-xs text-muted-foreground">
                  If this alert represents a real threat, assign it to an investigator for further analysis. If it is a false positive, mark it accordingly.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={fpOpen}
        onOpenChange={setFpOpen}
        title="Mark as False Positive?"
        description="This will close the alert as a false positive. This action cannot be undone."
        confirmLabel="Mark False Positive"
        destructive
        onConfirm={handleFalsePositive}
      />

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Investigator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Select an investigator to assign this alert to. The alert status will change to ASSIGNED and a new investigation will be created.
            </p>
            {investigators.length === 0 ? (
              <p className="rounded-md border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
                No investigators available. Please contact an administrator.
              </p>
            ) : (
              <Select value={selectedInvestigator} onValueChange={setSelectedInvestigator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an investigator" />
                </SelectTrigger>
                <SelectContent>
                  {investigators.map((inv) => (
                    <SelectItem key={inv.id} value={String(inv.id)}>
                      <div className="flex items-center gap-2">
                        <span>{inv.username}</span>
                        <RoleBadge role={inv.role} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedInvestigator || assigning}>
              {assigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{value ?? children}</div>
    </div>
  );
}
