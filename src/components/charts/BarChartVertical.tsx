import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BarChartVerticalProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
  color?: 'forest' | 'amber' | 'ocean';
  formatValue?: (value: number) => string;
}

const colorMap = {
  forest: 'hsl(142 50% 35%)',
  amber: 'hsl(35 90% 55%)',
  ocean: 'hsl(200 70% 50%)',
};

export function BarChartVertical({
  data,
  height = 300,
  color = 'forest',
  formatValue = (v) => v.toLocaleString(),
}: BarChartVerticalProps) {
  const baseColor = colorMap[color];
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          angle={0}
          textAnchor="middle"
          height={60}
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
          labelFormatter={(label) => `Driver: ${label}`}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={baseColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
