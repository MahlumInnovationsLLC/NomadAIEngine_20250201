import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Equipment } from "@db/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface EquipmentComparisonDashboardProps {
  selectedEquipment: Equipment[];
}

export default function EquipmentComparisonDashboard({ selectedEquipment }: EquipmentComparisonDashboardProps) {
  if (selectedEquipment.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipment Comparison</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Select multiple equipment items to compare their metrics
        </CardContent>
      </Card>
    );
  }

  const comparisonData = [
    {
      metric: "Health Score",
      ...selectedEquipment.reduce((acc, eq) => ({
        ...acc,
        [eq.name]: eq.healthScore
      }), {})
    },
    {
      metric: "Usage Rate",
      ...selectedEquipment.reduce((acc, eq) => ({
        ...acc,
        [eq.name]: Math.round(Math.random() * 100) // Replace with actual usage rate
      }), {})
    },
    {
      metric: "Maintenance Score",
      ...selectedEquipment.reduce((acc, eq) => ({
        ...acc,
        [eq.name]: eq.maintenanceScore || Math.round(Math.random() * 100) // Replace with actual maintenance score
      }), {})
    }
  ];

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={comparisonData}>
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
        </div>
      </CardContent>
    </Card>
  );
}
