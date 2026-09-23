'use client';

import { useEffect, useState, useCallback, type ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileSearch,
  ArrowLeft,
  RefreshCw,
  Save,
  CheckCircle2,
  Upload,
  Loader2,
  FileText,
  Download,
  Paperclip,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { LoadingState } from '@/components/shared/loading-states';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ApiError,
  completeInvestigation,
  getAlert,
  getEvidence,
  getInvestigation,
  updateInvestigation,
  uploadEvidence,
} from '@/lib/api';
import { formatDate, getAlertRuleName, getUserName } from '@/lib/format';
import type { Alert, Evidence, Investigation } from '@/lib/types';

export default function InvestigationWorkspacePage() {
  return (
    <RouteGuard>
      <AppLayout>
        <InvestigationWorkspaceContent />
      </AppLayout>
    </RouteGuard>
  );
}

function InvestigationWorkspaceContent() {
  const params = useParams();
  const id = params.id as string;

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const [summary, setSummary] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [conclusion, setConclusion] = useState('');

  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const inv = await getInvestigation(id);
      setInvestigation(inv);
      setSummary(inv.summary || '');
      setRootCause(inv.root_cause || '');
      setRecommendations(inv.recommendations || '');
      setConclusion(inv.conclusion || '');

      const alertId = typeof inv.alert === 'number' ? inv.alert : (inv.alert as Alert)?.id;
      if (alertId) {
        try {
          const a = await getAlert(alertId);
          setAlert(a);
        } catch {
          setAlert(null);
        }
      }

      try {
        const ev = await getEvidence(id);
        setEvidence(Array.isArray(ev) ? ev : []);
      } catch {
        setEvidence([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load investigation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isCompleted =
    String(investigation?.status).toUpperCase() === 'COMPLETED' ||
    String(investigation?.status).toUpperCase() === 'CLOSED';

  const canEdit = !isCompleted;

  async function handleSave() {
    if (!investigation) return;
    setSaving(true);
    try {
      const updated = await updateInvestigation(investigation.id, {
        status: investigation.status as string,
        summary,
        root_cause: rootCause,
        recommendations,
        conclusion,
      });
      setInvestigation(updated);
      toast.success('Investigation report saved');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save report');
    } finally {
      setSaving(false);
    }
  }

  function validateReport(): string | null {
    if (!summary.trim()) return 'Summary is required';
    if (!rootCause.trim()) return 'Root cause is required';
    if (!recommendations.trim()) return 'Recommendations are required';
    if (!conclusion.trim()) return 'Conclusion is required';
    return null;
  }

  async function handleComplete() {
    const err = validateReport();
    if (err) {
      toast.error(err);
      setCompleteOpen(false);
      return;
    }
    if (!investigation) return;
    setCompleting(true);
    try {
      await updateInvestigation(investigation.id, {
        status: investigation.status as string,
        summary,
        root_cause: rootCause,
        recommendations,
        conclusion,
      });
      const completed = await completeInvestigation(investigation.id);
      setInvestigation(completed);
      toast.success('Investigation completed. The associated alert has been closed.');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to complete investigation');
    } finally {
      setCompleting(false);
      setCompleteOpen(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0]);
    }
  }

  async function handleUpload() {
    if (!investigation || !evidenceFile) return;
    setUploading(true);
    try {
      await uploadEvidence(investigation.id, evidenceFile, evidenceDesc);
      toast.success('Evidence uploaded');
      setEvidenceFile(null);
      setEvidenceDesc('');
      const ev = await getEvidence(id);
      setEvidence(Array.isArray(ev) ? ev : []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <LoadingState message="Loading investigation…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!investigation) return <EmptyState icon={FileSearch} title="Investigation not found" />;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/investigations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Investigations
        </Link>
      </div>

      <PageHeader title={`Investigation #${investigation.id}`} description={`Associated Alert #${typeof investigation.alert === 'number' ? investigation.alert : (investigation.alert as Alert)?.id}`}>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Status"><StatusBadge status={investigation.status as string} /></InfoCard>
        <InfoCard label="Alert Severity">
          {alert?.severity ? <SeverityBadge severity={alert.severity as string} /> : '—'}
        </InfoCard>
        <InfoCard label="Created" value={formatDate(investigation.created_at)} />
        <InfoCard label="Updated" value={formatDate(investigation.updated_at)} />
      </div>

      <Tabs defaultValue="report" className="w-full">
        <TabsList>
          <TabsTrigger value="report">Investigation Report</TabsTrigger>
          <TabsTrigger value="alert">Associated Alert</TabsTrigger>
          <TabsTrigger value="evidence">Evidence ({evidence.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="report">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Investigation Report</CardTitle>
              {canEdit && (
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Report
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <ReportField label="Summary" value={summary} onChange={setSummary} disabled={!canEdit} placeholder="Provide a summary of the investigation…" />
              <ReportField label="Root Cause" value={rootCause} onChange={setRootCause} disabled={!canEdit} placeholder="Identify the root cause of the security incident…" />
              <ReportField label="Recommendations" value={recommendations} onChange={setRecommendations} disabled={!canEdit} placeholder="Provide recommendations for remediation…" />
              <ReportField label="Conclusion" value={conclusion} onChange={setConclusion} disabled={!canEdit} placeholder="State the conclusion of the investigation…" />

              {canEdit && (
                <div className="flex justify-end border-t border-border pt-4">
                  <Button
                    onClick={() => {
                      const err = validateReport();
                      if (err) {
                        toast.error(`Cannot complete: ${err}`);
                        return;
                      }
                      setCompleteOpen(true);
                    }}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Investigation
                  </Button>
                </div>
              )}
              {isCompleted && (
                <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                  This investigation has been completed. The associated alert has been closed by the system.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alert">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Associated Alert</CardTitle>
            </CardHeader>
            <CardContent>
              {alert ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow label="Alert ID" value={`#${alert.id}`} />
                    <InfoRow label="Rule" value={getAlertRuleName(alert)} />
                    <InfoRow label="Severity"><SeverityBadge severity={alert.severity as string} /></InfoRow>
                    <InfoRow label="Status"><StatusBadge status={alert.status as string} /></InfoRow>
                    <InfoRow label="Source" value={alert.source || alert.source_ip || '—'} />
                    <InfoRow label="Created" value={formatDate(alert.created_at || alert.timestamp)} />
                  </div>
                  {(alert.message || alert.description) && (
                    <div>
                      <p className="mb-1 text-sm font-medium text-muted-foreground">Description</p>
                      <p className="rounded-md border border-border bg-secondary/30 p-3 text-sm">{alert.message || alert.description}</p>
                    </div>
                  )}
                  <Link href={`/alerts/${alert.id}`}>
                    <Button variant="outline" size="sm">View Full Alert</Button>
                  </Link>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Alert information unavailable</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit && (
                <div className="rounded-md border border-border bg-secondary/30 p-4">
                  <p className="mb-3 text-sm font-medium">Upload New Evidence</p>
                  <div className="space-y-3">
                    <Input type="file" onChange={handleFileChange} disabled={uploading} />
                    <Input
                      value={evidenceDesc}
                      onChange={(e) => setEvidenceDesc(e.target.value)}
                      placeholder="Description (optional)"
                      disabled={uploading}
                    />
                    <Button onClick={handleUpload} disabled={!evidenceFile || uploading} size="sm">
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Upload Evidence
                    </Button>
                  </div>
                </div>
              )}

              {evidence.length === 0 ? (
                <EmptyState icon={Paperclip} title="No evidence uploaded" description="Evidence files will appear here once uploaded." />
              ) : (
                <div className="space-y-2">
                  {evidence.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3 rounded-md border border-border bg-secondary/20 p-3">
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{ev.file_name || ev.filename || ev.file || `Evidence #${ev.id}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {ev.description || 'No description'} · {getUserName(ev.uploaded_by)} · {formatDate(ev.uploaded_at || ev.created_at)}
                        </p>
                      </div>
                      {ev.file && (
                        <a href={ev.file as string} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Complete Investigation?"
        description="This will mark the investigation as completed and close the associated alert. This action cannot be undone."
        confirmLabel="Complete Investigation"
        onConfirm={handleComplete}
      />
    </div>
  );
}

function InfoCard({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm font-semibold">{value ?? children}</div>
      </CardContent>
    </Card>
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

function ReportField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        rows={4}
        className="resize-y"
      />
    </div>
  );
}
