import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface QualityControlCenterProps {
  showFullDashboard?: boolean;
}

export default function QualityControlCenter({ showFullDashboard = false }: QualityControlCenterProps) {
  const [activeView, setActiveView] = useState<'inspections' | 'metrics' | 'ncr'>('inspections');

  const { data: qualityInspections = [] } = useQuery({
    queryKey: ['/api/quality/inspections'],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Quality Control Center</span>
          <div className="flex gap-2">
            <Button 
              variant={activeView === 'inspections' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveView('inspections')}
            >
              Inspections
            </Button>
            <Button 
              variant={activeView === 'metrics' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveView('metrics')}
            >
              Metrics
            </Button>
            <Button 
              variant={activeView === 'ncr' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveView('ncr')}
            >
              NCR
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeView === 'inspections' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Pending Inspections</div>
                  <div className="text-2xl font-bold">12</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Completed Today</div>
                  <div className="text-2xl font-bold">45</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Pass Rate</div>
                  <div className="text-2xl font-bold">94.5%</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Critical Issues</div>
                  <div className="text-2xl font-bold text-red-500">2</div>
                </CardContent>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualityInspections.map((inspection: any) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">{inspection.id}</TableCell>
                    <TableCell>{inspection.type}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          inspection.status === 'passed'
                            ? 'bg-green-500/10 text-green-500'
                            : inspection.status === 'failed'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }
                      >
                        {inspection.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{inspection.inspector}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(inspection.updatedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'eye']} className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeView === 'metrics' && (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Quality Metrics Dashboard</h3>
            {/* Add quality metrics visualization here */}
          </div>
        )}

        {activeView === 'ncr' && (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Non-Conformance Reports</h3>
            {/* Add NCR management interface here */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
