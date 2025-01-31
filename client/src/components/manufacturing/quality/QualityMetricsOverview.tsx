import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import type { QualityMetrics } from "@/types/manufacturing";

interface QualityMetricsOverviewProps {
  metrics?: QualityMetrics;
}

export default function QualityMetricsOverview({ metrics }: QualityMetricsOverviewProps) {
  const chartData = [
    {
      name: "Defect Rate",
      actual: metrics?.defectRate.value || 0,
      target: metrics?.defectRate.target || 0,
    },
    {
      name: "First Pass Yield",
      actual: metrics?.firstPassYield.value || 0,
      target: metrics?.firstPassYield.target || 0,
    },
    {
      name: "Customer Complaints",
      actual: metrics?.customerComplaints.value || 0,
      target: metrics?.customerComplaints.target || 0,
    },
    {
      name: "Supplier Quality",
      actual: metrics?.supplierQuality.value || 0,
      target: metrics?.supplierQuality.target || 0,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">First Pass Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.firstPassYield.value.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {metrics?.firstPassYield.target}%
              <span className="ml-2 text-green-500">
                ↑ {metrics?.firstPassYield.trend}%
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Defect Rate (PPM)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.defectRate.value.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {metrics?.defectRate.target}
              <span className="ml-2 text-red-500">
                ↓ {metrics?.defectRate.trend}%
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Process Capability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.processCapability.value.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {metrics?.processCapability.target}
              <span className="ml-2 text-green-500">
                ↑ {metrics?.processCapability.trend}%
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quality Metrics Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="actual" fill="#2563eb" name="Actual" />
                <Bar dataKey="target" fill="#16a34a" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}