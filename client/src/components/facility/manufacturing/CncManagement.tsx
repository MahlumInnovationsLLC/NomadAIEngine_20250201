import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface CncJob {
  id: string;
  name: string;
  material: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  progress: number;
  estimatedTime: number;
  startTime?: Date;
  program: string;
  priority: number;
}

interface CncMachine {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'maintenance' | 'error';
  currentJob?: CncJob;
  toolLife: Record<string, number>;
  nextMaintenance: Date;
}

export default function CncManagement() {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  const { data: machines = [] } = useQuery<CncMachine[]>({
    queryKey: ['/api/fabrication/cnc/machines'],
  });

  const { data: jobs = [] } = useQuery<CncJob[]>({
    queryKey: ['/api/fabrication/cnc/jobs', selectedMachine],
    enabled: !!selectedMachine,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">CNC Operations</h2>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New Job
        </Button>
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
              <CardTitle className="text-sm font-medium">{machine.name}</CardTitle>
              <Badge
                variant={machine.status === 'running' ? 'default' : 'secondary'}
              >
                {machine.status}
              </Badge>
            </CardHeader>
            <CardContent>
              {machine.currentJob ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{machine.currentJob.name}</p>
                  <Progress value={machine.currentJob.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress: {machine.currentJob.progress}%</span>
                    <span>ETA: {machine.currentJob.estimatedTime} min</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active job</p>
              )}
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
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{job.material}</TableCell>
                    <TableCell>{job.program}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.status}</Badge>
                    </TableCell>
                    <TableCell>{job.priority}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon="ellipsis-h" className="h-4 w-4" />
                      </Button>
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
