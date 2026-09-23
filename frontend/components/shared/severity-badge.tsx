import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Severity } from '@/lib/types';

const styles: Record<string, string> = {
  CRITICAL: 'border-transparent bg-red-500/15 text-red-400',
  HIGH: 'border-transparent bg-orange-500/15 text-orange-400',
  MEDIUM: 'border-transparent bg-yellow-500/15 text-yellow-400',
  LOW: 'border-transparent bg-blue-500/15 text-blue-400',
};

export function SeverityBadge({ severity }: { severity: Severity | string }) {
  const s = String(severity || '').toUpperCase();
  return (
    <Badge className={cn(styles[s] || styles.LOW)}>
      {s || 'UNKNOWN'}
    </Badge>
  );
}
