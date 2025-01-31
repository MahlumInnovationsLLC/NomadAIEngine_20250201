import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QualityInspection, QualityFormTemplate, NonConformanceReport } from "@/types/manufacturing";

import { CreateInspectionDialog } from "./dialogs/CreateInspectionDialog";
import { InspectionTemplateDialog } from "./dialogs/InspectionTemplateDialog";
import { NCRDialog } from "./dialogs/NCRDialog";

export default function QualityInspectionList() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("inspections");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showNCRDialog, setShowNCRDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  const { data: inspections } = useQuery<QualityInspection[]>({
    queryKey: ["/api/manufacturing/quality/inspections"],
  });

  const createInspectionMutation = useMutation({
    mutationFn: async (data: Partial<QualityInspection>) => {
      const response = await fetch('/api/manufacturing/quality/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create inspection');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing/quality/inspections"] });
      setShowCreateDialog(false);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'in-progress':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const handleCreateNCR = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setShowNCRDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Quality Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage inspections, templates, and non-conformance reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <FontAwesomeIcon icon="file-alt" className="mr-2 h-4 w-4" />
            Manage Templates
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New Inspection
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="ncrs">NCRs</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Production Line</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections?.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell className="font-medium capitalize">
                        {inspection.type.replace('-', ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(inspection.status)}>
                          {inspection.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{inspection.assignedTo}</TableCell>
                      <TableCell>{formatDate(inspection.dueDate)}</TableCell>
                      <TableCell>{inspection.productionLine}</TableCell>
                      <TableCell>
                        {inspection.defects && inspection.defects.length > 0 && (
                          <Badge variant="destructive">
                            {inspection.defects.length} Issues Found
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateNCR(inspection)}>
                              <FontAwesomeIcon icon="exclamation-triangle" className="mr-2 h-4 w-4" />
                              Create NCR
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="file-pdf" className="mr-2 h-4 w-4" />
                              Export Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Form Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates?.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="capitalize">{template.type}</TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>{template.createdBy}</TableCell>
                      <TableCell>{formatDate(template.updatedAt)}</TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <FontAwesomeIcon icon="copy" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <FontAwesomeIcon icon="trash" className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ncrs">
          <Card>
            <CardHeader>
              <CardTitle>Non-Conformance Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NCR Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ncrs?.map((ncr) => (
                    <TableRow key={ncr.id}>
                      <TableCell className="font-medium">{ncr.number}</TableCell>
                      <TableCell>{ncr.title}</TableCell>
                      <TableCell className="capitalize">{ncr.type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ncr.severity === 'critical'
                              ? 'destructive'
                              : ncr.severity === 'major'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {ncr.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ncr.status === 'open'
                              ? 'default'
                              : ncr.status === 'closed'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {ncr.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(ncr.detectedDate)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="cog" className="mr-2 h-4 w-4" />
                              Create CAPA
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="file-pdf" className="mr-2 h-4 w-4" />
                              Export Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showCreateDialog && (
        <CreateInspectionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={createInspectionMutation.mutate}
        />
      )}

      {showTemplateDialog && (
        <InspectionTemplateDialog
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
        />
      )}

      {showNCRDialog && selectedInspection && (
        <NCRDialog
          open={showNCRDialog}
          onOpenChange={setShowNCRDialog}
          inspection={selectedInspection}
        />
      )}
    </div>
  );
}