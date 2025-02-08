import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface WeldingJob {
  id: string;
  name: string;
  material: string;
  thickness: number;
  status: 'queued' | 'in-progress' | 'completed' | 'qa-check';
  progress: number;
  operator?: string;
  startTime?: Date;
  estimatedTime: number;
  priority: number;
  qualityScore?: number;
}

interface WeldingStation {
  id: string;
  name: string;
  type: 'mig' | 'tig' | 'spot' | 'arc';
  status: 'idle' | 'running' | 'maintenance' | 'error';
  currentJob?: WeldingJob;
  operator?: string;
  materialUsage: {
    wire: number;
    gas: number;
  };
  nextMaintenance: Date;
}

export default function WeldingManagement() {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const { data: stations = [] } = useQuery<WeldingStation[]>({
    queryKey: ['/api/fabrication/welding/stations'],
  });

  const { data: jobs = [] } = useQuery<WeldingJob[]>({
    queryKey: ['/api/fabrication/welding/jobs', selectedStation],
    enabled: !!selectedStation,
  });

  const getStatusColor = (status: string) => {
    const colors = {
      idle: "bg-gray-500",
      running: "bg-green-500",
      maintenance: "bg-yellow-500",
      error: "bg-red-500"
    };
    return colors[status as keyof typeof colors];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Welding Operations</h2>
        <div className="flex gap-2">
          <Button>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New Job
          </Button>
          <Button variant="outline">
            <FontAwesomeIcon icon="user" className="mr-2 h-4 w-4" />
            Assign Operator
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stations.map((station) => (
          <Card 
            key={station.id}
            className={`cursor-pointer transition-colors ${
              selectedStation === station.id ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedStation(station.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {station.name} ({station.type.toUpperCase()})
              </CardTitle>
              <Badge
                variant={station.status === 'running' ? 'default' : 'secondary'}
              >
                {station.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {station.currentJob ? (
                  <>
                    <p className="text-sm font-medium">{station.currentJob.name}</p>
                    <Progress value={station.currentJob.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress: {station.currentJob.progress}%</span>
                      <span>ETA: {station.currentJob.estimatedTime} min</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No active job</p>
                )}
                <div className="flex justify-between text-xs text-muted-foreground pt-2">
                  <span>Operator: {station.operator || 'Unassigned'}</span>
                  <span>
                    Wire: {station.materialUsage.wire}m | Gas: {station.materialUsage.gas}L
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedStation && (
        <Card>
          <CardHeader>
            <CardTitle>Job Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Thickness</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{job.material}</TableCell>
                    <TableCell>{job.thickness}mm</TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.status}</Badge>
                    </TableCell>
                    <TableCell>{job.priority}</TableCell>
                    <TableCell>
                      {job.qualityScore ? (
                        <span className={`text-${job.qualityScore >= 90 ? 'green' : 'yellow'}-500`}>
                          {job.qualityScore}%
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <FontAwesomeIcon icon="play" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FontAwesomeIcon icon="pause" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FontAwesomeIcon icon="check" className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
