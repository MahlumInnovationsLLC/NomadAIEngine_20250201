import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import type { CAPA } from "@/types/manufacturing/capa";
import { CAPADialog } from "./dialogs/CAPADialog";

const fetchCAPAs = async (): Promise<CAPA[]> => {
  const response = await fetch('/api/manufacturing/quality/capas');
  if (!response.ok) {
    throw new Error('Failed to fetch CAPAs');
  }
  return response.json();
};

export default function CAPAList() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCAPA, setSelectedCAPA] = useState<CAPA | null>(null);

  const { data: capas = [], isLoading, error } = useQuery<CAPA[]>({
    queryKey: ['/api/manufacturing/quality/capas'],
    queryFn: fetchCAPAs,
  });

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'open':
        return 'default';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'verified':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getSourceInfo = (capa: CAPA) => {
    if (capa.sourceNcrId) {
      return `NCR: ${capa.sourceNcrId}`;
    }
    if (capa.sourceInspectionId) {
      return `Inspection: ${capa.sourceInspectionId}`;
    }
    return "Manual Creation";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading CAPAs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="rounded-lg border border-destructive/50 p-4 max-w-lg mx-auto">
          <h3 className="font-semibold text-destructive mb-2">Error Loading CAPAs</h3>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Corrective and Preventive Actions</h3>
          <p className="text-sm text-muted-foreground">
            Manage and track corrective actions and preventive measures
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          Create New CAPA
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CAPA List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CAPA #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capas.map((capa) => (
                <TableRow key={capa.id}>
                  <TableCell className="font-medium">{capa.number}</TableCell>
                  <TableCell>{capa.title}</TableCell>
                  <TableCell className="capitalize">{capa.type}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(capa.priority)}>
                      {capa.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(capa.status)}>
                      {capa.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{capa.department}</TableCell>
                  <TableCell>{getSourceInfo(capa)}</TableCell>
                  <TableCell>{formatDate(capa.createdAt)}</TableCell>
                  <TableCell>{formatDate(capa.scheduledReviewDate)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedCAPA(capa)}>
                          <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FontAwesomeIcon icon="check-square" className="mr-2 h-4 w-4" />
                          Update Status
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

      <CAPADialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          toast({
            title: "Success",
            description: "CAPA created successfully",
          });
        }}
      />
    </div>
  );
}