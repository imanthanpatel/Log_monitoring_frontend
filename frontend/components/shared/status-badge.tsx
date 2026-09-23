import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const styles: Record<string, string> = {
  OPEN: 'border-transparent bg-blue-500/15 text-blue-400',
  ASSIGNED: 'border-transparent bg-purple-500/15 text-purple-400',
  FALSE_POSITIVE: 'border-transparent bg-muted text-muted-foreground',
  RESOLVED: 'border-transparent bg-green-500/15 text-green-400',
  CLOSED: 'border-transparent bg-muted text-muted-foreground',
  ASSIGNED_INV: 'border-transparent bg-cyan-500/15 text-cyan-400',
  IN_PROGRESS: 'border-transparent bg-cyan-500/15 text-cyan-400',
  COMPLETED: 'border-transparent bg-green-500/15 text-green-400',
  CLOSED_INV: 'border-transparent bg-muted text-muted-foreground',
};

export function StatusBadge({ status }: { status: string }) {
  const s = String(status || '').toUpperCase();
  const display = s.replace('_INV', '').replace(/_/g, ' ');
  return (
    <Badge className={cn(styles[s] || 'border-transparent bg-muted text-muted-foreground')}>
      {display || 'UNKNOWN'}
    </Badge>
  );
}
