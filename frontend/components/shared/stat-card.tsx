import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'blue' | 'green' | 'orange' | 'red' | 'cyan' | 'muted';
  subtitle?: string;
}

const accents: Record<string, string> = {
  blue: 'text-blue-400 bg-blue-500/10',
  green: 'text-green-400 bg-green-500/10',
  orange: 'text-orange-400 bg-orange-500/10',
  red: 'text-red-400 bg-red-500/10',
  cyan: 'text-cyan-400 bg-cyan-500/10',
  muted: 'text-muted-foreground bg-muted',
};

export function StatCard({ title, value, icon: Icon, accent = 'blue', subtitle }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', accents[accent])}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
