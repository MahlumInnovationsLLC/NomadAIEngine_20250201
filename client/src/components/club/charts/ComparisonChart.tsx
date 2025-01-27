import React, { Suspense } from 'react';
import { Equipment } from "@db/schema";
import type { ResponsiveContainer, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart } from 'recharts';

interface ChartProps extends React.ComponentProps<typeof BarChart> {
  children?: React.ReactNode;
}

const LazyChart = React.lazy(() => import('recharts').then(module => ({
  default: ({ children, ...props }: ChartProps) => (
    <module.ResponsiveContainer>
      <module.BarChart {...props}>
        {children}
      </module.BarChart>
    </module.ResponsiveContainer>
  )
})));

const LazyChartComponents = {
  CartesianGrid: React.lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid }))),
  XAxis: React.lazy(() => import('recharts').then(m => ({ default: m.XAxis }))),
  YAxis: React.lazy(() => import('recharts').then(m => ({ default: m.YAxis }))),
  Tooltip: React.lazy(() => import('recharts').then(m => ({ default: m.Tooltip }))),
  Legend: React.lazy(() => import('recharts').then(m => ({ default: m.Legend }))),
  Bar: React.lazy(() => import('recharts').then(m => ({ default: m.Bar })))
};

interface ComparisonChartProps {
  data: Array<{
    metric: string;
    [key: string]: string | number;
  }>;
  selectedEquipment: Equipment[];
}

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

export default function ComparisonChart({ data, selectedEquipment }: ComparisonChartProps) {
  if (!data || !selectedEquipment) return null;

  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <LazyChart data={data} height={300}>
        <LazyChartComponents.CartesianGrid strokeDasharray="3 3" />
        <LazyChartComponents.XAxis dataKey="metric" />
        <LazyChartComponents.YAxis />
        <LazyChartComponents.Tooltip />
        <LazyChartComponents.Legend />
        {selectedEquipment.map((eq, index) => (
          <LazyChartComponents.Bar
            key={eq.id}
            dataKey={eq.name}
            fill={colors[index % colors.length]}
            name={eq.name}
          />
        ))}
      </LazyChart>
    </Suspense>
  );
}