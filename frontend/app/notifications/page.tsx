'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, RefreshCw, CheckCheck, Mail, MailOpen } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/loading-states';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { toast } from 'sonner';
import { ApiError, getNotifications, markNotificationRead } from '@/lib/api';
import { formatRelative, formatDate } from '@/lib/format';
import type { Notification } from '@/lib/types';

const typeColors: Record<string, string> = {
  INVESTIGATION_COMPLETED: 'border-transparent bg-green-500/15 text-green-400',
  ALERT_CLOSED: 'border-transparent bg-blue-500/15 text-blue-400',
  ALERT_ASSIGNED: 'border-transparent bg-cyan-500/15 text-cyan-400',
  EVIDENCE_UPLOADED: 'border-transparent bg-orange-500/15 text-orange-400',
};

export default function NotificationsPage() {
  return (
    <RouteGuard>
      <AppLayout>
        <NotificationsContent />
      </AppLayout>
    </RouteGuard>
  );
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkRead(id: number) {
    setMarkingId(id);
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, is_read: true } : n))
      );
      toast.success('Notification marked as read');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to mark notification');
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.read && !n.is_read);
    if (unread.length === 0) return;
    for (const n of unread) {
      try {
        await markNotificationRead(n.id);
      } catch {
        // continue
      }
    }
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, is_read: true }))
    );
    toast.success('All notifications marked as read');
  }

  const unreadCount = notifications.filter((n) => !n.read && !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="System alerts and investigation updates">
        <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </Button>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message="Loading notifications…" />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="You have no notifications at this time." />
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => {
                const isRead = n.read || n.is_read;
                const type = String(n.type || '').toUpperCase();
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-4 transition-colors hover:bg-accent/50 ${!isRead ? 'bg-primary/5' : ''}`}
                  >
                    <div className="mt-0.5">
                      {isRead ? (
                        <MailOpen className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Mail className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {type && (
                          <Badge className={typeColors[type] || 'border-transparent bg-muted text-muted-foreground'}>
                            {type.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        {!isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium">
                        {n.title || n.message || `Notification #${n.id}`}
                      </p>
                      {(n.title && n.message) && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelative(n.created_at || n.timestamp)} · {formatDate(n.created_at || n.timestamp)}
                      </p>
                    </div>
                    {!isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkRead(n.id)}
                        disabled={markingId === n.id}
                      >
                        {markingId === n.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Mark read'
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
