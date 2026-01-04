import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  variant?: 'default' | 'forest' | 'amber' | 'ocean';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  forest: 'gradient-forest text-primary-foreground',
  amber: 'gradient-sunset text-primary-foreground',
  ocean: 'gradient-ocean text-primary-foreground',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const isGradient = variant !== 'default';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] animate-fade-in',
        variantStyles[variant],
        !isGradient && 'glass-card',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            'text-sm font-medium',
            isGradient ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-bold tracking-tight',
            isGradient ? 'text-primary-foreground' : 'text-foreground'
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs',
              isGradient ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend.isPositive ? 'text-chart-emerald' : 'text-chart-terracotta'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            isGradient ? 'bg-primary-foreground/20' : 'bg-primary/10'
          )}>
            <Icon className={cn(
              'h-6 w-6',
              isGradient ? 'text-primary-foreground' : 'text-primary'
            )} />
          </div>
        )}
      </div>
    </div>
  );
}
