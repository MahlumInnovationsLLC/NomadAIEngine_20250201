import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { InspectionDetailsDialog } from "./dialogs/InspectionDetailsDialog";
import type { QualityInspection } from "@/types/manufacturing";

export function ProjectInspectionView() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['/api/manufacturing/projects'],
  });

  // Fetch inspections
  const { data: inspections } = useQuery<QualityInspection[]>({
    queryKey: ['/api/manufacturing/quality/inspections', selectedProject],
    enabled: !!selectedProject,
  });

  const filteredInspections = inspections?.filter(
    inspection => inspection.projectId === selectedProject
  ) || [];

  const getStatusColor = (status: QualityInspection['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Project Quality Overview</h3>
          <p className="text-sm text-muted-foreground">
            View and manage quality inspections by project
          </p>
        </div>
        <div className="w-[300px]">
          <Select onValueChange={setSelectedProject} value={selectedProject || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.projectNumber} - {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredInspections.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredInspections.filter(i => i.results.defectsFound.length > 0).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((filteredInspections.filter(i => i.status === 'completed').length / 
                      (filteredInspections.length || 1)) * 100)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Production Line</TableHead>
                  <TableHead>Defects</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell>{formatDate(inspection.inspectionDate)}</TableCell>
                    <TableCell className="font-medium capitalize">
                      {inspection.templateType}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(inspection.status)}>
                        {inspection.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{inspection.inspector}</TableCell>
                    <TableCell>{inspection.productionLineId}</TableCell>
                    <TableCell>
                      {inspection.results.defectsFound.length > 0 && (
                        <Badge variant="destructive">
                          {inspection.results.defectsFound.length} Issues Found
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedInspection(inspection);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {showDetailsDialog && selectedInspection && (
        <InspectionDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          inspection={selectedInspection}
          onUpdate={(updated) => {
            // Handle inspection update
          }}
        />
      )}
    </div>
  );
}
