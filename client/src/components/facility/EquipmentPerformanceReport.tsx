import { Equipment } from "@/types/facility";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface EquipmentPerformanceReportProps {
  equipment?: Equipment[];
}

export default function EquipmentPerformanceReport({ equipment = [] }: EquipmentPerformanceReportProps) {
  const selectedEquipment = equipment?.filter(eq => eq.isSelected) || [];

  if (!Array.isArray(equipment)) {
    return (
      <Card className="p-6">
        <div>No equipment data available</div>
      </Card>
    );
  }

  if (selectedEquipment.length === 0) {
    return (
      <Card className="p-6">
        <div>Select equipment to view performance report</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Equipment Performance Report</h3>
      <div className="space-y-4">
        {selectedEquipment.map((eq) => (
          <div key={eq.id} className="space-y-2">
            <h4 className="font-medium">{eq.name}</h4>
            <div className="h-[200px] w-full">
              <LineChart width={600} height={200} data={eq.performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="usage" stroke="#8884d8" />
                <Line type="monotone" dataKey="maintenance" stroke="#82ca9d" />
              </LineChart>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}