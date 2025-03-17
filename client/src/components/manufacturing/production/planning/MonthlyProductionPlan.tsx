
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

interface MonthlyProductionPlanProps {
  productionLineId?: string;
}

export function MonthlyProductionPlan({ productionLineId }: MonthlyProductionPlanProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ['/api/manufacturing/monthly-production', selectedMonth.toISOString(), productionLineId],
    queryFn: async () => {
      const url = `/api/manufacturing/monthly-production?month=${selectedMonth.toISOString()}${productionLineId ? `&lineId=${productionLineId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch monthly production data');
      return response.json();
    }
  });

  if (isLoading) {
    return <div>Loading monthly production data...</div>;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Production Overview</h3>
        {monthlyData ? (
          <div className="space-y-4">
            <div>Monthly statistics will be displayed here</div>
          </div>
        ) : (
          <div>No monthly production data available</div>
        )}
      </CardContent>
    </Card>
  );
}

export default MonthlyProductionPlan;
