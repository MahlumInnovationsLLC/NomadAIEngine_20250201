
import { Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Equipment } from "@db/schema";
import { Skeleton } from "@/components/ui/skeleton";

const ComparisonChart = lazy(() => import("./charts/ComparisonChart"));

interface EquipmentComparisonDashboardProps {
  selectedEquipment?: Equipment[];
}

export default function EquipmentComparisonDashboard({ selectedEquipment = [] }: EquipmentComparisonDashboardProps) {
  if (!selectedEquipment || selectedEquipment.length === 0) {
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
        [eq.name]: Math.round(Math.random() * 100)
      }), {})
    },
    {
      metric: "Maintenance Score",
      ...selectedEquipment.reduce((acc, eq) => ({
        ...acc,
        [eq.name]: eq.maintenanceScore || Math.round(Math.random() * 100)
      }), {})
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <ComparisonChart data={comparisonData} selectedEquipment={selectedEquipment} />
          </Suspense>
        </div>
      </CardContent>
    </Card>
  );
}
