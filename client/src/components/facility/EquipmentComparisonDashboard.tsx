import { Equipment } from "@db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EquipmentComparisonDashboardProps {
  equipment: Equipment[];
}

export default function EquipmentComparisonDashboard({ equipment }: EquipmentComparisonDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {equipment.length === 0 ? (
            "Select equipment to compare"
          ) : (
            `Comparing ${equipment.length} items`
          )}
        </div>
      </CardContent>
    </Card>
  );
}
