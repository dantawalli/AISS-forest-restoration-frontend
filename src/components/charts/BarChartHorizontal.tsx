import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BarChartHorizontalProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
  color?: 'forest' | 'amber' | 'ocean' | 'colorful';
  formatValue?: (value: number) => string;
}

const colorMap = {
  forest: 'hsl(142 50% 35%)',
  amber: 'hsl(35 90% 55%)',
  ocean: 'hsl(200 70% 50%)',
};

const colorfulColors = [
  'hsl(142 70% 45%)', // Forest green
  'hsl(35 85% 60%)', // Amber
  'hsl(200 65% 55%)', // Ocean blue
  'hsl(280 70% 55%)', // Purple
  'hsl(10 75% 55%)', // Red
  'hsl(45 80% 50%)', // Orange
  'hsl(170 60% 50%)', // Teal
  'hsl(320 65% 55%)', // Pink
  'hsl(60 70% 50%)', // Yellow
  'hsl(220 60% 55%)', // Blue
];

export function BarChartHorizontal({
  data,
  height = 250,
  color = 'forest',
  formatValue = (v) => v.toLocaleString(),
}: BarChartHorizontalProps) {
  const baseColor = colorMap[color];
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value.toString();
          }}
        />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          width={55}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow-card)',
            padding: '12px 16px',
          }}
          formatter={(value: number) => [formatValue(value), 'Loss']}
          cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={30}>
          {data.map((_, index) => {
            let fillColor = baseColor;
            let opacity = 1;
            
            if (color === 'colorful') {
              fillColor = colorfulColors[index % colorfulColors.length];
              opacity = 0.9;
            } else {
              opacity = 1 - index * 0.12;
            }
            
            return (
              <Cell 
                key={`cell-${index}`} 
                fill={fillColor}
                opacity={opacity}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
