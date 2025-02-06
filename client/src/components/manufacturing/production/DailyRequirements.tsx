
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

export function DailyRequirements() {
  const { data: dailyReqs = [] } = useQuery({
    queryKey: ['/api/manufacturing/daily-requirements'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/daily-requirements');
      if (!response.ok) throw new Error('Failed to fetch daily requirements');
      return response.json();
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Production Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyReqs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {dailyReqs.filter(r => r.status === 'critical').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Labor Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyReqs.reduce((acc, curr) => acc + (curr.laborHours || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Production Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Materials Required</TableHead>
                <TableHead>Labor Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyReqs.map((req, index) => (
                <TableRow key={index}>
                  <TableCell>{req.projectNumber}</TableCell>
                  <TableCell>{req.stage}</TableCell>
                  <TableCell>{req.materialsRequired}</TableCell>
                  <TableCell>{req.laborHours}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      req.status === 'ready' ? 'bg-green-100 text-green-800' :
                      req.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
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
