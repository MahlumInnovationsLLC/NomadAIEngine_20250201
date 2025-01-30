import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DefectData {
  id: string;
  type: string;
  severity: 'minor' | 'major' | 'critical';
  location: string;
  productLine: string;
  reportedBy: string;
  reportedAt: string;
  status: 'open' | 'investigating' | 'resolved';
  resolution?: string;
}

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#eab308'];

export default function DefectAnalytics() {
  const { data: defects } = useQuery<DefectData[]>({
    queryKey: ["/api/manufacturing/quality/defects"],
  });

  const defectsByType = defects?.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(defectsByType || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const trendData = [
    { month: 'Jan', defects: 12 },
    { month: 'Feb', defects: 15 },
    { month: 'Mar', defects: 8 },
    { month: 'Apr', defects: 10 },
    { month: 'May', defects: 5 },
    { month: 'Jun', defects: 7 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Defect Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Track and analyze product quality issues
          </p>
        </div>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          Report Defect
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Defects by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Defect Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="defects"
                    stroke="#2563eb"
                    name="Number of Defects"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Defects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Product Line</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defects?.slice(0, 5).map((defect) => (
                <TableRow key={defect.id}>
                  <TableCell className="font-medium">{defect.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        defect.severity === 'critical'
                          ? 'destructive'
                          : defect.severity === 'major'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {defect.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{defect.location}</TableCell>
                  <TableCell>{defect.productLine}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        defect.status === 'resolved'
                          ? 'default'
                          : defect.status === 'investigating'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {defect.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(defect.reportedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
