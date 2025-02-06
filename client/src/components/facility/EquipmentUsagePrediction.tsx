import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface EquipmentUsagePredictionProps {
  equipmentId: string;
}

export default function EquipmentUsagePrediction({ equipmentId }: EquipmentUsagePredictionProps) {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['/api/equipment/predictions', equipmentId],
    enabled: !!equipmentId,
  });

  if (isLoading) {
    return <Skeleton className="w-full h-[200px]" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Predictions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Equipment usage predictions will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}
