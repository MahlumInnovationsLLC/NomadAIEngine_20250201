import { Equipment } from "@db/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="metric" />
        <YAxis />
        <Tooltip />
        <Legend />
        {selectedEquipment.map((eq, index) => (
          <Bar
            key={eq.id}
            dataKey={eq.name}
            fill={colors[index % colors.length]}
            name={eq.name}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
