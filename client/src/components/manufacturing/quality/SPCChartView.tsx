import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface SPCDataPoint {
  timestamp: string;
  value: number;
  ucl: number;
  lcl: number;
  mean: number;
}

export default function SPCChartView() {
  const [selectedMetric, setSelectedMetric] = useState("dimension_a");
  const [timeRange, setTimeRange] = useState("24h");

  const { data: spcData } = useQuery<SPCDataPoint[]>({
    queryKey: ["/api/manufacturing/quality/spc", selectedMetric, timeRange],
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Statistical Process Control</h3>
          <p className="text-sm text-muted-foreground">
            Monitor process variation and control limits
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dimension_a">Dimension A</SelectItem>
              <SelectItem value="dimension_b">Dimension B</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="density">Density</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="8h">Last 8 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process Control Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={spcData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  dot={false}
                  name="Measurement"
                />
                <Line
                  type="monotone"
                  dataKey="ucl"
                  stroke="#dc2626"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Upper Control Limit"
                />
                <Line
                  type="monotone"
                  dataKey="lcl"
                  stroke="#dc2626"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Lower Control Limit"
                />
                <Line
                  type="monotone"
                  dataKey="mean"
                  stroke="#16a34a"
                  strokeDasharray="3 3"
                  dot={false}
                  name="Mean"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Process Capability (Cpk)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.33</div>
            <p className="text-xs text-muted-foreground">
              Minimum target: 1.33
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Out of Control Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Process Sigma Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5σ</div>
            <p className="text-xs text-muted-foreground">
              Target: 6σ
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
