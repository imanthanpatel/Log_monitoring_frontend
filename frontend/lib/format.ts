export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return String(dateStr);
  }
}

export function formatRelative(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(dateStr);
  } catch {
    return String(dateStr);
  }
}

export function getUserName(user: unknown): string {
  if (!user) return '—';
  if (typeof user === 'string') return user;
  if (typeof user === 'number') return `User #${user}`;
  if (typeof user === 'object') {
    const u = user as Record<string, unknown>;
    if (u.username) return String(u.username);
    if (u.first_name || u.last_name)
      return `${u.first_name || ''} ${u.last_name || ''}`.trim();
    if (u.email) return String(u.email);
    if (u.id) return `User #${u.id}`;
  }
  return '—';
}

export function getUserId(user: unknown): number | null {
  if (!user) return null;
  if (typeof user === 'number') return user;
  if (typeof user === 'object') {
    const u = user as Record<string, unknown>;
    if (typeof u.id === 'number') return u.id;
  if (typeof u.id === 'string') return parseInt(u.id, 10);
  }
  return null;
}

export function getAlertRuleName(alert: { rule_name?: string; rule?: string | { id: number; name: string } }): string {
  if (alert.rule_name) return alert.rule_name;
  if (alert.rule) {
    if (typeof alert.rule === 'string') return alert.rule;
    if (typeof alert.rule === 'object' && alert.rule.name) return alert.rule.name;
  }
  return '—';
}
