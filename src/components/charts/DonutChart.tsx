import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
  colors?: string[];
  centerLabel?: string;
  centerValue?: string;
}

const defaultColors = [
  'hsl(142 50% 35%)',
  'hsl(152 60% 45%)',
  'hsl(35 90% 55%)',
  'hsl(15 70% 55%)',
  'hsl(200 70% 50%)',
  'hsl(120 25% 65%)',
];

export function DonutChart({
  data,
  height = 250,
  colors = defaultColors,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              boxShadow: 'var(--shadow-card)',
              padding: '12px 16px',
            }}
            formatter={(value: number, name: string) => [
              `${value.toLocaleString()} (${((value / data.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && centerValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-foreground">{centerValue}</span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}

export function DonutLegend({ data, colors = defaultColors }: { data: Array<{ name: string; value: number }>; colors?: string[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  
  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {data.map((item, index) => (
        <div key={item.name} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors[index % colors.length] }}
          />
          <span className="text-sm text-muted-foreground">
            {item.name} ({((item.value / total) * 100).toFixed(0)}%)
          </span>
        </div>
      ))}
    </div>
  );
}
