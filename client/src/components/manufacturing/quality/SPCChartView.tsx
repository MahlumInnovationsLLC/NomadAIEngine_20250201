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
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";

interface SPCDataPoint {
  timestamp: string;
  value: number;
  ucl: number;
  lcl: number;
  mean: number;
  usl: number;
  lsl: number;
  sigma1Upper: number;
  sigma1Lower: number;
  sigma2Upper: number;
  sigma2Lower: number;
  movingRange: number;
}

interface ProcessCapability {
  cp: number;
  cpk: number;
  pp: number;
  ppk: number;
  sigma: number;
}

interface ControlRuleViolation {
  type: string;
  pointIndex: number;
  description: string;
  severity: 'warning' | 'critical';
}

export default function SPCChartView() {
  const [selectedMetric, setSelectedMetric] = useState("dimension_a");
  const [timeRange, setTimeRange] = useState("24h");
  const [showSigmaLevels, setShowSigmaLevels] = useState(true);
  const [showMovingRange, setShowMovingRange] = useState(false);

  const { data: spcData } = useQuery<{
    measurements: SPCDataPoint[];
    capability: ProcessCapability;
    violations: ControlRuleViolation[];
  }>({
    queryKey: ["/api/manufacturing/quality/spc", selectedMetric, timeRange],
  });

  const formatNumber = (num: number) => num.toFixed(3);

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
              <SelectItem value="hardness">Hardness</SelectItem>
              <SelectItem value="thickness">Thickness</SelectItem>
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
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowSigmaLevels(!showSigmaLevels)}>
            <FontAwesomeIcon icon={showSigmaLevels ? "eye-slash" : "eye"} className="mr-2 h-4 w-4" />
            Sigma Levels
          </Button>
          <Button variant="outline" onClick={() => setShowMovingRange(!showMovingRange)}>
            <FontAwesomeIcon icon="chart-line" className="mr-2 h-4 w-4" />
            Moving Range
          </Button>
          <Button variant="outline">
            <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {spcData?.violations && spcData.violations.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon="exclamation-triangle" className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Control rule violations detected ({spcData.violations.length})
              </p>
              <ul className="mt-2 text-sm">
                {spcData.violations.map((violation, index) => (
                  <li key={index} className="mt-1">
                    <Badge variant={violation.severity === 'critical' ? 'destructive' : 'default'}>
                      {violation.type}
                    </Badge>
                    <span className="ml-2 text-yellow-700">{violation.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Process Control Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={spcData?.measurements}
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
                  formatter={(value: number) => [formatNumber(value), '']}
                />
                <Legend />

                {/* Main measurement line */}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  dot={false}
                  name="Measurement"
                />

                {/* Control limits */}
                <Line
                  type="monotone"
                  dataKey="ucl"
                  stroke="#dc2626"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Upper Control Limit (3σ)"
                />
                <Line
                  type="monotone"
                  dataKey="lcl"
                  stroke="#dc2626"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Lower Control Limit (3σ)"
                />

                {/* Mean line */}
                <Line
                  type="monotone"
                  dataKey="mean"
                  stroke="#16a34a"
                  strokeDasharray="3 3"
                  dot={false}
                  name="Mean"
                />

                {/* Specification limits */}
                <ReferenceLine y={spcData?.measurements[0]?.usl} stroke="#9333ea" strokeDasharray="3 3" label="USL" />
                <ReferenceLine y={spcData?.measurements[0]?.lsl} stroke="#9333ea" strokeDasharray="3 3" label="LSL" />

                {/* Additional sigma levels */}
                {showSigmaLevels && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="sigma2Upper"
                      stroke="#fb923c"
                      strokeDasharray="3 3"
                      dot={false}
                      name="Upper 2σ"
                    />
                    <Line
                      type="monotone"
                      dataKey="sigma2Lower"
                      stroke="#fb923c"
                      strokeDasharray="3 3"
                      dot={false}
                      name="Lower 2σ"
                    />
                    <Line
                      type="monotone"
                      dataKey="sigma1Upper"
                      stroke="#fbbf24"
                      strokeDasharray="2 2"
                      dot={false}
                      name="Upper 1σ"
                    />
                    <Line
                      type="monotone"
                      dataKey="sigma1Lower"
                      stroke="#fbbf24"
                      strokeDasharray="2 2"
                      dot={false}
                      name="Lower 1σ"
                    />
                  </>
                )}

                {/* Moving range chart */}
                {showMovingRange && (
                  <Line
                    type="monotone"
                    dataKey="movingRange"
                    stroke="#8b5cf6"
                    dot={false}
                    name="Moving Range"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Process Capability (Cp)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(spcData?.capability.cp || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Target: ≥ 1.33
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Process Capability Index (Cpk)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(spcData?.capability.cpk || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Target: ≥ 1.33
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Process Performance (Pp)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(spcData?.capability.pp || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Target: ≥ 1.67
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Process Sigma Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(spcData?.capability.sigma || 0)}σ</div>
            <p className="text-xs text-muted-foreground">
              Target: 6σ
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}