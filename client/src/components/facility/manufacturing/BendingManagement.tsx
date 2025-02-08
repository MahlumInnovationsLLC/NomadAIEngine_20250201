import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface BendingJob {
  id: string;
  name: string;
  material: string;
  thickness: number;
  angle: number;
  length: number;
  status: 'queued' | 'in-progress' | 'completed' | 'qa-check';
  progress: number;
  operator?: string;
  startTime?: Date;
  estimatedTime: number;
  priority: number;
  qualityScore?: number;
}

interface BendingMachine {
  id: string;
  name: string;
  type: 'press-brake' | 'folding' | 'roll-bending';
  status: 'idle' | 'running' | 'maintenance' | 'error';
  currentJob?: BendingJob;
  tooling: {
    type: string;
    wear: number;
    lastReplacement: Date;
  };
  operator?: string;
  nextMaintenance: Date;
  maxForce: number;
  maxLength: number;
}

export default function BendingManagement() {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  const { data: machines = [] } = useQuery<BendingMachine[]>({
    queryKey: ['/api/fabrication/bending/machines'],
  });

  const { data: jobs = [] } = useQuery<BendingJob[]>({
    queryKey: ['/api/fabrication/bending/jobs', selectedMachine],
    enabled: !!selectedMachine,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bending Operations</h2>
        <div className="flex gap-2">
          <Button>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New Job
          </Button>
          <Button variant="outline">
            <FontAwesomeIcon icon="tools" className="mr-2 h-4 w-4" />
            Tool Setup
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {machines.map((machine) => (
          <Card 
            key={machine.id}
            className={`cursor-pointer transition-colors ${
              selectedMachine === machine.id ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedMachine(machine.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {machine.name} ({machine.type})
              </CardTitle>
              <Badge
                variant={machine.status === 'running' ? 'default' : 'secondary'}
              >
                {machine.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {machine.currentJob ? (
                  <>
                    <p className="text-sm font-medium">{machine.currentJob.name}</p>
                    <Progress value={machine.currentJob.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress: {machine.currentJob.progress}%</span>
                      <span>ETA: {machine.currentJob.estimatedTime} min</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No active job</p>
                )}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Tool Wear</p>
                    <p className="text-sm font-medium">{machine.tooling.wear}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Max Force</p>
                    <p className="text-sm font-medium">{machine.maxForce} tons</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Max Length</p>
                    <p className="text-sm font-medium">{machine.maxLength}mm</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMachine && (
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
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Angle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{job.material} ({job.thickness}mm)</TableCell>
                    <TableCell>{job.length}mm</TableCell>
                    <TableCell>{job.angle}°</TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.status}</Badge>
                    </TableCell>
                    <TableCell>{job.priority}</TableCell>
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
