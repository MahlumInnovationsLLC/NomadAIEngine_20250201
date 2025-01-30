import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SupplierMetrics {
  supplierId: string;
  name: string;
  qualityScore: number;
  onTimeDelivery: number;
  defectRate: number;
  responseTime: number;
  totalOrders: number;
  lastDelivery: string;
}

export default function SupplierQualityDashboard() {
  const { data: supplierMetrics } = useQuery<SupplierMetrics[]>({
    queryKey: ["/api/manufacturing/suppliers/metrics"],
  });

  const performanceData = supplierMetrics?.map((supplier) => ({
    name: supplier.name,
    'Quality Score': supplier.qualityScore,
    'On-Time Delivery': supplier.onTimeDelivery,
    'Defect Rate': supplier.defectRate,
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Supplier Quality Management</h3>
          <p className="text-sm text-muted-foreground">
            Monitor and analyze supplier performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supplierMetrics
                ? Math.round(
                    supplierMetrics.reduce((acc, curr) => acc + curr.qualityScore, 0) /
                      supplierMetrics.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">On-Time Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supplierMetrics
                ? Math.round(
                    supplierMetrics.reduce((acc, curr) => acc + curr.onTimeDelivery, 0) /
                      supplierMetrics.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Defect Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supplierMetrics
                ? (
                    supplierMetrics.reduce((acc, curr) => acc + curr.defectRate, 0) /
                    supplierMetrics.length
                  ).toFixed(2)
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierMetrics?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Quality Score" fill="#2563eb" />
                <Bar dataKey="On-Time Delivery" fill="#16a34a" />
                <Bar dataKey="Defect Rate" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
