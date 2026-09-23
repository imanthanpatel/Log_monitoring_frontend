import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Role } from '@/lib/types';

const styles: Record<string, string> = {
  ADMIN: 'border-transparent bg-red-500/15 text-red-400',
  SOC: 'border-transparent bg-cyan-500/15 text-cyan-400',
  INVESTIGATOR: 'border-transparent bg-green-500/15 text-green-400',
  VIEWER: 'border-transparent bg-muted text-muted-foreground',
};

export function RoleBadge({ role }: { role: Role | string }) {
  const r = String(role || '').toUpperCase();
  return <Badge className={cn(styles[r] || styles.VIEWER)}>{r || 'UNKNOWN'}</Badge>;
}
