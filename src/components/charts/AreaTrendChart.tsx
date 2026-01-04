import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AreaTrendChartProps {
  data: Array<{ year: number; value: number; label?: string }>;
  dataKey?: string;
  color?: 'forest' | 'amber' | 'ocean' | 'terracotta';
  height?: number;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

const colorMap = {
  forest: {
    stroke: 'hsl(142 50% 35%)',
    fill: 'url(#forestGradient)',
    gradient: ['hsl(142 50% 35%)', 'hsl(142 50% 35% / 0.1)'],
  },
  amber: {
    stroke: 'hsl(35 90% 55%)',
    fill: 'url(#amberGradient)',
    gradient: ['hsl(35 90% 55%)', 'hsl(35 90% 55% / 0.1)'],
  },
  ocean: {
    stroke: 'hsl(200 70% 50%)',
    fill: 'url(#oceanGradient)',
    gradient: ['hsl(200 70% 50%)', 'hsl(200 70% 50% / 0.1)'],
  },
  terracotta: {
    stroke: 'hsl(15 70% 55%)',
    fill: 'url(#terracottaGradient)',
    gradient: ['hsl(15 70% 55%)', 'hsl(15 70% 55% / 0.1)'],
  },
};

export function AreaTrendChart({
  data,
  dataKey = 'value',
  color = 'forest',
  height = 300,
  showGrid = true,
  formatValue = (v) => v.toLocaleString(),
}: AreaTrendChartProps) {
  const colors = colorMap[color];
  const gradientId = `${color}Gradient`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gradient[0]} stopOpacity={0.4} />
            <stop offset="95%" stopColor={colors.gradient[1]} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            vertical={false}
          />
        )}
        <XAxis
          dataKey="year"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value.toString();
          }}
          dx={-10}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow-card)',
            padding: '12px 16px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
          itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
          formatter={(value: number) => [formatValue(value), 'Value']}
          labelFormatter={(label) => `Year: ${label}`}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={colors.stroke}
          strokeWidth={3}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{
            r: 6,
            fill: colors.stroke,
            stroke: 'hsl(var(--background))',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
