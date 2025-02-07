import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Progress } from "@/components/ui/progress";

export default function ProductionLineStatus() {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  const { data: productionLines = [] } = useQuery({
    queryKey: ['/api/production-lines'],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Production Line Status</span>
          <Button variant="outline" size="sm" className="gap-2">
            <FontAwesomeIcon icon={['fal', 'plus']} className="h-4 w-4" />
            Add Line
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* Production Line Overview Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Active Lines</div>
                <div className="text-2xl font-bold">4/5</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Average Efficiency</div>
                <div className="text-2xl font-bold">92%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Output Today</div>
                <div className="text-2xl font-bold">2,450</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Quality Rate</div>
                <div className="text-2xl font-bold">98.5%</div>
              </CardContent>
            </Card>
          </div>

          {/* Production Lines Status */}
          <div className="space-y-4">
            {productionLines.map((line: any) => (
              <Card key={line.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{line.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {line.currentProduct || 'No active production'}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      line.status === 'active' 
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }
                  >
                    {line.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Efficiency</span>
                    <span className="font-medium">{line.efficiency || 0}%</span>
                  </div>
                  <Progress value={line.efficiency || 0} />

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Units/Hour</div>
                      <div className="font-medium">{line.unitsPerHour || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Defect Rate</div>
                      <div className="font-medium">{line.defectRate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Next Maintenance</div>
                      <div className="font-medium">{line.nextMaintenance || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
